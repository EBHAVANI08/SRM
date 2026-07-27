/**
 * Additional Automation Rules (§4 matrix rows for transport, library, hostel, inventory, safety)
 *
 * These rules are seeded alongside the Phase 2 default rules to complete the full module automation matrix.
 */

import { db } from './db'

export async function seedExtendedRules(schoolId: string = 'school_default'): Promise<number> {
  const extendedRules = [
    // === TRANSPORT AUTOMATION ===
    {
      name: 'Transport Delay → Affected Route Parents Alert',
      triggerEvent: 'transport.delayed',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'transport_delay_alert' },
        { type: 'create_task', title: 'Investigate transport delay', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 2 },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Transport Document Expiry → Reminder',
      triggerEvent: 'document.expiring',
      conditions: JSON.stringify({ op: 'contains', field: 'payload.documentType', value: 'VEHICLE' }),
      actions: JSON.stringify([
        { type: 'create_task', title: 'Renew vehicle document', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 168 },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Transport Boarding → Parent Notification',
      triggerEvent: 'transport.boarded',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'transport_boarding_notification' },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === LIBRARY AUTOMATION ===
    {
      name: 'Library Book Overdue → Reminder',
      triggerEvent: 'library.overdue',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'library_overdue_reminder' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'TC Issued → Library Clearance Check',
      triggerEvent: 'student.exited',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'create_task', title: 'Library clearance for TC', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 24 },
        { type: 'create_task', title: 'Inventory clearance for TC', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 24 },
      ]),
      tier: 'B',
      simulationMode: false,
    },

    // === HOSTEL AUTOMATION ===
    {
      name: 'Hostel Gate Pass → Parent Notification',
      triggerEvent: 'hostel.gate_pass',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'hostel_gate_pass_notification' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Hostel Late Return → Warden Alert',
      triggerEvent: 'hostel.late_return',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'create_task', title: 'Follow up on late hostel return', assigneeRole: 'ADMIN', priority: 'URGENT', slaHours: 1 },
        { type: 'send_communication', channel: 'SMS', recipientType: 'PARENT', template: 'hostel_late_return_alert' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Hostel Attendance Sync',
      triggerEvent: 'attendance.marked',
      conditions: JSON.stringify({ op: 'eq', field: 'payload.hostelStudent', value: true }),
      actions: JSON.stringify([
        { type: 'create_record', model: 'Task', data: { title: 'Sync hostel attendance', priority: 'LOW' } },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === INVENTORY AUTOMATION ===
    {
      name: 'Inventory Low Stock → Reorder Alert',
      triggerEvent: 'inventory.low_stock',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'create_task', title: 'Reorder inventory items', assigneeRole: 'ADMIN', priority: 'NORMAL', slaHours: 72 },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Asset Issued → Track Return',
      triggerEvent: 'asset.issued',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'schedule_followup', title: 'Check asset return', description: 'Verify asset has been returned', assigneeRole: 'ADMIN', delayHours: 168 },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Asset Write-off → Principal Approval',
      triggerEvent: 'asset.writeoff_requested',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'create_task', title: 'Review asset write-off request', assigneeRole: 'SCHOOL_HEAD', priority: 'HIGH', slaHours: 48 },
      ]),
      tier: 'C',
      simulationMode: false,
    },

    // === SAFETY/CLINIC AUTOMATION ===
    {
      name: 'Clinic Visit → Parent Notification',
      triggerEvent: 'clinic.visit',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'clinic_visit_notification' },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Allergy Flag → Propagate to Canteen/Transport',
      triggerEvent: 'student.admitted',
      conditions: JSON.stringify({ op: 'neq', field: 'payload.allergies', value: null }),
      actions: JSON.stringify([
        { type: 'create_task', title: 'Propagate allergy flags to canteen & transport', assigneeRole: 'ADMIN', priority: 'HIGH', slaHours: 12 },
      ]),
      tier: 'A',
      simulationMode: false,
    },
    {
      name: 'Visitor Mismatch → Security Alert',
      triggerEvent: 'gate.mismatch',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'create_task', title: 'Security alert: visitor mismatch at gate', assigneeRole: 'ADMIN', priority: 'URGENT', slaHours: 1 },
        { type: 'send_communication', channel: 'SMS', recipientType: 'STAFF', template: 'visitor_mismatch_alert' },
      ]),
      tier: 'A',
      simulationMode: false,
    },

    // === COMMUNICATION AUTOMATION ===
    {
      name: 'Circular Published → Segmented Send',
      triggerEvent: 'communication.circular',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'circular_notification' },
        { type: 'send_communication', channel: 'EMAIL', recipientType: 'PARENT', template: 'circular_email' },
      ]),
      tier: 'B',
      simulationMode: false,
    },

    // === COUNSELLING AUTOMATION ===
    {
      name: 'At-Risk Score Update → Counselling Pipeline',
      triggerEvent: 'at_risk.score_computed',
      conditions: JSON.stringify({ op: 'gte', field: 'payload.score', value: 50 }),
      actions: JSON.stringify([
        { type: 'create_task', title: 'Counselling referral needed', assigneeRole: 'SCHOOL_HEAD', priority: 'HIGH', slaHours: 48 },
      ]),
      tier: 'B',
      simulationMode: false,
    },

    // === PTM AUTOMATION ===
    {
      name: 'PTM Scheduled → Parent Booking + Reminder',
      triggerEvent: 'ptm.scheduled',
      conditions: '{}',
      actions: JSON.stringify([
        { type: 'send_communication', channel: 'WHATSAPP', recipientType: 'PARENT', template: 'ptm_schedule_notification' },
        { type: 'schedule_followup', title: 'Send PTM reminder', description: 'Reminder 1 day before PTM', assigneeRole: 'SYSTEM', delayHours: 24 },
      ]),
      tier: 'A',
      simulationMode: false,
    },
  ]

  let created = 0
  for (const rule of extendedRules) {
    const existing = await db.automationRule.findFirst({
      where: { schoolId, name: rule.name },
    })

    if (!existing) {
      await db.automationRule.create({
        data: {
          schoolId,
          name: rule.name,
          triggerEvent: rule.triggerEvent,
          conditions: rule.conditions,
          actions: rule.actions,
          tier: rule.tier,
          simulationMode: rule.simulationMode,
          enabled: true,
          version: 1,
        },
      })
      created++
    }
  }

  console.log(`  ✓ ${created} extended automation rules seeded (total: ${await db.automationRule.count()})`)
  return created
}
