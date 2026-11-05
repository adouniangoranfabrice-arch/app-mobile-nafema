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
export const PERIOD_TYPES = ["TRIMESTRE", "SEMESTRE"];

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

export const INITIAL_PERIODS: Period[] = [
  {
    id: "p1",
    yearId: "y1",
    cycle: "Collège",
    number: 1,
    label: "1er trimestre",
    type: "TRIMESTRE",
    start: ymd(2026, 9, 7),
    end: ymd(2026, 12, 18),
    locked: false,
  },
  {
    id: "p2",
    yearId: "y1",
    cycle: "Collège",
    number: 2,
    label: "2e trimestre",
    type: "TRIMESTRE",
    start: ymd(2027, 1, 4),
    end: ymd(2027, 3, 26),
    locked: false,
  },
  {
    id: "p3",
    yearId: "y1",
    cycle: "Collège",
    number: 3,
    label: "3e trimestre",
    type: "TRIMESTRE",
    start: ymd(2027, 4, 12),
    end: ymd(2027, 6, 25),
    locked: false,
  },
  {
    id: "p4",
    yearId: "y2",
    cycle: "Lycée",
    number: 1,
    label: "1er semestre",
    type: "SEMESTRE",
    start: ymd(2026, 9, 14),
    end: ymd(2027, 1, 29),
    locked: false,
  },
  {
    id: "p5",
    yearId: "y2",
    cycle: "Lycée",
    number: 2,
    label: "2e semestre",
    type: "SEMESTRE",
    start: ymd(2027, 2, 1),
    end: ymd(2027, 6, 25),
    locked: false,
  },
  {
    id: "p6",
    yearId: "y4",
    cycle: "Collège",
    number: 1,
    label: "1er trimestre",
    type: "TRIMESTRE",
    start: ymd(2025, 9, 8),
    end: ymd(2025, 12, 19),
    locked: true,
  },
  {
    id: "p7",
    yearId: "y4",
    cycle: "Collège",
    number: 2,
    label: "2e trimestre",
    type: "TRIMESTRE",
    start: ymd(2026, 1, 5),
    end: ymd(2026, 3, 27),
    locked: true,
  },
  {
    id: "p8",
    yearId: "y4",
    cycle: "Collège",
    number: 3,
    label: "3e trimestre",
    type: "TRIMESTRE",
    start: ymd(2026, 4, 13),
    end: ymd(2026, 6, 26),
    locked: true,
  },
];

/** Libellé proposé : (1, TRIMESTRE) → « 1er trimestre » */
export const suggestLabel = (type: string, n: number) =>
  `${n === 1 ? "1er" : `${n}e`} ${type.toLowerCase()}`;

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
