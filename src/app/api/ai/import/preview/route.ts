/**
 * POST /api/ai/import/preview — AI schema mapping + preview before commit
 *
 * Accepts: { columns: string[], rows: Record<string,any>[], targetType: string }
 * Returns: { mappedColumns, previewRows, dedupeCandidates, confidence }
 *
 * This is the "60-minute school migration" enabler (§9 pillar #8).
 * Previous ERP exports → AI column mapping → staged preview → commit (separate endpoint).
 */

import { NextRequest, NextResponse } from 'next/server'
import { mapImportColumns } from '@/lib/agents/intakeAgent'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { columns, rows, targetType } = body

    if (!columns || !Array.isArray(columns) || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ success: false, error: 'Missing columns or rows' }, { status: 400 })
    }

    const schoolId = req.headers.get('x-user-school-id') || 'school_default'

    // Step 1: AI column mapping
    const mappedColumns = await mapImportColumns(columns, rows.slice(0, 5), targetType || 'admission_form')

    // Step 2: Build preview rows (apply mapping to first 10 rows)
    const previewRows = rows.slice(0, 10).map((row, index) => {
      const mapped: Record<string, any> = {}
      for (const [sourceCol, targetField] of Object.entries(mappedColumns)) {
        if (targetField && targetField !== 'null') {
          mapped[targetField] = row[sourceCol]
        }
      }
      return { rowIndex: index, original: row, mapped }
    })

    // Step 3: Simple dedupe check (name + phone match against existing students)
    const dedupeCandidates: { rowIndex: number; matchType: string; confidence: number }[] = []
    const existingStudents = await db.student.findMany({
      select: { fullName: true, guardianPhone: true, admissionNo: true },
      take: 1000,
    })

    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const row = rows[i]
      const mappedName = mappedColumns['Name'] || mappedColumns['Student Name'] || mappedColumns['Full Name']
      const mappedPhone = mappedColumns['Phone'] || mappedColumns['Guardian Phone'] || mappedColumns['Parent Phone']

      const name = mappedName ? row[mappedName] : null
      const phone = mappedPhone ? row[mappedPhone] : null

      if (name) {
        const match = existingStudents.find(s =>
          s.fullName.toLowerCase().includes(String(name).toLowerCase()) ||
          (phone && s.guardianPhone.includes(String(phone)))
        )
        if (match) {
          dedupeCandidates.push({
            rowIndex: i,
            matchType: `Matches existing: ${match.fullName} (${match.admissionNo})`,
            confidence: phone ? 0.95 : 0.75,
          })
        }
      }
    }

    // Step 4: Calculate overall mapping confidence
    const mappedCount = Object.values(mappedColumns).filter(v => v && v !== 'null').length
    const confidence = columns.length > 0 ? mappedCount / columns.length : 0

    return NextResponse.json({
      success: true,
      preview: {
        mappedColumns,
        unmappedColumns: columns.filter(c => !mappedColumns[c] || mappedColumns[c] === 'null'),
        previewRows,
        totalRows: rows.length,
        dedupeCandidates,
        confidence: Math.round(confidence * 100) / 100,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
