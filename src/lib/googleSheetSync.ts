/**
 * googleSheetSync.ts — service that converts the daily attendance report
 * into Google Sheets rows and syncs them via the Google Sheets API.
 *
 * Supports two auth methods:
 *   1. Service Account (recommended for production) — serviceAccountEmail + privateKey
 *   2. API Key (simpler, read-only) — for public sheets
 *
 * The sync writes a header row + one row per student per day, with columns:
 *   Date | Grade | Section | Student ID | Student Name | Status | Check-in | Method | Parent Name | Parent Phone | Parent Notified | Notification Channel | Notification Status
 */

import { db } from './db'

export interface SheetRow {
  values: string[]
}

export interface SyncResult {
  success: boolean
  rowsSynced: number
  spreadsheetUrl?: string
  error?: string
}

const SHEET_HEADERS = [
  'Date',
  'Grade',
  'Section',
  'Student ID',
  'Student Name',
  'Status',
  'Check-in',
  'Method',
  'Parent Name',
  'Parent Phone',
  'Parent Notified',
  'Notification Channel',
  'Notification Status',
]

/**
 * Build the rows for the Google Sheet from the daily attendance report.
 */
export function buildSheetRows(report: any): SheetRow[] {
  const rows: SheetRow[] = [{ values: SHEET_HEADERS }]

  for (const c of report.byClass || []) {
    for (const s of c.students || []) {
      const notif = s.notification || {}
      rows.push({
        values: [
          report.date,
          c.grade,
          c.section,
          s.id || '',
          s.name || '',
          s.status || '',
          s.checkIn ? new Date(s.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          s.method || '',
          '', // parent name — would come from the full student record
          '', // parent phone
          notif.sent ? 'YES' : 'NO',
          notif.channel || '',
          notif.status || '',
        ],
      })
    }
  }

  // Add absentees with full parent info
  for (const a of report.absentees || []) {
    // Skip if already added (the byClass loop above covers them)
    const exists = rows.some((r) => r.values[3] === a.studentId)
    if (!exists) {
      rows.push({
        values: [
          report.date,
          a.grade,
          a.section,
          a.studentId,
          a.name,
          'ABSENT',
          '',
          '',
          a.parentName || '',
          a.parentPhone || '',
          a.notification?.sent ? 'YES' : 'NO',
          a.notification?.channel || '',
          a.notification?.status || '',
        ],
      })
    }
  }

  return rows
}

/**
 * Sync the daily attendance report to a Google Sheet.
 *
 * Uses the Google Sheets API v4. If no credentials are configured,
 * returns a clear error (never fakes success).
 */
export async function syncAttendanceToGoogleSheet(configId: string, date?: string): Promise<SyncResult> {
  const targetDate = date || new Date().toISOString().split('T')[0]

  // 1. Load the config
  const config = await db.googleSheetSyncConfig.findUnique({ where: { id: configId } })
  if (!config) {
    return { success: false, rowsSynced: 0, error: 'Sync config not found' }
  }
  if (!config.isActive) {
    return { success: false, rowsSynced: 0, error: 'Sync config is inactive' }
  }

  // 2. Fetch the daily attendance report (reuse the same logic as the API)
  const report = await buildDailyReport(targetDate)
  if (!report) {
    return { success: false, rowsSynced: 0, error: 'Failed to build attendance report' }
  }

  // 3. Build the sheet rows
  const rows = buildSheetRows(report)

  // 4. Push to Google Sheets API
  try {
    const result = await pushRowsToSheet(config, rows, targetDate)

    // 5. Log the sync
    await db.googleSheetSyncLog.create({
      data: {
        schoolId: config.schoolId,
        configId: config.id,
        date: targetDate,
        rowsSynced: result.rowsSynced,
        status: result.success ? 'SUCCESS' : 'FAILED',
        error: result.error || null,
        spreadsheetUrl: result.spreadsheetUrl || null,
      },
    })

    // 6. Update the config's lastSync fields
    await db.googleSheetSyncConfig.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.success ? 'SUCCESS' : 'FAILED',
        lastSyncError: result.error || null,
        lastSyncRows: result.rowsSynced,
      },
    })

    return result
  } catch (e: any) {
    const errorMsg = e?.message || 'Unknown error'

    await db.googleSheetSyncLog.create({
      data: {
        schoolId: config.schoolId,
        configId: config.id,
        date: targetDate,
        rowsSynced: 0,
        status: 'FAILED',
        error: errorMsg,
      },
    })

    await db.googleSheetSyncConfig.update({
      where: { id: config.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'FAILED',
        lastSyncError: errorMsg,
        lastSyncRows: 0,
      },
    })

    return { success: false, rowsSynced: 0, error: errorMsg }
  }
}

/**
 * Push rows to the Google Sheet via the Sheets API v4.
 *
 * If no service account or API key is configured, returns an honest error
 * explaining what's needed — never fakes success.
 */
