import { ymd } from "@/utils/dates";

export type Absence = {
  id: string;
  student_id: string;
  date: Date;
  debut: string;
  fin: string;
  matiere: string;
  justified: boolean;
  motif: string; // vide si non justifiée
};

// Données fictives (à remplacer par ton API), sur les élèves des classes de l'enseignant
export const ABSENCES: Absence[] = [
  {
    id: "ab1",
    student_id: "s2",
    date: ymd(2026, 11, 4),
    debut: "08:00",
    fin: "10:00",
    matiere: "Mathématiques",
    justified: true,
    motif: "Certificat médical",
  },
  {
    id: "ab2",
    student_id: "s9",
    date: ymd(2026, 11, 3),
    debut: "10:00",
    fin: "12:00",
    matiere: "Mathématiques",
    justified: false,
    motif: "",
  },
  {
    id: "ab3",
    student_id: "s11",
    date: ymd(2026, 11, 2),
    debut: "13:00",
    fin: "15:00",
    matiere: "Mathématiques",
    justified: false,
    motif: "",
  },
  {
    id: "ab4",
    student_id: "s1",
    date: ymd(2026, 10, 28),
    debut: "08:00",
    fin: "10:00",
    matiere: "Mathématiques",
    justified: true,
    motif: "Rendez-vous familial",
  },
  {
    id: "ab5",
    student_id: "s13",
    date: ymd(2026, 10, 27),
    debut: "08:00",
    fin: "10:00",
    matiere: "Mathématiques",
    justified: false,
    motif: "",
  },
  {
    id: "ab6",
    student_id: "s12",
    date: ymd(2026, 10, 20),
    debut: "13:00",
    fin: "15:00",
    matiere: "Mathématiques",
    justified: true,
    motif: "Maladie",
  },
];
