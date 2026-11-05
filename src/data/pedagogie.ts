import { Tone } from "@/organisation/types";
import { ymd } from "@/utils/dates";

// Données fictives (à remplacer par ton API), sur les élèves des classes de l'enseignant

export const PERIODES = ["1er trimestre", "2e trimestre", "3e trimestre"];

/* ----- Évaluations de compétences ----- */

export const COMPETENCE_LEVELS: { value: string; tone: Tone }[] = [
  { value: "Acquis", tone: "green" },
  { value: "En cours", tone: "amber" },
  { value: "Non acquis", tone: "slate" },
];

export type EvaluationCompetence = {
  id: string;
  student_id: string;
  competence_id: string;
  niveau: string;
  date: Date;
};

export const INITIAL_EVALUATIONS_COMPETENCES: EvaluationCompetence[] = [
  { id: "ec1", student_id: "s2", competence_id: "co1", niveau: "Acquis", date: ymd(2026, 10, 15) },
  { id: "ec2", student_id: "s9", competence_id: "co1", niveau: "En cours", date: ymd(2026, 10, 15) },
  { id: "ec3", student_id: "s11", competence_id: "co2", niveau: "Non acquis", date: ymd(2026, 10, 20) },
  { id: "ec4", student_id: "s1", competence_id: "co4", niveau: "Acquis", date: ymd(2026, 10, 22) },
  { id: "ec5", student_id: "s13", competence_id: "co3", niveau: "En cours", date: ymd(2026, 10, 22) },
];

/* ----- Appréciations par matière ----- */

export type Appreciation = {
  id: string;
  student_id: string;
  matiere: string;
  periode: string;
  texte: string;
};

export const INITIAL_APPRECIATIONS: Appreciation[] = [
  { id: "ap1", student_id: "s2", matiere: "Mathématiques", periode: "1er trimestre", texte: "Élève sérieuse et appliquée, de bons résultats." },
  { id: "ap2", student_id: "s9", matiere: "Mathématiques", periode: "1er trimestre", texte: "Des progrès, mais il faut participer davantage." },
  { id: "ap3", student_id: "s11", matiere: "Mathématiques", periode: "1er trimestre", texte: "Travail irrégulier, des efforts sont attendus." },
  { id: "ap4", student_id: "s1", matiere: "Mathématiques", periode: "1er trimestre", texte: "Bon raisonnement, ensemble satisfaisant." },
];

/* ----- Bulletins ----- */

export type Bulletin = {
  id: string;
  student_id: string;
  periode: string;
  moyenne: number; // sur 20
};

export const BULLETINS: Bulletin[] = [
  { id: "bu1", student_id: "s2", periode: "1er trimestre", moyenne: 15.2 },
  { id: "bu2", student_id: "s9", periode: "1er trimestre", moyenne: 12.4 },
  { id: "bu3", student_id: "s10", periode: "1er trimestre", moyenne: 16.8 },
  { id: "bu4", student_id: "s11", periode: "1er trimestre", moyenne: 9.6 },
  { id: "bu5", student_id: "s12", periode: "1er trimestre", moyenne: 13.1 },
  { id: "bu6", student_id: "s1", periode: "1er trimestre", moyenne: 14.3 },
  { id: "bu7", student_id: "s13", periode: "1er trimestre", moyenne: 10.5 },
  { id: "bu8", student_id: "s14", periode: "1er trimestre", moyenne: 11.9 },
];

export const mention = (moyenne: number): { label: string; tone: Tone } => {
  if (moyenne >= 16) return { label: "Très bien", tone: "green" };
  if (moyenne >= 14) return { label: "Bien", tone: "green" };
  if (moyenne >= 12) return { label: "Assez bien", tone: "blue" };
  if (moyenne >= 10) return { label: "Passable", tone: "amber" };
  return { label: "Insuffisant", tone: "slate" };
};

/* ----- Examens ----- */

export type Examen = {
  id: string;
  titre: string;
  classe_id: string;
  matiere: string;
  date: Date;
  duree: string;
};

export const INITIAL_EXAMENS: Examen[] = [
  { id: "ex1", titre: "Examen blanc de mathématiques", classe_id: "cl3", matiere: "Mathématiques", date: ymd(2027, 2, 15), duree: "3 h" },
  { id: "ex2", titre: "Examen du 1er trimestre", classe_id: "cl1", matiere: "Mathématiques", date: ymd(2026, 12, 10), duree: "2 h" },
  { id: "ex3", titre: "Examen du 1er trimestre", classe_id: "cl2", matiere: "Mathématiques", date: ymd(2026, 12, 11), duree: "2 h" },
  { id: "ex4", titre: "Test de rentrée", classe_id: "cl3", matiere: "Mathématiques", date: ymd(2026, 10, 5), duree: "1 h" },
];
