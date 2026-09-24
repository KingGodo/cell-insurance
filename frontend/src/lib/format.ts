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

export function labelize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function roleLabel(role: string) {
  if (role === "CLAIMS_OFFICER") return "Claims officer";
  if (role === "CUSTOMER_SERVICE") return "Customer service";
  if (role === "ADMIN") return "Admin";
  return "Customer";
}

export function roleDetail(role: string) {
  if (role === "CLAIMS_OFFICER") return "Claims desk";
  if (role === "CUSTOMER_SERVICE") return "Service desk";
  if (role === "ADMIN") return "Full access";
  return "Own record only";
}
