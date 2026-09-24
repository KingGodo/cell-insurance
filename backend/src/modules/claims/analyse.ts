export const MODEL_VERSION = 'customeriq-signals-v1'

export type ReviewSignalName = 'NORMAL' | 'REVIEW_REQUIRED' | 'HIGH_PRIORITY'

export type ClaimAnalysis = {
  score: number
  signal: ReviewSignalName
  factors: string[]
  modelVersion: string
}

export function analyseClaim(input: {
  amount: number
  providerAverage: number | null
  daysSinceSimilarClaim: number | null
  claimsInLast12Months: number
  missingDocument: boolean
}): ClaimAnalysis {
  let score = 0
  const factors: string[] = []

  if (input.providerAverage !== null && input.amount > input.providerAverage * 2) {
    score += 30
    factors.push('Claim amount differs significantly from historical patterns')
  }

  if (input.daysSinceSimilarClaim !== null && input.daysSinceSimilarClaim <= 21) {
    score += 25
    factors.push('Similar claim occurred recently')
  }

  if (input.claimsInLast12Months >= 4) {
    score += 20
    factors.push('Claim frequency is elevated')
  }

  if (input.missingDocument) {
    score += 16
    factors.push('Supporting information requires additional verification')
  }

  score = Math.min(100, score)

  let signal: ReviewSignalName = 'NORMAL'
  if (score >= 75) signal = 'HIGH_PRIORITY'
  else if (score >= 40 || input.missingDocument) signal = 'REVIEW_REQUIRED'

  if (factors.length === 0) {
    factors.push('Claim is consistent with recent history for this customer and provider')
  }

  return {
    score,
    signal,
    factors,
    modelVersion: MODEL_VERSION,
  }
}

export function daysBetween(later: Date, earlier: Date) {
  const ms = later.getTime() - earlier.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}
