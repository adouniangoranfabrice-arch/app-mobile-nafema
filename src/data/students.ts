import { ymd } from "@/utils/dates";

export type Student = {
  id: string;
  school: string; // Établissement
  classe_id: string; // vide si l'élève n'a pas encore de classe
  matricule: string;
  lastName: string; // Nom
  firstNames: string; // Prénoms
  sex: string; // Masculin | Féminin
  birthDate: Date | null;
  birthPlace: string;
  nationality: string;
  nationalId: string; // Matricule national
  extractNumber: string; // Numéro extrait
  address: string;
  district: string; // Quartier
  phone: string;
  bloodGroup: string;
  medicalNotes: string;
  previousSchool: string;
  photo: string; // Photo (chemin)
  active: boolean;
};

export const SEX_OPTIONS = ["Masculin", "Féminin"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** DIALLO Amadou */
export const fullName = (s: Student) =>
  `${s.lastName.toUpperCase()} ${s.firstNames}`;

const base = {
  classe_id: "",
  nationality: "Sénégalaise",
  nationalId: "",
  extractNumber: "",
  address: "",
  district: "",
  phone: "",
  bloodGroup: "",
  medicalNotes: "",
  previousSchool: "",
  photo: "",
  active: true,
};

// Données fictives (à remplacer par ton API)
export const INITIAL_STUDENTS: Student[] = [
  {
    ...base,
    id: "s1",
    classe_id: "cl3",
    school: "Collège des Almadies",
    matricule: "ALM-2026-001",
    lastName: "Diallo",
    firstNames: "Amadou",
    sex: "Masculin",
    birthDate: ymd(2011, 3, 14),
    birthPlace: "Dakar",
    nationalId: "SN-2011-034567",
    extractNumber: "EX-2011-4587",
    address: "Rue 10 x 15",
    district: "Point E",
    phone: "+221 77 123 45 67",
    bloodGroup: "O+",
    medicalNotes: "RAS",
    previousSchool: "École Sainte-Anne",
  },
  {
    ...base,
    id: "s2",
    classe_id: "cl1",
    school: "Collège des Almadies",
    matricule: "ALM-2026-002",
    lastName: "Diallo",
    firstNames: "Fatou",
    sex: "Féminin",
    birthDate: ymd(2014, 7, 2),
    birthPlace: "Dakar",
    nationalId: "SN-2014-051230",
    extractNumber: "EX-2014-1182",
    address: "Rue 10 x 15",
    district: "Point E",
    phone: "+221 77 123 45 67",
    bloodGroup: "A+",
    previousSchool: "École Les Papyrus",
  },
  {
    ...base,
    id: "s3",
    classe_id: "cl4",
    school: "Lycée Excellence",
    matricule: "EXC-2026-014",
    lastName: "Ba",
    firstNames: "Aïssatou",
    sex: "Féminin",
    birthDate: ymd(2010, 11, 23),
    birthPlace: "Thiès",
    nationalId: "SN-2010-077812",
    extractNumber: "EX-2010-9034",
    address: "Avenue Caydara",
    district: "Randoulène",
    phone: "+221 76 456 78 90",
    bloodGroup: "B+",
    medicalNotes: "Allergie aux arachides",
    previousSchool: "Collège Mame Diarra",
  },
  {
    ...base,
    id: "s4",
    classe_id: "cl6",
    school: "Collège Teranga",
    matricule: "TER-2026-027",
    lastName: "Sow",
    firstNames: "Mamadou",
    sex: "Masculin",
    birthDate: ymd(2012, 1, 30),
    birthPlace: "Rufisque",
    address: "Rue de la Gare",
    district: "Keury Souf",
    phone: "+221 78 321 65 40",
    bloodGroup: "AB+",
  },
  {
    ...base,
    id: "s5",
    school: "Lycée Kajoor",
    matricule: "KAJ-2026-008",
    lastName: "Ndiaye",
    firstNames: "Khadija",
    sex: "Féminin",
    birthDate: ymd(2011, 9, 9),
    birthPlace: "Louga",
    nationalId: "SN-2011-066001",
    address: "Route de Saint-Louis",
    district: "Santhiaba",
    phone: "+221 70 987 65 43",
    bloodGroup: "O-",
  },
  {
    ...base,
    id: "s6",
    school: "École Les Mouettes",
    matricule: "MOU-2026-003",
    lastName: "Fall",
    firstNames: "Ibrahima",
    sex: "Masculin",
    birthDate: ymd(2015, 5, 18),
    birthPlace: "Ziguinchor",
    address: "Boulevard des Mouettes",
    district: "Escale",
    phone: "+221 77 654 32 10",
  },
  {
    ...base,
    id: "s7",
    school: "Groupe scolaire Bakel",
    matricule: "BAK-2026-011",
    lastName: "Sarr",
    firstNames: "Awa",
    sex: "Féminin",
    birthDate: ymd(2012, 12, 5),
    birthPlace: "Bakel",
    district: "Centre",
    phone: "+221 76 111 22 33",
    active: false,
  },
  {
    ...base,
    id: "s8",
    school: "Collège Fouta",
    matricule: "FOU-2026-006",
    lastName: "Diop",
    firstNames: "Moussa",
    sex: "Masculin",
    birthDate: ymd(2011, 4, 27),
    birthPlace: "Matam",
    nationalId: "SN-2011-012945",
    address: "Rue du Marché",
    district: "Ourossogui",
    phone: "+221 78 555 44 33",
    bloodGroup: "A-",
    previousSchool: "École Ourossogui 1",
  },
  // Quelques élèves de plus, pour que chaque classe du Collège des Almadies ait une liste
  {
    ...base,
    id: "s9",
    classe_id: "cl1",
    school: "Collège des Almadies",
    matricule: "ALM-2026-003",
    lastName: "Gueye",
    firstNames: "Mariama",
    sex: "Féminin",
    birthDate: ymd(2014, 2, 11),
    birthPlace: "Dakar",
  },
  {
    ...base,
    id: "s10",
    classe_id: "cl1",
    school: "Collège des Almadies",
    matricule: "ALM-2026-004",
    lastName: "Seck",
    firstNames: "Cheikh",
    sex: "Masculin",
    birthDate: ymd(2014, 10, 6),
    birthPlace: "Pikine",
  },
  {
    ...base,
    id: "s11",
    classe_id: "cl2",
    school: "Collège des Almadies",
    matricule: "ALM-2026-005",
    lastName: "Mbaye",
    firstNames: "Astou",
    sex: "Féminin",
    birthDate: ymd(2014, 4, 21),
    birthPlace: "Dakar",
  },
  {
    ...base,
    id: "s12",
    classe_id: "cl2",
    school: "Collège des Almadies",
    matricule: "ALM-2026-006",
    lastName: "Thiam",
    firstNames: "Ousmane",
    sex: "Masculin",
    birthDate: ymd(2013, 12, 15),
    birthPlace: "Rufisque",
  },
  {
    ...base,
    id: "s13",
    classe_id: "cl3",
    school: "Collège des Almadies",
    matricule: "ALM-2026-007",
    lastName: "Faye",
    firstNames: "Ndèye",
    sex: "Féminin",
    birthDate: ymd(2011, 6, 3),
    birthPlace: "Dakar",
  },
  {
    ...base,
    id: "s14",
    classe_id: "cl3",
    school: "Collège des Almadies",
    matricule: "ALM-2026-008",
    lastName: "Cissé",
    firstNames: "Abdou",
    sex: "Masculin",
    birthDate: ymd(2011, 8, 19),
    birthPlace: "Thiès",
    active: false,
  },
];
