function isDecimal(value: object): value is { toNumber: () => number } {
  return 'toNumber' in value && typeof value.toNumber === 'function'
}

export function serialize(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && isDecimal(value)) return value.toNumber()
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      output[key] = serialize(entry)
    }
    return output
  }
  return value
}
