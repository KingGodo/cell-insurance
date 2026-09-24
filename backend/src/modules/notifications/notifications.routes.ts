import { Router } from 'express'
import { asyncHandler, notFound } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { requireAuth } from '../../middleware/auth'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unread = notifications.filter((item) => !item.read).length
    res.json({ data: serialize(notifications), meta: { unread } })
  }),
)

notificationsRouter.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    })
    if (!existing) throw notFound('Notification')
    const notification = await prisma.notification.update({
      where: { id: existing.id },
      data: { read: true },
    })
    res.json({ data: serialize(notification) })
  }),
)
