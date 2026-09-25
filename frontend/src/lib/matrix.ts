export const VALUE_LINE = 70;
export const RISK_LINE = 55;

export type MatrixSlug = "vvip" | "growable" | "ghost" | "save-me-now";

export type MatrixSegment = {
  slug: MatrixSlug;
  name: string;
  meaning: string;
  surface: string;
  figure: string;
  ink: string;
  button: string;
};

export const matrixSegments: MatrixSegment[] = [
  {
    slug: "ghost",
    name: "Ghost",
    meaning: "Value is under 70 and risk is 55 or more. The premium is thin, and they are already on the way out.",
    surface: "bg-[#d97706] text-white",
    figure: "text-white",
    ink: "text-white/90",
    button: "bg-white text-[#92400e]",
  },
  {
    slug: "save-me-now",
    name: "Save me now",
    meaning: "Value is 70 or more and risk is 55 or more. The relationship is worth a lot, and it leaves unless someone acts.",
    surface: "bg-[#e11d48] text-white",
    figure: "text-white",
    ink: "text-white/90",
    button: "bg-white text-[#9f1239]",
  },
  {
    slug: "growable",
    name: "Growable",
    meaning: "Value is under 70 and risk is under 55. They are still here, with room for another line or a larger premium.",
    surface: "bg-[#4f46e5] text-white",
    figure: "text-white",
    ink: "text-white/90",
    button: "bg-white text-[#312e81]",
  },
  {
    slug: "vvip",
    name: "VVIP",
    meaning: "Value is 70 or more and risk is under 55. They hold the premium, and they are not leaving.",
    surface: "bg-[#0f766e] text-white",
    figure: "text-white",
    ink: "text-white/90",
    button: "bg-white text-[#115e59]",
  },
];

export function matrixSlug(value: number, risk: number): MatrixSlug {
  const highValue = value >= VALUE_LINE;
  const highRisk = risk >= RISK_LINE;
  if (highValue && highRisk) return "save-me-now";
  if (highValue) return "vvip";
  if (highRisk) return "ghost";
  return "growable";
}

export function matrixBySlug(slug: string) {
  return matrixSegments.find((segment) => segment.slug === slug) ?? null;
}
