import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../../config/env'
import { ApiError, asyncHandler, validateBody } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { requireAuth } from '../../middleware/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRouter = Router()

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password')
    }

    const matches = await bcrypt.compare(password, user.passwordHash)
    if (!matches) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid email or password')
    }

    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, { expiresIn: '12h' })
    res.json({
      data: {
        token,
        user: serialize({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          customerId: user.customerId,
        }),
      },
    })
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: req.user })
  }),
)
