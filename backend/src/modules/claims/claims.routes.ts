import { ClaimStatus, ClaimType, DocumentStatus, Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { ApiError, asyncHandler, notFound, validateBody, validateQuery } from '../../lib/http'
import { prisma } from '../../lib/prisma'
import { serialize } from '../../lib/serialize'
import { assertCustomerAccess, requireAuth, requireRoles } from '../../middleware/auth'
import { scoreClaim } from './claims.service'

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(ClaimStatus).optional(),
  signal: z.enum(['NORMAL', 'REVIEW_REQUIRED', 'HIGH_PRIORITY']).optional(),
  customerId: z.string().uuid().optional(),
  type: z.nativeEnum(ClaimType).optional(),
})

const createSchema = z.object({
  customerId: z.string().uuid(),
  type: z.nativeEnum(ClaimType),
  policyId: z.string().uuid().optional(),
  membershipId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  amount: z.number().positive(),
  description: z.string().min(3).max(2000),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  documents: z
    .array(
      z.object({
        fileName: z.string().min(1).max(255),
        documentType: z.string().min(1).max(120),
        status: z.nativeEnum(DocumentStatus).default('RECEIVED'),
      }),
    )
    .optional(),
})

const updateSchema = z.object({
  status: z.nativeEnum(ClaimStatus),
  note: z.string().max(1000).optional(),
})

const documentSchema = z.object({
  fileName: z.string().min(1).max(255),
  documentType: z.string().min(1).max(120),
})

const claimInclude = {
  customer: { select: { id: true, customerCode: true, firstName: true, lastName: true, email: true } },
  provider: true,
  policy: true,
  membership: true,
  documents: true,
  events: { orderBy: { occurredAt: 'desc' as const } },
  prediction: true,
} satisfies Prisma.ClaimInclude

export const claimsRouter = Router()
claimsRouter.use(requireAuth)

claimsRouter.get(
  '/',
  validateQuery(listQuery),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof listQuery>
    const user = req.user!
    const where: Prisma.ClaimWhereInput = {}

    if (user.role === 'CUSTOMER') where.customerId = user.customerId ?? 'none'
    else if (query.customerId) where.customerId = query.customerId

    if (query.status) where.status = query.status
    if (query.signal) where.reviewSignal = query.signal
    if (query.type) where.type = query.type

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await prisma.$transaction([
      prisma.claim.count({ where }),
      prisma.claim.findMany({
        where,
        include: {
          customer: { select: { id: true, customerCode: true, firstName: true, lastName: true } },
          provider: true,
          prediction: true,
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
    ])

    res.json({
      data: serialize(rows),
      meta: { total, page: query.page, pageSize: query.pageSize },
    })
  }),
)

claimsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: claimInclude,
    })
    if (!claim) throw notFound('Claim')
    assertCustomerAccess(req.user!, claim.customerId)
    res.json({ data: serialize(claim) })
  }),
)

