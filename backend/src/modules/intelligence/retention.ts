import type { RetentionChannel, RetentionPlan, RetentionRule } from '@prisma/client'
import { prisma } from '../../lib/prisma'

const VALUE_LINE = 70
const RISK_LINE = 55

const channelLabel: Record<RetentionChannel, string> = {
  SMS: 'SMS',
  EMAIL: 'email',
  SOCIALS: 'socials',
  MARKETING: 'the marketing team',
  CUSTOMER_SERVICE: 'customer service',
  PORTAL: 'the customer portal',
}

const monthName = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type PlanSeed = {
  code: string
  name: string
  summary: string
  offer: string
  cost: number
  channels: RetentionChannel[]
  rule: {
    code: string
    name: string
    summary: string
    valueMin?: number
    valueMax?: number
    riskMin?: number
    riskMax?: number
    requiresChildren: boolean
    activeMonths: number[]
    priority: number
  }
}

const defaultPlans: PlanSeed[] = [
  {
    code: 'back-to-school',
    name: 'Back to school relief',
    summary: 'Holders with children qualify for a discount while schools reopen.',
    offer: 'A contribution discount for the reopen window.',
    cost: 240,
    channels: ['SMS', 'EMAIL', 'PORTAL', 'SOCIALS'],
    rule: {
      code: 'back-to-school-rule',
      name: 'Holders with children in a reopen month',
      summary: 'Value at least 40, risk at least 25, and a child on the membership, in January, May, or September.',
      valueMin: 40,
      riskMin: 25,
      requiresChildren: true,
      activeMonths: [1, 5, 9],
      priority: 10,
    },
  },
  {
    code: 'personal-save',
    name: 'Personal save',
    summary: 'A managed save for customers with high value and high risk.',
    offer: 'A managed save through customer service.',
    cost: 520,
    channels: ['CUSTOMER_SERVICE', 'EMAIL', 'SMS', 'PORTAL'],
    rule: {
      code: 'personal-save-rule',
      name: 'High value and high risk',
      summary: 'Value at least 70 and risk at least 55.',
      valueMin: 70,
      riskMin: 55,
      requiresChildren: false,
      activeMonths: [],
      priority: 20,
    },
  },
  {
    code: 'premium-rebuild',
    name: 'Premium rebuild',
    summary: 'A rebuild for high value customers whose risk is still contained.',
    offer: 'A rebuild of the premium through marketing and the portal.',
    cost: 480,
    channels: ['MARKETING', 'EMAIL', 'PORTAL', 'CUSTOMER_SERVICE'],
    rule: {
      code: 'premium-rebuild-rule',
      name: 'High value and contained risk',
      summary: 'Value at least 70 and risk at most 54.',
      valueMin: 70,
      riskMax: 54,
      requiresChildren: false,
      activeMonths: [],
      priority: 30,
    },
  },
  {
    code: 'early-hold',
    name: 'Early hold',
    summary: 'A lighter hold when value is lower and risk is high.',
    offer: 'A lighter hold by SMS and email.',
    cost: 150,
    channels: ['SMS', 'EMAIL'],
    rule: {
      code: 'early-hold-rule',
      name: 'Lower value and high risk',
      summary: 'Value at most 69 and risk at least 55.',
      valueMax: 69,
      riskMin: 55,
      requiresChildren: false,
      activeMonths: [],
      priority: 40,
    },
  },
]

export function segmentFor(value: number, risk: number) {
  const highValue = value >= VALUE_LINE
  const highRisk = risk >= RISK_LINE
  if (highValue && highRisk) return 'SAVE_ME_NOW' as const
  if (highValue) return 'VVIP' as const
  if (highRisk) return 'GHOST' as const
  return 'GROWABLE' as const
}

