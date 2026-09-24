import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, type Channel, type EngagementLevel, type Prisma } from '@prisma/client'
import { scoreClaim } from '../src/modules/claims/claims.service'
import { prisma as appPrisma } from '../src/lib/prisma'

const prisma = new PrismaClient()
const DEMO_PASSWORD = 'CustomerIQ123'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const at = (iso: string) => new Date(iso)

const people: Array<[string, string]> = [
  ['Tariro', 'Ncube'],
  ['Farai', 'Dube'],
  ['Chipo', 'Mutasa'],
  ['Tendai', 'Sibanda'],
  ['Rudo', 'Chikwanda'],
  ['Blessing', 'Ndlovu'],
  ['Tatenda', 'Mpofu'],
  ['Nyasha', 'Gumbo'],
  ['Simbarashe', 'Zhou'],
  ['Patience', 'Mlambo'],
  ['Tinashe', 'Banda'],
  ['Rufaro', 'Khumalo'],
  ['Anesu', 'Marufu'],
  ['Kudzai', 'Mapfumo'],
  ['Lorraine', 'Sithole'],
  ['Brian', 'Chiweshe'],
  ['Melissa', 'Nkomo'],
  ['Peter', 'Zulu'],
  ['Grace', 'Moyo'],
  ['David', 'Chirwa'],
  ['Sarah', 'Bhebhe'],
  ['Michael', 'Ncube'],
  ['Linda', 'Shumba'],
  ['Joseph', 'Phiri'],
  ['Emma', 'Takawira'],
  ['Chrispen', 'Moyo'],
  ['Patricia', 'Dube'],
  ['Allan', 'Sibanda'],
  ['Heather', 'Choto'],
]

const engagements: EngagementLevel[] = [
  'HIGH', 'HIGH', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'MEDIUM',
  'HIGH', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'HIGH',
  'MEDIUM', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'MEDIUM',
]

const locations = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 'Kwekwe', 'Chitungwiza']
const plans = ['Essential', 'Standard', 'Premium']
const visitTypes = ['General consultation', 'Follow-up', 'Dental check', 'Optical screening']

function channelFor(index: number): Channel {
  const options: Channel[] = ['DIGITAL', 'DIGITAL', 'WHATSAPP', 'CALL_CENTRE', 'BRANCH']
  return options[index % options.length]
}

function channelLabel(channel: Channel) {
  if (channel === 'DIGITAL') return 'Digital First'
  if (channel === 'WHATSAPP') return 'WhatsApp First'
  if (channel === 'CALL_CENTRE') return 'Call Centre First'
  return 'Branch First'
}

function engagementLabel(since: Date, engagement: EngagementLevel) {
  if (since >= day('2026-04-01')) return 'New Customer'
  if (engagement === 'HIGH') return 'Highly Engaged'
  if (engagement === 'LOW') return 'Low Digital Engagement'
  return 'Active Customer'
}

function productLabel(hasInsurance: boolean, hasMedical: boolean, hasCare: boolean) {
  if (hasInsurance && hasMedical && hasCare) return 'Multi-Service Customer'
  if (hasInsurance && hasMedical) return 'Insurance + Medical'
  if (hasInsurance) return 'Insurance Only'
  return 'Medical Only'
}

async function reset() {
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.aiPrediction.deleteMany()
  await prisma.aiFeature.deleteMany()
  await prisma.claimDocument.deleteMany()
  await prisma.claimEvent.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.pharmacyTransaction.deleteMany()
  await prisma.healthcareVisit.deleteMany()
  await prisma.customerInteraction.deleteMany()
  await prisma.customerEvent.deleteMany()
  await prisma.customerSegment.deleteMany()
  await prisma.customerInsight.deleteMany()
  await prisma.customerRecommendation.deleteMany()
  await prisma.dependant.deleteMany()
  await prisma.medicalMembership.deleteMany()
  await prisma.insurancePolicy.deleteMany()
  await prisma.customerProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.provider.deleteMany()
}

