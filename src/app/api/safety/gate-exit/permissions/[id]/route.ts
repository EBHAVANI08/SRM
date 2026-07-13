/** DELETE /api/safety/gate-exit/permissions/:id — revoke an early-exit permission */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromHeaders(req)
    const check = enforceAction('safety_alert', 'delete', user)
    if (!check.allowed) return NextResponse.json({ success: false, error: check.reason }, { status: 403 })

    const { id } = await params
    const existing = await db.earlyExitPermission.findUnique({ where: { id } })
    if (!existing || existing.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: 'Permission not found' }, { status: 404 })
    }

    await db.earlyExitPermission.delete({ where: { id } })
    return NextResponse.json({ success: true, deleted: id })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
