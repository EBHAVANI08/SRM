/**
 * POST /api/admissions/approve — Execute the Admission Saga (§3.1)
 * Triggers the 8-step cascade: student creation → household → ID card → fees → transport → library → RAG → welcome
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeAdmissionSaga } from '@/lib/sagas/admissionSaga'
import { hasPermission } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || ''
    const role = req.headers.get('x-user-role') || ''
    const permissions = JSON.parse(req.headers.get('x-user-permissions') || '[]')

    if (!hasPermission(permissions, 'admissions.create')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const input = await req.json()

    if (!input.firstName || !input.lastName || !input.guardianPhone) {
      return NextResponse.json({ success: false, error: 'Missing required fields: firstName, lastName, guardianPhone' }, { status: 400 })
    }

    const result = await executeAdmissionSaga({
      ...input,
      actorId: userId,
      schoolId: req.headers.get('x-user-school-id') || 'school_default',
    })

    return NextResponse.json({
      success: result.success,
      studentId: result.studentId,
      admissionNo: result.admissionNo,
      householdId: result.householdId,
      steps: result.steps,
      errors: result.errors,
      message: result.success
        ? `Admission complete! ${result.steps.filter(s => s.status === 'COMPLETED').length}/${result.steps.length} steps completed. Student ${input.firstName} ${input.lastName} is now live with admission no ${result.admissionNo}.`
        : `Admission partially completed with ${result.errors.length} errors. Student is live but some steps need attention.`,
    }, { status: result.success ? 201 : 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
