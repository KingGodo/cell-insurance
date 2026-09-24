import { Router } from 'express'
import { asyncHandler } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { requireAuth, requireRoles } from '../../middleware/auth'

export const analyticsRouter = Router()
analyticsRouter.use(requireAuth, requireRoles('ADMIN', 'CLAIMS_OFFICER', 'CUSTOMER_SERVICE'))

analyticsRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const renewalHorizon = new Date()
    renewalHorizon.setDate(renewalHorizon.getDate() + 45)

    const profileSelect = {
      id: true,
      customerCode: true,
      firstName: true,
      lastName: true,
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
          averageClaimValue: true,
          medicalClaimCount: true,
          healthcareVisitCount: true,
          pharmacyTransactionCount: true,
          digitalInteractionCount: true,
          paymentStanding: true,
          nextRenewalDate: true,
        },
      },
      segments: { select: { kind: true, label: true } },
      insights: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { title: true, detail: true, severity: true },
      },
      recommendations: {
        where: { status: 'OPEN' as const },
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { title: true, action: true },
      },
    }

    const [
      customers,
      activePolicies,
      claimsToday,
      requiresReview,
      engagement,
      signals,
      missingDocuments,
      upcomingRenewals,
      warningInsights,
      positiveInsights,
      segmentRows,
      locationRows,
      paymentRows,
      watchedProfiles,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.insurancePolicy.count({ where: { status: 'ACTIVE' } }),
      prisma.claim.count({ where: { submittedAt: { gte: startOfDay } } }),
      prisma.claim.count({ where: { reviewSignal: { in: ['REVIEW_REQUIRED', 'HIGH_PRIORITY'] }, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED'] } } }),
      prisma.customerSegment.groupBy({ by: ['label'], where: { kind: 'ENGAGEMENT' }, _count: { _all: true } }),
      prisma.claim.groupBy({ by: ['reviewSignal'], _count: { _all: true } }),
      prisma.claimDocument.count({ where: { status: 'MISSING' } }),
      prisma.insurancePolicy.count({ where: { status: 'ACTIVE', renewalDate: { lte: renewalHorizon, gte: startOfDay } } }),
      prisma.customerInsight.findMany({
        where: { severity: 'WARNING' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { customer: { select: { id: true, firstName: true, lastName: true, customerCode: true } } },
      }),
      prisma.customerInsight.findMany({
        where: { severity: 'POSITIVE' },
        orderBy: { createdAt: 'desc' },
        take: 2,
        include: { customer: { select: { id: true, firstName: true, lastName: true, customerCode: true } } },
      }),
      prisma.customerSegment.groupBy({ by: ['kind', 'label'], _count: { _all: true } }),
      prisma.customer.groupBy({
        by: ['location'],
        _count: { _all: true },
        orderBy: { _count: { location: 'desc' } },
        take: 6,
      }),
      prisma.customerProfile.groupBy({ by: ['paymentStanding'], _count: { _all: true } }),
      prisma.customer.findMany({
        where: { insights: { some: { severity: 'WARNING' } }, profile: { isNot: null } },
        orderBy: { lastInteractionAt: 'desc' },
        take: 8,
        select: profileSelect,
      }),
    ])

    const recentProfiles = await prisma.customer.findMany({
      where: {
        profile: { isNot: null },
        id: { notIn: watchedProfiles.map((customer) => customer.id) },
      },
      orderBy: { lastInteractionAt: 'desc' },
      take: 6,
      select: profileSelect,
    })

    const engagementTotal = engagement.reduce((sum, row) => sum + row._count._all, 0) || 1
    const engagementMap = Object.fromEntries(engagement.map((row) => [row.label, row._count._all]))
    const signalMap = Object.fromEntries(signals.map((row) => [row.reviewSignal, row._count._all]))

    res.json({
      data: serialize({
        customers,
        activePolicies,
        claimsToday,
        requiresReview,
        engagement: {
          highlyEngaged: engagementMap['Highly Engaged'] ?? 0,
          active: engagementMap['Active Customer'] ?? 0,
          lowEngagement: engagementMap['Low Digital Engagement'] ?? 0,
          newCustomer: engagementMap['New Customer'] ?? 0,
          total: engagementTotal,
        },
        claimIntelligence: {
          normal: signalMap.NORMAL ?? 0,
          reviewRequired: signalMap.REVIEW_REQUIRED ?? 0,
          highPriority: signalMap.HIGH_PRIORITY ?? 0,
        },
        alerts: {
          claimsRequiringReview: requiresReview,
          upcomingRenewals,
          missingClaimDocuments: missingDocuments,
        },
        insights: [...warningInsights, ...positiveInsights],
        profiles: [...watchedProfiles, ...recentProfiles],
        segments: segmentRows.map((row) => ({ kind: row.kind, label: row.label, count: row._count._all })),
        locations: locationRows.map((row) => ({ label: row.location, count: row._count._all })),
        payment: {
          current: paymentRows.find((row) => row.paymentStanding === 'CURRENT')?._count._all ?? 0,
          overdue: paymentRows.find((row) => row.paymentStanding === 'OVERDUE')?._count._all ?? 0,
        },
      }),
    })
  }),
)
