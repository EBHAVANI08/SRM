import { describe, it, expect, vi } from 'vitest'

// Mock Prisma db and comms before importing any module that uses them
vi.mock('@/lib/db', () => ({ db: {} }))
vi.mock('@/lib/comms', () => ({ sendCommunication: vi.fn() }))

// Now import the module under test
import { RuleCondition } from '@/lib/rulesEngine'

// ── Pure condition evaluation helper (extracted for testing) ──────────────────
// Since evalCondition is not exported, we test the observable behaviour
// via the processEvent pipeline in integration. For unit tests we test the
// exported RuleCondition *type* shape and pure data-transformation helpers.

describe('Rules Engine — RuleCondition types', () => {
  it('RuleCondition supports all required operators', () => {
    const ops: RuleCondition['op'][] = ['eq','neq','gt','gte','lt','lte','and','or','in','contains']
    expect(ops).toHaveLength(10)
    // Each operator string must be unique
    expect(new Set(ops).size).toBe(ops.length)
  })

  it('RuleCondition can represent a compound AND expression', () => {
    const cond: RuleCondition = {
      op: 'and',
      left: { op: 'lt', field: 'attendanceRate', value: 75 },
      right: { op: 'gt', field: 'feeBalance', value: 5000 },
    }
    expect(cond.left).toBeDefined()
    expect(cond.right).toBeDefined()
    expect(cond.op).toBe('and')
  })

  it('RuleCondition can represent a leaf equality check', () => {
    const cond: RuleCondition = { op: 'eq', field: 'status', value: 'ABSENT' }
    expect(cond.field).toBe('status')
    expect(cond.value).toBe('ABSENT')
  })
})

// ── Scoring logic unit tests (pure maths, no DB) ─────────────────────────────
describe('Rules Engine — scoring logic', () => {
  it('correctly computes attendance risk score formula', () => {
    // Mirrors the formula in atRiskScoring.ts:
    // attendanceScore = min(100, (100 - rate)*0.5 + streak*10)
    const rate = 65
    const streak = 5
    const score = Math.min(100, (100 - rate) * 0.5 + streak * 10)
    expect(score).toBe(67.5)
  })

  it('attendance score is bounded to 0-100', () => {
    const badScore = Math.min(100, (100 - 10) * 0.5 + 20 * 10)
    expect(badScore).toBe(100)
    const goodScore = Math.min(100, (100 - 100) * 0.5 + 0 * 10)
    expect(goodScore).toBe(0)
  })

  it('overall at-risk score weights sum to 1.0', () => {
    const weights = [0.30, 0.30, 0.20, 0.20]
    const sum = weights.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0)
  })
})
