'use client'

/**
 * ApplicationStatusModal — centralized popup that opens when the user clicks
 * any admission application. Shows:
 *   • Current status with a visual timeline (Applied → Documents → Interview → Confirmed/Waitlist)
 *   • AI-generated next steps (context-aware per status)
 *   • "Notify Parent" button — sends status update to the applicant's parent
 *   • "Notify Class Teacher" button — auto-resolves the teacher in charge of
 *     the joining grade via GRADE_TEACHERS and notifies them
 *
 * All notifications go through the shared NotificationPreviewModal (preview +
 * confirm layer) — same pattern used by every other module.
 */

import { motion } from 'framer-motion'
import {
  X, CheckCircle2, Clock, FileText, Calendar, Users, Sparkles,
  Send, Phone, Mail, ChevronRight, AlertCircle, User, Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNotificationPreview, type PreviewRecipient } from './NotificationPreviewModal'
import { toast } from 'sonner'

export interface Applicant {
  id: string
  name: string
  grade: string
  status: 'applied' | 'document' | 'interview' | 'confirmed' | 'waitlist' | 'rejected'
  date: string
  parentName: string
  parentPhone: string
  parentEmail: string
  score: number
  avatarColor: string
  initials: string
}

// Grade → Class Teacher mapping (mirrors AdmissionsModuleEnhanced's GRADE_TEACHERS)
const GRADE_TEACHERS: Record<string, { name: string; dept: string; phone: string; email: string }> = {
  'LKG': { name: 'Mrs. Anita Verma', dept: 'Pre-Primary', phone: '+91 99001 11111', email: 'anita.verma@learnx.edu' },
  'UKG': { name: 'Mrs. Kavita Joshi', dept: 'Pre-Primary', phone: '+91 99001 22222', email: 'kavita.joshi@learnx.edu' },
  'Grade 1': { name: 'Mrs. Anita Verma', dept: 'Primary', phone: '+91 99001 11111', email: 'anita.verma@learnx.edu' },
  'Grade 2': { name: 'Mr. Suresh Rao', dept: 'Primary', phone: '+91 99001 33333', email: 'suresh.rao@learnx.edu' },
  'Grade 3': { name: 'Mrs. Meena Iyer', dept: 'Primary', phone: '+91 99001 44444', email: 'meena.iyer@learnx.edu' },
  'Grade 4': { name: 'Mr. Ramesh Kumar', dept: 'Primary', phone: '+91 99001 55555', email: 'ramesh.kumar@learnx.edu' },
  'Grade 5': { name: 'Dr. Priya Sharma', dept: 'Middle', phone: '+91 99001 66666', email: 'priya.sharma@learnx.edu' },
  'Grade 6': { name: 'Dr. Priya Sharma', dept: 'Middle', phone: '+91 99001 66666', email: 'priya.sharma@learnx.edu' },
  'Grade 7': { name: 'Mr. Arun Nair', dept: 'Middle', phone: '+91 99001 77777', email: 'arun.nair@learnx.edu' },
  'Grade 8': { name: 'Mrs. Deepa Menon', dept: 'Middle', phone: '+91 99001 88888', email: 'deepa.menon@learnx.edu' },
  'Grade 9': { name: 'Dr. Vikram Rao', dept: 'Senior', phone: '+91 99001 99999', email: 'vikram.rao@learnx.edu' },
  'Grade 10': { name: 'Dr. Vikram Rao', dept: 'Senior', phone: '+91 99001 99999', email: 'vikram.rao@learnx.edu' },
}

const STATUS_COLORS: Record<string, string> = {
  applied: '#6B7280',
  document: '#F59E0B',
  interview: '#1E3A8A',
  confirmed: '#22C55E',
  waitlist: '#A855F7',
  rejected: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  applied: 'Applied',
  document: 'Document Verification',
  interview: 'Interview Scheduled',
  confirmed: 'Admission Confirmed',
  waitlist: 'Waitlisted',
  rejected: 'Rejected',
}

