import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, notFound, validateQuery } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { assertCustomerAccess, requireAuth, staffRoles } from '../../middleware/auth'

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  segment: z.string().trim().optional(),
  location: z.string().trim().optional(),
})

const customerInclude = {
  profile: true,
  segments: true,
  policies: { orderBy: { renewalDate: 'asc' as const } },
  memberships: { include: { dependants: true } },
  insights: { orderBy: { createdAt: 'desc' as const } },
  recommendations: { orderBy: { createdAt: 'desc' as const } },
  retentions: { where: { status: 'OPEN' as const }, orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.CustomerInclude

export const customersRouter = Router()
customersRouter.use(requireAuth)

customersRouter.get(
  '/',
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuery>
    const user = req.user!
    const where: Prisma.CustomerWhereInput = {}

    if (user.role === 'CUSTOMER') {
      where.id = user.customerId ?? 'none'
    }

    if (query.search) {
      const parts = query.search.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        where.AND = [
          { firstName: { contains: parts[0], mode: 'insensitive' } },
          { lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' } },
        ]
      } else {
        where.OR = [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { customerCode: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
        ]
      }
    }

    if (query.location) where.location = { equals: query.location, mode: 'insensitive' }
    if (query.segment) where.segments = { some: { label: { equals: query.segment, mode: 'insensitive' } } }

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: { segments: true, profile: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: query.pageSize,
      }),
    ])

    res.json({
      data: serialize(rows),
      meta: { total, page: query.page, pageSize: query.pageSize },
    })
  }),
)

customersRouter.get(
  '/meta/segments',
  asyncHandler(async (req, res) => {
    if (!staffRoles.includes(req.user!.role)) {
      res.json({ data: [] })
      return
    }
    const grouped = await prisma.customerSegment.groupBy({
      by: ['kind', 'label'],
      _count: { _all: true },
      orderBy: { label: 'asc' },
    })
    res.json({
      data: grouped.map((row) => ({
        kind: row.kind,
        label: row.label,
        count: row._count._all,
      })),
    })
  }),
)

customersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    assertCustomerAccess(req.user!, req.params.id)
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: customerInclude,
    })
    if (!customer) throw notFound('Customer')
    res.json({ data: serialize(customer) })
  }),
)

customersRouter.get(
  '/:id/profile',
  asyncHandler(async (req, res) => {
    assertCustomerAccess(req.user!, req.params.id)
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        ...customerInclude,
        claims: {
          orderBy: { submittedAt: 'desc' },
          take: 50,
          include: { provider: { select: { name: true } }, documents: true },
        },
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 50,
          include: { provider: { select: { name: true } } },
        },
        pharmacy: { orderBy: { transactedAt: 'desc' }, take: 50 },
        interactions: { orderBy: { occurredAt: 'desc' }, take: 50 },
      },
    })
    if (!customer) throw notFound('Customer')

    res.json({
      data: serialize({
        customer: {
          id: customer.id,
          customerCode: customer.customerCode,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          location: customer.location,
          customerSince: customer.customerSince,
          engagement: customer.engagement,
          preferredChannel: customer.preferredChannel,
          lastInteractionAt: customer.lastInteractionAt,
        },
        profile: customer.profile,
        segments: customer.segments,
        policies: customer.policies,
        memberships: customer.memberships,
        insights: customer.insights,
        recommendations: customer.recommendations,
        retentions: customer.retentions,
        recentClaims: customer.claims,
        recentVisits: customer.visits,
        recentPharmacy: customer.pharmacy,
        recentInteractions: customer.interactions,
      }),
    })
  }),
)

customersRouter.get(
  '/:id/journey',
  asyncHandler(async (req, res) => {
    assertCustomerAccess(req.user!, req.params.id)
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!customer) throw notFound('Customer')
    const events = await prisma.customerEvent.findMany({
      where: { customerId: req.params.id },
      orderBy: { occurredAt: 'desc' },
    })
    res.json({ data: serialize(events) })
  }),
)

customersRouter.get(
  '/:id/interactions',
  asyncHandler(async (req, res) => {
    assertCustomerAccess(req.user!, req.params.id)
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!customer) throw notFound('Customer')
    const interactions = await prisma.customerInteraction.findMany({
      where: { customerId: req.params.id },
      orderBy: { occurredAt: 'desc' },
    })
    res.json({ data: serialize(interactions) })
  }),
)
