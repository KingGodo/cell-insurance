import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, notFound, validateQuery } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { assertCustomerAccess, requireAuth } from '../../middleware/auth'

const listQuery = z.object({
  customerId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'LAPSED', 'EXPIRED', 'PENDING']).optional(),
})

export const policiesRouter = Router()
policiesRouter.use(requireAuth)

policiesRouter.get(
  '/',
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuery>
    const user = req.user!
    const customerId = user.role === 'CUSTOMER' ? user.customerId ?? 'none' : query.customerId
    const policies = await prisma.insurancePolicy.findMany({
      where: {
        customerId,
        status: query.status,
      },
      include: {
        customer: { select: { id: true, customerCode: true, firstName: true, lastName: true } },
      },
      orderBy: { renewalDate: 'asc' },
    })
    res.json({ data: serialize(policies) })
  }),
)

policiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, customerCode: true, firstName: true, lastName: true } },
        claims: { orderBy: { submittedAt: 'desc' } },
      },
    })
    if (!policy) throw notFound('Policy')
    assertCustomerAccess(req.user!, policy.customerId)
    res.json({ data: serialize(policy) })
  }),
)
