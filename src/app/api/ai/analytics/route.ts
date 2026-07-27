import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  let moduleName = 'attendance'
  try {
    const body = await req.json()
    moduleName = String(body.module || 'attendance')
    const timeRange = body.timeRange || '30d'

    // Real ERP metrics (simulated from realistic seed data)
    const metrics = generateModuleMetrics(moduleName, timeRange)

    const zai = await ZAI.create()

    const aiSummary = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are the LearnX AI Analytics engine. Generate 3-5 concise, actionable insights based on the provided ERP metrics. Use bullet points. Be specific with numbers. Suggest one bold action item.',
        },
        {
          role: 'user',
          content: `Module: ${module}\nTime range: ${timeRange}\nMetrics: ${JSON.stringify(metrics, null, 2)}\n\nGenerate AI insights and one bold recommendation.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 600,
    })

    return NextResponse.json({
      module,
      timeRange,
      metrics,
      aiInsights: aiSummary.choices[0]?.message?.content || '',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Analytics Error:', error)
    return NextResponse.json(
      {
        module: moduleName,
        metrics: generateModuleMetrics(moduleName, '30d'),
        aiInsights: 'AI insights temporarily unavailable. Showing raw metrics.',
        error: error?.message,
      },
      { status: 200 }
    )
  }
}

function generateModuleMetrics(module: string, timeRange: string) {
  const base: Record<string, any> = {
    attendance: {
      kpis: [
        { label: 'Avg Attendance', value: 94.2, unit: '%', trend: +0.8, target: 95 },
        { label: 'Present Today', value: 2683, unit: '', trend: +47, target: 2847 },
        { label: 'Absent', value: 164, unit: '', trend: -12, target: 100 },
        { label: 'Late Arrivals', value: 47, unit: '', trend: -8, target: 30 },
      ],
      breakdown: { biometric: 48, rfid: 32, face: 18, manual: 2 },
      trend: [92.1, 93.4, 94.2, 93.8, 94.5, 95.1, 94.2],
      insight: 'Attendance is up 0.8% vs last week. Grade 7-B has the lowest attendance (87.2%).',
    },
    fees: {
      kpis: [
        { label: 'Collected (FY)', value: 4.82, unit: 'Cr', trend: +12.5, target: 6.0 },
        { label: 'Pending', value: 38.4, unit: 'L', trend: -8.2, target: 20 },
        { label: 'Defaulters', value: 47, unit: '', trend: -12, target: 30 },
        { label: 'Online %', value: 92, unit: '%', trend: +3, target: 95 },
      ],
      breakdown: { upi: 58, card: 18, netbanking: 12, cash: 8, cheque: 4 },
      trend: [3.2, 3.8, 4.1, 4.5, 4.7, 4.8, 4.82],
      insight: 'Fee collection trending +12.5% YoY. 47 defaulters predicted; recommend early intervention.',
    },
    admissions: {
      kpis: [
        { label: 'Applications', value: 1284, unit: '', trend: +24, target: 1500 },
        { label: 'Confirmed', value: 612, unit: '', trend: +18, target: 700 },
        { label: 'KG Reg', value: 184, unit: '', trend: +32, target: 200 },
        { label: 'Conversion', value: 68.5, unit: '%', trend: +5.2, target: 75 },
      ],
      breakdown: { kg: 184, primary: 312, secondary: 412, sr_secondary: 376 },
      trend: [820, 940, 1080, 1140, 1220, 1260, 1284],
      insight: 'KG registration grew 32% YoY. Recommend increasing capacity by 1 section.',
    },
    exams: {
      kpis: [
        { label: 'Upcoming', value: 14, unit: '', trend: 0, target: 14 },
        { label: 'Evaluated', value: 8492, unit: '', trend: +1284, target: 10000 },
        { label: 'Avg Score', value: 78.4, unit: '%', trend: +2.1, target: 80 },
        { label: 'Pass Rate', value: 96.8, unit: '%', trend: +1.4, target: 98 },
      ],
      breakdown: { unit_test: 4, monthly: 3, half_yearly: 1, final: 1, quiz: 5 },
      trend: [74.2, 75.8, 76.4, 77.1, 77.8, 78.1, 78.4],
      insight: 'Average scores improved 2.1%. Science scores highest (84%), Maths needs attention (71%).',
    },
    'ai-safety': {
      kpis: [
        { label: 'Cameras', value: 184, unit: '', trend: 0, target: 184 },
        { label: 'Alerts Today', value: 4, unit: '', trend: -2, target: 0 },
        { label: 'Response Time', value: 1.2, unit: 'min', trend: -18, target: 1 },
        { label: 'False Positive', value: 0.8, unit: '%', trend: -0.3, target: 0.5 },
      ],
      breakdown: { fight: 1, fall: 1, intrusion: 0, fire: 0, other: 2 },
      trend: [8, 6, 5, 7, 4, 5, 4],
      insight: 'Safety alerts down 50% week-over-week. AI model retrained last week — accuracy +2%.',
    },
    'ai-calendar': {
      kpis: [
        { label: 'Coverage Today', value: 98.2, unit: '%', trend: +1.4, target: 100 },
        { label: 'AI Substitutions', value: 12, unit: '', trend: +2, target: 0 },
        { label: 'Allocation Time', value: 4.2, unit: 's', trend: -82, target: 5 },
        { label: 'Match Accuracy', value: 96, unit: '%', trend: +2, target: 98 },
      ],
      breakdown: { sick_leave: 5, emergency: 3, training: 2, other: 2 },
      trend: [12, 8, 14, 10, 9, 11, 12],
      insight: 'AI substitution engine handled 12 cases today in avg 4.2s. Coverage at 98.2%.',
    },
  }

  return (
    base[module] || {
      kpis: [
        { label: 'Total Records', value: 2847, unit: '', trend: +84, target: 3000 },
        { label: 'Active Today', value: 1842, unit: '', trend: +47, target: 2000 },
        { label: 'AI Actions', value: 312, unit: '', trend: +28, target: 400 },
        { label: 'Efficiency', value: 92.4, unit: '%', trend: +2.1, target: 95 },
      ],
      breakdown: { active: 65, idle: 25, maintenance: 10 },
      trend: [82, 85, 87, 89, 90, 91, 92.4],
      insight: `Module ${module} operating at 92.4% efficiency. AI optimization suggestions available.`,
    }
  )
}
