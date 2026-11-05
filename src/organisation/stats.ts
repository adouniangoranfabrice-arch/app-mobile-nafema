import { AcademicYear, Period, periodStatus } from "@/data/academic";
import { OrgRecord } from "./types";

type SchoolInput = {
  school: string;
  students: { school: string; sex: string; active: boolean }[];
  years: AcademicYear[];
  periods: Period[];
  classes: OrgRecord[];
  niveaux: OrgRecord[];
  salles: OrgRecord[];
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Les statistiques d'une école, sur son année scolaire active (école → année → classes) */
export function computeSchoolStats(d: SchoolInput) {
  const now = d.now ?? new Date();
  const year = d.years.find((y) => y.school === d.school && y.active);

  const students = d.students.filter((s) => s.school === d.school);
  const classes = year ? d.classes.filter((c) => c.annee === year.id) : [];
  const periods = year ? d.periods.filter((p) => p.yearId === year.id) : [];

  const salleIds = new Set(classes.map((c) => c.salle).filter(Boolean));
  const salles = d.salles.filter((s) => salleIds.has(s.id));

  const daysTotal = year
    ? Math.round((year.end.getTime() - year.start.getTime()) / DAY_MS)
    : 0;
  const daysElapsed = year
    ? Math.round((now.getTime() - year.start.getTime()) / DAY_MS)
    : 0;

  return {
    hasYear: !!year,
    totals: {
      students: students.length,
      classes: classes.length,
      salles: salles.length,
    },
    students: {
      active: students.filter((s) => s.active).length,
      girls: students.filter((s) => s.sex === "Féminin").length,
      boys: students.filter((s) => s.sex === "Masculin").length,
    },
    seats: classes.reduce((t, c) => t + (Number(c.effectif_max) || 0), 0),
    year: {
      daysTotal,
      daysElapsed: Math.min(daysTotal, Math.max(0, daysElapsed)),
    },
    periods: {
      total: periods.length,
      done: periods.filter((p) => periodStatus(p, now) === "done").length,
      current:
        periods.find((p) => periodStatus(p, now) === "ongoing")?.label ?? "",
    },
    classesByNiveau: [...d.niveaux]
      .sort((a, b) => Number(a.order) - Number(b.order))
      .map((n) => ({
        id: n.id,
        name: String(n.name),
        count: classes.filter((c) => c.niveau === n.id).length,
      }))
      .filter((n) => n.count > 0),
  };
}

type Input = {
  students: { sex: string; active: boolean }[];
  drenas: number;
  iepps: number;
  etablissements: OrgRecord[];
  classes: OrgRecord[];
  niveaux: OrgRecord[];
  cycles: OrgRecord[];
  salles: OrgRecord[];
  matieres: number;
  personnels: OrgRecord[];
};

/** Les statistiques du tableau de bord, calculées à partir des données de l'application */
export function computeStats(d: Input) {
  const cycleOfNiveau = new Map(d.niveaux.map((n) => [n.id, String(n.cycle)]));
  const sum = (rows: OrgRecord[], key: string) =>
    rows.reduce((total, r) => total + (Number(r[key]) || 0), 0);

  return {
    totals: {
      drenas: d.drenas,
      iepps: d.iepps,
      etablissements: d.etablissements.length,
      classes: d.classes.length,
      salles: d.salles.length,
      matieres: d.matieres,
    },
    students: {
      total: d.students.length,
      active: d.students.filter((s) => s.active).length,
      girls: d.students.filter((s) => s.sex === "Féminin").length,
      boys: d.students.filter((s) => s.sex === "Masculin").length,
    },
    personnels: {
      total: d.personnels.length,
      active: d.personnels.filter((p) => p.active).length,
    },
    schoolTypes: {
      public: d.etablissements.filter((e) => e.type === "PUBLIC").length,
      private: d.etablissements.filter((e) => e.type === "PRIVE").length,
    },
    classesByCycle: [...d.cycles]
      .sort((a, b) => Number(a.order) - Number(b.order))
      .map((c) => ({
        id: c.id,
        name: String(c.name),
        count: d.classes.filter(
          (cl) => cycleOfNiveau.get(String(cl.niveau)) === c.id,
        ).length,
      })),
    places: {
      classes: sum(d.classes, "effectif_max"),
      salles: sum(d.salles, "capacite"),
    },
  };
}
