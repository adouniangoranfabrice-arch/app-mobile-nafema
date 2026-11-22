import { api, okMessage } from "@/api/client";
import { fetchAllPages } from "@/api/pages";
import { Platform } from "react-native";
import { normalize } from "@/utils/text";

/**
 * Corps de POST /inscriptions, identique au formulaire du site.
 * eleve, niveau_precedant, niveau_actuel et serie sont des public_key ; birth_day est au format « 2015-03-12 ».
 * Un champ non rempli part vide ("") : le serveur le traite comme absent.
 */
export type InscriptionInput = {
  type_ins: string; // nouvelle | reinscription
  eleve: string; // public_key de l'élève déjà inscrit (réinscription)
  // Identité
  name: string;
  firstname: string;
  birth_day: string;
  birth_of: string;
  gender: string; // M | F
  nationality: string;
  national_mat: string;
  numero_extrait: string;
  photo: string | null;
  residence: string; // Résidence (ville / commune)
  city: string; // Quartier
  phone: string;
  groupe_sang: string;
  observat_medic: string;
  ancien_ecole: string;
  // Parent ou tuteur
  nom_parent: string;
  prenoms_parent: string;
  phone_parent: string;
  lien_parent: string;
  job_parent: string;
  // Scolarité
  niveau_precedant: string;
  niveau_actuel: string;
  serie: string;
  affectation: string; // affecte | non_affecte
  regime_eleve: string; // boursier | non_boursier
  type_paiement: string; // total | tranche
  lang_v1: string;
  lang_v2: string;
  redoublant: boolean;
  decision_finale: string;
  sortie_le: string;
  motif_sort: string;
  frais_optionnels: string[]; // public_key des frais facultatifs choisis
};

