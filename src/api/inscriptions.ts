import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

/**
 * Corps attendu pour une inscription. annee, niveau_precedant, niveau_actuel et classe sont des public_key ;
 * les dates sont en ISO « 2015-03-12T00:00:00Z ». Un champ facultatif non rempli part à null.
 */
export type InscriptionInput = {
  // Année et type
  annee: string;
  type: "NOUVELLE" | "REINSCRIPTION";
  eleve: string | null; // public_key de l'élève déjà inscrit (réinscription)
  // Élève (nouvelle inscription seulement : null pour une réinscription)
  name: string | null;
  firstname: string | null;
  gender: "M" | "F" | null;
  birth_day: string | null;
  birth_of: string | null;
  nationality: string | null;
  matricule_national: string | null;
  numero_extrait: string | null;
  photo_path: string | null;
  residence: string | null;
  city: string | null;
  phone: string | null;
  groupe_sang: string | null;
  observat_medicales: string | null;
  // Parent ou tuteur
  nom_parent: string | null;
  prenoms_parent: string | null;
  phone_parent: string | null;
  lien_parent: string | null;
  job_parent: string | null;
  // Scolarité
  ancien_ecole: string | null;
  niveau_precedant: string | null;
  niveau_actuel: string;
  classe: string;
  affectation: string;
  regime: string;
  est_redoublant: boolean;
  decision_fin_annee: string | null;
};

/** Valeurs proposées dans le formulaire */
export const TYPES_INSCRIPTION = [
  { value: "NOUVELLE", label: "Nouvelle" },
  { value: "REINSCRIPTION", label: "Réinscription" },
];
export const AFFECTATIONS = [
  { value: "AFFECTE", label: "Affecté" },
  { value: "NON_AFFECTE", label: "Non affecté" },
];
export const REGIMES = [
  { value: "BOURSIER", label: "Boursier" },
  { value: "NON_BOURSIER", label: "Non boursier" },
];
/** Nationalités proposées (la liste reste ouverte : « Autre ») */
export const NATIONALITES = [
  "Ivoirienne",
  "Burkinabè",
  "Malienne",
  "Guinéenne",
  "Sénégalaise",
  "Ghanéenne",
  "Nigériane",
  "Nigérienne",
  "Béninoise",
  "Togolaise",
  "Libérienne",
  "Camerounaise",
  "Mauritanienne",
  "Libanaise",
  "Française",
  "Autre",
];

export const GROUPES_SANGUINS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Mode fictif : les inscriptions sont gardées dans l'application (en mémoire) au lieu du serveur,
 * en attendant que POST /inscriptions fonctionne. Passer à false pour utiliser la vraie API.
 * Les listes du formulaire (années, niveaux, classes) restent celles de la base.
 */
export const INSCRIPTIONS_FICTIVES = true;

/** Noms à afficher dans la liste : la requête ne contient que des clés */
export type InscriptionDisplay = {
  eleve_name: string;
  matricule: string;
  classe_name: string;
  niveau_name: string;
  annee_name: string;
};

/** Inscrit un élève et renvoie le message de confirmation */
export async function createInscription(
  inscription: InscriptionInput,
  display: InscriptionDisplay,
) {
  if (INSCRIPTIONS_FICTIVES) {
    await pause(500); // comme un aller-retour réseau
    const now = new Date();
    fictives.unshift({
      public_key: `FICTIF-${now.getTime()}`,
      ...display,
      type: inscription.type,
      statut: "EN_ATTENTE",
      date: localDateTime(now),
      est_redoublant: inscription.est_redoublant,
      affectation: inscription.affectation,
      regime: inscription.regime,
      decision_fin_annee: inscription.decision_fin_annee ?? "",
      modifie_le: "",
    });
    return "Inscription enregistrée (mode fictif, en attendant le serveur).";
  }
  const { data } = await api.post<{ message?: string }>(
    "/inscriptions",
    inscription,
  );
  return data?.message || "Inscription enregistrée avec succès.";
}

/* ---------- Lecture : liste (GET /inscriptions) et détail (GET /inscriptions/{inscription}) ---------- */

/** Une inscription telle que l'application l'affiche */
export type Inscription = {
  public_key: string;
  eleve_name: string; // « KOUASSI Aya Marie »
  matricule: string;
  classe_name: string;
  niveau_name: string;
  annee_name: string;
  type: string; // NOUVELLE | REINSCRIPTION
  statut: string;
  date: string; // date brute de l'API
  est_redoublant: boolean;
  affectation: string;
  regime: string;
  decision_fin_annee: string;
  modifie_le: string;
};

/** Un lien vers une autre table : objet imbriqué { name } ou simple texte */
type Ref = { public_key?: string; name?: string; libelle?: string; firstname?: string; prenoms?: string; matricule?: string } | string | null;

type RawInscription = {
  id?: number;
  public_key?: string;
  pubkey?: string;
  eleve?: Ref;
  eleve_name?: string;
  eleve_firstname?: string;
  eleve_fullname?: string;
  eleve_matricule?: string;
  name?: string;
  firstname?: string;
  matricule?: string;
  classe?: Ref;
  classe_name?: string;
  niveau?: Ref;
  niveau_name?: string;
  niveau_actuel_name?: string;
  annee?: Ref;
  annee_name?: string;
  type?: string;
  type_inscription?: string;
  statut?: string;
  status?: string;
  date?: string;
  date_inscription?: string;
  cree_le?: string;
  created_at?: string;
  modifie_le?: string;
  modifiee_le?: string;
  updated_at?: string;
  est_redoublant?: boolean | number | string | null;
  affectation?: string;
  regime?: string;
  decision_fin_annee?: string;
};

