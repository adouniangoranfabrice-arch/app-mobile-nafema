export type Note = {
  id: string;
  evaluation_id: string;
  student_id: string;
  valeur: number; // sur le barème de l'évaluation
};

// Données fictives (à remplacer par ton API), sur les évaluations déjà passées
export const NOTES: Note[] = [
  { id: "no1", evaluation_id: "ev2", student_id: "s2", valeur: 8 },
  { id: "no2", evaluation_id: "ev2", student_id: "s9", valeur: 6.5 },
  { id: "no3", evaluation_id: "ev2", student_id: "s10", valeur: 9 },
  { id: "no4", evaluation_id: "ev4", student_id: "s1", valeur: 7 },
  { id: "no5", evaluation_id: "ev4", student_id: "s13", valeur: 5 },
  { id: "no6", evaluation_id: "ev4", student_id: "s14", valeur: 8.5 },
];
