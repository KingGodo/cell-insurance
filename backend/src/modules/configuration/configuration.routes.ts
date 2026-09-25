import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, validateBody } from '../../lib/http'
import { requireAuth, requireRoles } from '../../middleware/auth'
import { receiveCustomerCsv } from './csv'
import { feeds } from './sources'

const csvBody = z.object({
  csv: z.string().trim().min(1).max(500_000),
})

export const configurationRouter = Router()
configurationRouter.use(requireAuth, requireRoles('ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE'))

configurationRouter.get(
  '/sources',
  asyncHandler(async (_req, res) => {
    res.json({ data: feeds })
  }),
)

configurationRouter.post(
  '/csv',
  validateBody(csvBody),
  asyncHandler(async (req, res) => {
    const result = await receiveCustomerCsv(req.body.csv)
    res.status(result.created + result.updated > 0 || result.errors.length === 0 ? 200 : 400).json({ data: result })
  }),
)
