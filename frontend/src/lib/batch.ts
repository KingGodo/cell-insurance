import { matrixSlug, type MatrixSlug } from "@/lib/matrix";

export type BatchOutcome = "converted" | "saved" | "recovered" | "losing" | "lost" | "slipped" | "held";

export type BatchCustomer = {
  id: string;
  name: string;
  code: string;
  location: string;
  from: MatrixSlug;
  to: MatrixSlug;
  priorValue: number;
  priorRisk: number;
  value: number;
  risk: number;
  outcome: BatchOutcome;
};

const priorPoint: Record<MatrixSlug, (n: number) => { value: number; risk: number }> = {
  vvip: (n) => ({ value: 74 + (n % 22), risk: 6 + (n % 36) }),
  growable: (n) => ({ value: 42 + (n % 24), risk: 8 + (n % 34) }),
  ghost: (n) => ({ value: 30 + (n % 32), risk: 62 + (n % 30) }),
  "save-me-now": (n) => ({ value: 74 + (n % 20), risk: 61 + (n % 28) }),
};

function hashCode(code: string) {
  let n = 0;
  for (const char of code) n = (n + char.charCodeAt(0) * 17) % 997;
  return n;
}

export function priorSegment(code: string, current: MatrixSlug): MatrixSlug {
  const n = hashCode(code);
  const roll = n % 3;
  if (roll === 2) return current;
  if (roll === 0) {
    if (current === "vvip") return n % 2 === 0 ? "growable" : "save-me-now";
    if (current === "growable") return "ghost";
    return current;
  }
  if (current === "ghost") return n % 2 === 0 ? "growable" : "save-me-now";
  if (current === "save-me-now") return "vvip";
  if (current === "growable") return "vvip";
  return current;
}

export function batchOutcome(from: MatrixSlug, to: MatrixSlug): BatchOutcome {
  if (from === to) return "held";
  if (to === "vvip" && from === "save-me-now") return "saved";
  if (to === "vvip") return "converted";
  if (to === "growable" && from === "ghost") return "recovered";
  if (to === "ghost") return "lost";
  if (to === "save-me-now") return "losing";
  return "slipped";
}

export function buildBatch(
  people: Array<{ id: string; customerCode: string; firstName: string; lastName: string; location: string; profile: { valueScore: number; riskScore: number } | null }>,
): BatchCustomer[] {
  return people.flatMap((person) => {
    if (!person.profile) return [];
    const value = person.profile.valueScore;
    const risk = person.profile.riskScore;
    const to = matrixSlug(value, risk);
    const from = priorSegment(person.customerCode, to);
    const n = hashCode(person.customerCode);
    const prior = from === to ? { value, risk } : priorPoint[from](n);
    return [{
      id: person.id,
      name: `${person.firstName} ${person.lastName}`,
      code: person.customerCode,
      location: person.location,
      from,
      to,
      priorValue: prior.value,
      priorRisk: prior.risk,
      value,
      risk,
      outcome: batchOutcome(from, to),
    }];
  });
}

export function countSegments(rows: BatchCustomer[], key: "from" | "to") {
  return {
    vvip: rows.filter((row) => row[key] === "vvip").length,
    growable: rows.filter((row) => row[key] === "growable").length,
    ghost: rows.filter((row) => row[key] === "ghost").length,
    "save-me-now": rows.filter((row) => row[key] === "save-me-now").length,
  } satisfies Record<MatrixSlug, number>;
}