/** Valeurs proposées dans le formulaire (valeurs exactes du site) */
export const TYPES_INSCRIPTION = [
  { value: "nouvelle", label: "Nouvelle" },
  { value: "reinscription", label: "Réinscription" },
];
export const AFFECTATIONS = [
  { value: "affecte", label: "Affecté" },
  { value: "non_affecte", label: "Non affecté" },
];
export const REGIMES = [
  { value: "non_boursier", label: "Non boursier" },
  { value: "boursier", label: "Boursier" },
];
export const TYPES_PAIEMENT = [
  { value: "total", label: "Total" },
  { value: "tranche", label: "Par tranches" },
];
export const LIENS_PARENT = [
  { value: "PERE", label: "Père" },
  { value: "MERE", label: "Mère" },
  { value: "ONCLE", label: "Oncle" },
  { value: "TANTE", label: "Tante" },
  { value: "GRAND-PERE", label: "Grand-père" },
  { value: "GRANDE-MERE", label: "Grande-mère" },
  { value: "FRERE", label: "Frère" },
  { value: "Soeur", label: "Soeur" },
  { value: "TUTEUR/TUTRICE", label: "Tuteur/Tutrice" },
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

export const GROUPES_SANGUINS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

/**
 * Mode fictif : les inscriptions sont gardées dans l'application (en mémoire) au lieu du serveur,
 * en attendant que POST /inscriptions fonctionne. Passer à false pour utiliser la vraie API.
 * Les listes du formulaire (années, niveaux, classes) restent celles de la base.
 */
export const INSCRIPTIONS_FICTIVES = false;

/** Noms à afficher dans la liste : la requête ne contient que des clés */
export type InscriptionDisplay = {
  eleve_name: string;
  matricule: string;
  classe_name: string;
  niveau_name: string;
  annee_name: string;
};

/** Photo de l'élève choisie sur le téléphone (facultative) */
export type PhotoFile = { uri: string; name: string; type: string };

/** Corps multipart : booléens en 1/0, liste en champ[] , photo en fichier */
async function toFormData(inscription: InscriptionInput, photo: PhotoFile) {
  const form = new FormData();
  for (const [key, value] of Object.entries(inscription)) {
    if (key === "photo" || value === null || value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => form.append(`${key}[]`, String(v)));
    else if (typeof value === "boolean") form.append(key, value ? "1" : "0");
    else form.append(key, String(value));
  }
  if (Platform.OS === "web") {
    // Sur le web, l'image choisie est une URL locale : on envoie son contenu
    const blob = await (await fetch(photo.uri)).blob();
    form.append("photo", blob, photo.name);
  } else {
    // Sur Android / iOS, React Native lit le fichier à partir de son uri
    form.append("photo", photo as unknown as Blob);
  }
  return form;
}

/** Inscrit un élève et renvoie le message de confirmation */
export async function createInscription(
  inscription: InscriptionInput,
  display: InscriptionDisplay,
  photo?: PhotoFile | null,
) {
  if (INSCRIPTIONS_FICTIVES) {
    await pause(500); // comme un aller-retour réseau
    const now = new Date();
    fictives.unshift({
      public_key: `FICTIF-${now.getTime()}`,
      ...display,
      type: inscription.type_ins,
      statut: "EN_ATTENTE",
      date: localDateTime(now),
      est_redoublant: inscription.redoublant,
      affectation: inscription.affectation,
      regime: inscription.regime_eleve,
      decision_fin_annee: inscription.decision_finale,
      modifie_le: "",
    });
    return "Inscription enregistrée (mode fictif, en attendant le serveur).";
  }
  if (__DEV__)
    console.log("Inscription : envoi", JSON.stringify(inscription), photo ? `+ photo ${photo.name}` : "sans photo");
  try {
    // Avec une photo, le corps part en multipart (comme le formulaire du site) ; sinon en JSON
    const body = photo ? await toFormData(inscription, photo) : inscription;
    const { data } = await api.post("/inscriptions", body, {
      ...(photo ? { headers: { "Content-Type": "multipart/form-data" }, timeout: 60000 } : {}),
    });
    if (__DEV__) console.log("Inscription : réponse", JSON.stringify(data));
    return okMessage(data, "Inscription enregistrée avec succès.");
  } catch (error) {
    if (__DEV__) {
      const e = error as { response?: { status?: number; data?: unknown } };
      console.log(
        "Inscription : échec",
        e.response?.status,
        JSON.stringify(e.response?.data ?? String(error)),
      );
    }
    throw error;
  }
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
type Ref =
  | {
      public_key?: string;
      name?: string;
      libelle?: string;
      firstname?: string;
      prenoms?: string;
      matricule?: string;
    }
  | string
  | null;

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
  type_ins?: string;
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
  regime_eleve?: string;
  redoublant?: boolean | number | string | null;
  decision_fin_annee?: string;
  decision_finale?: string;
};

const refName = (r: Ref | undefined) =>
  !r ? "" : typeof r === "string" ? r : (r.name ?? r.libelle ?? "");
const yes = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

function toInscription(i: RawInscription): Inscription {
  const eleve = i.eleve && typeof i.eleve === "object" ? i.eleve : null;
  const eleveName =
    i.eleve_fullname ??
    ([
      i.eleve_name ?? i.name ?? eleve?.name,
      i.eleve_firstname ?? i.firstname ?? eleve?.firstname ?? eleve?.prenoms,
    ]
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
    // « nouvelle » / « reinscription » → NOUVELLE / REINSCRIPTION, comme les filtres de la liste
    type: (i.type_ins ?? i.type ?? i.type_inscription ?? "").toUpperCase(),
    statut: i.statut ?? i.status ?? "",
    date: i.date_inscription ?? i.date ?? i.cree_le ?? i.created_at ?? "",
    est_redoublant: yes(i.est_redoublant ?? i.redoublant),
    affectation: i.affectation ?? "",
    regime: i.regime_eleve ?? i.regime ?? "",
    decision_fin_annee: i.decision_finale ?? i.decision_fin_annee ?? "",
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

/** Supprime une inscription (DELETE /inscriptions/{inscription}) */
export async function deleteInscription(publicKey: string) {
  const { data } = await api.delete(`/inscriptions/${encodeURIComponent(publicKey)}`);
  return okMessage(data, "Inscription supprimée avec succès.");
}

/* ---------- Libellés ---------- */

const label = (list: { value: string; label: string }[], v: string) =>
  list.find((x) => x.value.toLowerCase() === v.toLowerCase())?.label ??
  humanize(v);

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
    PREINSCRIT: "Préinscrit",
    PREINSCRITE: "Préinscrite",
    INSCRIT: "Inscrit",
    INSCRITE: "Inscrite",
    ANNULE: "Annulé",
  };
  const k = normalize(v).toUpperCase();
  if (known[k]) return known[k];
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
  decision_fin_annee:
    type === "REINSCRIPTION" ? "Admis en classe supérieure" : "",
  modifie_le: "",
});

// Quelques exemples pour que la liste ne soit pas vide ; les nouvelles inscriptions s'ajoutent en tête
const fictives: Inscription[] = [
  exemple(
    1,
    "KOUASSI Aya Marie",
    "07055027R",
    "6e A",
    "Sixième",
    "NOUVELLE",
    "VALIDEE",
    "2026-09-02 08:15:00",
  ),
  exemple(
    2,
    "TRAORE Ibrahim",
    "08123456K",
    "Tle D1",
    "Terminale",
    "REINSCRIPTION",
    "VALIDEE",
    "2026-09-03 10:40:00",
  ),
  exemple(
    3,
    "KONE Awa Fatou",
    "09234567M",
    "3e B",
    "Troisième",
    "REINSCRIPTION",
    "EN_ATTENTE",
    "2026-09-05 14:05:00",
    true,
  ),
  exemple(
    4,
    "YAO Konan Serge",
    "",
    "2nde C1",
    "Seconde",
    "NOUVELLE",
    "EN_ATTENTE",
    "2026-09-08 09:20:00",
  ),
];