function hasChild(dependants: Array<{ relationship: string; dateOfBirth: Date }>, now: Date) {
  return dependants.some((person) => {
    if (person.relationship.toLowerCase() === 'child') return true
    const years = (now.getTime() - new Date(person.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    return years >= 0 && years < 18 && person.relationship.toLowerCase() !== 'spouse'
  })
}

export function hasThreshold(rule: Pick<RetentionRule, 'valueMin' | 'valueMax' | 'riskMin' | 'riskMax'>) {
  return rule.valueMin != null || rule.valueMax != null || rule.riskMin != null || rule.riskMax != null
}

function qualifies(rule: RetentionRule, value: number, risk: number, children: boolean, month: number) {
  if (!rule.enabled || !hasThreshold(rule)) return false
  if (rule.valueMin != null && value < rule.valueMin) return false
  if (rule.valueMax != null && value > rule.valueMax) return false
  if (rule.riskMin != null && risk < rule.riskMin) return false
  if (rule.riskMax != null && risk > rule.riskMax) return false
  if (rule.requiresChildren && !children) return false
  if (rule.activeMonths.length > 0 && !rule.activeMonths.includes(month)) return false
  return true
}

function specificity(rule: RetentionRule) {
  let score = 0
  if (rule.requiresChildren) score += 4
  if (rule.activeMonths.length > 0) score += 4
  if (rule.valueMin != null) score += 1
  if (rule.valueMax != null) score += 1
  if (rule.riskMin != null) score += 1
  if (rule.riskMax != null) score += 1
  return score
}

function boundText(label: string, min: number | null, max: number | null) {
  if (min != null && max != null) return `${label} ${min}–${max}`
  if (min != null) return `${label} at least ${min}`
  if (max != null) return `${label} at most ${max}`
  return ''
}

export async function ensurePlans() {
  for (const item of defaultPlans) {
    const plan = await prisma.retentionPlan.upsert({
      where: { code: item.code },
      update: {},
      create: {
        code: item.code,
        name: item.name,
        summary: item.summary,
        offer: item.offer,
        cost: item.cost,
        channels: item.channels,
      },
    })
    await prisma.retentionRule.upsert({
      where: { code: item.rule.code },
      update: {},
      create: { ...item.rule, planId: plan.id },
    })
  }
}

type PlanWithRules = RetentionPlan & { rules: RetentionRule[] }

export async function assignPlan(input: {
  customerId: string
  firstName: string
  value: number
  risk: number
  dependants: Array<{ relationship: string; dateOfBirth: Date }>
  plans: PlanWithRules[]
  now: Date
}) {
  const month = input.now.getUTCMonth() + 1
  const children = hasChild(input.dependants, input.now)
  const chosen = input.plans
    .flatMap((plan) => plan.rules.map((rule) => ({ plan, rule })))
    .filter((item) => qualifies(item.rule, input.value, input.risk, children, month))
    .sort((a, b) => specificity(b.rule) - specificity(a.rule) || a.rule.priority - b.rule.priority)[0]

  const open = await prisma.retention.findFirst({ where: { customerId: input.customerId, status: 'OPEN' } })
  if (!chosen) {
    if (open) await prisma.retention.update({ where: { id: open.id }, data: { status: 'KEPT' } })
    return
  }

  const { plan, rule } = chosen
  const months = rule.activeMonths.map((item) => monthName[item]).filter(Boolean).join(', ')
  const figures = [boundText('value', rule.valueMin, rule.valueMax), boundText('risk', rule.riskMin, rule.riskMax)].filter(Boolean).join(', ')
  const extras = [
    rule.requiresChildren ? 'they have a child on the membership' : '',
    months ? `this is a school reopen month (${months})` : '',
  ].filter(Boolean)
  const reason = `${input.firstName} qualifies for ${plan.name} under ${rule.name}. Value is ${input.value} and risk is ${input.risk}. The rule requires ${figures}.${extras.length ? ` Also, ${extras.join(', and ')}.` : ''} ${plan.summary}`
  const channels = plan.channels.map((channel) => channelLabel[channel]).join(', ')
  const data = {
    planId: plan.id,
    ruleId: rule.id,
    title: plan.name,
    reason,
    action: `Send ${plan.offer} by ${channels}. The cost on this plan is ${Number(plan.cost).toFixed(0)}.`,
    cost: plan.cost,
    channels: plan.channels,
    valueScore: input.value,
    riskScore: input.risk,
  }

  if (open?.planId === plan.id && open.ruleId === rule.id) {
    await prisma.retention.update({ where: { id: open.id }, data })
    return
  }
  if (open) await prisma.retention.update({ where: { id: open.id }, data: { status: 'KEPT' } })
  await prisma.retention.create({ data: { customerId: input.customerId, status: 'OPEN', ...data } })
}
