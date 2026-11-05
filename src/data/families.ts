export type Parent = {
  id: string;
  school: string; // Établissement
  lastName: string;
  firstNames: string;
  sex: string;
  phone: string;
  phone2: string; // Tél. secondaire
  email: string;
  profession: string;
  address: string;
  district: string; // Quartier
  active: boolean;
};

export type ParentLink = {
  id: string;
  parentId: string;
  studentId: string;
  relation: string; // Lien parenté
  financialResponsible: boolean; // Resp. financier
  emergencyContact: boolean; // Contact urgence
};

export const RELATIONS = [
  "Père",
  "Mère",
  "Tuteur",
  "Tutrice",
  "Grand-parent",
  "Oncle / Tante",
  "Autre",
];

/** DIALLO Ibrahima */
export const parentName = (p: Parent) =>
  `${p.lastName.toUpperCase()} ${p.firstNames}`;

// Données fictives (à remplacer par ton API). Les studentId correspondent à data/students.ts
export const INITIAL_PARENTS: Parent[] = [
  {
    id: "p1",
    school: "Collège des Almadies",
    lastName: "Diallo",
    firstNames: "Ibrahima",
    sex: "Masculin",
    phone: "+221 77 123 45 67",
    phone2: "+221 78 111 22 33",
    email: "ibrahima.diallo@exemple.sn",
    profession: "Ingénieur",
    address: "Rue 10 x 15",
    district: "Point E",
    active: true,
  },
  {
    id: "p2",
    school: "Collège des Almadies",
    lastName: "Diallo",
    firstNames: "Mariama",
    sex: "Féminin",
    phone: "+221 77 765 43 21",
    phone2: "",
    email: "",
    profession: "Enseignante",
    address: "Rue 10 x 15",
    district: "Point E",
    active: true,
  },
  {
    id: "p3",
    school: "Lycée Excellence",
    lastName: "Ba",
    firstNames: "Cheikh",
    sex: "Masculin",
    phone: "+221 76 456 78 90",
    phone2: "+221 77 900 80 70",
    email: "",
    profession: "Commerçant",
    address: "Avenue Caydara",
    district: "Randoulène",
    active: true,
  },
  {
    id: "p4",
    school: "Collège Teranga",
    lastName: "Sow",
    firstNames: "Aminata",
    sex: "Féminin",
    phone: "+221 78 321 65 40",
    phone2: "",
    email: "aminata.sow@exemple.sn",
    profession: "Couturière",
    address: "Rue de la Gare",
    district: "Keury Souf",
    active: true,
  },
  {
    id: "p5",
    school: "Lycée Kajoor",
    lastName: "Ndiaye",
    firstNames: "Ousmane",
    sex: "Masculin",
    phone: "+221 70 987 65 43",
    phone2: "+221 70 123 98 76",
    email: "",
    profession: "Chauffeur",
    address: "Route de Saint-Louis",
    district: "Santhiaba",
    active: true,
  },
  {
    id: "p6",
    school: "École Les Mouettes",
    lastName: "Fall",
    firstNames: "Rokhaya",
    sex: "Féminin",
    phone: "+221 77 654 32 10",
    phone2: "",
    email: "",
    profession: "Infirmière",
    address: "Boulevard des Mouettes",
    district: "Escale",
    active: false,
  },
];

export const INITIAL_LINKS: ParentLink[] = [
  {
    id: "l1",
    parentId: "p1",
    studentId: "s1",
    relation: "Père",
    financialResponsible: true,
    emergencyContact: true,
  },
  {
    id: "l2",
    parentId: "p1",
    studentId: "s2",
    relation: "Père",
    financialResponsible: true,
    emergencyContact: false,
  },
  {
    id: "l3",
    parentId: "p2",
    studentId: "s1",
    relation: "Mère",
    financialResponsible: false,
    emergencyContact: true,
  },
  {
    id: "l4",
    parentId: "p2",
    studentId: "s2",
    relation: "Mère",
    financialResponsible: false,
    emergencyContact: true,
  },
  {
    id: "l5",
    parentId: "p3",
    studentId: "s3",
    relation: "Père",
    financialResponsible: true,
    emergencyContact: true,
  },
  {
    id: "l6",
    parentId: "p4",
    studentId: "s4",
    relation: "Mère",
    financialResponsible: true,
    emergencyContact: true,
  },
  {
    id: "l7",
    parentId: "p5",
    studentId: "s5",
    relation: "Père",
    financialResponsible: true,
    emergencyContact: false,
  },
  {
    id: "l8",
    parentId: "p6",
    studentId: "s6",
    relation: "Tutrice",
    financialResponsible: true,
    emergencyContact: true,
  },
];
