import { ymd } from "@/utils/dates";

export type AcademicYear = {
  id: string;
  school: string;
  start: Date;
  end: Date;
  active: boolean;
};

export type Period = {
  id: string;
  yearId: string; // id de l'année scolaire
  cycle: string;
  number: number;
  label: string;
  type: string;
  start: Date;
  end: Date;
  locked: boolean;
};

// À remplacer par la liste venant de ton API
export const SCHOOL_NAMES = [
  "Collège des Almadies",
  "Lycée Excellence",
  "Collège Teranga",
  "Lycée Kajoor",
  "École Les Mouettes",
  "Groupe scolaire Bakel",
  "Collège Fouta",
];

export const CYCLES = ["Primaire", "Collège", "Lycée"];
/** Types de période : la valeur envoyée à l'API (type) et le libellé affiché */
export const PERIOD_TYPES = [
  { value: "bilan", label: "Bilan" },
  { value: "composition", label: "Composition" },
  { value: "trimestre", label: "Trimestre" },
  { value: "semestre", label: "Semestre" },
];

/** La valeur de la liste, sans tenir compte des majuscules (« TRIMESTRE » → « Trimestre ») */
export const periodTypeValue = (type: string) =>
  PERIOD_TYPES.find((t) => t.value.toLowerCase() === type.trim().toLowerCase())
    ?.value ?? type;

/** Libellé affiché ; une valeur inconnue est affichée telle quelle */
export const periodTypeLabel = (type: string) =>
  PERIOD_TYPES.find((t) => t.value === periodTypeValue(type))?.label ?? type;

export const INITIAL_YEARS: AcademicYear[] = [
  {
    id: "y1",
    school: "Collège des Almadies",
    start: ymd(2026, 9, 7),
    end: ymd(2027, 6, 25),
    active: true,
  },
  {
    id: "y2",
    school: "Lycée Excellence",
    start: ymd(2026, 9, 14),
    end: ymd(2027, 6, 25),
    active: true,
  },
  {
    id: "y3",
    school: "Collège Teranga",
    start: ymd(2026, 9, 7),
    end: ymd(2027, 6, 18),
    active: true,
  },
  {
    id: "y4",
    school: "Collège des Almadies",
    start: ymd(2025, 9, 8),
    end: ymd(2026, 6, 26),
    active: false,
  },
  {
    id: "y5",
    school: "Lycée Excellence",
    start: ymd(2025, 9, 15),
    end: ymd(2026, 6, 26),
    active: false,
  },
  {
    id: "y6",
    school: "Collège des Almadies",
    start: ymd(2024, 9, 9),
    end: ymd(2025, 6, 27),
    active: false,
  },
];

/** Libellé proposé : (1, TRIMESTRE) → « 1er trimestre » */
export const suggestLabel = (type: string, n: number) => {
  const word = type.toLowerCase();
  // « composition » est féminin : 1re composition ; les autres : 1er trimestre, 1er bilan…
  const first = word.startsWith("composition") ? "1re" : "1er";
  return `${n === 1 ? first : `${n}e`} ${word}`;
};

/** Statut calculé à partir de la date du jour */
export type PeriodStatus = "ongoing" | "upcoming" | "done";

export const periodStatus = (
  p: Pick<Period, "start" | "end">,
  now = new Date(),
): PeriodStatus => {
  const endOfLastDay = new Date(
    p.end.getFullYear(),
    p.end.getMonth(),
    p.end.getDate() + 1,
  );
  if (now < p.start) return "upcoming";
  if (now >= endOfLastDay) return "done";
  return "ongoing";
};

export const PERIOD_STATUS = {
  ongoing: { label: "En cours", badge: "bg-green-100", text: "text-green-700" },
  upcoming: { label: "À venir", badge: "bg-soft", text: "text-primary" },
  done: { label: "Terminée", badge: "bg-slate-100", text: "text-muted" },
} as const;
