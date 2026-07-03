/**
 * BriefingAgent (§2.2) — Role-specific morning briefings
 *
 * "Principal: 3 things need you today"
 * Natural-language analytics ("class 8 students below 75% attendance with pending fees" → live table)
 */

import { db } from '../db'
import ZAI from 'z-ai-web-dev-sdk'
import { generateInsights, type Insight } from './insightAgent'
import { buildSafeSystemPrompt } from './promptDefense'

export interface MorningBriefing {
  role: string
  userName: string
  date: string
  greeting: string
  summary: string
  priorities: { title: string; detail: string; severity: string; actionUrl?: string }[]
  stats: { label: string; value: string; trend?: string }[]
  insights: Insight[]
  aiNarrative: string
}

export async function generateMorningBriefing(
  user: { userId: string; role: string; name: string; schoolId: string }
): Promise<MorningBriefing> {
  const schoolId = user.schoolId
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Gather stats based on role
  const stats: { label: string; value: string; trend?: string }[] = []

  const studentCount = await db.student.count({ where: { status: 'ACTIVE' } })
  const staffCount = await db.staff.count({ where: { status: 'ACTIVE' } })
  const openTasks = await db.task.count({ where: { schoolId, status: 'OPEN' } })
  const overdueTasks = await db.task.count({ where: { schoolId, status: 'OPEN', slaDeadline: { lt: new Date() } } })

  // Today's attendance
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayAttendance = await db.attendance.findMany({ where: { date: { gte: todayStart } } })
  const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length
  const absentToday = todayAttendance.filter(a => a.status === 'ABSENT').length
  const attendanceRate = todayAttendance.length > 0 ? (presentToday / todayAttendance.length) * 100 : 0

  stats.push({ label: 'Students', value: studentCount.toString() })
  stats.push({ label: 'Staff', value: staffCount.toString() })
  stats.push({ label: "Today's Attendance", value: `${attendanceRate.toFixed(1)}%`, trend: `${presentToday} present, ${absentToday} absent` })
  stats.push({ label: 'Open Tasks', value: openTasks.toString(), trend: overdueTasks > 0 ? `${overdueTasks} overdue` : 'All on track' })

  // Fee stats
  const pendingFees = await db.fee.findMany({ where: { balance: { gt: 0 } } })
  const totalDue = pendingFees.reduce((sum, f) => sum + f.balance, 0)
  stats.push({ label: 'Fee Outstanding', value: `₹${totalDue.toLocaleString('en-IN')}`, trend: `${pendingFees.length} students` })

  // Communications today
  const commsToday = await db.communicationLog.count({ where: { schoolId, createdAt: { gte: todayStart } } })
  stats.push({ label: 'Messages Sent Today', value: commsToday.toString() })

  // Generate insights
  const insights = await generateInsights(schoolId)

  // Build priorities (top 3-5 most urgent)
  const priorities = insights
    .filter(i => i.severity === 'CRITICAL' || i.severity === 'WARNING')
    .slice(0, 5)
    .map(i => ({
      title: i.title,
      detail: i.body,
      severity: i.severity,
      actionUrl: i.actionUrl,
    }))

  // If no urgent priorities, add informational ones
  if (priorities.length < 3) {
    const infoInsights = insights.filter(i => i.severity === 'INFO' || i.severity === 'POSITIVE')
    for (const i of infoInsights) {
      if (priorities.length >= 5) break
      priorities.push({
        title: i.title,
        detail: i.body,
        severity: i.severity,
        actionUrl: i.actionUrl,
      })
    }
  }

  // Generate AI narrative (natural language summary)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const systemPrompt = buildSafeSystemPrompt(
    'BriefingAgent',
    `You are generating a morning briefing for ${user.name} (${user.role} role) at a school.

Date: ${today}
Stats: ${JSON.stringify(stats)}
Priorities: ${JSON.stringify(priorities.map(p => p.title))}

Generate a brief, conversational summary (3-4 sentences) that:
1. Greets them by name
2. Highlights the most important thing(s) needing attention today
3. Notes any positive trends
4. Ends with an encouraging note

Keep it concise — this is a glance, not a report. Use natural language.`
  )

  let aiNarrative = `${greeting}, ${user.name.split(' ')[0]}! Here's your briefing for ${today}.`

  try {
    const zai = await ZAI.create()
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate my morning briefing.' },
      ],
      temperature: 0.6,
      max_tokens: 300,
    })
    aiNarrative = response.choices[0]?.message?.content || aiNarrative
  } catch {
    // Fallback to template narrative
    aiNarrative = `${greeting}, ${user.name.split(' ')[0]}! You have ${openTasks} open tasks (${overdueTasks} overdue). Attendance today is ${attendanceRate.toFixed(1)}%. ${priorities.length > 0 ? `Top priority: ${priorities[0].title}.` : 'Everything looks good!'}`
  }

  // Build summary
  const summary = `${studentCount} students, ${staffCount} staff. Attendance: ${attendanceRate.toFixed(1)}%. ${overdueTasks > 0 ? `${overdueTasks} overdue tasks.` : 'All tasks on track.'} ₹${totalDue.toLocaleString('en-IN')} in pending fees. ${commsToday} messages sent today.`

  return {
    role: user.role,
    userName: user.name,
    date: today,
    greeting,
    summary,
    priorities,
    stats,
    insights,
    aiNarrative,
  }
}
