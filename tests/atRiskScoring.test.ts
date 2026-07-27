import { describe, it, expect } from 'vitest'
import { computeAtRiskScore } from '@/lib/agents/atRiskScoring'

// ── At-Risk Scoring tests ────────────────────────────────────────────────────
describe('At-Risk Scoring', () => {
  it('returns HIGH risk for student with very low attendance and poor grades', () => {
    const score = computeAtRiskScore({
      attendanceRate: 55,
      gradeAverage: 42,
      feeBalance: 12000,
      behaviorNegativeCount: 5,
      consecutiveAbsences: 8,
    })
    expect(score.riskLevel).toBe('HIGH')
    expect(score.score).toBeGreaterThanOrEqual(70)
  })

  it('returns LOW risk for healthy student profile', () => {
    const score = computeAtRiskScore({
      attendanceRate: 96,
      gradeAverage: 88,
      feeBalance: 0,
      behaviorNegativeCount: 0,
      consecutiveAbsences: 0,
    })
    expect(score.riskLevel).toBe('LOW')
    expect(score.score).toBeLessThan(30)
  })

  it('returns MEDIUM risk for borderline attendance + some fee overdue', () => {
    const score = computeAtRiskScore({
      attendanceRate: 74,
      gradeAverage: 60,
      feeBalance: 3500,
      behaviorNegativeCount: 1,
      consecutiveAbsences: 2,
    })
    expect(score.riskLevel).toBe('MEDIUM')
  })

  it('always returns a numeric score between 0 and 100', () => {
    const score = computeAtRiskScore({
      attendanceRate: 80,
      gradeAverage: 70,
      feeBalance: 1000,
      behaviorNegativeCount: 0,
      consecutiveAbsences: 1,
    })
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.score).toBeLessThanOrEqual(100)
  })

  it('includes risk factors in result', () => {
    const score = computeAtRiskScore({
      attendanceRate: 60,
      gradeAverage: 45,
      feeBalance: 8000,
      behaviorNegativeCount: 3,
      consecutiveAbsences: 5,
    })
    expect(score.factors).toBeDefined()
    expect(Array.isArray(score.factors)).toBe(true)
    expect(score.factors.length).toBeGreaterThan(0)
  })
})
