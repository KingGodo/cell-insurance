import { Router } from 'express'
import { asyncHandler, notFound } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { requireAuth, requireRoles } from '../../middleware/auth'

export const providersRouter = Router()
providersRouter.use(requireAuth, requireRoles('ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE'))

providersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const providers = await prisma.provider.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { claims: true, visits: true } } },
    })
    res.json({ data: serialize(providers) })
  }),
)

providersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const provider = await prisma.provider.findUnique({
      where: { id: req.params.id },
      include: {
        claims: {
          orderBy: { submittedAt: 'desc' },
          take: 20,
          include: { customer: { select: { id: true, firstName: true, lastName: true, customerCode: true } } },
        },
      },
    })
    if (!provider) throw notFound('Provider')
    res.json({ data: serialize(provider) })
  }),
)
