// Données fictives « Finances & abonnements » (à remplacer par l'API)
import { fullName, INITIAL_STUDENTS } from "@/data/students";
import { SCHOOL_NAMES } from "@/data/academic";
import { day, ymd } from "@/utils/dates";

/** 150000 → « 150 000 FCFA » (espaces simples : rendu identique sur Android et iOS) */
export const fcfa = (n: number) =>
  `${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;

/* ---------- Frais ---------- */

export type Frais = {
  id: string;
  libelle: string;
  montant: number;
  cible: string; // à qui s'applique le frais
  echeance: Date;
  obligatoire: boolean;
};

export const FRAIS: Frais[] = [
  { id: "f1", libelle: "Frais d'inscription", montant: 25000, cible: "Tous les niveaux", echeance: ymd(2026, 9, 30), obligatoire: true },
  { id: "f2", libelle: "Scolarité – 1re tranche", montant: 75000, cible: "Collège", echeance: ymd(2026, 10, 31), obligatoire: true },
  { id: "f3", libelle: "Scolarité – 2e tranche", montant: 75000, cible: "Collège", echeance: ymd(2027, 1, 31), obligatoire: true },
  { id: "f4", libelle: "Scolarité – 1re tranche", montant: 90000, cible: "Lycée", echeance: ymd(2026, 10, 31), obligatoire: true },
  { id: "f5", libelle: "Scolarité – 2e tranche", montant: 90000, cible: "Lycée", echeance: ymd(2027, 1, 31), obligatoire: true },
  { id: "f6", libelle: "Cantine (trimestre)", montant: 45000, cible: "Élèves inscrits à la cantine", echeance: ymd(2026, 10, 15), obligatoire: false },
  { id: "f7", libelle: "Transport scolaire (trimestre)", montant: 60000, cible: "Élèves inscrits au transport", echeance: ymd(2026, 10, 15), obligatoire: false },
  { id: "f8", libelle: "Tenue scolaire", montant: 15000, cible: "Nouveaux élèves", echeance: ymd(2026, 9, 30), obligatoire: true },
  { id: "f9", libelle: "Assurance scolaire", montant: 2000, cible: "Tous les niveaux", echeance: ymd(2026, 9, 30), obligatoire: true },
  { id: "f10", libelle: "Frais d'examen BEPC", montant: 10000, cible: "3e", echeance: ymd(2027, 3, 31), obligatoire: true },
  { id: "f11", libelle: "Frais d'examen BAC", montant: 15000, cible: "Terminale", echeance: ymd(2027, 3, 31), obligatoire: true },
];

/* ---------- Créances : ce que chaque élève doit sur les frais obligatoires ---------- */

export type Creance = {
  id: string;
  eleve: string;
  school: string;
  frais: string;
  montant: number;
  paye: number;
  echeance: Date;
};

// Chaque élève a 3 frais (échéances passées et à venir) ; la part payée varie pour donner des cas différents
const PARTS = [1, 0.5, 0, 1, 0.8, 0.3, 1, 0, 0.6];
const FRAIS_ELEVE = [FRAIS[0], FRAIS[1], FRAIS[2]];

export const CREANCES: Creance[] = INITIAL_STUDENTS.flatMap((s, i) =>
  FRAIS_ELEVE.map((f, j) => {
    const part = PARTS[(i + j * 2) % PARTS.length];
    return {
      id: `cr-${s.id}-${f.id}`,
      eleve: fullName(s),
      school: s.school,
      frais: f.libelle,
      montant: f.montant,
      paye: Math.round(f.montant * part),
      echeance: f.echeance,
    };
  }),
);

export const reste = (c: Creance) => c.montant - c.paye;
export const enRetard = (c: Creance, today = day(new Date())) =>
  reste(c) > 0 && c.echeance < today;

/* ---------- Paiements : les sommes déjà versées sur les créances ---------- */

export type Paiement = {
  id: string;
  reference: string;
  eleve: string;
  school: string;
  frais: string;
  montant: number;
  date: Date;
  mode: "Espèces" | "Mobile Money" | "Virement" | "Chèque";
};

const MODES: Paiement["mode"][] = ["Mobile Money", "Espèces", "Virement", "Chèque"];

export const PAIEMENTS: Paiement[] = CREANCES.filter((c) => c.paye > 0).map(
  (c, i) => ({
    id: `p-${c.id}`,
    reference: `PAY-2026-${String(i + 1).padStart(4, "0")}`,
    eleve: c.eleve,
    school: c.school,
    frais: c.frais,
    montant: c.paye,
    // Paiement quelques jours avant l'échéance
    date: new Date(c.echeance.getTime() - ((i % 9) + 1) * 86400000),
    mode: MODES[i % MODES.length],
  }),
);

/* ---------- Plans et abonnements des établissements à NAFEMA ---------- */

export type Plan = {
  id: string;
  name: string;
  prixMensuel: number;
  maxEleves: number | null; // null : illimité
  modules: string[];
};

export const PLANS: Plan[] = [
  { id: "pl1", name: "Essentiel", prixMensuel: 25000, maxEleves: 300, modules: ["Scolarité", "Notes", "Absences"] },
  { id: "pl2", name: "Standard", prixMensuel: 50000, maxEleves: 800, modules: ["Scolarité", "Notes", "Absences", "Bulletins", "Finances"] },
  { id: "pl3", name: "Premium", prixMensuel: 90000, maxEleves: null, modules: ["Tous les modules", "Support prioritaire", "Statistiques avancées"] },
];

export type Abonnement = {
  id: string;
  school: string;
  planId: string;
  debut: Date;
  fin: Date;
};

export const ABONNEMENTS: Abonnement[] = SCHOOL_NAMES.map((school, i) => {
  // Un établissement sur trois a un abonnement terminé, les autres sont en cours
  const debut = ymd(i % 3 === 2 ? 2025 : 2026, 9 - (i % 3), 1);
  const fin = ymd(debut.getFullYear() + 1, debut.getMonth() + 1, 0);
  return { id: `ab${i + 1}`, school, planId: PLANS[i % PLANS.length].id, debut, fin };
});

export const planOf = (a: Abonnement) => PLANS.find((p) => p.id === a.planId);
export const abonnementActif = (a: Abonnement, today = day(new Date())) =>
  a.debut <= today && a.fin >= today;
