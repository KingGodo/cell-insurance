import type { RiskBand, ValueBand } from '@prisma/client'
import { prisma } from '../../lib/prisma'

const DAY = 24 * 60 * 60 * 1000

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
  if (band === 'LEAVING') return 'Leaving'
  if (band === 'WATCH') return 'Watch'
  return 'Steady'
}

function valueLabel(band: ValueBand) {
  if (band === 'HIGH') return 'High value'
  if (band === 'CORE') return 'Core'
  return 'Lower value'
}

function channelPhrase(channel: string) {
  if (channel === 'WHATSAPP') return 'WhatsApp'
  if (channel === 'CALL_CENTRE') return 'a call'
  if (channel === 'BRANCH') return 'the branch'
  return 'the portal'
}

export async function scoreBook() {
  const now = new Date()
  const horizon = new Date(now.getTime() + 45 * DAY)
  const customers = await prisma.customer.findMany({
    include: {
      profile: true,
      policies: { select: { status: true, premium: true, renewalDate: true } },
      memberships: { select: { status: true, monthlyContribution: true } },
    },
  })

  for (const customer of customers) {
    if (!customer.profile) continue
    const reasons: string[] = []
    let risk = 0

    if (customer.engagement === 'LOW') {
      risk += 30
      reasons.push('Engagement is low, so a quiet exit is easy to miss')
    } else if (customer.engagement === 'MEDIUM') {
      risk += 12
      reasons.push('Engagement is only moderate')
    }

    if (customer.profile.paymentStanding === 'OVERDUE') {
      risk += 25
      reasons.push('Payment is overdue')
    }

    const renewal = customer.profile.nextRenewalDate
    if (renewal && renewal >= now && renewal <= horizon) {
      risk += 25
      reasons.push('A renewal falls inside the next 45 days')
    }

    if (customer.lastInteractionAt) {
      const days = Math.floor((now.getTime() - customer.lastInteractionAt.getTime()) / DAY)
      if (days > 45) {
        risk += 18
        reasons.push(`No contact for ${days} days`)
      }
    } else {
      risk += 18
      reasons.push('No recent contact on file')
    }

    if (customer.profile.productsHeld.length <= 1) {
      risk += 12
      reasons.push('Only one product is holding the relationship')
    }

    if (customer.profile.digitalInteractionCount <= 1) {
      risk += 8
      reasons.push('Digital contact is thin')
    }

    risk = Math.min(100, risk)

    let value = Math.min(45, customer.profile.productsHeld.length * 15)
    const years = Math.max(0, (now.getTime() - customer.customerSince.getTime()) / (365 * DAY))
    value += Math.min(20, Math.round(years * 4))
    const premium = customer.policies
      .filter((policy) => policy.status === 'ACTIVE')
      .reduce((sum, policy) => sum + Number(policy.premium), 0)
    const contribution = customer.memberships
      .filter((membership) => membership.status === 'ACTIVE')
      .reduce((sum, membership) => sum + Number(membership.monthlyContribution), 0)
    value += Math.min(20, Math.round((premium + contribution) / 8))
    if (customer.profile.paymentStanding === 'CURRENT') value += 8
    if (customer.engagement === 'HIGH') value += 8
    value = Math.min(100, value)

    const riskBand = bandRisk(risk)
    const valueBand = bandValue(value)

    await prisma.customerProfile.update({
      where: { customerId: customer.id },
      data: { riskScore: risk, valueScore: value, riskBand, valueBand, scoredAt: now },
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

    const needsRetention = riskBand === 'LEAVING' || riskBand === 'WATCH'
    const open = await prisma.retention.findFirst({
      where: { customerId: customer.id, status: 'OPEN' },
    })

    if (!needsRetention) {
      if (open) await prisma.retention.update({ where: { id: open.id }, data: { status: 'KEPT' } })
      continue
    }

    const title = riskBand === 'LEAVING' ? 'Stop a quiet exit' : 'Hold them before they drift'
    const reason = `${reasons.join('. ')}.`
    const via = channelPhrase(customer.preferredChannel)
    const action =
      valueBand === 'HIGH'
        ? `Contact ${customer.firstName} on ${via} this week. The value is high, and the exit would otherwise go unseen.`
        : `Contact ${customer.firstName} on ${via} before the relationship goes quiet.`

    if (open) {
      await prisma.retention.update({ where: { id: open.id }, data: { title, reason, action } })
    } else {
      await prisma.retention.create({
        data: { customerId: customer.id, title, reason, action, status: 'OPEN' },
      })
    }
  }
}
