'use client'

/**
 * TimetableModuleEnhanced — Per grade/section timetable with:
 *   - Teacher + topic per period
 *   - Drag-and-drop admin editing
 *   - Auto-notify all students + teachers on change
 *   - Reference: mysmartcalendar.space-z.ai layout
 */

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Clock, Users, Bot, RefreshCw, Send, Save,
  ChevronRight, BookOpen, GraduationCap, GripVertical, MapPin,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from './SectionHeader'
import { useNotificationPreview } from './NotificationPreviewModal'
import { toast } from 'sonner'

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const SECTIONS = ['A', 'B', 'C']
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const PERIODS = [
  { period: 1, time: '08:00 - 08:45', label: 'Period 1' },
  { period: 2, time: '08:45 - 09:30', label: 'Period 2' },
  { period: 3, time: '09:30 - 10:15', label: 'Period 3' },
  { period: 4, time: '10:15 - 11:00', label: 'Period 4' },
  { period: 5, time: '11:00 - 11:30', label: 'Break' },
  { period: 6, time: '11:30 - 12:15', label: 'Period 5' },
  { period: 7, time: '12:15 - 01:00', label: 'Period 6' },
  { period: 8, time: '01:00 - 01:45', label: 'Lunch' },
  { period: 9, time: '01:45 - 02:30', label: 'Period 7' },
  { period: 10, time: '02:30 - 03:15', label: 'Period 8' },
]

interface PeriodEntry {
  subject: string
  teacher: string
  topic: string
  room: string
  isBreak?: boolean
}

const SUBJECT_COLORS: Record<string, string> = {
  'Mathematics': '#3B82F6',
  'English': '#8B5CF6',
  'Science': '#22C55E',
  'Social Studies': '#F59E0B',
  'Hindi': '#EC4899',
  'Computer Science': '#06B6D4',
  'Physical Education': '#10B981',
  'Art': '#F97316',
  'Music': '#A855F7',
  'Break': '#94A3B8',
  'Lunch': '#94A3B8',
}

// Generate initial timetable for Grade 7-A
function generateInitialTimetable(): Record<string, Record<number, PeriodEntry>> {
  const schedule: Record<string, Record<number, PeriodEntry>> = {}
  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education', 'Art']
  const teachers: Record<string, string> = {
    'Mathematics': 'Ms. Sunita Reddy',
    'English': 'Mr. Arjun Mehta',
    'Science': 'Mr. Vikram Nair',
    'Social Studies': 'Ms. Kavya Singh',
    'Hindi': 'Ms. Meena Iyer',
    'Computer Science': 'Mr. Suresh Iyer',
    'Physical Education': 'Mr. Suresh Iyer',
    'Art': 'Ms. Pooja Desai',
  }
  const topics: Record<string, string[]> = {
    'Mathematics': ['Algebra — Linear Equations', 'Geometry — Triangles', 'Number System', 'Mensuration', 'Data Handling'],
    'English': ['Grammar — Tenses', 'Literature — The Diary of a Young Girl', 'Writing — Essay', 'Reading Comprehension', 'Poetry — The Road Not Taken'],
    'Science': ['Physics — Motion', 'Chemistry — Acids & Bases', 'Biology — Nutrition', 'Physics — Light', 'Chemistry — Materials'],
    'Social Studies': ['History — Medieval India', 'Geography — Resources', 'Civics — Government', 'Economics — Markets', 'History — Mughal Empire'],
    'Hindi': ['व्याकरण — संज्ञा', 'पाठ — भारत माता', 'निबंध — मेरा विद्यालय', 'कविता — सूरदास', 'व्याकरण — क्रिया'],
    'Computer Science': ['Python Basics', 'Data Structures', 'HTML & CSS', 'Algorithms', 'Database Concepts'],
    'Physical Education': ['Football', 'Athletics', 'Yoga', 'Basketball', 'Cricket'],
    'Art': ['Watercolor Painting', 'Sketching', 'Craft', 'Calligraphy', 'Poster Design'],
  }

  for (const day of DAYS) {
    schedule[day] = {}
    let subjIdx = 0
    for (const p of PERIODS) {
      if (p.label === 'Break') {
        schedule[day][p.period] = { subject: 'Break', teacher: '', topic: '', room: '', isBreak: true }
      } else if (p.label === 'Lunch') {
        schedule[day][p.period] = { subject: 'Lunch', teacher: '', topic: '', room: '', isBreak: true }
      } else {
        const subj = subjects[subjIdx % subjects.length]
        const topic = topics[subj][Math.floor(Math.random() * topics[subj].length)]
        schedule[day][p.period] = {
          subject: subj,
          teacher: teachers[subj],
          topic,
          room: `Room ${101 + (subjIdx % 5)}`,
        }
        subjIdx++
      }
    }
  }
  return schedule
}

