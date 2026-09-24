import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, notFound, validateBody } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { assertCustomerAccess, requireAuth, requireRoles } from '../../middleware/auth'
import { scoreClaim } from '../claims/claims.service'

const analyseSchema = z.object({
  claimId: z.string().uuid(),
})

export const aiRouter = Router()
aiRouter.use(requireAuth)

aiRouter.post(
  '/analyse-claim',
  requireRoles('ADMIN', 'CLAIMS_OFFICER'),
  validateBody(analyseSchema),
  asyncHandler(async (req, res) => {
    const { claimId } = req.body as z.infer<typeof analyseSchema>
    const { analysis } = await scoreClaim(claimId)
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { prediction: true, customer: { select: { id: true, firstName: true, lastName: true, customerCode: true } } },
    })
    res.json({
      data: serialize({
        claimId,
        claimNumber: claim?.claimNumber,
        customer: claim?.customer,
        ...analysis,
      }),
    })
  }),
)

aiRouter.get(
  '/segment',
  requireRoles('ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE'),
  asyncHandler(async (_req, res) => {
    const grouped = await prisma.customerSegment.groupBy({
      by: ['kind', 'label'],
      _count: { _all: true },
    })
    const segments = {
      product: [] as { label: string; count: number }[],
      engagement: [] as { label: string; count: number }[],
      channel: [] as { label: string; count: number }[],
    }
    for (const row of grouped) {
      const item = { label: row.label, count: row._count._all }
      if (row.kind === 'PRODUCT') segments.product.push(item)
      if (row.kind === 'ENGAGEMENT') segments.engagement.push(item)
      if (row.kind === 'CHANNEL') segments.channel.push(item)
    }
    res.json({ data: segments })
  }),
)

aiRouter.get(
  '/recommendations',
  requireRoles('ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE'),
  asyncHandler(async (_req, res) => {
    const recommendations = await prisma.customerRecommendation.findMany({
      where: { status: 'OPEN' },
      include: {
        customer: { select: { id: true, customerCode: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: serialize(recommendations) })
  }),
)

aiRouter.get(
  '/profile/:customerId',
  asyncHandler(async (req, res) => {
    assertCustomerAccess(req.user!, req.params.customerId)
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
      include: {
        segments: true,
        insights: { orderBy: { createdAt: 'desc' } },
        recommendations: { where: { status: 'OPEN' } },
        aiFeatures: { orderBy: { capturedAt: 'desc' }, take: 1 },
      },
    })
    if (!customer) throw notFound('Customer')
    res.json({
      data: serialize({
        customerId: customer.id,
        customerCode: customer.customerCode,
        segments: customer.segments,
        insights: customer.insights,
        recommendations: customer.recommendations,
        features: customer.aiFeatures[0]?.featureSet ?? null,
      }),
    })
  }),
)
