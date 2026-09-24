import type { Claim, ClaimDocument, Provider } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { notFound } from '../../lib/http'
import { analyseClaim, daysBetween, type ClaimAnalysis } from './analyse'

type ClaimWithContext = Claim & {
  documents: ClaimDocument[]
  provider: Provider | null
}

export async function scoreClaim(claimId: string): Promise<{ claim: ClaimWithContext; analysis: ClaimAnalysis }> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { documents: true, provider: true },
  })
  if (!claim) throw notFound('Claim')

  const yearAgo = new Date(claim.incidentDate)
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1)

  const [claimsInLast12Months, previous] = await Promise.all([
    prisma.claim.count({
      where: {
        customerId: claim.customerId,
        incidentDate: { gte: yearAgo, lte: claim.incidentDate },
      },
    }),
    prisma.claim.findFirst({
      where: {
        customerId: claim.customerId,
        type: claim.type,
        id: { not: claim.id },
        incidentDate: { lte: claim.incidentDate },
      },
      orderBy: { incidentDate: 'desc' },
    }),
  ])

  const analysis = analyseClaim({
    amount: Number(claim.amount),
    providerAverage: claim.provider ? Number(claim.provider.averageClaimValue) : null,
    daysSinceSimilarClaim: previous ? Math.abs(daysBetween(claim.incidentDate, previous.incidentDate)) : null,
    claimsInLast12Months,
    missingDocument: claim.documents.some((document) => document.status === 'MISSING'),
  })

  await prisma.$transaction([
    prisma.claim.update({
      where: { id: claim.id },
      data: {
        anomalyScore: analysis.score,
        reviewSignal: analysis.signal,
      },
    }),
    prisma.aiPrediction.upsert({
      where: { claimId: claim.id },
      update: {
        score: analysis.score,
        signal: analysis.signal,
        factors: analysis.factors,
        modelVersion: analysis.modelVersion,
      },
      create: {
        claimId: claim.id,
        score: analysis.score,
        signal: analysis.signal,
        factors: analysis.factors,
        modelVersion: analysis.modelVersion,
      },
    }),
  ])

  return { claim, analysis }
}