const refName = (r: Ref | undefined) =>
  !r ? "" : typeof r === "string" ? r : (r.name ?? r.libelle ?? "");
const yes = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

function toInscription(i: RawInscription): Inscription {
  const eleve = i.eleve && typeof i.eleve === "object" ? i.eleve : null;
  const eleveName =
    i.eleve_fullname ??
    ([i.eleve_name ?? i.name ?? eleve?.name, i.eleve_firstname ?? i.firstname ?? eleve?.firstname ?? eleve?.prenoms]
      .filter(Boolean)
      .join(" ") ||
      (typeof i.eleve === "string" ? i.eleve : ""));
  return {
    public_key: i.public_key ?? i.pubkey ?? String(i.id ?? ""),
    eleve_name: eleveName,
    matricule: i.eleve_matricule ?? i.matricule ?? eleve?.matricule ?? "",
    classe_name: i.classe_name ?? refName(i.classe),
    niveau_name: i.niveau_name ?? i.niveau_actuel_name ?? refName(i.niveau),
    annee_name: i.annee_name ?? refName(i.annee),
    type: i.type ?? i.type_inscription ?? "",
    statut: i.statut ?? i.status ?? "",
    date: i.date_inscription ?? i.date ?? i.cree_le ?? i.created_at ?? "",
    est_redoublant: yes(i.est_redoublant),
    affectation: i.affectation ?? "",
    regime: i.regime ?? "",
    decision_fin_annee: i.decision_fin_annee ?? "",
    modifie_le: i.modifie_le ?? i.modifiee_le ?? i.updated_at ?? "",
  };
}

// Une inscription créée : la liste se recharge à son retour
let stale = false;
export const markInscriptionsStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takeInscriptionsStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Toutes les inscriptions, page après page : la recherche et le filtre se font dans l'application */
export async function getInscriptions() {
  if (INSCRIPTIONS_FICTIVES) {
    await pause(300);
    return fictives.map((i) => ({ ...i }));
  }
  const raw = await fetchAllPages<RawInscription>(
    "/inscriptions",
    (i) => toInscription(i).public_key,
  );
  if (__DEV__ && raw[0]) console.log("Inscription reçue (exemple) :", raw[0]); // pour caler les champs
  return raw.map(toInscription);
}

/** Une inscription. La réponse peut être enveloppée dans { data } ou non */
export async function getInscription(publicKey: string) {
  if (INSCRIPTIONS_FICTIVES) {
    await pause(200);
    const found = fictives.find((i) => i.public_key === publicKey);
    if (!found) throw new Error("Inscription introuvable");
    return { ...found };
  }
  const { data } = await api.get<{ data?: RawInscription } & RawInscription>(
    `/inscriptions/${encodeURIComponent(publicKey)}`,
  );
  const raw = (data?.data ?? data) as RawInscription;
  if (__DEV__) console.log("Inscription reçue (détail) :", raw); // pour caler les champs
  return toInscription({ ...raw, public_key: raw?.public_key ?? publicKey });
}

/* ---------- Libellés ---------- */

const label = (list: { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? humanize(v);

/** « EN_ATTENTE » → « En attente » */
export const humanize = (v: string) => {
  // Statuts courants : avec leurs accents
  const known: Record<string, string> = {
    VALIDEE: "Validée",
    VALIDE: "Validé",
    ANNULEE: "Annulée",
    REJETEE: "Rejetée",
    TERMINEE: "Terminée",
    ACTIVE: "Active",
  };
  if (known[v]) return known[v];
  const w = v.toLowerCase().replace(/_/g, " ").trim();
  return w ? w[0].toUpperCase() + w.slice(1) : "";
};

export const typeLabel = (v: string) => label(TYPES_INSCRIPTION, v);
export const affectationLabel = (v: string) => label(AFFECTATIONS, v);
export const regimeLabel = (v: string) => label(REGIMES, v);

/* ---------- Données fictives (mode INSCRIPTIONS_FICTIVES) ---------- */

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Date locale « 2026-11-17 09:30:00 », comme les dates de l'API */
const localDateTime = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const exemple = (
  n: number,
  eleve_name: string,
  matricule: string,
  classe_name: string,
  niveau_name: string,
  type: string,
  statut: string,
  date: string,
  est_redoublant = false,
): Inscription => ({
  public_key: `FICTIF-EX${n}`,
  eleve_name,
  matricule,
  classe_name,
  niveau_name,
  annee_name: "2026-2027",
  type,
  statut,
  date,
  est_redoublant,
  affectation: n % 2 ? "AFFECTE" : "NON_AFFECTE",
  regime: n % 3 ? "NON_BOURSIER" : "BOURSIER",
  decision_fin_annee: type === "REINSCRIPTION" ? "Admis en classe supérieure" : "",
  modifie_le: "",
});

// Quelques exemples pour que la liste ne soit pas vide ; les nouvelles inscriptions s'ajoutent en tête
const fictives: Inscription[] = [
  exemple(1, "KOUASSI Aya Marie", "07055027R", "6e A", "Sixième", "NOUVELLE", "VALIDEE", "2026-09-02 08:15:00"),
  exemple(2, "TRAORE Ibrahim", "08123456K", "Tle D1", "Terminale", "REINSCRIPTION", "VALIDEE", "2026-09-03 10:40:00"),
  exemple(3, "KONE Awa Fatou", "09234567M", "3e B", "Troisième", "REINSCRIPTION", "EN_ATTENTE", "2026-09-05 14:05:00", true),
  exemple(4, "YAO Konan Serge", "", "2nde C1", "Seconde", "NOUVELLE", "EN_ATTENTE", "2026-09-08 09:20:00"),
];
