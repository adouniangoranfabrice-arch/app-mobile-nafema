export type Competence = {
  id: string;
  code: string;
  intitule: string;
  matiere: string;
  description: string;
};

// Données fictives (à remplacer par ton API)
export const INITIAL_COMPETENCES: Competence[] = [
  {
    id: "co1",
    code: "MATH-CALC",
    intitule: "Calculer avec des fractions",
    matiere: "Mathématiques",
    description: "Additionner, soustraire et comparer des fractions.",
  },
  {
    id: "co2",
    code: "MATH-GEO",
    intitule: "Construire une figure géométrique",
    matiere: "Mathématiques",
    description: "Utiliser la règle et le compas pour tracer une figure.",
  },
  {
    id: "co3",
    code: "MATH-RAIS",
    intitule: "Résoudre un problème",
    matiere: "Mathématiques",
    description: "Choisir une méthode et justifier son raisonnement.",
  },
  {
    id: "co4",
    code: "MATH-DEM",
    intitule: "Démontrer une propriété",
    matiere: "Mathématiques",
    description: "",
  },
];
