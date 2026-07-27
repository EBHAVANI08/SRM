import { describe, it, expect } from 'vitest'
import {
  can,
  applyScope,
  maskFields,
  getAllowedFields,
  canBroadcast,
  PERMISSION_MATRIX,
} from '@/lib/roleScope'
import type { ScopeContext } from '@/lib/roleScope'

// ── Base test context ────────────────────────────────────────────────────────
const baseCtx: ScopeContext = {
  role: 'TEACHER',
  userId: 'user_teacher_1',
  schoolId: 'school_default',
  assignedSectionIds: ['sec_1a'],
  assignedStudentIds: ['stu_1', 'stu_2'],
  childrenStudentIds: [],
}

// ── Permission Matrix tests ──────────────────────────────────────────────────
describe('Permission Matrix', () => {
  it('SUPER_ADMIN can do everything on every resource', () => {
    expect(can('SUPER_ADMIN', 'student', 'view')).toBe(true)
    expect(can('SUPER_ADMIN', 'student', 'delete')).toBe(true)
    expect(can('SUPER_ADMIN', 'payroll', 'approve')).toBe(true)
    expect(can('SUPER_ADMIN', 'communication_log', 'broadcast')).toBe(true)
  })

  it('TEACHER cannot view fees or payroll (except own payslip)', () => {
    expect(can('TEACHER', 'fee', 'view')).toBe(false)
    expect(can('TEACHER', 'transaction', 'view')).toBe(false)
    expect(can('TEACHER', 'payroll', 'approve')).toBe(false)
  })

  it('STUDENT can only view own records', () => {
    expect(can('STUDENT', 'student', 'view')).toBe(true)
    expect(can('STUDENT', 'student', 'create')).toBe(false)
    expect(can('STUDENT', 'staff', 'view')).toBe(false)
    expect(can('STUDENT', 'exam', 'view')).toBe(true)
    expect(can('STUDENT', 'exam', 'create')).toBe(false)
  })

  it('PARENT can view only children-scoped resources', () => {
    expect(can('PARENT', 'student', 'view')).toBe(true)
    expect(can('PARENT', 'student', 'create')).toBe(false)
    expect(can('PARENT', 'payroll', 'view')).toBe(false)
    expect(can('PARENT', 'fee', 'create')).toBe(true) // parents can pay fees
  })

  it('IT_TEAM cannot access PII data', () => {
    expect(can('IT_TEAM', 'student', 'view')).toBe(false)
    expect(can('IT_TEAM', 'health', 'view')).toBe(false)
    expect(can('IT_TEAM', 'behaviour', 'view')).toBe(false)
    expect(can('IT_TEAM', 'audit_log', 'view')).toBe(true) // IT can see audit logs
  })

  it('RECEPTION has no access to exam/report_card/payroll', () => {
    expect(can('RECEPTION', 'exam', 'view')).toBe(false)
    expect(can('RECEPTION', 'report_card', 'view')).toBe(false)
    expect(can('RECEPTION', 'payroll', 'view')).toBe(false)
  })

  it('All roles have entries in PERMISSION_MATRIX', () => {
    const expectedRoles = [
      'SUPER_ADMIN', 'SCHOOL_HEAD', 'ADMIN', 'TEACHER',
      'STUDENT', 'PARENT', 'RECEPTION', 'IT_TEAM',
    ]
    for (const role of expectedRoles) {
      expect(PERMISSION_MATRIX).toHaveProperty(role)
    }
  })
})

