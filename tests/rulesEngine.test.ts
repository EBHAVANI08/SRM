import { describe, it, expect } from 'vitest'
import { evaluateCondition, type RuleCondition } from '@/lib/rulesEngine'

// ── Condition evaluation tests ───────────────────────────────────────────────
describe('Rules Engine — evaluateCondition', () => {
  const context = {
    attendanceRate: 65,
    feeBalance: 8500,
    grade: 'Grade 6',
    studentName: 'Priya',
    isActive: true,
    daysSinceLastPayment: 45,
  }

  it('evaluates eq condition correctly', () => {
    const cond: RuleCondition = { field: 'grade', op: 'eq', value: 'Grade 6' }
    expect(evaluateCondition(cond, context)).toBe(true)

    const cond2: RuleCondition = { field: 'grade', op: 'eq', value: 'Grade 7' }
    expect(evaluateCondition(cond2, context)).toBe(false)
  })

  it('evaluates lt (less than) condition', () => {
    const cond: RuleCondition = { field: 'attendanceRate', op: 'lt', value: 75 }
    expect(evaluateCondition(cond, context)).toBe(true)

    const cond2: RuleCondition = { field: 'attendanceRate', op: 'lt', value: 50 }
    expect(evaluateCondition(cond2, context)).toBe(false)
  })

  it('evaluates gt (greater than) condition', () => {
    const cond: RuleCondition = { field: 'feeBalance', op: 'gt', value: 5000 }
    expect(evaluateCondition(cond, context)).toBe(true)

    const cond2: RuleCondition = { field: 'feeBalance', op: 'gt', value: 10000 }
    expect(evaluateCondition(cond2, context)).toBe(false)
  })

  it('evaluates gte (greater than or equal) condition', () => {
    const cond: RuleCondition = { field: 'daysSinceLastPayment', op: 'gte', value: 45 }
    expect(evaluateCondition(cond, context)).toBe(true)
  })

  it('evaluates lte (less than or equal) condition', () => {
    const cond: RuleCondition = { field: 'attendanceRate', op: 'lte', value: 65 }
    expect(evaluateCondition(cond, context)).toBe(true)
  })

  it('evaluates neq (not equal) condition', () => {
    const cond: RuleCondition = { field: 'grade', op: 'neq', value: 'Grade 7' }
    expect(evaluateCondition(cond, context)).toBe(true)
  })

  it('evaluates contains condition on string', () => {
    const cond: RuleCondition = { field: 'studentName', op: 'contains', value: 'Pri' }
    expect(evaluateCondition(cond, context)).toBe(true)

    const cond2: RuleCondition = { field: 'studentName', op: 'contains', value: 'Ram' }
    expect(evaluateCondition(cond2, context)).toBe(false)
  })

  it('handles missing field gracefully', () => {
    const cond: RuleCondition = { field: 'nonexistentField', op: 'eq', value: 'anything' }
    expect(evaluateCondition(cond, context)).toBe(false)
  })
})
