/**
 * POST /api/ai/import/commit — Commit the staged import (create records after preview approval)
 *
 * Accepts: { rows: Record<string,any>[], mappedColumns: Record<string,string>, targetType: string }
 * Returns: { created: number, errors: string[], importJobId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { publishEvent } from '@/lib/eventBus'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rows, mappedColumns, targetType } = body

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ success: false, error: 'Missing rows' }, { status: 400 })
    }

    const schoolId = req.headers.get('x-user-school-id') || 'school_default'
    const userId = req.headers.get('x-user-id') || 'system'

    let created = 0
    const errors: string[] = []

    // Get active academic year
    const ay = await db.academicYear.findFirst({ where: { isActive: true } })

    // Create import job record
    const importJob = await db.task.create({
      data: {
        schoolId,
        title: `Bulk Import — ${targetType || 'students'}`,
        description: `Importing ${rows.length} records. Mapping: ${JSON.stringify(mappedColumns)}`,
        assigneeRole: 'ADMIN',
        assigneeId: userId,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        metadata: JSON.stringify({ type: 'import', rowCount: rows.length, targetType }),
      },
    })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        // Apply mapping
        const mapped: Record<string, any> = {}
        for (const [sourceCol, targetField] of Object.entries(mappedColumns)) {
          if (targetField && targetField !== 'null' && row[sourceCol] !== undefined) {
            mapped[targetField] = row[sourceCol]
          }
        }

        if (targetType === 'admission_form' || targetType === 'student') {
          // Generate admission number
          const count = await db.student.count()
          const admissionNo = `ADM2026-${String(count + 1).padStart(4, '0')}`

          const student = await db.student.create({
            data: {
              admissionNo,
              firstName: mapped.firstName || 'Unknown',
              lastName: mapped.lastName || '',
              fullName: `${mapped.firstName || 'Unknown'} ${mapped.lastName || ''}`.trim(),
              dob: mapped.dob ? new Date(mapped.dob) : new Date('2010-01-01'),
              gender: (mapped.gender || 'MALE').toUpperCase(),
              bloodGroup: mapped.bloodGroup || null,
              nationality: mapped.nationality || 'Indian',
              religion: mapped.religion || null,
              category: mapped.category || null,
              address: mapped.address || null,
              city: mapped.city || null,
              state: mapped.state || null,
              pincode: mapped.pincode || null,
              fatherName: mapped.fatherName || null,
              motherName: mapped.motherName || null,
              guardianName: mapped.guardianName || mapped.fatherName || 'Unknown',
              guardianPhone: mapped.guardianPhone || '0000000000',
              guardianEmail: mapped.guardianEmail || null,
              guardianOccupation: mapped.guardianOccupation || null,
              annualIncome: mapped.annualIncome ? parseFloat(mapped.annualIncome) : null,
              previousSchool: mapped.previousSchool || null,
              status: 'ACTIVE',
              academicYearId: ay?.id || null,
            },
          })

          // Publish event
          await publishEvent({
            type: 'student.admitted',
            entityType: 'STUDENT',
            entityId: student.id,
            payload: { admissionNo, name: student.fullName, source: 'bulk_import' },
            actorType: 'human',
            actorId: userId,
            schoolId,
          })

          created++
        }
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error?.message}`)
      }
    }

    // Update import job
    await db.task.update({
      where: { id: importJob.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: JSON.stringify({ type: 'import', created, errors: errors.length, rowCount: rows.length }),
      },
    })

    return NextResponse.json({
      success: true,
      created,
      errors: errors.slice(0, 20), // Limit error messages
      totalRows: rows.length,
      importJobId: importJob.id,
      message: `Import complete: ${created}/${rows.length} records created${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
