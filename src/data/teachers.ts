export type Teacher = {
  id: string;
  name: string;
  subject: string;
};

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "M. Diop", subject: "Mathématiques" },
  { id: "t2", name: "Mme Ndiaye", subject: "Français" },
  { id: "t3", name: "Mme Koné", subject: "Histoire-Géographie" },
  { id: "t4", name: "M. Traoré", subject: "Physique-Chimie" },
  { id: "t5", name: "Mme Bamba", subject: "Enseignement primaire" },
  { id: "t6", name: "M. Ouattara", subject: "Anglais" },
  { id: "t7", name: "Mme Yao", subject: "SVT" },
  { id: "t8", name: "M. Kouassi", subject: "EPS" },
];

export const teacherLabel = (t: Teacher) => `${t.name} · ${t.subject}`;
