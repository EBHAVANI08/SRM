import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

// Simulated RAG knowledge base — in production this would query a vector DB
const KNOWLEDGE_BASE: Record<string, string> = {
  attendance: 'The school attendance system uses biometric fingerprint, RFID cards, and AI face recognition. Average daily attendance is 94.2%. AI anomaly detection flags unusual patterns. Auto-SMS is sent to parents for absent students within 5 minutes of morning assembly.',
  fees: 'Fee management supports UPI, cards, net-banking, and cash. Annual fee collection is Rs 4.82 Cr with 92% digital. AI predicts defaulters 14 days before due date. Auto-reminders sent via SMS, email, and WhatsApp 7/3/1 days before due date.',
  admissions: 'Admission workflow: online application, document upload, AI prospect scoring (academic + demographic + extracurricular), interview scheduling, offer letter, fee payment, enrollment. KG registration analytics show 32% YoY growth. Conversion rate 68.5%.',
  exams: 'Examination system handles scheduling, hall arrangement, invigilation duty allocation, OMR-based evaluation, AI score verification (detects suspicious patterns), report card generation, and parent SMS. 14 exams scheduled in next 7 days.',
  'ai-calendar': 'AI Academic Calendar engine generates daily/weekly/monthly plans, syncs lesson plans, tracks syllabus coverage (avg 76%), and auto-allocates substitute teachers in 4.2 seconds using subject-expert matching algorithm. Coverage today: 98.2%.',
  'ai-safety': 'AI Safety Alert uses computer vision on 184 CCTV cameras to detect fights, falls, fire, smoke, and intrusion in real-time. Multi-channel alerts (SMS, push, email, siren) triggered within 1.2 minutes. False positive rate 0.8%.',
  'ai-question-paper': 'AI Question Paper Generator creates exam papers in 8.2 seconds using blueprint adherence, difficulty calibration, and a question bank of 24,000+ items. Supports MCQ, short answer, long answer, and case-based questions. Multi-board compliant (CBSE, ICSE, IB, State).',
  'ai-mock': 'AI Mock Engine generates adaptive tests that adjust difficulty based on student performance. Tracks weak areas and creates personalized study plans. 8,492 mock tests taken with average score improvement of 18%.',
  transport: 'Transport fleet: 38 buses, 1,847 students onboard, 96.2% on-time arrival. Live GPS tracking with AI ETA prediction (94% accurate). RFID boarding ensures no child left behind. Route optimization saved 18% fuel last quarter.',
  hrms: 'HRMS manages 186 staff with complete lifecycle: recruitment, onboarding, attendance, leave, payroll (Rs 62.4 L monthly), PF/ESI compliance, appraisals. AI attrition prediction flagged 4 staff at risk — intervention in progress.',
  hostel: '4 hostels (2 boys, 2 girls) with 847 residents at 94.2% occupancy. Mess management with 4.3/5 rating. AI optimizes room allocation based on compatibility scoring. Warden app enables real-time issue reporting.',
}

const SYSTEM_PROMPT = `You are LearnX AI — the intelligent assistant embedded inside the LearnX AI School ERP platform.

You are knowledgeable about:
- School operations: admissions, attendance, fees, exams, transport, hostel, canteen, HRMS, finance
- AI features: academic intelligence, behavior tracking, safety alerts, career counselling, mock tests, question paper generation, substitution engine
- Indian school context: CBSE, ICSE, IB, State boards; Indian Rupee; Indian academic calendar (April-March)
- Best practices for school management, pedagogy, and compliance (DPDP Act, NEP 2020)

Style guidelines:
- Be concise, professional, and helpful
- Use bullet points for multi-step answers
- When suggesting actions, reference specific modules in the ERP
- If asked about specific student/staff data, decline and direct user to the relevant module
- Use Indian English spelling and Rupee symbol
- For numerical insights, prefer percentages and absolute numbers together
- Always be supportive of teachers, students, and parents

When the user asks about a module, use the provided KNOWLEDGE BASE context to ground your answer. If you don't know, suggest where to find the info.`

export async function POST(req: NextRequest) {
  try {
    const { messages, moduleContext, userRole } = await req.json()

    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
    const userQuery: string = lastUserMessage?.content || ''

    // Simple keyword-based RAG retrieval
    const relevantKeys = Object.keys(KNOWLEDGE_BASE).filter((key) =>
      userQuery.toLowerCase().includes(key.replace('-', ' ').replace('ai ', ''))
    )
    const retrievedContext = relevantKeys
      .map((k) => `[${k.toUpperCase()}]: ${KNOWLEDGE_BASE[k]}`)
      .join('\n\n')

    const zai = await ZAI.create()

    const systemMessage = retrievedContext
      ? `${SYSTEM_PROMPT}\n\nRelevant context retrieved from RAG knowledge base:\n${retrievedContext}\n\nUser role: ${userRole || 'TEACHER'}\nActive module: ${moduleContext || 'dashboard'}`
      : `${SYSTEM_PROMPT}\n\nUser role: ${userRole || 'TEACHER'}\nActive module: ${moduleContext || 'dashboard'}`

    const response = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemMessage },
        ...messages.slice(-8).map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content as string,
        })),
      ],
      temperature: 0.6,
      max_tokens: 800,
    })

    const reply = response.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.'

    // Generate suggested follow-up questions
    const followUps = generateFollowUps(userQuery, moduleContext)

    return NextResponse.json({
      reply,
      followUps,
      contextUsed: relevantKeys.length > 0,
      retrievedModules: relevantKeys,
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      {
        reply: `I encountered an issue processing your request. ${error?.message || 'Please try again.'}`,
        followUps: [
          "Show me today's attendance summary",
          'What fees are pending this week?',
          'Generate a question paper for Grade 10 Maths',
        ],
        contextUsed: false,
      },
      { status: 200 }
    )
  }
}

function generateFollowUps(query: string, module?: string): string[] {
  const q = query.toLowerCase()
  if (q.includes('attendance')) {
    return ['Why is attendance low in Grade 7?', 'Send reminder to parents of absent students', 'Show attendance trend for last 30 days']
  }
  if (q.includes('fee') || q.includes('payment')) {
    return ['List top 10 fee defaulters', 'Send fee reminder to Grade 8 parents', 'Generate fee collection report for Q1']
  }
  if (q.includes('exam') || q.includes('question')) {
    return ['Generate a question paper for Grade 10 Science', 'Show exam schedule for next week', 'Analyze last exam performance by subject']
  }
  if (q.includes('substitut') || q.includes('timetable')) {
    return ['Find substitute for Math class Grade 8B tomorrow', "Show today's timetable conflicts", 'Optimize timetable for next week']
  }
  if (q.includes('safety') || q.includes('alert')) {
    return ['Show active safety alerts', 'Run fire drill simulation', 'Generate safety report for this month']
  }
  if (q.includes('career')) {
    return ['Recommend careers for a student good at Maths & Biology', 'Schedule career counselling for Grade 10', 'Show aptitude test results']
  }
  return [
    "Summarize today's school operations",
    'Which students need attention today?',
    'Generate monthly performance report',
  ]
}