claimsRouter.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>
    const user = req.user!
    assertCustomerAccess(user, body.customerId)

    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      include: { user: true },
    })
    if (!customer) throw notFound('Customer')

    if (body.policyId) {
      const policy = await prisma.insurancePolicy.findFirst({
        where: { id: body.policyId, customerId: customer.id },
      })
      if (!policy) throw new ApiError(400, 'VALIDATION_ERROR', 'Policy does not belong to this customer')
    }
    if (body.membershipId) {
      const membership = await prisma.medicalMembership.findFirst({
        where: { id: body.membershipId, customerId: customer.id },
      })
      if (!membership) throw new ApiError(400, 'VALIDATION_ERROR', 'Membership does not belong to this customer')
    }

    const count = await prisma.claim.count()
    const claimNumber = `CLM-${String(30000 + count + 1)}`
    const missingDocument = body.documents?.some((document) => document.status === 'MISSING') ?? false

    const created = await prisma.claim.create({
      data: {
        customerId: customer.id,
        policyId: body.policyId,
        membershipId: body.membershipId,
        providerId: body.providerId,
        claimNumber,
        type: body.type,
        status: 'SUBMITTED',
        amount: body.amount,
        description: body.description,
        incidentDate: new Date(`${body.incidentDate}T00:00:00.000Z`),
        submittedAt: new Date(),
        documents: {
          create: (body.documents ?? []).map((document) => ({
            fileName: document.fileName,
            documentType: document.documentType,
            status: document.status,
            uploadedAt: document.status === 'RECEIVED' ? new Date() : null,
          })),
        },
        events: {
          create: {
            title: 'Claim submitted',
            description: `${customer.firstName} ${customer.lastName} submitted a ${body.type.toLowerCase()} claim.`,
            occurredAt: new Date(),
          },
        },
      },
    })

    const { analysis } = await scoreClaim(created.id)
    const status: ClaimStatus = missingDocument
      ? 'DOCUMENTS_REQUIRED'
      : analysis.signal === 'NORMAL'
        ? 'SUBMITTED'
        : 'UNDER_REVIEW'

    const claim = await prisma.claim.update({
      where: { id: created.id },
      data: {
        status,
        events: {
          create: {
            title: analysis.signal === 'NORMAL' ? 'Analysis complete' : 'Review recommended',
            description: analysis.factors.join(' '),
            occurredAt: new Date(),
          },
        },
      },
      include: claimInclude,
    })

    if (analysis.signal !== 'NORMAL') {
      await prisma.customerInsight.create({
        data: {
          customerId: customer.id,
          title: analysis.signal === 'HIGH_PRIORITY' ? 'High priority claim' : 'Claim under review',
          detail: `${claim.claimNumber}: ${analysis.factors[0]}`,
          severity: 'WARNING',
        },
      })

      const officers = await prisma.user.findMany({
        where: { role: { in: ['CLAIMS_OFFICER', 'ADMIN'] } },
        select: { id: true },
      })
      await prisma.notification.createMany({
        data: officers.map((officer) => ({
          userId: officer.id,
          customerId: customer.id,
          title: 'Claim recommended for review',
          body: `${claim.claimNumber} for ${customer.firstName} ${customer.lastName} has ${analysis.factors.length} signal${analysis.factors.length === 1 ? '' : 's'}.`,
        })),
      })
    }

    if (missingDocument && customer.user) {
      await prisma.notification.create({
        data: {
          userId: customer.user.id,
          customerId: customer.id,
          title: 'Additional documentation needed',
          body: `Your claim ${claim.claimNumber} requires additional documentation.`,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'CLAIM_CREATED',
        entity: 'claim',
        entityId: claim.id,
        metadata: { claimNumber: claim.claimNumber, signal: analysis.signal, score: analysis.score },
      },
    })

    res.status(201).json({ data: serialize(claim) })
  }),
)

claimsRouter.post(
  '/:id/documents',
  validateBody(documentSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof documentSchema>
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } })
    if (!claim) throw notFound('Claim')
    assertCustomerAccess(req.user!, claim.customerId)

    const document = await prisma.claimDocument.create({
      data: {
        claimId: claim.id,
        fileName: body.fileName,
        documentType: body.documentType,
        status: 'RECEIVED',
        uploadedAt: new Date(),
      },
    })

    const missing = await prisma.claimDocument.count({
      where: { claimId: claim.id, status: 'MISSING' },
    })

    await prisma.claimEvent.create({
      data: {
        claimId: claim.id,
        title: 'Document uploaded',
        description: `${body.documentType} received (${body.fileName}).`,
        occurredAt: new Date(),
      },
    })

    if (missing === 0 && claim.status === 'DOCUMENTS_REQUIRED') {
      await prisma.claim.update({
        where: { id: claim.id },
        data: { status: 'UNDER_REVIEW' },
      })
    }

    await scoreClaim(claim.id)
    const updated = await prisma.claim.findUnique({ where: { id: claim.id }, include: claimInclude })
    res.status(201).json({ data: serialize({ document, claim: updated }) })
  }),
)

claimsRouter.patch(
  '/:id',
  requireRoles('ADMIN', 'CLAIMS_OFFICER'),
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateSchema>
    const existing = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: { customer: { include: { user: true } } },
    })
    if (!existing) throw notFound('Claim')

    const claim = await prisma.claim.update({
      where: { id: existing.id },
      data: {
        status: body.status,
        events: {
          create: {
            title: `Status changed to ${body.status.replaceAll('_', ' ').toLowerCase()}`,
            description: body.note ?? `Updated by ${req.user!.name}.`,
            occurredAt: new Date(),
          },
        },
      },
      include: claimInclude,
    })

    if (body.status === 'DOCUMENTS_REQUIRED' && existing.customer.user) {
      await prisma.notification.create({
        data: {
          userId: existing.customer.user.id,
          customerId: existing.customerId,
          title: 'Additional documentation needed',
          body: body.note ?? `Your claim ${existing.claimNumber} requires additional documentation.`,
        },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: req.user!.id,
        action: 'CLAIM_STATUS_UPDATED',
        entity: 'claim',
        entityId: claim.id,
        metadata: { from: existing.status, to: body.status },
      },
    })

    res.json({ data: serialize(claim) })
  }),
)
