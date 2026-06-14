// ── Types ────────────────────────────────────────────────────────────
export type CheckInData = {
  sleep: number
  socialEnergy: number
  pressure: number
  ate: string
  emotion: string
  status?: string
  timestamp?: string
}

export type Baseline = {
  avgSleep: number
  avgSocialEnergy: number
  avgPressure: number
  totalDays: number
  lastUpdated?: string
}

// ── Emotion → expected numeric range map ────────────────────────────
const EMOTION_EXPECTED: Record<string, {
  sleepMin: number
  socialMin: number
  pressureMax: number
}> = {
  Good:        { sleepMin: 6,  socialMin: 6,  pressureMax: 7  },
  Okay:        { sleepMin: 4,  socialMin: 4,  pressureMax: 8  },
  Tired:       { sleepMin: 1,  socialMin: 1,  pressureMax: 10 },
  Anxious:     { sleepMin: 1,  socialMin: 1,  pressureMax: 10 },
  Flat:        { sleepMin: 1,  socialMin: 1,  pressureMax: 10 },
  Overwhelmed: { sleepMin: 1,  socialMin: 1,  pressureMax: 10 },
}

// ── Emotion → numeric alignment check ───────────────────────────────
// Returns a trust multiplier: 1.0 = fully trusted, 0.5 = suspicious
export function getEmotionTrustScore(data: CheckInData): number {
  const expected = EMOTION_EXPECTED[data.emotion]
  if (!expected) return 1.0

  let mismatches = 0

  // If they feel "Good" but sleep is very low — mismatch
  if (data.emotion === 'Good' && data.sleep < 4) mismatches++

  // If they feel "Good" but social energy is very low — mismatch
  if (data.emotion === 'Good' && data.socialEnergy < 4) mismatches++

  // If they feel "Anxious" or "Overwhelmed" but everything is rated 9-10 — mismatch
  if ((data.emotion === 'Anxious' || data.emotion === 'Overwhelmed') &&
    data.sleep >= 8 && data.socialEnergy >= 8 && data.pressure <= 3) {
    mismatches += 2
  }

  // If they feel "Tired" but rated sleep 9-10 — mismatch
  if (data.emotion === 'Tired' && data.sleep >= 9) mismatches++

  // If they feel "Flat" but rated social energy 9-10 — mismatch
  if (data.emotion === 'Flat' && data.socialEnergy >= 9) mismatches++

  if (mismatches === 0) return 1.0
  if (mismatches === 1) return 0.85
  if (mismatches === 2) return 0.65
  return 0.5
}

// ── Variance detection ───────────────────────────────────────────────
// Very low variance across many days = suspicious (real humans vary)
export function getVarianceTrustScore(recentCheckins: CheckInData[]): number {
  if (recentCheckins.length < 5) return 1.0

  const sleepScores = recentCheckins.map(c => c.sleep)
  const socialScores = recentCheckins.map(c => c.socialEnergy)
  const pressureScores = recentCheckins.map(c => c.pressure)

  const stdDev = (arr: number[]) => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
  }

  const sleepStd = stdDev(sleepScores)
  const socialStd = stdDev(socialScores)
  const pressureStd = stdDev(pressureScores)
  const avgStd = (sleepStd + socialStd + pressureStd) / 3

  // Real humans have std dev > 1.2 across these metrics
  // Suspiciously flat responses have std dev < 0.6
  if (avgStd < 0.4) return 0.4   // Very suspicious — almost certainly gaming
  if (avgStd < 0.6) return 0.6   // Suspicious
  if (avgStd < 0.8) return 0.8   // Slightly suspicious
  return 1.0                      // Normal human variance
}

// ── Speed detection ──────────────────────────────────────────────────
// If check-in was completed too fast (< 8 seconds) — suspicious
export function getSpeedTrustScore(startTime: number, endTime: number): number {
  const seconds = (endTime - startTime) / 1000
  if (seconds < 6)  return 0.4   // Way too fast
  if (seconds < 10) return 0.7   // Suspicious
  if (seconds < 15) return 0.9   // Slightly fast
  return 1.0
}

// ── Consecutive high score detection ────────────────────────────────
// Rating 9+ on everything for 5+ consecutive days = suspicious
export function getConsistencyTrustScore(recentCheckins: CheckInData[]): number {
  if (recentCheckins.length < 5) return 1.0

  const last5 = recentCheckins.slice(-5)
  const allHigh = last5.every(c =>
    c.sleep >= 8 &&
    c.socialEnergy >= 8 &&
    c.pressure <= 3
  )

  if (allHigh && recentCheckins.length >= 7) return 0.5
  if (allHigh) return 0.7
  return 1.0
}

