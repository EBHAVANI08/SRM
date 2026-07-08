/**
 * POST /api/omnichannel/send — Send a message via any channel from any profile
 *
 * Body: {
 *   recipientType: 'STUDENT' | 'PARENT' | 'STAFF',
 *   recipientId: string,
 *   channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP',
 *   subject?: string,           // for email
 *   body: string,               // message body (free text)
 *   templateName?: string,      // optional pre-approved template
 *   audience?: 'MINIMUM' | 'WIDER',  // default MINIMUM
 *   metadata?: Record<string, any>,
 * }
 *
 * The endpoint:
 *   1. Validates inputs + role-scope (broadcast permission for WIDER audience)
 *   2. Auto-resolves recipient contact from the database (Student.guardianPhone,
 *      Staff.phone, etc.) if recipientContact not provided
 *   3. Routes through the Communication Agent (single service of record)
 *   4. Returns the comm log ID + delivery status
 *   5. Every send is auto-logged to CommunicationLog with initiatedBy audit trail
 *
 * This is the OmniChannel Hub — any module/profile that needs to send a message
 * routes through here. No module sends messages directly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const body = await req.json()
    const {
      recipientType,
      recipientId,
      channel,
      subject,
      body: messageBody,
      templateName,
      audience = 'MINIMUM',
      metadata = {},
    } = body

    // ─── Validate inputs ───
    if (!recipientType || !recipientId || !channel) {
      return NextResponse.json(
        { success: false, error: 'recipientType, recipientId, and channel are required' },
        { status: 400 },
      )
    }
    if (!['STUDENT', 'PARENT', 'STAFF'].includes(recipientType)) {
      return NextResponse.json(
        { success: false, error: 'recipientType must be STUDENT, PARENT, or STAFF' },
        { status: 400 },
      )
    }
    if (!['WHATSAPP', 'SMS', 'EMAIL', 'PUSH', 'IN_APP'].includes(channel)) {
      return NextResponse.json(
        { success: false, error: 'channel must be WHATSAPP, SMS, EMAIL, PUSH, or IN_APP' },
        { status: 400 },
      )
    }
    if (!messageBody && !templateName) {
      return NextResponse.json(
        { success: false, error: 'Either body or templateName is required' },
        { status: 400 },
      )
    }

    // ─── Server-side scope ───
    // WIDER audience (broadcast) requires SCHOOL_HEAD+ per roleScope.
    // MINIMUM audience (single recipient) is allowed for ADMIN+ and RECEPTION.
    if (audience === 'WIDER') {
      const broadcastCheck = enforceAction('communication_log', 'broadcast', user)
      if (!broadcastCheck.allowed) {
        return NextResponse.json(
          { success: false, error: broadcastCheck.reason, scopeDenied: true },
          { status: 403 },
        )
      }
    } else {
      // MINIMUM audience: need create permission on communication_log
      const sendCheck = enforceAction('communication_log', 'create', user)
      if (!sendCheck.allowed) {
        return NextResponse.json(
          { success: false, error: sendCheck.reason, scopeDenied: true },
          { status: 403 },
        )
      }
    }

    // ─── Auto-resolve recipient contact from the database ───
    let recipientContact = body.recipientContact || ''
    let recipientName = ''
    if (!recipientContact) {
      if (recipientType === 'STUDENT' || recipientType === 'PARENT') {
        const student = await db.student.findUnique({
          where: { id: recipientId },
          select: { fullName: true, guardianName: true, guardianPhone: true, guardianEmail: true },
        }).catch(() => null)
        if (student) {
          recipientName = student.guardianName || student.fullName
          if (channel === 'EMAIL') recipientContact = student.guardianEmail || ''
          else recipientContact = student.guardianPhone || ''
        }
      } else if (recipientType === 'STAFF') {
        const staff = await db.staff.findUnique({
          where: { id: recipientId },
          select: { fullName: true, phone: true, email: true },
        }).catch(() => null)
        if (staff) {
          recipientName = staff.fullName
          if (channel === 'EMAIL') recipientContact = staff.email || ''
          else recipientContact = staff.phone || ''
        }
      }
    }

    if (!recipientContact) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not resolve contact for ${recipientType} ${recipientId} on channel ${channel}. Please provide recipientContact directly.`,
        },
        { status: 400 },
      )
    }

    // ─── Route through the Communication Agent (single service of record) ───
    await sendCommunication({
      channel,
      recipientType: recipientType as any,
      recipientId,
      recipientContact,
      templateName,
      subject,
      body: messageBody,
      schoolId: user.schoolId,
      audience,
      metadata: {
        ...metadata,
        recipientName,
        initiatedFrom: 'omnichannel_hub',
      },
      initiatedByRole: user.role,
      initiatedByUserId: user.userId,
    })

    // ─── Fetch the just-created comm log entry ───
    const log = await db.communicationLog.findFirst({
      where: { recipientId, channel },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, body: true, subject: true, createdAt: true },
    })

    return NextResponse.json({
      success: true,
      message: `✓ Message sent to ${recipientName || recipientId} via ${channel}`,
      log: {
        id: log?.id,
        channel,
        recipientType,
        recipientId,
        recipientName,
        recipientContact: channel === 'EMAIL'
          ? recipientContact
          : recipientContact.slice(0, 4) + '****' + recipientContact.slice(-4),
        subject: log?.subject,
        body: log?.body,
        status: log?.status,
        sentAt: log?.createdAt,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/omnichannel/send error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

/**
 * GET /api/omnichannel/log — Fetch the communication log for any entity
 *
 * Query: ?recipientId=X&recipientType=STUDENT
 *     OR ?limit=50 (latest across all)
 */
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const { searchParams } = new URL(req.url)
    const recipientId = searchParams.get('recipientId')
    const recipientType = searchParams.get('recipientType')
    const channel = searchParams.get('channel')
    const limit = parseInt(searchParams.get('limit') || '50')

    // SERVER-SIDE SCOPE: view permission on communication_log
    const actionCheck = enforceAction('communication_log', 'view', user)
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    const where: Record<string, any> = { schoolId: user.schoolId }
    if (recipientId) where.recipientId = recipientId
    if (recipientType) where.recipientType = recipientType
    if (channel) where.channel = channel

    const logs = await db.communicationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
