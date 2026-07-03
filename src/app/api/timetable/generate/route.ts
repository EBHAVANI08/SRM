/**
 * POST /api/timetable/generate — AI timetable generation (CSP solver)
 * Body: { classes: [{ classId, className, subjects: [{ name, periodsPerWeek }] }] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateTimetable } from '@/lib/sagas/timetableCSP'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || ''
    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'academic.*') && !hasPermission(permissions, '*')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    const { classes } = body

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      // Default: generate for a sample class
      const defaultClasses = [
        {
          classId: '7-A',
          className: 'Grade 7-A',
          subjects: [
            { name: 'Mathematics', periodsPerWeek: 6 },
            { name: 'Science', periodsPerWeek: 5 },
            { name: 'English', periodsPerWeek: 5 },
            { name: 'Social Studies', periodsPerWeek: 4 },
            { name: 'Hindi', periodsPerWeek: 4 },
            { name: 'Computer Science', periodsPerWeek: 2 },
            { name: 'Physical Education', periodsPerWeek: 2 },
          ],
        },
        {
          classId: '8-A',
          className: 'Grade 8-A',
          subjects: [
            { name: 'Mathematics', periodsPerWeek: 6 },
            { name: 'Physics', periodsPerWeek: 4 },
            { name: 'Chemistry', periodsPerWeek: 4 },
            { name: 'English', periodsPerWeek: 5 },
            { name: 'Biology', periodsPerWeek: 3 },
            { name: 'Social Studies', periodsPerWeek: 3 },
            { name: 'Computer Science', periodsPerWeek: 2 },
          ],
        },
      ]

      const result = await generateTimetable({
        schoolId,
        classes: defaultClasses,
        actorId: userId,
      })

      return NextResponse.json({
        success: true,
        timetable: result,
        message: result.message,
      })
    }

    const result = await generateTimetable({
      schoolId,
      classes,
      actorId: userId,
    })

    return NextResponse.json({
      success: true,
      timetable: result,
      message: result.message,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
