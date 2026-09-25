import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { scoreBook } from '../intelligence/score'

const rowSchema = z.object({
  customerCode: z.string().trim().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  location: z.string().trim().min(1),
  customerSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  engagement: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  preferredChannel: z.enum(['DIGITAL', 'WHATSAPP', 'CALL_CENTRE', 'BRANCH']).default('DIGITAL'),
})

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const input = text.replace(/^\uFEFF/, '')

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (char === '\n') {
      row.push(cell.trim())
      rows.push(row)
      row = []
      cell = ''
    } else if (char !== '\r') {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim())
    rows.push(row)
  }

  return rows.filter((line) => line.some((value) => value.length > 0))
}

function day(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`)
}

export async function receiveCustomerCsv(csv: string) {
  const table = parseCsv(csv)
  if (table.length < 2) {
    return { received: 0, created: 0, updated: 0, errors: ['The file needs a header row and at least one customer.'] }
  }

  const [header, ...lines] = table
  const keys = header.map((name) => name.trim())
  const errors: string[] = []
  let created = 0
  let updated = 0
  const limited = lines.slice(0, 100)

  for (const [index, line] of limited.entries()) {
    const record = Object.fromEntries(keys.map((key, column) => [key, line[column] ?? '']))
    const parsed = rowSchema.safeParse({
      ...record,
      engagement: record.engagement ? record.engagement.toUpperCase() : undefined,
      preferredChannel: record.preferredChannel ? record.preferredChannel.toUpperCase() : undefined,
    })
    if (!parsed.success) {
      errors.push(`Row ${index + 2} is missing a required column or uses a value the book does not accept.`)
      continue
    }

    const data = parsed.data
    const existing = await prisma.customer.findUnique({ where: { customerCode: data.customerCode } })
    const emailOwner = await prisma.customer.findUnique({ where: { email: data.email } })
    if (emailOwner && emailOwner.customerCode !== data.customerCode) {
      errors.push(`Row ${index + 2} uses an email already on another customer.`)
      continue
    }

    const fields = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: day(data.dateOfBirth),
      location: data.location,
      customerSince: day(data.customerSince),
      engagement: data.engagement,
      preferredChannel: data.preferredChannel,
    }

    if (existing) {
      await prisma.customer.update({ where: { id: existing.id }, data: fields })
      updated += 1
    } else {
      const customer = await prisma.customer.create({
        data: { customerCode: data.customerCode, ...fields },
      })
      await prisma.customerProfile.create({
        data: {
          customerId: customer.id,
          productsHeld: [],
          policyCount: 0,
          claimCount: 0,
          claimFrequency: 0,
          averageClaimValue: 0,
          medicalClaimCount: 0,
          healthcareVisitCount: 0,
          pharmacyTransactionCount: 0,
          digitalInteractionCount: 0,
          supportInteractionCount: 0,
          paymentStanding: 'CURRENT',
        },
      })
      created += 1
    }
  }

  if (created + updated > 0) await scoreBook()
  if (lines.length > limited.length) errors.push('Only the first 100 customers in the file were received.')

  return { received: limited.length, created, updated, errors }
}
