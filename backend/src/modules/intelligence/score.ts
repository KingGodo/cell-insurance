import type { RiskBand, ValueBand } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { ensureBehaviour } from './behaviour'
import { deriveInputs, deriveValue, predictRisk, predictValue } from './features'
import { assignPlan, ensurePlans, segmentFor } from './retention'

function bandRisk(score: number): RiskBand {
  if (score >= 55) return 'LEAVING'
  if (score >= 25) return 'WATCH'
  return 'STEADY'
}

function bandValue(score: number): ValueBand {
  if (score >= 70) return 'HIGH'
  if (score >= 40) return 'CORE'
  return 'LOWER'
}

function riskLabel(band: RiskBand) {
  if (band === 'LEAVING') return 'High risk'
  if (band === 'WATCH') return 'Medium risk'
  return 'Low risk'
}

function valueLabel(band: ValueBand) {
  if (band === 'HIGH') return 'High value'
  if (band === 'CORE') return 'Medium value'
  return 'Low value'
}

export async function scoreBook() {
  await ensureBehaviour()
  await ensurePlans()
  await prisma.retention.updateMany({ where: { status: 'OPEN', ruleId: null }, data: { status: 'KEPT' } })
  const plans = await prisma.retentionPlan.findMany({
    where: { enabled: true },
    include: { rules: { where: { enabled: true }, orderBy: { priority: 'asc' } } },
  })
  const now = new Date()
  const customers = await prisma.customer.findMany({
    include: {
      profile: true,
      policies: { select: { status: true, premium: true, previousPremium: true, renewalPremium: true, startDate: true } },
      memberships: { select: { status: true, monthlyContribution: true } },
      dependants: { select: { relationship: true, dateOfBirth: true } },
      claims: { select: { type: true, amount: true, incidentDate: true } },
      interactions: { select: { sentiment: true } },
      payments: { select: { channel: true, payerCountry: true, payerCity: true, dueDate: true, paidAt: true } },
    },
  })

  for (const customer of customers) {
    if (!customer.profile) continue
    const behaviour = {
      customerSince: customer.customerSince,
      employer: customer.employer,
      affinityGroup: customer.affinityGroup,
      claims: customer.claims,
      interactions: customer.interactions,
      policies: customer.policies,
      memberships: customer.memberships,
      payments: customer.payments,
    }
    const inputs = deriveInputs(behaviour, now)
    const valueInputs = deriveValue(behaviour, now)
    const prediction = predictRisk(inputs)
    const valuePrediction = predictValue(valueInputs)
    const risk = prediction.score
    const value = valuePrediction.score
    await prisma.aiFeature.deleteMany({ where: { customerId: customer.id } })
    await prisma.aiFeature.create({
      data: {
        customerId: customer.id,
        featureSet: {
          riskModelVersion: 'customeriq-xgb-sim-v1',
          valueModelVersion: 'customeriq-value-sim-v1',
          modelVersion: 'customeriq-xgb-sim-v1',
          inputs,
          prediction: risk,
          riskReasons: prediction.reasons,
          valueInputs,
          valuePrediction: value,
          valueReasons: valuePrediction.reasons,
        },
      },
    })

    const riskBand = bandRisk(risk)
    const valueBand = bandValue(value)

    await prisma.customerProfile.update({
      where: { customerId: customer.id },
      data: { riskScore: risk, valueScore: value, riskBand, valueBand, matrixSegment: segmentFor(value, risk), scoredAt: now },
    })

    await prisma.customerSegment.deleteMany({
      where: { customerId: customer.id, kind: { in: ['RISK', 'VALUE'] } },
    })
    await prisma.customerSegment.createMany({
      data: [
        { customerId: customer.id, kind: 'RISK', label: riskLabel(riskBand) },
        { customerId: customer.id, kind: 'VALUE', label: valueLabel(valueBand) },
      ],
    })

    await assignPlan({
      customerId: customer.id,
      firstName: customer.firstName,
      value,
      risk,
      dependants: customer.dependants,
      plans,
      now,
    })
  }
}
