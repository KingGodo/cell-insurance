export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function when(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function riskTerm(band: string) {
  if (band === "LEAVING") return "High risk";
  if (band === "WATCH") return "Medium risk";
  return "Low risk";
}

export function valueTerm(band: string) {
  if (band === "HIGH") return "High value";
  if (band === "CORE") return "Medium value";
  if (band === "LOWER") return "Low value";
  return band;
}

export function labelize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function roleLabel(role: string) {
  if (role === "CUSTOMER") return "Customer";
  return "Admin";
}

export function roleDetail(role: string) {
  if (role === "CUSTOMER") return "Own record only";
  return "Risk, value, and retentions";
}
