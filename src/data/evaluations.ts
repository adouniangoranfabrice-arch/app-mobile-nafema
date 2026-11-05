import { ymd } from "@/utils/dates";

export type Evaluation = {
  id: string;
  titre: string;
  classe_id: string;
  matiere: string;
  type: string;
  date: Date;
  bareme: number; // note maximale
  coefficient: number;
};

export const EVALUATION_TYPES = ["Devoir", "Interrogation", "Composition"];

// Données fictives (à remplacer par ton API)
export const INITIAL_EVALUATIONS: Evaluation[] = [
  {
    id: "ev1",
    titre: "Fractions et proportions",
    classe_id: "cl1",
    matiere: "Mathématiques",
    type: "Devoir",
    date: ymd(2026, 11, 12),
    bareme: 20,
    coefficient: 2,
  },
  {
    id: "ev2",
    titre: "Nombres décimaux",
    classe_id: "cl1",
    matiere: "Mathématiques",
    type: "Interrogation",
    date: ymd(2026, 10, 15),
    bareme: 10,
    coefficient: 1,
  },
  {
    id: "ev3",
    titre: "Géométrie : les angles",
    classe_id: "cl2",
    matiere: "Mathématiques",
    type: "Devoir",
    date: ymd(2026, 11, 19),
    bareme: 20,
    coefficient: 2,
  },
  {
    id: "ev4",
    titre: "Théorème de Pythagore",
    classe_id: "cl3",
    matiere: "Mathématiques",
    type: "Interrogation",
    date: ymd(2026, 10, 22),
    bareme: 10,
    coefficient: 1,
  },
  {
    id: "ev5",
    titre: "Composition du 1er trimestre",
    classe_id: "cl3",
    matiere: "Mathématiques",
    type: "Composition",
    date: ymd(2026, 12, 7),
    bareme: 20,
    coefficient: 3,
  },
];

/** Une évaluation du jour reste « à venir » jusqu'à la fin de la journée */
export const isUpcoming = (e: Pick<Evaluation, "date">, now = new Date()) =>
  new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate() + 1) > now;