// ── Combined trust score ─────────────────────────────────────────────
export function getCombinedTrustScore(
  data: CheckInData,
  recentCheckins: CheckInData[],
  startTime?: number,
  endTime?: number
): {
  score: number        // 0.0 - 1.0
  flags: string[]      // Human-readable flags for admin
  trustLevel: 'high' | 'medium' | 'low' | 'suspicious'
} {
  const flags: string[] = []

  const emotionTrust = getEmotionTrustScore(data)
  const varianceTrust = getVarianceTrustScore([...recentCheckins, data])
  const consistencyTrust = getConsistencyTrustScore([...recentCheckins, data])
  const speedTrust = startTime && endTime ? getSpeedTrustScore(startTime, endTime) : 1.0

  if (emotionTrust < 0.8) flags.push('emotion_numeric_mismatch')
  if (varianceTrust < 0.7) flags.push('suspiciously_low_variance')
  if (consistencyTrust < 0.8) flags.push('consecutive_high_scores')
  if (speedTrust < 0.8) flags.push('completed_too_fast')

  // Weighted average — emotion mismatch and variance are most important
  const combined = (
    emotionTrust * 0.35 +
    varianceTrust * 0.30 +
    consistencyTrust * 0.20 +
    speedTrust * 0.15
  )

  let trustLevel: 'high' | 'medium' | 'low' | 'suspicious'
  if (combined >= 0.85) trustLevel = 'high'
  else if (combined >= 0.70) trustLevel = 'medium'
  else if (combined >= 0.55) trustLevel = 'low'
  else trustLevel = 'suspicious'

  return { score: combined, flags, trustLevel }
}

// ── Status calculation (now trust-aware) ────────────────────────────
export function calculateStatus(
  data: CheckInData,
  baseline: Baseline | null,
  trustScore: number = 1.0
): 'green' | 'amber' | 'red' {
  if (!baseline || baseline.totalDays < 7) {
    // No baseline yet — use absolute thresholds
    if (data.sleep <= 3 || data.socialEnergy <= 3 || data.pressure >= 9) return 'red'
    if (data.sleep <= 5 || data.socialEnergy <= 5 || data.pressure >= 7) return 'amber'
    return 'green'
  }

  // If trust is low, be more conservative — assume worse than reported
  const adjustedSleep = data.sleep * trustScore
  const adjustedSocial = data.socialEnergy * trustScore
  const adjustedPressure = trustScore < 0.7
    ? Math.min(10, data.pressure * (2 - trustScore)) // inflate pressure if untrusted
    : data.pressure

  let lowMetrics = 0
  const AMBER_DEVIATION = 1.5
  const RED_DEVIATION = 2.0

  if (baseline.avgSleep - adjustedSleep > AMBER_DEVIATION) lowMetrics++
  if (baseline.avgSocialEnergy - adjustedSocial > AMBER_DEVIATION) lowMetrics++
  if (adjustedPressure - baseline.avgPressure > AMBER_DEVIATION) lowMetrics++

  let criticalMetrics = 0
  if (baseline.avgSleep - adjustedSleep > RED_DEVIATION) criticalMetrics++
  if (baseline.avgSocialEnergy - adjustedSocial > RED_DEVIATION) criticalMetrics++
  if (adjustedPressure - baseline.avgPressure > RED_DEVIATION) criticalMetrics++

  if (criticalMetrics >= 2) return 'red'
  if (lowMetrics >= 2) return 'amber'
  return 'green'
}

// ── Drift detection across recent check-ins ──────────────────────────
export function detectDrift(
  recentCheckins: CheckInData[],
  baseline: Baseline | null
): 'green' | 'amber' | 'red' {
  if (!baseline || recentCheckins.length < 3) return 'green'

  const last3 = recentCheckins.slice(-3)
  const last4 = recentCheckins.slice(-4)

  const redCount = last3.filter(c => c.status === 'red').length
  const amberCount = last4.filter(c =>
    c.status === 'amber' || c.status === 'red'
  ).length

  if (redCount >= 3) return 'red'
  if (amberCount >= 3) return 'amber'
  return 'green'
}

