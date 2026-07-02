'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Phone, Mail, MapPin, Calendar, User, Users, FileText, CheckCircle2,
  AlertTriangle, TrendingUp, Award, Heart, Bus, BedDouble, Trophy,
  Download, MessageSquare, Send, Eye, Brain, Activity, DollarSign,
  Fingerprint, Shield, BookOpen, Star, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Student, Teacher, Staff } from '@/lib/school-data'
import { toast } from 'sonner'

interface PersonDetailModalProps {
  person: Student | Teacher | Staff | null
  type: 'student' | 'teacher' | 'staff' | null
  onClose: () => void
}

export function PersonDetailModal({ person, type, onClose }: PersonDetailModalProps) {
  if (!person || !type) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-blue-800 to-blue-900 p-6 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl">
                  {person.photo}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{person.fullName}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold uppercase tracking-wide">
                      {type}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">
                    {type === 'student' ? `${(person as Student).sectionId} · ${(person as Student).admissionNo}` :
                     type === 'teacher' ? `${(person as Teacher).designation} · ${(person as Teacher).department}` :
                     `${(person as Staff).designation} · ${(person as Staff).department}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {type === 'student' ? (person as Student).guardianPhone : (person as Teacher | Staff).phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {type === 'student' ? (person as Student).guardianEmail : (person as Teacher | Staff).email}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">
            {type === 'student' && <StudentBiodata student={person as Student} />}
            {type === 'teacher' && <TeacherBiodata teacher={person as Teacher} />}
            {type === 'staff' && <StaffBiodata staff={person as Staff} />}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span>All data interlinked · Real-time sync · Audit logged</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg gap-1" onClick={() => toast.success('Profile downloaded as PDF')}>
                <Download className="w-3 h-3" /> Export
              </Button>
              <Button size="sm" className="h-8 text-xs rounded-lg bg-blue-800 hover:bg-blue-900 text-white gap-1" onClick={() => toast.success('Message sent via WhatsApp')}>
                <MessageSquare className="w-3 h-3" /> Message
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ============ Student Biodata ============
function StudentBiodata({ student }: { student: Student }) {
  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Attendance', value: '94.2%', icon: CheckCircle2, color: '#22C55E' },
          { label: 'Avg Score', value: '83.8%', icon: TrendingUp, color: '#1E3A8A' },
          { label: 'Class Rank', value: '#3', icon: Award, color: '#F97316' },
          { label: 'Fee Status', value: student.fees.some(f => f.status === 'OVERDUE' || f.status === 'PENDING') ? 'Pending' : 'Clear', icon: DollarSign, color: student.fees.some(f => f.status === 'OVERDUE' || f.status === 'PENDING') ? '#EF4444' : '#22C55E' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Personal Information */}
      <Section title="Personal Information" emoji="📋">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <InfoItem label="Admission No" value={student.admissionNo} />
          <InfoItem label="Date of Birth" value={new Date(student.dob).toLocaleDateString('en-IN')} />
          <InfoItem label="Gender" value={student.gender} />
          <InfoItem label="Blood Group" value={student.bloodGroup} />
          <InfoItem label="Nationality" value={student.nationality} />
          <InfoItem label="Religion" value={student.religion} />
          <InfoItem label="Category" value={student.category} />
          <InfoItem label="Aadhaar" value={student.aadhaarNo} />
          <InfoItem label="Admission Date" value={new Date(student.admissionDate).toLocaleDateString('en-IN')} />
          <InfoItem label="Previous School" value={student.previousSchool} />
          <InfoItem label="Class" value={student.sectionId} />
          <InfoItem label="Status" value={student.status} />
        </div>
      </Section>

      {/* Guardian Information */}
      <Section title="Guardian / Parent Information" emoji="👨‍👩‍👧">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <InfoItem label="Father Name" value={student.fatherName} />
          <InfoItem label="Mother Name" value={student.motherName} />
          <InfoItem label="Guardian" value={student.guardianName} />
          <InfoItem label="Phone" value={student.guardianPhone} />
          <InfoItem label="Email" value={student.guardianEmail} />
          <InfoItem label="Occupation" value={student.guardianOccupation} />
          <InfoItem label="Annual Income" value={`₹${student.annualIncome.toLocaleString('en-IN')}`} />
          <InfoItem label="Address" value={`${student.address}, ${student.city}, ${student.state} - ${student.pincode}`} colSpan={3} />
        </div>
      </Section>

      {/* Attendance History */}
      <Section title="Attendance History (Recent)" emoji="✅">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Method</th></tr></thead>
            <tbody>
              {student.attendance.map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`status-chip ${a.status === 'PRESENT' ? 'status-success' : a.status === 'ABSENT' ? 'status-danger' : 'status-warning'}`}>{a.status}</span></td>
                  <td className="font-mono">{a.checkIn}</td>
                  <td className="font-mono">{a.checkOut}</td>
                  <td><span className="text-[10px] font-medium text-slate-600">{a.method}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Exam Scores */}
      <Section title="Exam Performance" emoji="📝">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th><th>%</th><th>Rank</th><th>Remark</th></tr></thead>
            <tbody>
              {student.examScores.map((e, i) => (
                <tr key={i}>
                  <td>{e.exam}</td>
                  <td className="font-medium">{e.subject}</td>
                  <td>{e.marksObtained}/{e.totalMarks}</td>
                  <td><span className="status-chip status-info">{e.grade}</span></td>
                  <td className="font-semibold">{e.percentage}%</td>
                  <td>#{e.rank}</td>
                  <td className="text-[11px] text-slate-500">{e.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Fee Records */}
      <Section title="Fee Records" emoji="💰">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Fee Type</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Receipt</th></tr></thead>
            <tbody>
              {student.fees.map((f, i) => (
                <tr key={i}>
                  <td className="font-medium">{f.feeType}</td>
                  <td>₹{f.amount.toLocaleString('en-IN')}</td>
                  <td className="text-emerald-600">₹{f.paid.toLocaleString('en-IN')}</td>
                  <td className={f.balance > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400'}>₹{f.balance.toLocaleString('en-IN')}</td>
                  <td>{f.dueDate}</td>
                  <td><span className={`status-chip ${f.status === 'PAID' ? 'status-success' : f.status === 'PARTIAL' ? 'status-warning' : f.status === 'OVERDUE' ? 'status-danger' : 'status-info'}`}>{f.status}</span></td>
                  <td>{f.receiptNo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Health Records */}
      <Section title="Health & Wellness" emoji="🏥">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <InfoItem label="Height" value={`${student.healthRecords[0].height} cm`} />
          <InfoItem label="Weight" value={`${student.healthRecords[0].weight} kg`} />
          <InfoItem label="BMI" value={student.healthRecords[0].bmi.toString()} />
          <InfoItem label="Blood Pressure" value={student.healthRecords[0].bloodPressure} />
          <InfoItem label="Vision" value={student.healthRecords[0].vision} />
          <InfoItem label="Hearing" value={student.healthRecords[0].hearing} />
          <InfoItem label="Allergies" value={student.healthRecords[0].allergies} />
          <InfoItem label="Chronic Conditions" value={student.healthRecords[0].chronicConditions} />
          <InfoItem label="Medications" value={student.healthRecords[0].medications} />
          <InfoItem label="Doctor" value={student.healthRecords[0].doctorName} />
          <InfoItem label="Last Checkup" value={new Date(student.healthRecords[0].date).toLocaleDateString('en-IN')} />
          <InfoItem label="Notes" value={student.healthRecords[0].notes} colSpan={3} />
        </div>
      </Section>

      {/* Behavior Records */}
      <Section title="Behavior & Conduct" emoji="📊">
        <div className="space-y-2">
          {student.behaviorRecords.map((b, i) => (
            <div key={i} className={`p-3 rounded-xl border ${b.type === 'POSITIVE' ? 'bg-emerald-50 border-emerald-100' : b.type === 'NEGATIVE' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${b.type === 'POSITIVE' ? 'bg-emerald-200 text-emerald-800' : b.type === 'NEGATIVE' ? 'bg-rose-200 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>{b.type}</span>
                  <span className="text-xs font-semibold text-slate-900">{b.category}</span>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[10px] text-slate-500">{new Date(b.date).toLocaleDateString('en-IN')}</span>
                </div>
                <span className={`text-xs font-bold ${b.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{b.points > 0 ? '+' : ''}{b.points} pts</span>
              </div>
              <p className="text-xs text-slate-700">{b.description}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                <span>By: {b.recordedBy}</span>
                <span>·</span>
                <span>Action: {b.actionTaken}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Transport */}
      {student.transportAssignment && (
        <Section title="Transport Details" emoji="🚌">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <InfoItem label="Vehicle No" value={student.transportAssignment.vehicleNo} />
            <InfoItem label="Route" value={student.transportAssignment.routeName} />
            <InfoItem label="Fee" value={`₹${student.transportAssignment.fee.toLocaleString('en-IN')}`} />
            <InfoItem label="Pickup Point" value={student.transportAssignment.pickupPoint} />
            <InfoItem label="Drop Point" value={student.transportAssignment.dropPoint} />
            <InfoItem label="Driver" value={`${student.transportAssignment.driverName} (${student.transportAssignment.driverPhone})`} />
          </div>
        </Section>
      )}

      {/* Activities */}
      <Section title="Extra-curricular Activities" emoji="🏆">
        <div className="space-y-2">
          {student.activities.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><Trophy className="w-4 h-4 text-orange-500" /></div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{a.name}</div>
                  <div className="text-[10px] text-slate-500">{a.category} · {a.performance}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: a.rating }).map((_, j) => <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Documents */}
      <Section title="Documents" emoji="📄">
        <div className="space-y-1.5">
          {student.documents.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">{d.title}</span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] text-slate-400">{new Date(d.uploadedOn).toLocaleDateString('en-IN')}</span>
              </div>
              <span className={`status-chip ${d.verified ? 'status-success' : 'status-warning'}`}>{d.verified ? '✓ Verified' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Leave History */}
      <Section title="Leave History" emoji="🌴">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>
              {student.leaveRequests.map((l, i) => (
                <tr key={i}>
                  <td>{l.leaveType}</td>
                  <td>{new Date(l.startDate).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(l.endDate).toLocaleDateString('en-IN')}</td>
                  <td>{l.daysCount}</td>
                  <td className="text-[11px] text-slate-500">{l.reason}</td>
                  <td><span className={`status-chip ${l.status === 'APPROVED' ? 'status-success' : l.status === 'PENDING' ? 'status-warning' : 'status-danger'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Report Cards */}
      <Section title="Report Cards" emoji="📜">
        <div className="space-y-2">
          {student.reportCards.map((r, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-900">{r.term}</span>
                  <span className="text-[10px] text-slate-400 ml-2">Generated: {new Date(r.generatedAt).toLocaleDateString('en-IN')}</span>
                </div>
                <span className={`status-chip ${r.status === 'PUBLISHED' ? 'status-success' : 'status-warning'}`}>{r.status}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[11px] mb-2">
                <div><span className="text-slate-500">Percentage:</span> <span className="font-bold text-slate-900">{r.overallPercentage}%</span></div>
                <div><span className="text-slate-500">Grade:</span> <span className="font-bold text-slate-900">{r.overallGrade}</span></div>
                <div><span className="text-slate-500">Rank:</span> <span className="font-bold text-slate-900">#{r.overallRank}</span></div>
                <div><span className="text-slate-500">Attendance:</span> <span className="font-bold text-slate-900">{r.attendancePercentage}%</span></div>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div><span className="font-semibold">Teacher:</span> {r.teacherRemark}</div>
                <div><span className="font-semibold">Principal:</span> {r.principalRemark}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* PTM History */}
      <Section title="PTM Meetings" emoji="👨‍🏫">
        <div className="space-y-2">
          {student.ptmMeetings.map((p, i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">{p.staffName}</span>
                <span className="text-[10px] text-slate-400">{new Date(p.date).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-600 mb-1">{p.agenda}</div>
              <div className="text-[11px] text-slate-500">{p.feedback}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-slate-400">Parent Rating:</span>
                {Array.from({ length: p.parentRating }).map((_, j) => <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

// ============ Teacher Biodata ============
function TeacherBiodata({ teacher }: { teacher: Teacher }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Experience', value: `${teacher.experience} yrs`, icon: Clock, color: '#1E3A8A' },
          { label: 'Classes', value: teacher.classesTaught.length.toString(), icon: Users, color: '#0D9488' },
          { label: 'Subjects', value: teacher.subjectsTaught.length.toString(), icon: BookOpen, color: '#F97316' },
          { label: 'Salary Status', value: teacher.salaryRecords[0]?.status || 'N/A', icon: DollarSign, color: '#22C55E' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{s.value}</div>
          </div>
        ))}
      </div>

      <Section title="Personal Information" emoji="📋">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <InfoItem label="Employee ID" value={teacher.employeeId} />
          <InfoItem label="Date of Birth" value={new Date(teacher.dob).toLocaleDateString('en-IN')} />
          <InfoItem label="Gender" value={teacher.gender} />
          <InfoItem label="Blood Group" value={teacher.bloodGroup} />
          <InfoItem label="Qualification" value={teacher.qualification} />
          <InfoItem label="Experience" value={`${teacher.experience} years`} />
          <InfoItem label="Designation" value={teacher.designation} />
          <InfoItem label="Department" value={teacher.department} />
          <InfoItem label="Subject Specialization" value={teacher.subjectSpecialization} />
          <InfoItem label="Joining Date" value={new Date(teacher.joiningDate).toLocaleDateString('en-IN')} />
          <InfoItem label="Employment Type" value={teacher.employmentType} />
          <InfoItem label="Status" value={teacher.status} />
          <InfoItem label="Phone" value={teacher.phone} />
          <InfoItem label="Email" value={teacher.email} />
          <InfoItem label="Address" value={teacher.address} colSpan={3} />
          <InfoItem label="Aadhaar" value={teacher.aadhaarNo} />
          <InfoItem label="PAN" value={teacher.panNo} />
          <InfoItem label="Bank" value={teacher.bankName} />
          <InfoItem label="Account No" value={teacher.bankAccountNo} />
          <InfoItem label="IFSC" value={teacher.bankIfsc} />
        </div>
      </Section>

      <Section title="Classes & Subjects Taught" emoji="📚">
        <div className="flex flex-wrap gap-2">
          {teacher.classesTaught.map((c) => (
            <span key={c} className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-800">{c}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {teacher.subjectsTaught.map((s) => (
            <span key={s} className="px-3 py-1 rounded-lg bg-orange-50 border border-orange-100 text-xs font-semibold text-orange-700">{s}</span>
          ))}
        </div>
      </Section>

      <Section title="Attendance (Recent)" emoji="✅">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead>
            <tbody>
              {teacher.attendance.map((a, i) => (
                <tr key={i}>
                  <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                  <td><span className={`status-chip ${a.status === 'PRESENT' ? 'status-success' : 'status-warning'}`}>{a.status}</span></td>
                  <td className="font-mono">{a.checkIn}</td>
                  <td className="font-mono">{a.checkOut}</td>
                  <td>{a.workHours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Salary Records" emoji="💰">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Month</th><th>Basic</th><th>Gross</th><th>Net</th><th>PF</th><th>Tax</th><th>Status</th></tr></thead>
            <tbody>
              {teacher.salaryRecords.map((s, i) => (
                <tr key={i}>
                  <td>{s.month}</td>
                  <td>₹{s.basicSalary.toLocaleString('en-IN')}</td>
                  <td>₹{s.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="font-semibold text-emerald-600">₹{s.netSalary.toLocaleString('en-IN')}</td>
                  <td className="text-rose-500">₹{s.pfDeduction.toLocaleString('en-IN')}</td>
                  <td className="text-rose-500">₹{s.taxDeduction.toLocaleString('en-IN')}</td>
                  <td><span className={`status-chip ${s.status === 'PAID' ? 'status-success' : 'status-warning'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Documents" emoji="📄">
        <div className="space-y-1.5">
          {teacher.documents.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-700">{d.title}</span>
              </div>
              <span className={`status-chip ${d.verified ? 'status-success' : 'status-warning'}`}>{d.verified ? '✓ Verified' : 'Pending'}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

// ============ Staff Biodata ============
function StaffBiodata({ staff }: { staff: Staff }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Department', value: staff.department, icon: BookOpen, color: '#1E3A8A' },
          { label: 'Designation', value: staff.designation, icon: User, color: '#0D9488' },
          { label: 'Status', value: staff.status, icon: CheckCircle2, color: '#22C55E' },
          { label: 'Salary', value: `₹${staff.salaryRecords[0]?.netSalary.toLocaleString('en-IN') || 'N/A'}`, icon: DollarSign, color: '#F97316' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] font-semibold text-slate-500 uppercase">{s.label}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">{s.value}</div>
          </div>
        ))}
      </div>

      <Section title="Personal Information" emoji="📋">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <InfoItem label="Employee ID" value={staff.employeeId} />
          <InfoItem label="Date of Birth" value={new Date(staff.dob).toLocaleDateString('en-IN')} />
          <InfoItem label="Gender" value={staff.gender} />
          <InfoItem label="Qualification" value={staff.qualification} />
          <InfoItem label="Designation" value={staff.designation} />
          <InfoItem label="Department" value={staff.department} />
          <InfoItem label="Joining Date" value={new Date(staff.joiningDate).toLocaleDateString('en-IN')} />
          <InfoItem label="Status" value={staff.status} />
          <InfoItem label="Phone" value={staff.phone} />
          <InfoItem label="Email" value={staff.email} />
          <InfoItem label="Address" value={staff.address} colSpan={3} />
        </div>
      </Section>

      <Section title="Salary Records" emoji="💰">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full premium-table">
            <thead><tr><th>Month</th><th>Basic</th><th>Gross</th><th>Net</th><th>Status</th></tr></thead>
            <tbody>
              {staff.salaryRecords.map((s, i) => (
                <tr key={i}>
                  <td>{s.month}</td>
                  <td>₹{s.basicSalary.toLocaleString('en-IN')}</td>
                  <td>₹{s.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="font-semibold text-emerald-600">₹{s.netSalary.toLocaleString('en-IN')}</td>
                  <td><span className={`status-chip ${s.status === 'PAID' ? 'status-success' : 'status-warning'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}

// ============ Helper Components ============
function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{emoji}</span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoItem({ label, value, colSpan = 1 }: { label: string; value: string; colSpan?: number }) {
  return (
    <div className={colSpan === 3 ? 'col-span-3' : ''}>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-xs font-semibold text-slate-900">{value}</div>
    </div>
  )
}