// ── applyScope tests ─────────────────────────────────────────────────────────
describe('applyScope', () => {
  it('SUPER_ADMIN gets empty where clause (global scope)', () => {
    const ctx: ScopeContext = { role: 'SUPER_ADMIN', userId: 'u1', schoolId: 'school_default' }
    const result = applyScope('student', ctx)
    expect(result.allowed).toBe(true)
    expect(result.where).toEqual({})
  })

  it('TEACHER gets assigned student IDs in where clause', () => {
    const result = applyScope('student', baseCtx)
    expect(result.allowed).toBe(true)
    expect(result.where).toMatchObject({ id: { in: ['stu_1', 'stu_2'] } })
  })

  it('STUDENT gets own userId as filter', () => {
    const ctx: ScopeContext = { role: 'STUDENT', userId: 'stu_self', schoolId: 'school_default' }
    const result = applyScope('student', ctx)
    expect(result.allowed).toBe(true)
    expect(result.where).toMatchObject({ id: 'stu_self' })
  })

  it('PARENT gets children IDs in where clause', () => {
    const ctx: ScopeContext = {
      role: 'PARENT', userId: 'parent_1', schoolId: 'school_default',
      childrenStudentIds: ['child_1', 'child_2'],
    }
    const result = applyScope('student', ctx)
    expect(result.allowed).toBe(true)
    expect(result.where).toMatchObject({ id: { in: ['child_1', 'child_2'] } })
  })

  it('IT_TEAM gets denied access to student (no access)', () => {
    const ctx: ScopeContext = { role: 'IT_TEAM', userId: 'it_user', schoolId: 'school_default' }
    const result = applyScope('student', ctx)
    expect(result.allowed).toBe(false)
    expect(result.where).toMatchObject({ id: '__NO_ACCESS__' })
  })

  it('TEACHER denied access to fee', () => {
    const result = applyScope('fee', baseCtx)
    expect(result.allowed).toBe(false)
  })
})

// ── Field masking tests ──────────────────────────────────────────────────────
describe('maskFields', () => {
  const studentRecord = {
    id: 'stu_1',
    name: 'Ravi Kumar',
    rollNo: 'A101',
    sectionId: 'sec_1a',
    aadhaarNo: '1234-5678-9012',
    medicalConditions: 'Asthma',
    feeBalance: 5000,
    address: '123, Main Street',
    attendanceRate: 92.5,
    gradeAverage: 85,
  }

  it('TEACHER (maxSensitivity=2) cannot see aadhaarNo or medicalConditions', () => {
    const masked = maskFields('TEACHER', 'student', studentRecord)
    expect(masked).not.toHaveProperty('aadhaarNo')
    expect(masked).not.toHaveProperty('medicalConditions')
  })

  it('TEACHER can see name and rollNo (public fields)', () => {
    const masked = maskFields('TEACHER', 'student', studentRecord)
    expect(masked).toHaveProperty('name')
    expect(masked).toHaveProperty('rollNo')
  })

  it('SUPER_ADMIN can see all fields including sensitive ones', () => {
    const masked = maskFields('SUPER_ADMIN', 'student', studentRecord)
    // SUPER_ADMIN maxSensitivity=4, all fields are returned
    expect(masked).toHaveProperty('aadhaarNo')
    expect(masked).toHaveProperty('medicalConditions')
  })

  it('IT_TEAM gets empty object for student (no access)', () => {
    const masked = maskFields('IT_TEAM', 'student', studentRecord)
    expect(Object.keys(masked)).toHaveLength(0)
  })
})

// ── getAllowedFields tests ────────────────────────────────────────────────────
describe('getAllowedFields', () => {
  it('returns all (*) for resources without sensitivity map (e.g., fee)', () => {
    const fields = getAllowedFields('ADMIN', 'fee')
    expect(fields).toBe('*')
  })

  it('returns subset for student with TEACHER role', () => {
    const fields = getAllowedFields('TEACHER', 'student')
    expect(Array.isArray(fields)).toBe(true)
    if (Array.isArray(fields)) {
      // Should include public/internal fields
      expect(fields).toContain('name')
      // Should NOT include restricted fields (aadhaarNo = sensitivity 4)
      expect(fields).not.toContain('aadhaarNo')
    }
  })

  it('returns empty array for IT_TEAM on student', () => {
    const fields = getAllowedFields('IT_TEAM', 'student')
    expect(fields).toEqual([])
  })
})

// ── canBroadcast tests ───────────────────────────────────────────────────────
describe('canBroadcast', () => {
  it('SUPER_ADMIN and SCHOOL_HEAD can broadcast', () => {
    expect(canBroadcast('SUPER_ADMIN')).toBe(true)
    expect(canBroadcast('SCHOOL_HEAD')).toBe(true)
  })

  it('TEACHER and PARENT cannot broadcast', () => {
    expect(canBroadcast('TEACHER')).toBe(false)
    expect(canBroadcast('PARENT')).toBe(false)
  })

  it('ADMIN cannot broadcast (limited scope)', () => {
    expect(canBroadcast('ADMIN')).toBe(false)
  })
})
