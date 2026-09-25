import type { PaymentChannel, Sentiment } from '@prisma/client'
import { prisma } from '../../lib/prisma'

const localCities = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo']
const employers = ['Delta Corporation', 'Econet', 'CBZ', 'National Railways', null]

type Pattern = {
  employer: string | null
  affinityGroup: string | null
  lines: number
  claimRatio: number
  baseAnnual: number
  channel: PaymentChannel
  payerCountry: string
  payerCity: string
  lateDays: number[]
  shock: number
  sentiment: Sentiment
  seasonal: boolean
}

function patternFor(code: string): Pattern {
  if (code === 'CUS-00182') {
    return {
      employer: null,
      affinityGroup: 'Cell Diaspora Scheme',
      lines: 3,
      claimRatio: 0.4,
      baseAnnual: 2800,
      channel: 'DIASPORA_TRANSFER',
      payerCountry: 'ZA',
      payerCity: 'Johannesburg',
      lateDays: [4, 18, 2, 21, 9, 16],
      shock: 0.34,
      sentiment: 'NEGATIVE',
      seasonal: true,
    }
  }
  let n = 0
  for (const char of code) n += char.charCodeAt(0)
  const kind = n % 5
  const employer = employers[n % 4]
  const city = localCities[n % localCities.length]
  if (kind === 0) {
    return { employer: null, affinityGroup: null, lines: 2, claimRatio: 0.9, baseAnnual: 1400, channel: 'DIASPORA_TRANSFER', payerCountry: 'GB', payerCity: 'London', lateDays: [12, 20, 8, 15, 11, 19], shock: 0.28, sentiment: 'NEGATIVE', seasonal: true }
  }
  if (kind === 1) {
    return { employer, affinityGroup: `${employer} Staff Scheme`, lines: 3, claimRatio: 0.2, baseAnnual: 2400, channel: 'EMPLOYER_DEDUCTION', payerCountry: 'ZW', payerCity: city, lateDays: [0, 1, 0, 0, 2, 0], shock: 0.04, sentiment: 'POSITIVE', seasonal: false }
  }
  if (kind === 2) {
    return { employer, affinityGroup: null, lines: 2, claimRatio: 0.45, baseAnnual: 960, channel: 'BANK', payerCountry: 'ZW', payerCity: city, lateDays: [3, 5, 2, 6, 4, 3], shock: 0.12, sentiment: 'NEUTRAL', seasonal: false }
  }
  if (kind === 3) {
    return { employer: null, affinityGroup: null, lines: 1, claimRatio: 1.2, baseAnnual: 420, channel: 'MOBILE_MONEY', payerCountry: 'ZA', payerCity: 'Johannesburg', lateDays: [1, 14, 0, 22, 6, 17], shock: 0.22, sentiment: 'NEGATIVE', seasonal: true }
  }
  return { employer: null, affinityGroup: null, lines: 1, claimRatio: 0.95, baseAnnual: 540, channel: 'CASH', payerCountry: 'ZW', payerCity: city, lateDays: [7, 9, 6, 11, 8, 10], shock: 0.18, sentiment: 'NEUTRAL', seasonal: true }
}

function dueDates(seasonal: boolean) {
  return seasonal
    ? ['2025-11-01', '2025-12-01', '2026-01-01', '2026-02-01', '2026-06-01', '2026-08-01']
    : ['2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01']
}