export function TimetableModuleEnhanced() {
  const [grade, setGrade] = useState('Grade 7')
  const [section, setSection] = useState('A')
  const [selectedDay, setSelectedDay] = useState('MONDAY')
  const [editMode, setEditMode] = useState(false)
  const [timetable, setTimetable] = useState(generateInitialTimetable())
  const [draggedPeriod, setDraggedPeriod] = useState<number | null>(null)
  const [draggedDay, setDraggedDay] = useState<string | null>(null)
  const { preview: previewNotification } = useNotificationPreview()

  const handleDragStart = (day: string, period: number) => {
    if (!editMode) return
    setDraggedDay(day)
    setDraggedPeriod(period)
  }

  const handleDrop = (day: string, period: number) => {
    if (!editMode || draggedPeriod === null || draggedDay === null) return
    if (day === draggedDay && period === draggedPeriod) return

    // Swap the two periods
    const sourceEntry = timetable[draggedDay][draggedPeriod]
    const targetEntry = timetable[day][period]
    setTimetable((prev) => ({
      ...prev,
      [draggedDay]: { ...prev[draggedDay], [draggedPeriod]: targetEntry },
      [day]: { ...prev[day], [period]: sourceEntry },
    }))
    setDraggedPeriod(null)
    setDraggedDay(null)
    toast.success('Periods swapped — click "Save & Notify" to broadcast changes')
  }

  const saveAndNotify = () => {
    // Send notification to all students in the class + all teachers
    previewNotification({
      recipients: [
        {
          id: `class-${grade}-${section}-students`,
          name: `All Students in ${grade} ${section}`,
          contact: '+91 98765 43210',
          channel: 'WHATSAPP',
          recipientType: 'STUDENT',
        },
        {
          id: `class-${grade}-${section}-teachers`,
          name: `All Teachers for ${grade} ${section}`,
          contact: '+91 98000 00000',
          channel: 'SMS',
          recipientType: 'STAFF',
        },
      ],
      body: `Dear Student/Parent,\n\nThe timetable for ${grade} Section ${section} has been updated. Please check the school portal for the revised schedule.\n\nChanges effective from tomorrow.\n\nRegards,\nLearnX International School`,
      subject: `Timetable Updated — ${grade} Section ${section}`,
      source: 'timetable_change_notification',
    })
    setEditMode(false)
    toast.success('Timetable saved. Notifications will be sent to all students and teachers.')
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <SectionHeader
        emoji="🗓️"
        title="Class Timetable"
        subtitle="Per grade/section · teacher + topic per period · drag-and-drop editing · auto-notify on change"
        accent="#10B981"
        onNew={editMode ? saveAndNotify : () => setEditMode(true)}
        newLabel={editMode ? 'Save & Notify' : 'Edit Timetable'}
      />

      {/* AI banner */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-sm">Smart Timetable System</div>
            <p className="text-xs text-white/85 mt-1 leading-relaxed">
              View the full weekly timetable for any grade and section. Each period shows the subject, teacher, and topic covered.
              Admins can drag-and-drop periods to rearrange — when saved, an automated notification is sent to every student
              in the class and every teacher who teaches that class.
            </p>
            {editMode && (
              <div className="mt-2 px-2 py-1 rounded bg-white/15 text-[10px] inline-block">
                ✏️ Edit mode ON — drag any period to another slot to swap. Click "Save & Notify" when done.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grade + Section selector */}
      <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Grade</label>
            <select value={grade} onChange={(e) => { setGrade(e.target.value); setTimetable(generateInitialTimetable()) }}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-400">
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Section</label>
            <div className="flex gap-1">
              {SECTIONS.map((s) => (
                <button key={s} onClick={() => { setSection(s); setTimetable(generateInitialTimetable()) }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${section === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">Day</label>
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((d) => (
                <button key={d} onClick={() => setSelectedDay(d)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedDay === d ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto text-xs text-slate-500">
            Showing: <span className="font-semibold text-slate-900">{grade} - Section {section}</span> · {selectedDay}
          </div>
        </div>
      </Card>

      {/* Day view — period by period */}
      <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            {selectedDay} — {grade} Section {section}
          </h3>
          {editMode && (
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200">
              ✏️ Drag to swap periods
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {PERIODS.map((p) => {
            const entry = timetable[selectedDay]?.[p.period]
            if (!entry) return null
            const color = SUBJECT_COLORS[entry.subject] || '#64748B'
            if (entry.isBreak) {
              return (
                <div key={p.period} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-dashed border-slate-200">
                  <div className="w-16 text-[10px] text-slate-400 text-right">{p.time}</div>
                  <div className="flex-1 text-center text-xs text-slate-400 font-medium">{entry.subject}</div>
                </div>
              )
            }
            return (
              <div
                key={p.period}
                draggable={editMode}
                onDragStart={() => handleDragStart(selectedDay, p.period)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(selectedDay, p.period)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  editMode ? 'cursor-move border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30' : 'border-slate-200'
                }`}
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="w-20 flex-shrink-0">
                  <div className="text-[10px] font-bold text-slate-700">{p.label}</div>
                  <div className="text-[10px] text-slate-400">{p.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-sm font-semibold text-slate-900">{entry.subject}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{entry.topic}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-700">{entry.teacher}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">
                      <MapPin className="w-2.5 h-2.5" /> {entry.room}
                    </div>
                  </div>
                  {editMode && <GripVertical className="w-4 h-4 text-slate-300" />}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Full week overview */}
      <Card className="p-5 bg-white border-slate-200/70 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Full Week Overview — {grade} Section {section}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">Period</th>
                {DAYS.map((d) => (
                  <th key={d} className="px-2 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">{d.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => {
                const entry = timetable[selectedDay]?.[p.period]
                const isBreak = entry?.isBreak
                return (
                  <tr key={p.period} className="border-b border-slate-100">
                    <td className="px-2 py-1.5 text-[10px] text-slate-500 font-medium">
                      {p.label}<br/><span className="text-slate-400">{p.time}</span>
                    </td>
                    {DAYS.map((d) => {
                      const e = timetable[d]?.[p.period]
                      if (!e || e.isBreak) {
                        return <td key={d} className="px-2 py-1.5 text-center text-[10px] text-slate-300 bg-slate-50">{e?.subject || '—'}</td>
                      }
                      const color = SUBJECT_COLORS[e.subject] || '#64748B'
                      return (
                        <td key={d} className="px-2 py-1.5 text-center" style={{ background: color + '08' }}>
                          <div className="font-semibold text-[10px]" style={{ color }}>{e.subject}</div>
                          <div className="text-[9px] text-slate-500">{e.teacher.split(' ').slice(-1)[0]}</div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
