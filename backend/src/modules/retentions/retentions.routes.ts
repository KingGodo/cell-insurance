import { RetentionChannel } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { ApiError, asyncHandler, notFound } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { requireAuth, staffRoles } from '../../middleware/auth'

const bound = z.number().int().min(0).max(100).nullable()

const planSchema = z.object({
  name: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(8).max(400),
  offer: z.string().trim().min(2).max(200),
  cost: z.number().positive().max(100000),
  channels: z.array(z.nativeEnum(RetentionChannel)).min(1),
  enabled: z.boolean(),
})

const ruleSchema = z
  .object({
    planId: z.string().uuid(),
    name: z.string().trim().min(2).max(80),
    summary: z.string().trim().min(8).max(400),
    valueMin: bound,
    valueMax: bound,
    riskMin: bound,
    riskMax: bound,
    requiresChildren: z.boolean(),
    activeMonths: z.array(z.number().int().min(1).max(12)).max(12),
    enabled: z.boolean(),
    priority: z.number().int().min(1).max(999),
  })
  .superRefine((value, ctx) => {
    const hasThreshold = [value.valueMin, value.valueMax, value.riskMin, value.riskMax].some((item) => item != null)
    if (!hasThreshold) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Set a value or risk threshold before this rule can be saved.', path: ['valueMin'] })
    }
    if (value.valueMin != null && value.valueMax != null && value.valueMin > value.valueMax) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Value from cannot be higher than value to.', path: ['valueMax'] })
    }
    if (value.riskMin != null && value.riskMax != null && value.riskMin > value.riskMax) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Risk from cannot be higher than risk to.', path: ['riskMax'] })
    }
  })

function codeFor(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${slug || 'item'}-${Date.now().toString(36)}`
}

function months(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b)
}

export const retentionsRouter = Router()
retentionsRouter.use(requireAuth, (req, res, next) => {
  if (!req.user || !staffRoles.includes(req.user.role)) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'This desk is for the admin.' } })
    return
  }
  next()
})

retentionsRouter.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    const plans = await prisma.retentionPlan.findMany({
      orderBy: { name: 'asc' },
      include: {
        rules: { orderBy: { priority: 'asc' } },
        _count: { select: { deployments: { where: { status: 'OPEN' } } } },
      },
    })
    res.json({ data: serialize(plans) })
  }),
)

retentionsRouter.post(
  '/plans',
  asyncHandler(async (req, res) => {
    const parsed = planSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Check the plan fields.')
    const plan = await prisma.retentionPlan.create({ data: { ...parsed.data, code: codeFor(parsed.data.name) } })
    res.status(201).json({ data: serialize(plan) })
  }),
)

retentionsRouter.patch(
  '/plans/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.retentionPlan.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Retention plan')
    const parsed = planSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Check the plan fields.')
    const plan = await prisma.retentionPlan.update({ where: { id: existing.id }, data: parsed.data })
    res.json({ data: serialize(plan) })
  }),
)

retentionsRouter.delete(
  '/plans/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.retentionPlan.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Retention plan')
    await prisma.retention.updateMany({ where: { planId: existing.id, status: 'OPEN' }, data: { status: 'KEPT' } })
    await prisma.retentionPlan.delete({ where: { id: existing.id } })
    res.json({ data: { id: existing.id } })
  }),
)

retentionsRouter.get(
  '/rules',
  asyncHandler(async (_req, res) => {
    const rules = await prisma.retentionRule.findMany({
      orderBy: { priority: 'asc' },
      include: { plan: { select: { id: true, name: true, enabled: true } } },
    })
    res.json({ data: serialize(rules) })
  }),
)

retentionsRouter.post(
  '/rules',
  asyncHandler(async (req, res) => {
    const parsed = ruleSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Check the rule fields.')
    const plan = await prisma.retentionPlan.findUnique({ where: { id: parsed.data.planId } })
    if (!plan) throw notFound('Retention plan')
    const rule = await prisma.retentionRule.create({
      data: { ...parsed.data, activeMonths: months(parsed.data.activeMonths), code: codeFor(parsed.data.name) },
    })
    res.status(201).json({ data: serialize(rule) })
  }),
)

retentionsRouter.patch(
  '/rules/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.retentionRule.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Retention rule')
    const parsed = ruleSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Check the rule fields.')
    const plan = await prisma.retentionPlan.findUnique({ where: { id: parsed.data.planId } })
    if (!plan) throw notFound('Retention plan')
    const rule = await prisma.retentionRule.update({
      where: { id: existing.id },
      data: { ...parsed.data, activeMonths: months(parsed.data.activeMonths) },
    })
    res.json({ data: serialize(rule) })
  }),
)

retentionsRouter.delete(
  '/rules/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.retentionRule.findUnique({ where: { id: req.params.id } })
    if (!existing) throw notFound('Retention rule')
    await prisma.retention.updateMany({ where: { ruleId: existing.id, status: 'OPEN' }, data: { status: 'KEPT' } })
    await prisma.retentionRule.delete({ where: { id: existing.id } })
    res.json({ data: { id: existing.id } })
  }),
)

retentionsRouter.get(
  '/deployed',
  asyncHandler(async (_req, res) => {
    const deployed = await prisma.retention.findMany({
      where: { status: 'OPEN', planId: { not: null } },
      include: {
        customer: { select: { id: true, customerCode: true, firstName: true, lastName: true, location: true } },
        plan: { select: { name: true, offer: true } },
        rule: { select: { name: true } },
      },
      orderBy: { cost: 'desc' },
    })
    res.json({ data: serialize(deployed) })
  }),
)
