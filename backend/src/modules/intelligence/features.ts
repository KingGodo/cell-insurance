const DAY = 24 * 60 * 60 * 1000
const PRESSURE_MONTHS = new Set([11, 12, 1, 2])

export type BehaviourInput = {
  customerSince: Date
  employer: string | null
  affinityGroup: string | null
  claims: Array<{ type: string; amount: unknown; incidentDate: Date }>
  interactions: Array<{ sentiment: string }>
  policies: Array<{ status: string; premium: unknown; previousPremium: unknown; renewalPremium: unknown; startDate: Date }>
  memberships: Array<{ status: string; monthlyContribution: unknown }>
  payments: Array<{ channel: string; payerCountry: string; payerCity: string; dueDate: Date; paidAt: Date | null }>
}

export type ValueInputs = {
  lineCount: number
  claimToPremiumRatio: number
  affinityGroup: string | null
  tenureYears: number
  renewed: boolean
  annualizedPremium: number
}

export type ModelInputs = {
  claimFrequency: number
  claimSentiment: number
  premiumShock: number
  seasonalPressure: number
  diaspora: boolean
  payerLocation: string
  paymentLatenessDays: number
  paymentJitterDays: number
  dominantChannel: string
  employer: string | null
}

function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function spread(values: number[]) {
  if (values.length < 2) return 0
  const center = mean(values)
  return Math.sqrt(mean(values.map((value) => (value - center) ** 2)))
}

function sentimentValue(sentiment: string) {
  if (sentiment === 'NEGATIVE') return 1
  if (sentiment === 'POSITIVE') return -1
  return 0
}

export function deriveInputs(input: BehaviourInput, now = new Date()): ModelInputs {
  const years = Math.max(1, (now.getTime() - input.customerSince.getTime()) / (365 * DAY))
  const insuranceClaims = input.claims.filter((claim) => claim.type === 'INSURANCE')
  const claimFrequency = Number((insuranceClaims.length / years).toFixed(2))
  const claimSentiment = Number(mean(input.interactions.map((item) => sentimentValue(item.sentiment))).toFixed(2))

  const shocks = input.policies
    .filter((policy) => Number(policy.previousPremium) > 0 && policy.renewalPremium != null)
    .map((policy) => (Number(policy.renewalPremium) - Number(policy.previousPremium)) / Number(policy.previousPremium))
  const premiumShock = Number((shocks[0] ?? 0).toFixed(2))

  const dated = [
    ...insuranceClaims.map((claim) => claim.incidentDate),
    ...input.payments.map((payment) => payment.dueDate),
  ]
  const seasonalHits = dated.filter((date) => PRESSURE_MONTHS.has(date.getUTCMonth() + 1)).length
  const seasonalPressure = dated.length === 0 ? 0 : Number((seasonalHits / dated.length).toFixed(2))

  const abroad = input.payments.filter((payment) => payment.payerCountry !== 'ZW')
  const diaspora = input.payments.length > 0 && abroad.length * 2 >= input.payments.length
  const payer = abroad[0] ?? input.payments[0]
  const payerLocation = payer ? `${payer.payerCity}, ${payer.payerCountry}` : 'Unknown'

  const lateness = input.payments.map((payment) => {
    const paid = payment.paidAt ?? now
    return (paid.getTime() - payment.dueDate.getTime()) / DAY
  })
  const paymentLatenessDays = Number(Math.max(0, mean(lateness)).toFixed(1))
  const paymentJitterDays = Number(spread(lateness).toFixed(1))

  const counts = new Map<string, number>()
  for (const payment of input.payments) counts.set(payment.channel, (counts.get(payment.channel) ?? 0) + 1)
  const dominantChannel = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'NONE'

  return {
    claimFrequency,
    claimSentiment,
    premiumShock,
    seasonalPressure,
    diaspora,
    payerLocation,
    paymentLatenessDays,
    paymentJitterDays,
    dominantChannel,
    employer: input.employer,
  }
}

