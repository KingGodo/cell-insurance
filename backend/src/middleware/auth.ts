import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from '../config/env'
import { ApiError } from '../lib/http'
import { prisma } from '../lib/prisma'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: Role
  customerId: string | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'No token provided')
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string }
    if (!payload.sub) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, customerId: true },
    })
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid token')
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof ApiError) {
      next(error)
      return
    }
    next(new ApiError(401, 'UNAUTHORIZED', 'Invalid token'))
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this action'))
      return
    }
    next()
  }
}

export function assertCustomerAccess(user: AuthUser, customerId: string) {
  if (user.role === 'CUSTOMER' && user.customerId !== customerId) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only access your own records')
  }
}

export const staffRoles: Role[] = ['ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE']