// ── Baseline updater ─────────────────────────────────────────────────
export function updateBaseline(
  existing: Baseline | null,
  newData: CheckInData,
  trustScore: number = 1.0
): Baseline {
  if (!existing) {
    return {
      avgSleep: newData.sleep,
      avgSocialEnergy: newData.socialEnergy,
      avgPressure: newData.pressure,
      totalDays: 1,
    }
  }

  const n = existing.totalDays

  // If trust is low, weight the new data less in the baseline
  const weight = trustScore < 0.6 ? 0.3 : 1.0

  // Weighted rolling average
  const newAvgSleep = (existing.avgSleep * n + newData.sleep * weight) / (n + weight)
  const newAvgSocial = (existing.avgSocialEnergy * n + newData.socialEnergy * weight) / (n + weight)
  const newAvgPressure = (existing.avgPressure * n + newData.pressure * weight) / (n + weight)

  return {
    avgSleep: Math.round(newAvgSleep * 10) / 10,
    avgSocialEnergy: Math.round(newAvgSocial * 10) / 10,
    avgPressure: Math.round(newAvgPressure * 10) / 10,
    totalDays: existing.totalDays + 1,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MWPQ Domain-Aware Scoring (New System) ────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

import type { MWPQQuestion, QuestionCategory } from './questions'
import { SCORE_THRESHOLDS } from './questions'

export type MWPQStatus = 'calibrating' | 'stable' | 'drifting' | 'needs_attention' | 'alert'

export type MWPQAnswer = {
  questionId: string
  // For frequency/quality scales: 1-5
  // For yes_no / multiple_choice: the index of the selected option (0-based)
  value: number
}

export type DomainScore = {
  domain: QuestionCategory
  rawAvg: number      // 1-5 scale average
  normalizedAvg: number // always "high = good" normalized
  questionCount: number
}

/**
 * Normalize a raw answer so that high = good.
 * For reverse-scored questions, we flip: normalizedScore = 6 - rawScore.
 */
function normalizeAnswer(raw: number, reverse: boolean): number {
  return reverse ? 6 - raw : raw
}

/**
 * Calculate per-domain scores from a set of answered MWPQ questions.
 * Returns a map of domain → DomainScore.
 */
export function calcDomainScores(
  answers: MWPQAnswer[],
  questionBank: MWPQQuestion[]
): Map<QuestionCategory, DomainScore> {
  const domainAccum = new Map<QuestionCategory, { sum: number; count: number }>()

  for (const answer of answers) {
    const q = questionBank.find(q => q.id === answer.questionId)
    if (!q) continue

    // For yes_no / multiple_choice, value 0 (first option) = best → maps to 5
    // Simple linear mapping for 3-option yes_no: [good, neutral, bad] → [5, 3, 1]
    let normalized: number
    if (q.type === 'yes_no' || q.type === 'multiple_choice') {
      const optionCount = q.options?.length ?? 2
      // Option 0 = best response. Map linearly to 5..1
      normalized = 5 - (answer.value / Math.max(optionCount - 1, 1)) * 4
    } else {
      // frequency_scale or quality_scale (1-5)
      normalized = normalizeAnswer(Math.min(5, Math.max(1, answer.value)), q.reverse ?? false)
    }

    const existing = domainAccum.get(q.category) ?? { sum: 0, count: 0 }
    domainAccum.set(q.category, { sum: existing.sum + normalized, count: existing.count + 1 })
  }

  const result = new Map<QuestionCategory, DomainScore>()
  for (const [domain, { sum, count }] of domainAccum.entries()) {
    const normalizedAvg = count > 0 ? sum / count : 0
    result.set(domain, {
      domain,
      rawAvg: normalizedAvg, // both are normalized here; raw is kept for reference
      normalizedAvg,
      questionCount: count,
    })
  }
  return result
}

/**
 * Derive an overall MWPQ status from domain scores.
 * Thresholds from user specification:
 *   Stable:          overall avg ≥ 4.0 AND no domain below 3.2
 *   Drifting:        overall avg 3.2–3.9 (gradual decline pattern)
 *   Needs Attention: overall avg 2.5–3.1 OR two or more domains below 3.2
 *   Alert:           overall avg < 2.5 OR rapid deterioration across domains
 */
export function calcMWPQStatus(
  domainScores: Map<QuestionCategory, DomainScore>,
  baselineDaysCompleted: number,
): MWPQStatus {
  // During the 7-day calibration period — never show a negative tag
  if (baselineDaysCompleted < 7) return 'calibrating'

  const scores = Array.from(domainScores.values()).map(d => d.normalizedAvg)
  if (scores.length === 0) return 'calibrating'

  const overallAvg = scores.reduce((a, b) => a + b, 0) / scores.length
  const domainsBelow3_2 = scores.filter(s => s < SCORE_THRESHOLDS.DOMAIN_LOW_THRESHOLD).length

  if (overallAvg < SCORE_THRESHOLDS.ALERT) return 'alert'
  if (overallAvg < SCORE_THRESHOLDS.NEEDS_ATTENTION_UPPER || domainsBelow3_2 >= 2) return 'needs_attention'
  if (overallAvg < SCORE_THRESHOLDS.STABLE || domainsBelow3_2 >= 1) return 'drifting'
  return 'stable'
}

/**
 * Detect drift across the last 7 MWPQ check-ins.
 * Returns true if the average MWPQ score has declined significantly over time.
 */
export function detectMWPQDrift(recentMWPQScores: number[]): boolean {
  if (recentMWPQScores.length < 3) return false
  const recent3 = recentMWPQScores.slice(-3)
  const avg3 = recent3.reduce((a, b) => a + b, 0) / 3
  return avg3 < SCORE_THRESHOLDS.DRIFTING_LOWER
}

/**
 * Map an MWPQ status to the legacy traffic-light status for backward compatibility
 * (dashboard, alerts, etc. still use 'green' | 'amber' | 'red').
 */
export function mwpqStatusToLegacy(status: MWPQStatus): 'green' | 'amber' | 'red' {
  switch (status) {
    case 'stable':          return 'green'
    case 'calibrating':     return 'green'  // safe default
    case 'drifting':        return 'amber'
    case 'needs_attention': return 'amber'
    case 'alert':           return 'red'
  }
}