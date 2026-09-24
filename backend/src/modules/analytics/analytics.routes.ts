import { Router } from 'express'
import { asyncHandler } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { requireAuth, requireRoles } from '../../middleware/auth'
import { scoreBook } from '../intelligence/score'

export const analyticsRouter = Router()
analyticsRouter.use(requireAuth, requireRoles('ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE'))

analyticsRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    await scoreBook()

    const [profiles, segmentRows, openRetentions] = await Promise.all([
      prisma.customer.findMany({
        where: { profile: { isNot: null } },
        select: {
          id: true,
          customerCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          location: true,
          engagement: true,
          preferredChannel: true,
          customerSince: true,
          lastInteractionAt: true,
          profile: {
            select: {
              productsHeld: true,
              policyCount: true,
              claimCount: true,
              claimFrequency: true,
              averageClaimValue: true,
              medicalClaimCount: true,
              healthcareVisitCount: true,
              pharmacyTransactionCount: true,
              digitalInteractionCount: true,
              supportInteractionCount: true,
              riskScore: true,
              valueScore: true,
              riskBand: true,
              valueBand: true,
              paymentStanding: true,
              nextRenewalDate: true,
            },
          },
          segments: { select: { kind: true, label: true } },
          retentions: {
            where: { status: 'OPEN' },
            take: 1,
            select: { title: true, reason: true, action: true },
          },
        },
      }),
      prisma.customerSegment.groupBy({ by: ['kind', 'label'], _count: { _all: true } }),
      prisma.retention.count({ where: { status: 'OPEN' } }),
    ])

    const rank = { LEAVING: 0, WATCH: 1, STEADY: 2 }
    profiles.sort((a, b) => {
      const risk = rank[a.profile?.riskBand ?? 'STEADY'] - rank[b.profile?.riskBand ?? 'STEADY']
      if (risk !== 0) return risk
      return (b.profile?.valueScore ?? 0) - (a.profile?.valueScore ?? 0)
    })

    const leaving = profiles.filter((person) => person.profile?.riskBand === 'LEAVING').length
    const watch = profiles.filter((person) => person.profile?.riskBand === 'WATCH').length
    const valueAtRisk = profiles.filter(
      (person) =>
        (person.profile?.riskBand === 'LEAVING' || person.profile?.riskBand === 'WATCH') &&
        (person.profile?.valueBand === 'HIGH' || person.profile?.valueBand === 'CORE'),
    ).length

    res.json({
      data: serialize({
        customers: profiles.length,
        leaving,
        watch,
        valueAtRisk,
        openRetentions,
        profiles,
        segments: segmentRows.map((row) => ({ kind: row.kind, label: row.label, count: row._count._all })),
      }),
    })
  }),
)