export function predictRisk(inputs: ModelInputs) {
  const reasons: string[] = []
  let score = 6

  if (inputs.claimFrequency >= 0.8) {
    score += 14
    reasons.push(`Insurance claims run at ${inputs.claimFrequency} a year`)
  }
  if (inputs.claimSentiment > 0.2) {
    score += 12
    reasons.push('Contact sentiment around claims is negative')
  }
  if (inputs.premiumShock >= 0.2) {
    score += 18
    reasons.push(`The renewal premium is ${Math.round(inputs.premiumShock * 100)}% above the previous premium`)
  }
  if (inputs.seasonalPressure >= 0.45) {
    score += 10
    reasons.push('Claims and premium dues cluster in the rainy and school-fee months')
  }
  if (inputs.diaspora) {
    score += 12
    reasons.push(`Premiums are paid from ${inputs.payerLocation}`)
  }
  if (inputs.paymentLatenessDays >= 7) {
    score += 14
    reasons.push(`Payments arrive ${inputs.paymentLatenessDays} days late on average`)
  }
  if (inputs.paymentJitterDays >= 6) {
    score += 10
    reasons.push('The gap between due date and payment jumps around')
  }
  if (inputs.dominantChannel === 'DIASPORA_TRANSFER' || inputs.dominantChannel === 'CASH') {
    score += 8
    reasons.push(`The usual payment channel is ${inputs.dominantChannel === 'CASH' ? 'cash' : 'a diaspora transfer'}`)
  }
  if (inputs.dominantChannel === 'EMPLOYER_DEDUCTION') {
    score -= 8
    reasons.push(`${inputs.employer ?? 'The employer'} deducts the premium, so payment is steady`)
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}

export function deriveValue(input: BehaviourInput, now = new Date()): ValueInputs {
  const activePolicies = input.policies.filter((policy) => policy.status === 'ACTIVE')
  const activeMemberships = input.memberships.filter((membership) => membership.status === 'ACTIVE')
  const lineCount = activePolicies.length + activeMemberships.length
  const annualizedPremium = Number((
    activePolicies.reduce((sum, policy) => sum + Number(policy.premium) * 12, 0) +
    activeMemberships.reduce((sum, membership) => sum + Number(membership.monthlyContribution) * 12, 0)
  ).toFixed(2))
  const claimTotal = input.claims
    .filter((claim) => claim.type === 'INSURANCE')
    .reduce((sum, claim) => sum + Number(claim.amount), 0)
  const claimToPremiumRatio = annualizedPremium > 0 ? Number((claimTotal / annualizedPremium).toFixed(2)) : 0
  const tenureYears = Number((Math.max(0, (now.getTime() - input.customerSince.getTime()) / (365 * DAY))).toFixed(1))
  const renewed = input.policies.some((policy) => policy.previousPremium != null && Number(policy.previousPremium) > 0)

  return {
    lineCount,
    claimToPremiumRatio,
    affinityGroup: input.affinityGroup,
    tenureYears,
    renewed,
    annualizedPremium,
  }
}

export function predictValue(inputs: ValueInputs) {
  const reasons: string[] = []
  let score = 4

  if (inputs.lineCount >= 3) {
    score += 28
    reasons.push(`${inputs.lineCount} active lines on the book`)
  } else if (inputs.lineCount === 2) {
    score += 16
    reasons.push('Two active lines')
  } else {
    score += 6
    reasons.push('A single line')
  }

  if (inputs.claimToPremiumRatio <= 0.3) {
    score += 20
    reasons.push(`Claims are ${Math.round(inputs.claimToPremiumRatio * 100)}% of the annual premium`)
  } else if (inputs.claimToPremiumRatio <= 0.7) {
    score += 10
    reasons.push(`Claims are ${Math.round(inputs.claimToPremiumRatio * 100)}% of the annual premium`)
  } else {
    reasons.push(`Claims are ${Math.round(inputs.claimToPremiumRatio * 100)}% of the annual premium`)
  }

  if (inputs.affinityGroup) {
    score += 16
    reasons.push(`Linked to ${inputs.affinityGroup}`)
  }

  score += Math.min(18, Math.round(inputs.tenureYears * 3))
  if (inputs.renewed && inputs.tenureYears >= 3) {
    score += 8
    reasons.push(`${inputs.tenureYears} years on the book, and the policy has renewed`)
  } else {
    reasons.push(`${inputs.tenureYears} years on the book`)
  }

  if (inputs.annualizedPremium >= 2000) {
    score += 18
    reasons.push(`Annual premium volume is ${Math.round(inputs.annualizedPremium)}`)
  } else if (inputs.annualizedPremium >= 800) {
    score += 10
    reasons.push(`Annual premium volume is ${Math.round(inputs.annualizedPremium)}`)
  } else {
    score += 4
    reasons.push(`Annual premium volume is ${Math.round(inputs.annualizedPremium)}`)
  }

  return { score: Math.max(0, Math.min(100, score)), reasons }
}
