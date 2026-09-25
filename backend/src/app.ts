import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler, notFoundHandler } from './middleware/error'
import { aiRouter } from './modules/ai/ai.routes'
import { analyticsRouter } from './modules/analytics/analytics.routes'
import { authRouter } from './modules/auth/auth.routes'
import { claimsRouter } from './modules/claims/claims.routes'
import { configurationRouter } from './modules/configuration/configuration.routes'
import { retentionsRouter } from './modules/retentions/retentions.routes'
import { customersRouter } from './modules/customers/customers.routes'
import { medicalRouter } from './modules/medical/medical.routes'
import { notificationsRouter } from './modules/notifications/notifications.routes'
import { policiesRouter } from './modules/policies/policies.routes'
import { providersRouter } from './modules/providers/providers.routes'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'customeriq-api', timestamp: new Date().toISOString() })
  })

  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/customers', customersRouter)
  app.use('/api/v1/policies', policiesRouter)
  app.use('/api/v1/medical', medicalRouter)
  app.use('/api/v1/claims', claimsRouter)
  app.use('/api/v1/providers', providersRouter)
  app.use('/api/v1/ai', aiRouter)
  app.use('/api/v1/analytics', analyticsRouter)
  app.use('/api/v1/configuration', configurationRouter)
  app.use('/api/v1/retentions', retentionsRouter)
  app.use('/api/v1/notifications', notificationsRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