// Status flow order — used for the timeline
const FLOW: { key: string; label: string; icon: any }[] = [
  { key: 'applied', label: 'Application Submitted', icon: FileText },
  { key: 'document', label: 'Document Verification', icon: CheckCircle2 },
  { key: 'interview', label: 'Interview', icon: Users },
  { key: 'confirmed', label: 'Admission Confirmed', icon: CheckCircle2 },
]

/**
 * AI-generated next steps, context-aware per status.
 * This is rule-based AI (deterministic + explainable) — no LLM call needed,
 * which keeps the response instant and the action predictable.
 */
function generateNextSteps(app: Applicant): { title: string; description: string; priority: 'high' | 'medium' | 'low' }[] {
  switch (app.status) {
    case 'applied':
      return [
        { title: 'Verify Documents', description: `Collect & verify birth certificate, Aadhaar, previous school TC, and 2 passport photos for ${app.name}. Schedule a document verification slot within 48 hours.`, priority: 'high' },
        { title: 'Send Acknowledgement', description: `Send an automated WhatsApp/SMS to ${app.parentName} confirming receipt of application ${app.id} and outlining the next steps.`, priority: 'high' },
        { title: 'AI Score Review', description: `Applicant's AI score is ${app.score}/100. ${app.score >= 90 ? 'Fast-track eligibility — qualify for merit scholarship consideration.' : app.score >= 80 ? 'Eligible for standard admission track.' : 'Flag for additional assessment.'}`, priority: 'medium' },
      ]
    case 'document':
      return [
        { title: 'Schedule Interview', description: `Documents received. Schedule an interview with ${app.parentName} and ${app.name}. Recommend 30-min slot with the Grade ${app.grade.replace('Grade ', '')} class teacher.`, priority: 'high' },
        { title: 'Prepare Interview Brief', description: `Auto-generate a brief for the interviewer covering the applicant's previous school record, age-appropriate assessment areas, and parent concerns.`, priority: 'medium' },
        { title: 'Update Parent', description: `Notify ${app.parentName} that documents are verified and an interview slot is being scheduled.`, priority: 'medium' },
      ]
    case 'interview':
      return [
        { title: 'Await Interview Result', description: `Interview for ${app.name} is scheduled. The interviewing teacher must submit a result + recommendation within 24 hours of the interview.`, priority: 'high' },
        { title: 'Prepare Admission Decision', description: `On receipt of interview feedback, the system will auto-recommend one of: Confirm / Waitlist / Reject based on AI score (${app.score}) + interview rating.`, priority: 'medium' },
        { title: 'Pre-block Seat', description: `Pre-block a seat in ${app.grade} pending final decision to avoid over-admission.`, priority: 'low' },
      ]
    case 'confirmed':
      return [
        { title: 'Collect Admission Fee', description: `Send fee payment link to ${app.parentName}. Tuition Q1 + admission fee + uniform + books total due within 7 days.`, priority: 'high' },
        { title: 'Onboard to ERP', description: `Auto-create Student record, Parent Portal login, transport/hostel opt-in form, and welcome kit for ${app.name}.`, priority: 'high' },
        { title: 'Notify Class Teacher', description: `Inform the ${app.grade} class teacher that ${app.name} will be joining — share guardian contact + any medical/behavioral notes.`, priority: 'medium' },
        { title: 'Schedule Orientation', description: `Invite family to the next orientation session (every Saturday 10 AM).`, priority: 'low' },
      ]
    case 'waitlist':
      return [
        { title: 'Send Waitlist Acknowledgement', description: `Notify ${app.parentName} that ${app.name} is on the waitlist for ${app.grade}. Share current waitlist position and expected decision date.`, priority: 'high' },
        { title: 'Monitor Seat Availability', description: `System will auto-notify if a seat opens up in ${app.grade} (typically within 2-4 weeks of term start).`, priority: 'medium' },
        { title: 'Recommend Alternative', description: `If wait exceeds 4 weeks, AI will recommend alternative nearby schools with available seats in the same grade.`, priority: 'low' },
      ]
    case 'rejected':
      return [
        { title: 'Send Rejection Communication', description: `Send a courteous, constructive rejection letter to ${app.parentName} explaining the decision and suggesting next steps.`, priority: 'high' },
        { title: 'Archive Application', description: `Archive application ${app.id}. Retain records for 1 year per DPDP compliance.`, priority: 'medium' },
        { title: 'Feedback Survey', description: `Optional: send a feedback survey to understand the applicant's experience.`, priority: 'low' },
      ]
    default:
      return []
  }
}

