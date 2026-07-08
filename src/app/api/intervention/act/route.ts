/**
 * POST /api/intervention/act — Execute a one-click intervention action
 *
 * Body: {
 *   studentId: string,
 *   actionType: 'schedule_meeting' | 'send_intervention' | 'attendance_alert' |
 *               'behavior_referral' | 'send_progress_update' | 'send_praise',
 *   channel?: 'WHATSAPP' | 'SMS' | 'EMAIL',  // override parent's preferred channel
 *   meetingDate?: string,  // ISO date for scheduled meeting
 *   notes?: string,
 * }
 *
 * The endpoint:
 *   1. Validates the action type
 *   2. Fetches student + parent contact info
 *   3. Sends the communication via the Communication Agent (auto-logged)
 *   4. Creates a Task record for tracking (for schedule_meeting/behavior_referral)
 *   5. Publishes an event for the audit log
 *   6. Returns the action result with comm log ID + task ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'
import { getUserFromHeaders, enforceAction } from '@/lib/apiScope'
import { sendCommunication } from '@/lib/comms'

export const runtime = 'nodejs'

const ACTION_TEMPLATES: Record<string, { templateName: string; defaultChannel: 'WHATSAPP' | 'SMS' | 'EMAIL'; taskType?: string; taskTitle: string; priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> = {
  schedule_meeting: {
    templateName: 'intervention_meeting_scheduled',
    defaultChannel: 'WHATSAPP',
    taskType: 'COUNSELLOR_MEETING',
    taskTitle: 'Schedule counsellor meeting',
    priority: 'HIGH',
  },
  send_intervention: {
    templateName: 'intervention_message',
    defaultChannel: 'WHATSAPP',
    taskTitle: 'Send intervention message',
    priority: 'HIGH',
  },
  attendance_alert: {
    templateName: 'attendance_alert_parent',
    defaultChannel: 'SMS',
    taskTitle: 'Send attendance alert',
    priority: 'HIGH',
  },
  behavior_referral: {
    templateName: 'behavior_referral_notice',
    defaultChannel: 'EMAIL',
    taskType: 'BEHAVIOR_REFERRAL',
    taskTitle: 'Refer to behaviour specialist',
    priority: 'MEDIUM',
  },
  send_progress_update: {
    templateName: 'progress_update_parent',
    defaultChannel: 'EMAIL',
    taskTitle: 'Send progress update',
    priority: 'MEDIUM',
  },
  send_praise: {
    templateName: 'praise_note',
    defaultChannel: 'WHATSAPP',
    taskTitle: 'Send praise note',
    priority: 'LOW',
  },
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromHeaders(req)
    const body = await req.json()
    const { studentId, actionType, channel, meetingDate, notes } = body

    if (!studentId || !actionType) {
      return NextResponse.json(
        { success: false, error: 'studentId and actionType are required' },
        { status: 400 },
      )
    }

    const template = ACTION_TEMPLATES[actionType]
    if (!template) {
      return NextResponse.json(
        { success: false, error: `Unknown actionType: ${actionType}. Valid: ${Object.keys(ACTION_TEMPLATES).join(', ')}` },
        { status: 400 },
      )
    }

    // SERVER-SIDE SCOPE: TEACHER+ can take intervention actions on students they can view
    const actionCheck = enforceAction('student', 'view', user)
    if (!actionCheck.allowed) {
      return NextResponse.json(
        { success: false, error: actionCheck.reason, scopeDenied: true },
        { status: 403 },
      )
    }

    // Fetch student + guardian contact
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true, fullName: true, admissionNo: true, sectionId: true,
        guardianName: true, guardianPhone: true, guardianEmail: true,
      },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 },
      )
    }

    // Determine channel: explicit override > student's preferred > template default
    let useChannel = channel || template.defaultChannel
    let contact = ''
    if (useChannel === 'EMAIL') {
      contact = student.guardianEmail || ''
      if (!contact && student.guardianPhone) { useChannel = 'WHATSAPP'; contact = student.guardianPhone }
    } else {
      contact = student.guardianPhone || ''
      if (!contact && student.guardianEmail) { useChannel = 'EMAIL'; contact = student.guardianEmail }
    }

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'No guardian contact on file for this student' },
        { status: 400 },
      )
    }

    // 1. Send the communication via the Communication Agent (auto-logged)
    const commResult = await sendCommunication({
      channel: useChannel,
      recipientType: 'PARENT',
      recipientId: studentId,
      recipientContact: contact,
      templateName: template.templateName,
      schoolId: user.schoolId,
      audience: 'MINIMUM',
      metadata: {
        studentName: student.fullName,
        admissionNo: student.admissionNo,
        actionType,
        meetingDate: meetingDate || null,
        notes: notes || '',
        initiatedBy: user.userId,
        initiatedByRole: user.role,
      },
      initiatedByRole: user.role,
      initiatedByUserId: user.userId,
    }).catch((err: any) => ({ error: err?.message }))

    // 2. Fetch the comm log entry
    const commLog = await db.communicationLog.findFirst({
      where: { recipientId: studentId, channel: useChannel },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    })

    // 3. Create a Task for tracking (for schedule_meeting + behavior_referral)
    let task: any = null
    if (template.taskType) {
      task = await db.task.create({
        data: {
          schoolId: user.schoolId,
          title: `${template.taskTitle} — ${student.fullName}`,
          description: `Action initiated by ${user.userId} (${user.role}). ${notes || ''}`.trim(),
          assigneeRole: 'ADMIN',
          entityType: 'STUDENT',
          entityId: studentId,
          metadata: JSON.stringify({
            actionType,
            commLogId: commLog?.id,
            meetingDate: meetingDate || null,
            priority: template.priority,
          }),
          status: 'OPEN',
        },
      }).catch(() => null)
    }

    // 4. Publish event for audit log
    await publishEvent({
      type: 'intervention.action_taken',
      entityType: 'STUDENT',
      entityId: studentId,
      payload: {
        actionType,
        channel: useChannel,
        commLogId: commLog?.id,
        taskId: task?.id,
        meetingDate: meetingDate || null,
        notes: notes || '',
      },
      actorType: 'human',
      actorId: user.userId,
      schoolId: user.schoolId,
    })

    return NextResponse.json({
      success: true,
      action: {
        type: actionType,
        label: template.taskTitle,
        studentId,
        studentName: student.fullName,
        channel: useChannel,
        contact: useChannel === 'EMAIL' ? contact : contact.slice(0, 4) + '****' + contact.slice(-4),
        commLogId: commLog?.id,
        commStatus: commLog?.status,
        taskId: task?.id,
        priority: template.priority,
        meetingDate: meetingDate || null,
      },
      message: `✓ ${template.taskTitle} sent to ${student.guardianName || 'parent'} via ${useChannel}`,
    })
  } catch (error: any) {
    console.error('POST /api/intervention/act error:', error)
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