async function main() {
  await reset()
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const clinic = await prisma.provider.create({
    data: { name: 'Nectacare Avondale', type: 'CLINIC', location: 'Harare', averageClaimValue: 180 },
  })
  const hospital = await prisma.provider.create({
    data: { name: 'CellMed Avenues', type: 'HOSPITAL', location: 'Harare', averageClaimValue: 470 },
  })
  const pharmacy = await prisma.provider.create({
    data: { name: 'Greenwood Pharmacy', type: 'PHARMACY', location: 'Bulawayo', averageClaimValue: 35 },
  })
  const garage = await prisma.provider.create({
    data: { name: 'Westend Panel & Paint', type: 'GARAGE', location: 'Harare', averageClaimValue: 620 },
  })
  const mutareClinic = await prisma.provider.create({
    data: { name: 'Mutare Community Clinic', type: 'CLINIC', location: 'Mutare', averageClaimValue: 95 },
  })

  const providers = [clinic, hospital, pharmacy, garage, mutareClinic]
  let policySeq = 110200
  let memberSeq = 441000
  let claimSeq = 25000

  const john = await prisma.customer.create({
    data: {
      customerCode: 'CUS-00182',
      firstName: 'John',
      lastName: 'Moyo',
      email: 'john.moyo@cellgroup.demo',
      phone: '+263 77 412 8901',
      dateOfBirth: day('1988-04-16'),
      location: 'Harare',
      customerSince: day('2022-03-14'),
      engagement: 'HIGH',
      preferredChannel: 'DIGITAL',
      lastInteractionAt: at('2026-09-22T14:10:00+02:00'),
    },
  })

  const motor = await prisma.insurancePolicy.create({
    data: {
      customerId: john.id,
      policyNumber: 'POL-104582',
      productName: 'Motor Comprehensive',
      status: 'ACTIVE',
      premium: 86.5,
      coverAmount: 18000,
      startDate: day('2026-01-12'),
      renewalDate: day('2026-10-15'),
    },
  })
  await prisma.insurancePolicy.create({
    data: {
      customerId: john.id,
      policyNumber: 'POL-098811',
      productName: 'Personal Accident',
      status: 'ACTIVE',
      premium: 18,
      coverAmount: 10000,
      startDate: day('2025-01-12'),
      renewalDate: day('2027-01-12'),
    },
  })

  const membership = await prisma.medicalMembership.create({
    data: {
      customerId: john.id,
      memberNumber: 'MED-441902',
      planName: 'Premium',
      status: 'ACTIVE',
      monthlyContribution: 120,
      startDate: day('2022-06-01'),
    },
  })

  await prisma.dependant.createMany({
    data: [
      { customerId: john.id, membershipId: membership.id, firstName: 'Rudo', lastName: 'Moyo', relationship: 'Spouse', dateOfBirth: day('1990-11-02') },
      { customerId: john.id, membershipId: membership.id, firstName: 'Tanaka', lastName: 'Moyo', relationship: 'Child', dateOfBirth: day('2016-02-19') },
      { customerId: john.id, membershipId: membership.id, firstName: 'Anashe', lastName: 'Moyo', relationship: 'Child', dateOfBirth: day('2019-07-08') },
    ],
  })

  const johnClaims: Prisma.ClaimCreateManyInput[] = [
    { customerId: john.id, policyId: motor.id, providerId: garage.id, claimNumber: 'CLM-24003', type: 'INSURANCE', status: 'PAID', amount: 150, description: 'Roadside towing after a breakdown', incidentDate: day('2023-06-18'), submittedAt: at('2023-06-18T09:00:00Z') },
    { customerId: john.id, policyId: motor.id, providerId: garage.id, claimNumber: 'CLM-24011', type: 'INSURANCE', status: 'PAID', amount: 540, description: 'Bumper repair after a parking incident', incidentDate: day('2024-11-02'), submittedAt: at('2024-11-02T10:20:00Z') },
    { customerId: john.id, policyId: motor.id, providerId: garage.id, claimNumber: 'CLM-24018', type: 'INSURANCE', status: 'PAID', amount: 320, description: 'Windscreen replacement', incidentDate: day('2026-02-03'), submittedAt: at('2026-02-03T08:40:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: clinic.id, claimNumber: 'CLM-24031', type: 'MEDICAL', status: 'PAID', amount: 95, description: 'GP consultation', incidentDate: day('2025-04-12'), submittedAt: at('2025-04-12T11:00:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: clinic.id, claimNumber: 'CLM-24044', type: 'MEDICAL', status: 'PAID', amount: 140, description: 'Dental check for a dependant', incidentDate: day('2025-08-01'), submittedAt: at('2025-08-01T09:30:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: hospital.id, claimNumber: 'CLM-24051', type: 'MEDICAL', status: 'PAID', amount: 260, description: 'Outpatient laboratory tests', incidentDate: day('2026-01-15'), submittedAt: at('2026-01-15T13:00:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: clinic.id, claimNumber: 'CLM-24060', type: 'MEDICAL', status: 'PAID', amount: 180, description: 'Follow-up consultation', incidentDate: day('2026-03-20'), submittedAt: at('2026-03-20T10:00:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: hospital.id, claimNumber: 'CLM-24072', type: 'MEDICAL', status: 'PAID', amount: 410, description: 'Specialist consultation', incidentDate: day('2026-06-02'), submittedAt: at('2026-06-02T08:15:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: hospital.id, claimNumber: 'CLM-24088', type: 'MEDICAL', status: 'PAID', amount: 210, description: 'Similar specialist visit', incidentDate: day('2026-09-11'), submittedAt: at('2026-09-11T09:45:00Z') },
    { customerId: john.id, membershipId: membership.id, providerId: hospital.id, claimNumber: 'CLM-10924', type: 'MEDICAL', status: 'DOCUMENTS_REQUIRED', amount: 1850, description: 'Specialist procedure at CellMed Avenues', incidentDate: day('2026-09-24'), submittedAt: at('2026-09-24T09:05:00+02:00') },
  ]
  await prisma.claim.createMany({ data: johnClaims })

  const reviewClaim = await prisma.claim.findUniqueOrThrow({ where: { claimNumber: 'CLM-10924' } })
  await prisma.claimDocument.createMany({
    data: [
      { claimId: reviewClaim.id, fileName: 'referral-letter.pdf', documentType: 'Referral letter', status: 'RECEIVED', uploadedAt: at('2026-09-24T09:06:00+02:00') },
      { claimId: reviewClaim.id, fileName: 'specialist-report.pdf', documentType: 'Specialist report', status: 'MISSING' },
    ],
  })
  await prisma.claimEvent.createMany({
    data: [
      { claimId: reviewClaim.id, title: 'Claim submitted', description: 'John Moyo submitted a medical claim.', occurredAt: at('2026-09-24T09:05:00+02:00') },
      { claimId: reviewClaim.id, title: 'Review recommended', description: '3 relevant anomaly signals detected.', occurredAt: at('2026-09-24T09:06:00+02:00') },
      { claimId: reviewClaim.id, title: 'Additional documentation requested', description: 'Specialist report is still outstanding.', occurredAt: at('2026-09-24T11:20:00+02:00') },
    ],
  })

  const windscreen = await prisma.claim.findUniqueOrThrow({ where: { claimNumber: 'CLM-24018' } })
  await prisma.claimEvent.createMany({
    data: [
      { claimId: windscreen.id, title: 'Claim submitted', description: 'Windscreen claim submitted.', occurredAt: at('2026-02-03T08:40:00Z') },
      { claimId: windscreen.id, title: 'Claim processed', description: 'Claim approved and paid.', occurredAt: at('2026-02-07T15:00:00Z') },
    ],
  })

  await prisma.healthcareVisit.createMany({
    data: [
      { customerId: john.id, providerId: clinic.id, facilityName: 'Nectacare Avondale', visitType: 'General consultation', visitedAt: at('2026-03-18T10:30:00Z') },
      { customerId: john.id, providerId: hospital.id, facilityName: 'CellMed Avenues', visitType: 'Specialist consultation', visitedAt: at('2026-09-11T09:45:00Z') },
    ],
  })
  await prisma.pharmacyTransaction.create({
    data: {
      customerId: john.id,
      pharmacyName: 'Avondale Pharmacy',
      description: 'Prescribed antibiotics',
      amount: 18.5,
      transactedAt: at('2026-04-02T16:10:00Z'),
    },
  })
  await prisma.customerInteraction.createMany({
    data: [
      { customerId: john.id, channel: 'CALL_CENTRE', subject: 'Policy wording', summary: 'Asked how the motor excess applies after a windscreen claim.', occurredAt: at('2026-05-10T11:05:00Z') },
      { customerId: john.id, channel: 'DIGITAL', subject: 'Signed in', summary: 'Logged into CustomerIQ.', occurredAt: at('2026-08-21T19:12:00Z') },
      { customerId: john.id, channel: 'DIGITAL', subject: 'Claim status', summary: 'Checked the status of a medical claim.', occurredAt: at('2026-09-22T14:10:00+02:00') },
    ],
  })
  await prisma.customerEvent.createMany({
    data: [
      { customerId: john.id, title: 'Purchased motor insurance', category: 'POLICY', occurredAt: at('2026-01-12T09:00:00Z') },
      { customerId: john.id, title: 'Submitted insurance claim', category: 'CLAIM', occurredAt: at('2026-02-03T08:40:00Z') },
      { customerId: john.id, title: 'Claim processed', category: 'CLAIM', occurredAt: at('2026-02-07T15:00:00Z') },
      { customerId: john.id, title: 'Healthcare visit', category: 'CARE', occurredAt: at('2026-03-18T10:30:00Z') },
      { customerId: john.id, title: 'Pharmacy interaction', category: 'CARE', occurredAt: at('2026-04-02T16:10:00Z') },
      { customerId: john.id, title: 'Contacted customer support', category: 'SUPPORT', occurredAt: at('2026-05-10T11:05:00Z') },
      { customerId: john.id, title: 'Logged into CustomerIQ', category: 'DIGITAL', occurredAt: at('2026-08-21T19:12:00Z') },
      { customerId: john.id, title: 'Submitted medical claim', category: 'CLAIM', occurredAt: at('2026-09-24T09:05:00+02:00') },
    ],
  })
  await prisma.customerSegment.createMany({
    data: [
      { customerId: john.id, kind: 'PRODUCT', label: 'Multi-Service Customer' },
      { customerId: john.id, kind: 'ENGAGEMENT', label: 'Highly Engaged' },
      { customerId: john.id, kind: 'CHANNEL', label: 'Digital First' },
    ],
  })
  await prisma.customerInsight.createMany({
    data: [
      { customerId: john.id, title: 'Motor policy renewal approaching', detail: 'Motor Comprehensive renews on 15 Oct 2026.', severity: 'WARNING' },
      { customerId: john.id, title: 'Medical claim under review', detail: 'CLM-10924 has anomaly signals and a missing specialist report.', severity: 'WARNING' },
      { customerId: john.id, title: 'High digital engagement', detail: 'John regularly uses the CustomerIQ portal.', severity: 'POSITIVE' },
    ],
  })
  await prisma.customerRecommendation.create({
    data: {
      customerId: john.id,
      title: 'Send renewal notification',
      detail: 'Motor policy expires soon and the customer is digitally engaged.',
      action: 'Send a renewal notification for POL-104582.',
      status: 'OPEN',
    },
  })
  await prisma.customerProfile.create({
    data: {
      customerId: john.id,
      productsHeld: ['Motor Insurance', 'Medical Aid', 'Healthcare Services'],
      policyCount: 2,
      claimCount: 10,
      claimFrequency: 2.4,
      averageClaimValue: 415.5,
      medicalClaimCount: 7,
      healthcareVisitCount: 2,
      pharmacyTransactionCount: 1,
      digitalInteractionCount: 2,
      supportInteractionCount: 1,
      paymentStanding: 'CURRENT',
      nextRenewalDate: day('2026-10-15'),
    },
  })
  await prisma.aiFeature.create({
    data: {
      customerId: john.id,
      featureSet: {
        customerCode: 'CUS-00182',
        age: 38,
        location: 'Harare',
        customerSince: '2022-03-14',
        productsHeld: ['Motor Insurance', 'Medical Aid', 'Healthcare Services'],
        policyCount: 2,
        claimCount: 10,
        medicalClaims: 7,
        healthcareVisits: 2,
        pharmacyTransactions: 1,
        digitalInteractions: 2,
        supportInteractions: 1,
        paymentHistory: 'CURRENT',
        policyRenewalDate: '2026-10-15',
      },
    },
  })

  for (const [index, [firstName, lastName]] of people.entries()) {
    const hasInsurance = index % 4 !== 1
    const hasMedical = index % 4 !== 0
    const hasCare = index % 4 === 3 || hasMedical && index % 3 === 0
    const engagement = engagements[index]
    const channel = channelFor(index)
    const location = locations[index % locations.length]
    const since = [5, 14, 21].includes(index) ? day('2026-05-20') : day(`${2018 + (index % 7)}-0${(index % 8) + 1}-15`)
    const customer = await prisma.customer.create({
      data: {
        customerCode: `CUS-${String(10100 + index)}`,
        firstName,
        lastName,
        email: `${firstName}.${lastName}@cellgroup.demo`.toLowerCase(),
        phone: `+263 77 ${String(200 + index).padStart(3, '0')} ${String(1000 + index * 17).slice(0, 4)}`,
        dateOfBirth: day(`${1974 + (index % 24)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`),
        location,
        customerSince: since,
        engagement,
        preferredChannel: channel,
        lastInteractionAt: at(`2026-09-${String((index % 22) + 1).padStart(2, '0')}T10:00:00Z`),
      },
    })

    const products: string[] = []
    let nextRenewal: Date | null = null
    let policyId: string | undefined
    let membershipId: string | undefined

    if (hasInsurance) {
      products.push('Motor Insurance')
      policySeq += 1
      const renewal = index % 5 === 0 ? day('2026-10-20') : day('2027-03-01')
      nextRenewal = renewal
      const policy = await prisma.insurancePolicy.create({
        data: {
          customerId: customer.id,
          policyNumber: `POL-${policySeq}`,
          productName: index % 2 === 0 ? 'Motor Comprehensive' : 'Household Cover',
          status: 'ACTIVE',
          premium: 40 + (index % 9) * 12,
          coverAmount: 8000 + index * 500,
          startDate: day('2025-03-01'),
          renewalDate: renewal,
        },
      })
      policyId = policy.id
    }

    if (hasMedical) {
      products.push('Medical Aid')
      memberSeq += 1
      const createdMembership = await prisma.medicalMembership.create({
        data: {
          customerId: customer.id,
          memberNumber: `MED-${memberSeq}`,
          planName: plans[index % plans.length],
          status: 'ACTIVE',
          monthlyContribution: 45 + (index % 5) * 25,
          startDate: day('2024-02-01'),
        },
      })
      membershipId = createdMembership.id
      if (index % 2 === 0) {
        await prisma.dependant.create({
          data: {
            customerId: customer.id,
            membershipId: createdMembership.id,
            firstName: 'Tadiwa',
            lastName,
            relationship: 'Child',
            dateOfBirth: day('2018-05-12'),
          },
        })
      }
    }

    if (hasCare) products.push('Healthcare Services')

    const claimAmounts: number[] = []
    const claimRows = index % 4 === 0 ? 2 : index % 4 === 3 ? 3 : 1
    for (let n = 0; n < claimRows; n += 1) {
      claimSeq += 1
      const medical = hasMedical && (n > 0 || !hasInsurance)
      const large = index % 6 === 0 && n === 0
      const today = index % 4 === 0 && n === 0
      const amount = large ? 1600 + index * 20 : 60 + ((index * 17 + n * 40) % 280)
      claimAmounts.push(amount)
      const provider = medical ? (location === 'Mutare' ? mutareClinic : hospital) : garage
      const incident = today ? '2026-09-24' : `2026-${String(((index + n) % 8) + 1).padStart(2, '0')}-14`
      await prisma.claim.create({
        data: {
          customerId: customer.id,
          policyId: medical ? undefined : policyId,
          membershipId: medical ? membershipId : undefined,
          providerId: provider.id,
          claimNumber: `CLM-${claimSeq}`,
          type: medical ? 'MEDICAL' : 'INSURANCE',
          status: today ? 'UNDER_REVIEW' : 'PAID',
          amount,
          description: medical ? 'Outpatient treatment' : 'Accident repair',
          incidentDate: day(incident),
          submittedAt: today ? at('2026-09-24T08:15:00+02:00') : at(`${incident}T09:00:00Z`),
          documents: large
            ? { create: [{ fileName: 'invoice.pdf', documentType: 'Invoice', status: 'MISSING' }] }
            : { create: [{ fileName: 'invoice.pdf', documentType: 'Invoice', status: 'RECEIVED', uploadedAt: at('2026-09-01T09:00:00Z') }] },
        },
      })
    }

    if (hasCare) {
      await prisma.healthcareVisit.create({
        data: {
          customerId: customer.id,
          providerId: location === 'Mutare' ? mutareClinic.id : clinic.id,
          facilityName: location === 'Mutare' ? mutareClinic.name : clinic.name,
          visitType: visitTypes[index % visitTypes.length],
          visitedAt: at('2026-03-18T10:00:00Z'),
        },
      })
      await prisma.pharmacyTransaction.create({
        data: {
          customerId: customer.id,
          pharmacyName: location === 'Bulawayo' ? 'Greenwood Pharmacy' : 'Avondale Pharmacy',
          description: 'Repeat prescription',
          amount: 12 + (index % 6) * 4,
          transactedAt: at('2026-04-02T12:00:00Z'),
        },
      })
    }

    await prisma.customerInteraction.create({
      data: {
        customerId: customer.id,
        channel,
        subject: channel === 'WHATSAPP' ? 'WhatsApp enquiry' : 'Service enquiry',
        summary: 'Asked about cover and recent claims.',
        occurredAt: at(`2026-09-${String((index % 22) + 1).padStart(2, '0')}T10:00:00Z`),
      },
    })
    await prisma.customerEvent.createMany({
      data: [
        { customerId: customer.id, title: 'Profile opened by service team', category: 'SERVICE', occurredAt: at('2026-08-02T09:00:00Z') },
        { customerId: customer.id, title: 'Recent service interaction', category: 'SUPPORT', occurredAt: at(`2026-09-${String((index % 22) + 1).padStart(2, '0')}T10:00:00Z`) },
      ],
    })

    await prisma.customerSegment.createMany({
      data: [
        { customerId: customer.id, kind: 'PRODUCT', label: productLabel(hasInsurance, hasMedical, hasCare) },
        { customerId: customer.id, kind: 'ENGAGEMENT', label: engagementLabel(since, engagement) },
        { customerId: customer.id, kind: 'CHANNEL', label: channelLabel(channel) },
      ],
    })

    const insights: Prisma.CustomerInsightCreateManyInput[] = []
    if (nextRenewal && nextRenewal <= day('2026-11-15')) {
      insights.push({
        customerId: customer.id,
        title: 'Policy renewal approaching',
        detail: `${firstName}'s policy renews on 20 Oct 2026.`,
        severity: 'WARNING',
      })
      await prisma.customerRecommendation.create({
        data: {
          customerId: customer.id,
          title: 'Send renewal notification',
          detail: 'Renewal is inside the next 45 days.',
          action: 'Send a renewal reminder through the preferred channel.',
          status: 'OPEN',
        },
      })
    }
    if (engagement === 'HIGH') {
      insights.push({
        customerId: customer.id,
        title: 'High digital engagement',
        detail: `${firstName} responds well to digital service.`,
        severity: 'POSITIVE',
      })
    }
    if (engagement === 'LOW') {
      insights.push({
        customerId: customer.id,
        title: 'Low digital engagement',
        detail: `${firstName} has had little recent digital activity.`,
        severity: 'INFO',
      })
    }
    if (insights.length) await prisma.customerInsight.createMany({ data: insights })

    const average = claimAmounts.reduce((sum, value) => sum + value, 0) / claimAmounts.length
    await prisma.customerProfile.create({
      data: {
        customerId: customer.id,
        productsHeld: products,
        policyCount: hasInsurance ? 1 : 0,
        claimCount: claimAmounts.length,
        claimFrequency: Number((claimAmounts.length / 2).toFixed(2)),
        averageClaimValue: Number(average.toFixed(2)),
        medicalClaimCount: hasMedical ? Math.max(1, claimAmounts.length - (hasInsurance ? 1 : 0)) : 0,
        healthcareVisitCount: hasCare ? 1 : 0,
        pharmacyTransactionCount: hasCare ? 1 : 0,
        digitalInteractionCount: channel === 'DIGITAL' || channel === 'WHATSAPP' ? 3 + (index % 4) : 1,
        supportInteractionCount: channel === 'CALL_CENTRE' || channel === 'BRANCH' ? 2 : 1,
        paymentStanding: index % 11 === 0 ? 'OVERDUE' : 'CURRENT',
        nextRenewalDate: nextRenewal,
      },
    })
    await prisma.aiFeature.create({
      data: {
        customerId: customer.id,
        featureSet: {
          customerCode: customer.customerCode,
          location,
          productsHeld: products,
          claimCount: claimAmounts.length,
          engagement,
          channel,
        },
      },
    })
  }

  const claims = await prisma.claim.findMany({ select: { id: true } })
  for (const claim of claims) {
    await scoreClaim(claim.id)
  }

  const admin = await prisma.user.create({
    data: { email: 'admin@cellgroup.demo', name: 'Amina Chari', role: 'ADMIN', passwordHash },
  })
  const claimsOfficer = await prisma.user.create({
    data: { email: 'claims@cellgroup.demo', name: 'Tawanda Ncube', role: 'CLAIMS_OFFICER', passwordHash },
  })
  const service = await prisma.user.create({
    data: { email: 'service@cellgroup.demo', name: 'Rumbidzai Dube', role: 'CUSTOMER_SERVICE', passwordHash },
  })
  const johnUser = await prisma.user.create({
    data: {
      email: 'john.moyo@cellgroup.demo',
      name: 'John Moyo',
      role: 'CUSTOMER',
      passwordHash,
      customerId: john.id,
    },
  })
  const tariro = await prisma.customer.findUniqueOrThrow({ where: { email: 'tariro.ncube@cellgroup.demo' } })
  await prisma.user.create({
    data: {
      email: tariro.email,
      name: `${tariro.firstName} ${tariro.lastName}`,
      role: 'CUSTOMER',
      passwordHash,
      customerId: tariro.id,
    },
  })

  await prisma.notification.createMany({
    data: [
      {
        userId: johnUser.id,
        customerId: john.id,
        title: 'Additional documentation needed',
        body: 'Your claim CLM-10924 requires additional documentation.',
      },
      {
        userId: claimsOfficer.id,
        customerId: john.id,
        title: 'Claim recommended for review',
        body: 'CLM-10924 for John Moyo has anomaly signals and a missing specialist report.',
      },
      {
        userId: admin.id,
        customerId: john.id,
        title: 'High priority claim',
        body: 'CLM-10924 is waiting for a claims officer.',
      },
      {
        userId: service.id,
        customerId: john.id,
        title: 'Renewal coming up',
        body: 'John Moyo motor policy POL-104582 renews on 15 Oct 2026.',
      },
    ],
  })

  await prisma.auditLog.create({
    data: {
      actorId: claimsOfficer.id,
      action: 'CLAIM_REVIEW_OPENED',
      entity: 'claim',
      entityId: reviewClaim.id,
      metadata: { claimNumber: 'CLM-10924', customerCode: 'CUS-00182' },
    },
  })

  const [customers, claimCount, policies] = await Promise.all([
    prisma.customer.count(),
    prisma.claim.count(),
    prisma.insurancePolicy.count(),
  ])
  console.log(`Seeded ${customers} customers, ${policies} policies, ${claimCount} claims`)
  console.log('Demo password for every account: CustomerIQ123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await appPrisma.$disconnect()
  })