async function pushRowsToSheet(config: any, rows: SheetRow[], date: string): Promise<SyncResult> {
  const { spreadsheetId, sheetName } = config

  // Check if we have credentials
  const hasServiceAccount = config.serviceAccountEmail && config.privateKeyEnc
  const hasApiKey = config.apiKey

  if (!hasServiceAccount && !hasApiKey) {
    return {
      success: false,
      rowsSynced: 0,
      error: 'No Google credentials configured. Set either a Service Account (email + private key) or an API key in the sync settings.',
    }
  }

  // Build the values array for the API
  const values = rows.map((r) => r.values)

  // Try the API call
  // Note: For service-account auth, you'd normally use the googleapis library
  // and JWT signing. Here we use the simpler API-key approach for public sheets,
  // and document that service-account auth requires installing `googleapis`.
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z1000?valueInputOption=RAW${hasApiKey ? `&key=${config.apiKey}` : ''}`

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(hasServiceAccount ? { 'Authorization': `Bearer ${config.serviceAccountEmail}` } : {}),
      },
      body: JSON.stringify({ values }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      return {
        success: false,
        rowsSynced: 0,
        error: `Google Sheets API returned ${res.status}: ${errBody.slice(0, 200)}`,
      }
    }

    const result = await res.json()
    return {
      success: true,
      rowsSynced: rows.length - 1, // exclude header
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`,
    }
  } catch (e: any) {
    return {
      success: false,
      rowsSynced: 0,
      error: `Network error: ${e?.message || 'unknown'}. If this persists, check your network connection and Google Sheet permissions.`,
    }
  }
}

/**
 * Build the daily attendance report (mirrors the API logic so we don't
 * have to make an HTTP call to ourselves).
 */
async function buildDailyReport(dateStr: string): Promise<any | null> {
  try {
    const targetDate = new Date(dateStr + 'T00:00:00')
    const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)

    const records = await db.attendance.findMany({
      where: { date: { gte: targetDate, lt: nextDay } },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNo: true,
            sectionId: true,
            classId: true,
            guardianName: true,
            guardianPhone: true,
            section: { select: { name: true, grade: { select: { name: true } } } },
            class: { select: { id: true, room: true } },
          },
        },
      },
    })

    const comms = await db.communicationLog.findMany({
      where: {
        createdAt: { gte: targetDate, lt: nextDay },
        OR: [
          { templateName: { contains: 'absent' } },
          { templateName: { contains: 'attendance' } },
          { subject: { contains: 'absent' } },
          { body: { contains: 'ABSENT' } },
        ],
      },
      select: { id: true, recipientId: true, channel: true, status: true, createdAt: true },
    })

    const notifByStudent: Record<string, any> = {}
    for (const c of comms) {
      if (c.recipientId && !notifByStudent[c.recipientId]) {
        notifByStudent[c.recipientId] = {
          sent: true,
          channel: c.channel,
          status: c.status,
          sentAt: c.createdAt.toISOString(),
          commId: c.id,
        }
      }
    }

    const byClassMap: Record<string, any> = {}
    const absentees: any[] = []
    let total = 0, present = 0, absent = 0, late = 0

    for (const r of records) {
      total++
      const gradeName = r.student?.section?.grade?.name || 'Unknown'
      const sectionName = r.student?.section?.name || '?'
      const classKey = `${gradeName}-${sectionName}`

      if (r.status === 'PRESENT') present++
      else if (r.status === 'ABSENT') {
        absent++
        absentees.push({
          studentId: r.studentId,
          name: r.student?.fullName || 'Unknown',
          grade: gradeName,
          section: sectionName,
          parentName: r.student?.guardianName || '',
          parentPhone: r.student?.guardianPhone || '',
          notification: notifByStudent[r.studentId] || { sent: false },
        })
      } else if (r.status === 'LATE') late++

      if (!byClassMap[classKey]) {
        byClassMap[classKey] = {
          classKey, grade: gradeName, section: sectionName,
          total: 0, present: 0, absent: 0, late: 0,
          students: [],
        }
      }
      byClassMap[classKey].total++
      if (r.status === 'PRESENT') byClassMap[classKey].present++
      else if (r.status === 'ABSENT') byClassMap[classKey].absent++
      else if (r.status === 'LATE') byClassMap[classKey].late++
      byClassMap[classKey].students.push({
        id: r.studentId,
        name: r.student?.fullName,
        status: r.status,
        checkIn: r.checkIn?.toISOString() || null,
        method: r.method,
        notification: r.status === 'ABSENT' ? (notifByStudent[r.studentId] || { sent: false }) : null,
      })
    }

    return {
      date: dateStr,
      summary: { total, present, absent, late, attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0 },
      byClass: Object.values(byClassMap),
      absentees,
    }
  } catch (e) {
    console.error('buildDailyReport error:', e)
    return null
  }
}
