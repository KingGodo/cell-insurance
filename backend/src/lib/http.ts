import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodError, type ZodSchema } from 'zod'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(new ApiError(400, 'VALIDATION_ERROR', 'Invalid request body', flatten(result.error)))
      return
    }
    req.body = result.data
    next()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      next(new ApiError(400, 'VALIDATION_ERROR', 'Invalid query', flatten(result.error)))
      return
    }
    req.query = result.data as typeof req.query
    next()
  }
}

function flatten(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
}

export function notFound(resource: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', `${resource} not found`)
}
