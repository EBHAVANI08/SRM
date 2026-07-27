/**
 * POST /api/omnichannel/send
 *
 * Sends a notification via the specified channel (WHATSAPP, SMS, EMAIL, PUSH, IN_APP)
 * using the comms.ts sendCommunication() service.
 *
 * This route was missing — the NotificationPreviewModal.doSend() was calling it
 * but no route existed, so all "Confirm & Send" button clicks failed silently.
 *
 * Body:
 *   {
 *     recipientType: 'PARENT' | 'STAFF' | 'STUDENT',
 *     recipientId: string,
 *     channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP',
 *     subject?: string,
 *     body: string,
 *     templateName?: string,
 *     audience?: 'MINIMUM' | 'WIDER',
 *     metadata?: Record<string, any>
 *   }
 *
 * Returns:
 *   { success: true, results: [{ recipientId, channel, status, commId }] }
 *   or { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFromHeaders } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    if (!user.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { recipientType, recipientId, channel, subject, body: messageBody, templateName, audience, metadata } = body

    if (!recipientId || !channel || !messageBody) {
      return NextResponse.json({ success: false, error: 'recipientId, channel, and body are required' }, { status: 400 })
    }

    // Look up the recipient's contact info from the DB
    // For PARENT recipients, recipientId is typically the studentId — look up the student's guardian
    // For STAFF recipients, recipientId might be a staff ID or a "teacher-{grade}" key
    let recipientContact = ''
    let recipientName = metadata?.recipientName || 'Recipient'

    if (recipientType === 'PARENT') {
      // Try to find the student by ID (could be a real studentId or an application ID)
      const student = await db.student.findFirst({
        where: {
          OR: [
            { id: recipientId },
            { admissionNo: recipientId },
          ],
        },
        select: { guardianName: true, guardianPhone: true, guardianEmail: true, fullName: true },
      })

      if (student) {
        recipientName = student.guardianName || recipientName
        if (channel === 'EMAIL') {
          recipientContact = student.guardianEmail || ''
        } else {
          recipientContact = student.guardianPhone || ''
        }
      } else {
        // Not a student — use the contact from metadata if available
        recipientContact = metadata?.contact || metadata?.phone || metadata?.email || ''
      }
    } else if (recipientType === 'STAFF') {
      // For staff, recipientId might be "teacher-{grade}" or a staff ID
      if (recipientId.startsWith('teacher-') || recipientId.startsWith('staff-')) {
        // Use the contact from metadata (the modal already has the phone/email)
        recipientContact = metadata?.contact || metadata?.phone || metadata?.email || ''
      } else {
        const staff = await db.staff.findFirst({
          where: {
            OR: [{ id: recipientId }, { employeeId: recipientId }],
          },
          select: { phone: true, email: true, fullName: true },
        })
        if (staff) {
          recipientName = staff.fullName || recipientName
          recipientContact = channel === 'EMAIL' ? staff.email : staff.phone
        }
      }
    }

    // If we still don't have a contact, accept a direct `contact` field from the body
    // (the NotificationPreviewModal already has the phone/email from the frontend)
    if (!recipientContact) {
      recipientContact = body.contact || body.phone || body.email || ''
    }

    if (!recipientContact) {
      return NextResponse.json({
        success: false,
        error: `Could not resolve contact info for ${recipientType} ${recipientId} on channel ${channel}. Please ensure the recipient has a phone number (for WhatsApp/SMS) or email (for Email) in the system.`,
      }, { status: 400 })
    }

    // Send via comms.ts
    const comm = await sendCommunication({
      channel,
      recipientType: recipientType || 'PARENT',
      recipientId,
      recipientContact,
      templateName,
      subject: subject || '',
      body: messageBody,
      category: metadata?.category || 'GENERAL',
      audience: audience || 'MINIMUM',
      schoolId: user.schoolId,
      initiatedByRole: user.role as any,
      initiatedByUserId: user.userId,
      metadata: { ...metadata, source: metadata?.source || 'omnichannel-send' },
    })

    return NextResponse.json({
      success: true,
      results: [{
        recipientId,
        recipientName,
        channel,
        status: comm.status,
        commId: comm.id,
        contact: recipientContact,
      }],
    })
  } catch (error: any) {
    console.error('POST /api/omnichannel/send error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