export function ApplicationStatusModal({
  applicant,
  onClose,
}: {
  applicant: Applicant | null
  onClose: () => void
}) {
  const { preview } = useNotificationPreview()

  if (!applicant) return null

  const app = applicant
  const teacher = GRADE_TEACHERS[app.grade] || GRADE_TEACHERS['Grade 1']
  const nextSteps = generateNextSteps(app)
  const currentStepIndex = FLOW.findIndex((s) => s.key === app.status)
  const isWaitlist = app.status === 'waitlist'
  const isRejected = app.status === 'rejected'

  const handleNotifyParent = () => {
    const body = `Dear ${app.parentName},\n\nUpdate on ${app.name}'s admission application (${app.id}):\n\nStatus: ${STATUS_LABELS[app.status]}\nGrade Applied: ${app.grade}\nAI Score: ${app.score}/100\n\nNext Steps:\n${nextSteps.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`).join('\n')}\n\nYou can track the application status on the LearnX Parent Portal.\n\n— LearnX Admissions Office`
    const recipients: PreviewRecipient[] = [
      { id: app.id, name: app.parentName, contact: app.parentPhone, channel: 'WHATSAPP', recipientType: 'PARENT' },
    ]
    preview({
      recipients,
      subject: `Admission Update — ${app.name} (${app.id})`,
      body,
      audience: 'MINIMUM',
      source: 'admissions-status-parent',
    })
    toast.success(`Status notification prepared for ${app.parentName}`)
  }

  const handleNotifyTeacher = () => {
    const body = `Dear ${teacher.name},\n\nA new admission is in progress for Grade ${app.grade} and you are the assigned class teacher.\n\nStudent: ${app.name}\nApplication ID: ${app.id}\nCurrent Status: ${STATUS_LABELS[app.status]}\nAI Score: ${app.score}/100\nParent/Guardian: ${app.parentName}\nParent Contact: ${app.parentPhone}\nParent Email: ${app.parentEmail}\n\nNext Steps Requiring Your Attention:\n${nextSteps.filter((s) => s.priority === 'high' || s.priority === 'medium').map((s, i) => `${i + 1}. ${s.title} — ${s.description}`).join('\n')}\n\nPlease review and confirm via the LearnX Teacher Portal.\n\n— LearnX Admissions Office`
    const recipients: PreviewRecipient[] = [
      { id: `teacher-${app.grade}`, name: teacher.name, contact: teacher.phone, channel: 'WHATSAPP', recipientType: 'STAFF' },
    ]
    preview({
      recipients,
      subject: `New Admission — ${app.name} joining Grade ${app.grade}`,
      body,
      audience: 'MINIMUM',
      source: 'admissions-status-teacher',
    })
    toast.success(`Notification prepared for ${teacher.name} (Grade ${app.grade} teacher)`)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ borderTop: `4px solid ${STATUS_COLORS[app.status]}` }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold" style={{ background: app.avatarColor }}>
              {app.initials}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{app.name}</h3>
              <p className="text-[11px] text-slate-500">
                {app.id} · Applied for {app.grade} · {app.date}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">
          {/* Status badge row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Current Status</div>
              <Badge variant="outline" className="text-xs font-semibold capitalize px-2.5 py-1" style={{ color: STATUS_COLORS[app.status], borderColor: STATUS_COLORS[app.status] + '40', background: STATUS_COLORS[app.status] + '10' }}>
                {STATUS_LABELS[app.status]}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">AI Score</div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-lg font-bold text-slate-900">{app.score}</span>
                <span className="text-[10px] text-slate-500">/100</span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {!isWaitlist && !isRejected && (
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Application Progress
              </div>
              <div className="flex items-center justify-between">
                {FLOW.map((step, i) => {
                  const Icon = step.icon
                  const isDone = i < currentStepIndex
                  const isCurrent = i === currentStepIndex
                  const isFuture = i > currentStepIndex
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {/* connecting line */}
                      {i < FLOW.length - 1 && (
                        <div className="absolute top-4 left-1/2 w-full h-0.5 bg-slate-200">
                          <div
                            className="h-full transition-all"
                            style={{ width: isDone ? '100%' : '0%', background: STATUS_COLORS[app.status] }}
                          />
                        </div>
                      )}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          isDone ? 'text-white' : isCurrent ? 'text-white' : 'bg-white text-slate-400 border-slate-200'
                        }`}
                        style={{
                          background: isDone || isCurrent ? STATUS_COLORS[app.status] : '#FFFFFF',
                          borderColor: isDone || isCurrent ? STATUS_COLORS[app.status] : '#E2E8F0',
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className={`text-[10px] font-medium mt-1.5 text-center ${isCurrent ? 'text-slate-900' : isFuture ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Waitlist special callout */}
          {isWaitlist && (
            <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-purple-900">
                <div className="font-semibold mb-0.5">On Waitlist</div>
                <p className="text-[11px] leading-relaxed text-purple-700">
                  The applicant is on the waitlist for {app.grade}. The system will auto-notify the parent if a seat opens up.
                </p>
              </div>
            </div>
          )}

          {/* Rejected special callout */}
          {isRejected && (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <div className="font-semibold mb-0.5">Application Rejected</div>
                <p className="text-[11px] leading-relaxed text-rose-700">
                  This application has been closed. Send a courteous rejection letter to the parent and archive the record.
                </p>
              </div>
            </div>
          )}

          {/* AI Next Steps */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-700" />
              AI-Generated Next Steps
              <span className="ml-auto text-[10px] font-normal text-slate-400">context-aware · auto-updates with status</span>
            </div>
            <div className="space-y-2">
              {nextSteps.map((step, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{
                      background: step.priority === 'high' ? '#DC2626' : step.priority === 'medium' ? '#F59E0B' : '#6B7280',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-900">{step.title}</span>
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{
                          color: step.priority === 'high' ? '#DC2626' : step.priority === 'medium' ? '#F59E0B' : '#6B7280',
                          background: step.priority === 'high' ? '#FEE2E2' : step.priority === 'medium' ? '#FEF3C7' : '#F1F5F9',
                        }}
                      >
                        {step.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parent + Teacher info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Parent / Guardian
              </div>
              <div className="text-xs font-semibold text-slate-900">{app.parentName}</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-600">
                <Phone className="w-2.5 h-2.5" /> {app.parentPhone}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <Mail className="w-2.5 h-2.5" /> <span className="truncate">{app.parentEmail}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Class Teacher (Grade {app.grade})
              </div>
              <div className="text-xs font-semibold text-slate-900">{teacher.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{teacher.dept} Department</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-600">
                <Phone className="w-2.5 h-2.5" /> {teacher.phone}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                <Mail className="w-2.5 h-2.5" /> <span className="truncate">{teacher.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — Notify actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            AI auto-personalizes the message body per recipient
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg text-xs gap-1.5"
              onClick={handleNotifyTeacher}
            >
              <Send className="w-3.5 h-3.5" />
              Notify Class Teacher
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-lg text-xs gap-1.5 text-white"
              style={{ background: STATUS_COLORS[app.status] }}
              onClick={handleNotifyParent}
            >
              <Send className="w-3.5 h-3.5" />
              Notify Parent
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
