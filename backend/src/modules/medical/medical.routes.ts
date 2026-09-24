import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, notFound, validateQuery } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { assertCustomerAccess, requireAuth } from '../../middleware/auth'

const listQuery = z.object({
  customerId: z.string().uuid().optional(),
})

export const medicalRouter = Router()
medicalRouter.use(requireAuth)

medicalRouter.get(
  '/',
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuery>
    const user = req.user!
    const customerId = user.role === 'CUSTOMER' ? user.customerId ?? 'none' : query.customerId
    const memberships = await prisma.medicalMembership.findMany({
      where: { customerId },
      include: {
        dependants: true,
        customer: { select: { id: true, customerCode: true, firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    })
    res.json({ data: serialize(memberships) })
  }),
)

medicalRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const membership = await prisma.medicalMembership.findUnique({
      where: { id: req.params.id },
      include: {
        dependants: true,
        claims: { orderBy: { submittedAt: 'desc' } },
        customer: { select: { id: true, customerCode: true, firstName: true, lastName: true } },
      },
    })
    if (!membership) throw notFound('Membership')
    assertCustomerAccess(req.user!, membership.customerId)
    res.json({ data: serialize(membership) })
  }),
)