async function shapeValue(customerId: string, code: string, pattern: Pattern, claimTotal: number) {
  const sized = claimTotal > 0 ? claimTotal / pattern.claimRatio : pattern.baseAnnual
  const annual = pattern.claimRatio <= 0.45
    ? Math.min(4200, Math.max(pattern.baseAnnual, sized))
    : Math.min(pattern.baseAnnual, Math.max(360, sized))
  const medicalShare = pattern.lines >= 3 ? annual * 0.35 : 0
  const insuranceLines = pattern.lines >= 3 ? 2 : pattern.lines
  const monthly = Number(((annual - medicalShare) / insuranceLines / 12).toFixed(2))
  const previous = Number((monthly / (1 + pattern.shock)).toFixed(2))
  const renewal = Number((previous * (1 + pattern.shock)).toFixed(2))
  const priced = { premium: monthly, previousPremium: previous, renewalPremium: renewal, status: 'ACTIVE' as const }

  let policies = await prisma.insurancePolicy.findMany({ where: { customerId }, orderBy: { startDate: 'asc' } })
  if (policies.length === 0) {
    await prisma.insurancePolicy.create({
      data: {
        customerId,
        policyNumber: `ENG-${code}-1`,
        productName: 'Motor Comprehensive',
        coverAmount: 10000,
        startDate: new Date('2024-03-01T00:00:00.000Z'),
        renewalDate: new Date('2026-10-15T00:00:00.000Z'),
        ...priced,
      },
    })
    policies = await prisma.insurancePolicy.findMany({ where: { customerId }, orderBy: { startDate: 'asc' } })
  }

  const extraNumber = `ENG-${code}-2`
  if (insuranceLines >= 2 && policies.length < 2) {
    await prisma.insurancePolicy.create({
      data: {
        customerId,
        policyNumber: extraNumber,
        productName: 'Household Cover',
        coverAmount: 8000,
        startDate: new Date('2023-06-01T00:00:00.000Z'),
        renewalDate: new Date('2026-10-15T00:00:00.000Z'),
        ...priced,
      },
    })
    policies = await prisma.insurancePolicy.findMany({ where: { customerId }, orderBy: { startDate: 'asc' } })
  }

  for (const [index, policy] of policies.entries()) {
    await prisma.insurancePolicy.update({
      where: { id: policy.id },
      data: index < insuranceLines
        ? priced
        : { status: 'LAPSED', premium: policy.premium, previousPremium: previous, renewalPremium: renewal },
    })
  }

  const contribution = Number((medicalShare / 12).toFixed(2))
  const memberships = await prisma.medicalMembership.findMany({ where: { customerId } })
  if (pattern.lines >= 3) {
    if (memberships.length === 0) {
      await prisma.medicalMembership.create({
        data: {
          customerId,
          memberNumber: `ENG-${code}-M`,
          planName: 'Standard',
          status: 'ACTIVE',
          monthlyContribution: contribution,
          startDate: new Date('2024-02-01T00:00:00.000Z'),
        },
      })
    } else {
      await prisma.medicalMembership.update({
        where: { id: memberships[0].id },
        data: { status: 'ACTIVE', monthlyContribution: contribution },
      })
      if (memberships.length > 1) {
        await prisma.medicalMembership.updateMany({
          where: { customerId, id: { not: memberships[0].id } },
          data: { status: 'ENDED' },
        })
      }
    }
  } else if (memberships.length > 0) {
    await prisma.medicalMembership.updateMany({ where: { customerId }, data: { status: 'ENDED' } })
  }

  const held = ['Motor Insurance']
  if (insuranceLines >= 2) held.push('Household Cover')
  if (pattern.lines >= 3) held.push('Medical Aid')
  await prisma.customerProfile.updateMany({
    where: { customerId },
    data: { productsHeld: held, policyCount: insuranceLines },
  })
  return monthly
}

export async function ensureBehaviour() {
  const customers = await prisma.customer.findMany({
    include: {
      policies: { select: { id: true } },
      payments: { select: { id: true } },
      interactions: { select: { id: true } },
      claims: { where: { type: 'INSURANCE' }, select: { amount: true } },
    },
  })

  for (const customer of customers) {
    const pattern = patternFor(customer.customerCode)
    await prisma.customer.update({
      where: { id: customer.id },
      data: { employer: pattern.employer, affinityGroup: pattern.affinityGroup },
    })
    if (customer.interactions.length > 0) {
      await prisma.customerInteraction.updateMany({
        where: { customerId: customer.id },
        data: { sentiment: pattern.sentiment },
      })
    }
    const claimTotal = customer.claims.reduce((sum, claim) => sum + Number(claim.amount), 0)
    const premium = await shapeValue(customer.id, customer.customerCode, pattern, claimTotal)
    if (customer.payments.length > 0) {
      await prisma.premiumPayment.updateMany({ where: { customerId: customer.id }, data: { amount: premium } })
    }
    if (customer.payments.length === 0) {
      const dues = dueDates(pattern.seasonal)
      await prisma.premiumPayment.createMany({
        data: dues.map((due, index) => {
          const dueDate = new Date(`${due}T00:00:00.000Z`)
          const paid = new Date(dueDate.getTime() + pattern.lateDays[index] * 24 * 60 * 60 * 1000)
          return {
            customerId: customer.id,
            amount: premium,
            channel: pattern.channel,
            payerCountry: pattern.payerCountry,
            payerCity: pattern.payerCity,
            dueDate,
            paidAt: paid,
          }
        }),
      })
    }
  }
}
