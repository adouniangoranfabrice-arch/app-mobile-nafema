import { api, okMessage } from "@/api/client";
import { fetchAllPages } from "@/api/pages";
import { normalize } from "@/utils/text";

/** Corps attendu par POST /etablissements (champs optionnels omis s'ils sont vides) */
export type EtablissementInput = {
  numero?: string;
  name: string;
  abbreviation: string;
  type: string;
  catego: string;
  dren: string;
  iep?: string;
  localisation?: string;
  ville?: string;
  commune?: string;
  phone?: string;
  email_ecole?: string;
  autorisation?: string;
  civility: string;
  sexe: string;
  dir_nom: string;
  dir_prenoms: string;
  dir_phone: string;
  dir_mail: string;
  /** Généré par le serveur s'il est absent */
  mot_passe?: string;
};

export const TYPES_ETABLISSEMENT = [
  { value: "public", label: "Public" },
  { value: "prive", label: "Privé" },
  { value: "semi_prive", label: "Semi-privé" },
];

export const CATEGORIES_ETABLISSEMENT = [
  { value: "prescolaire", label: "Préscolaire" },
  { value: "primaire", label: "Primaire" },
  { value: "college", label: "Collège" },
  { value: "lycee", label: "Lycée" },
  { value: "tous", label: "Tous les cycles" },
];

export const CIVILITES = [
  { value: "M", label: "M." },
  { value: "Mme", label: "Mme" },
  { value: "Mlle", label: "Mlle" },
  { value: "Dr", label: "Dr" },
  { value: "Pr", label: "Pr" },
];

export const GENRES = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
];

/** Corps envoyé : tous les champs, comme le fait le site ; un champ vide part à null.
 * Un champ absent peut faire planter le serveur (clé lue sans vérification → erreur 500). */
function toPayload(input: EtablissementInput) {
  const body: Record<string, unknown> = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v]),
  );
  // Mot de passe vide : le serveur le génère, la clé n'est pas envoyée
  if (body.mot_passe === null) delete body.mot_passe;
  return body;
}

const PASSWORD_KEY = /(pass|mot_?de_?passe|mot_?passe|pwd)/i;

/** Masque tout mot de passe d'un objet (pour les logs) */
function hidePasswords(value: unknown, depth = 0): unknown {
  if (!value || typeof value !== "object" || depth > 4) return value;
  if (Array.isArray(value)) return value.map((v) => hidePasswords(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      k,
      PASSWORD_KEY.test(k) && typeof v === "string" && v ? "••••••" : hidePasswords(v, depth + 1),
    ]),
  );
}

/** Le mot de passe renvoyé par le serveur, où qu'il soit dans la réponse ("" s'il n'y en a pas) */
function findPassword(value: unknown, depth = 0): string {
  if (!value || typeof value !== "object" || depth > 4) return "";
  for (const [k, v] of Object.entries(value)) {
    if (PASSWORD_KEY.test(k) && typeof v === "string" && v.trim()) return v;
  }
  for (const v of Object.values(value)) {
    const found = findPassword(v, depth + 1);
    if (found) return found;
  }
  return "";
}

function logFailure(what: string, error: unknown) {
  if (!__DEV__) return;
  const e = error as { response?: { status?: number; data?: unknown } };
  console.log(
    `${what} : échec`,
    JSON.stringify(
      {
        statut: e.response?.status ?? "sans réponse (réseau)",
        reponse: hidePasswords(e.response?.data) ?? String(error),
      },
      null,
      2,
    ),
  );
}

export type CreatedEtablissement = {
  message: string;
  /** Mot de passe du gérant : celui saisi, sinon celui généré et renvoyé par le serveur ("" s'il ne le renvoie pas) */
  password: string;
};

/** Crée un établissement et son administrateur */
export async function createEtablissement(input: EtablissementInput): Promise<CreatedEtablissement> {
  const body = toPayload(input);
  if (__DEV__) console.log("Création établissement : envoi", JSON.stringify(hidePasswords(body), null, 2));
  try {
    const { data, status } = await api.post<{ success?: boolean; message?: string }>("/etablissements", body);
    if (__DEV__) {
      console.log(
        "Création établissement : réponse",
        JSON.stringify({ statut: status, reponse: hidePasswords(data) }, null, 2),
      );
    }
    const message = okMessage(data, "Établissement créé avec succès.");
    return { message, password: input.mot_passe || findPassword(data) };
  } catch (error) {
    logFailure("Création établissement", error);
    throw error;
  }
}

/** Modifie un établissement (PUT /etablissements/{etablissement}) : le mot de passe n'est jamais envoyé */
export async function updateEtablissement(publicKey: string, input: EtablissementInput) {
  const { mot_passe: _ignored, ...rest } = input;
  const body = toPayload(rest);
  if (__DEV__) console.log("Modification établissement : envoi", JSON.stringify(body, null, 2));
  try {
    const { data } = await api.put<{ success?: boolean; message?: string }>(
      `/etablissements/${encodeURIComponent(publicKey)}`,
      body,
    );
    return okMessage(data, "Établissement modifié avec succès.");
  } catch (error) {
    logFailure("Modification établissement", error);
    throw error;
  }
}

// Un établissement modifié depuis son détail : la liste se recharge à son retour
let stale = false;
export const markEtablissementsStale = () => {
  stale = true;
};
export const takeEtablissementsStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** « Collège Saint-Viateur » → « college-saint-viateur » */
export const slugify = (text: string) =>
  normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* ---------- Lecture : GET /etablissements ---------- */

/** Un établissement tel que GET /etablissements le renvoie (champs lus avec tolérance) */
export type EtablissementApi = {
  public_key: string;
  name: string;
  abbrev: string;
  /** PUBLIC | PRIVE | "" */
  type: string;
  city: string;
  /** active | pending | suspended | "" si la réponse ne le dit pas */
  status: "" | "active" | "pending" | "suspended";
};

type Named =
  { name?: string; libelle?: string; nom?: string } | string | null | undefined;

type RawEtablissement = {
  id?: number;
  public_key?: string;
  name?: string;
  nom?: string;
  libelle?: string;
  abbrev?: string;
  abbreviation?: string;
  abreviation?: string;
  sigle?: string;
  type?: string;
  type_etab?: string;
  statut_etab?: string;
  ville?: Named;
  city?: Named;
  commune?: Named;
  localite?: Named;
  localisation?: Named;
  iepp?: Named;
  iepp_name?: string;
  drena_name?: string;
  status?: string | boolean | number | null;
  statut?: string | null;
  active?: boolean | number | null;
  is_active?: boolean | number | null;
};

const named = (v: Named) =>
  !v ? "" : typeof v === "string" ? v : v.name || v.libelle || v.nom || "";

function toStatus(e: RawEtablissement): EtablissementApi["status"] {
  const flag = e.active ?? e.is_active;
  if (typeof e.status === "boolean" || typeof e.status === "number")
    return e.status ? "active" : "suspended";
  const s = String(e.status ?? e.statut ?? "").toLowerCase();
  if (/^(actif|active|valide|ouvert)/.test(s)) return "active";
  if (/(attente|pending|valider|nouveau)/.test(s)) return "pending";
  if (/(suspendu|suspended|inactif|inactive|bloque|ferme)/.test(s))
    return "suspended";
  if (flag !== undefined && flag !== null) return flag ? "active" : "suspended";
  return "";
}

const toEtablissement = (e: RawEtablissement): EtablissementApi => ({
  public_key: e.public_key ?? String(e.id ?? ""),
  name: e.name || e.nom || e.libelle || "",
  abbrev: e.abbrev || e.abbreviation || e.abreviation || e.sigle || "",
  type: e.type || e.type_etab || e.statut_etab || "",
  // Ville d'abord, puis commune, puis les autres noms possibles
  city:
    named(e.ville) ||
    named(e.city) ||
    named(e.commune) ||
    named(e.localite) ||
    e.iepp_name ||
    named(e.iepp) ||
    e.drena_name ||
    "",
  status: toStatus(e),
});

/** Tous les établissements de la plateforme (super admin) */
export async function getEtablissements() {
  const raw = await fetchAllPages<RawEtablissement>(
    "/etablissements",
    (e) => toEtablissement(e).public_key || toEtablissement(e).name,
  );
  if (__DEV__ && raw[0])
    console.log("Établissement reçu (exemple) :", JSON.stringify(raw[0])); // pour caler les champs
  return raw.map(toEtablissement);
}

/** « PUBLIC » → « Établissement public » */
export const typeEtablissementLabel = (type: string) => {
  const t = type.toLowerCase();
  if (t.startsWith("semi")) return "Établissement semi-privé";
  if (t.startsWith("pub")) return "Établissement public";
  if (t.startsWith("priv")) return "Établissement privé";
  if (t.includes("confess")) return "Établissement confessionnel";
  return type ? `Établissement ${t}` : "Établissement";
};

/* ---------- Détail : GET /etablissements/{etablissement} ---------- */

export type EtablissementDetail = {
  public_key: string;
  numero: string;
  name: string;
  /** Slug : « college-moderne-de-bieby » */
  abbrev: string;
  /** public | prive | semi_prive */
  type: string;
  /** prescolaire | primaire | college | lycee | tous */
  catego: string;
  active: boolean;
  drena_name: string;
  drena_key: string;
  iepp_name: string;
  district: string;
  localisation: string;
  city: string;
  commune: string;
  phone: string;
  email_ecole: string;
  autorisation: string;
  logo: string;
  dir_civility: string;
  dir_sexe: string;
  dir_nom: string;
  dir_full_name: string;
  dir_phone: string;
  dir_mail: string;
  created_at: string;
  updated_at: string;
};

type Text = string | number | null | undefined;

type RawEtablissementDetail = {
  public_key?: string;
  numero?: Text;
  name?: string;
  abbrev?: string;
  abbreviation?: string;
  type_etab?: string;
  type?: string;
  catego?: string;
  active?: boolean | number | string | null;
  drena_name?: string | null;
  drena_public_key?: string | null;
  dren?: Named;
  iepp_name?: string | null;
  iep?: Named;
  district?: Named;
  localisation?: string | null;
  city?: string | null;
  ville?: string | null;
  commune?: string | null;
  phone?: Text;
  email_ecole?: string | null;
  autorisation?: string | null;
  logo?: string | null;
  civility?: string | null;
  sexe?: string | null;
  dir_nom?: string | null;
  dir_prenoms?: string | null;
  dir_full_name?: string | null;
  dir_phone?: Text;
  dir_mail?: string | null;
  cree_le?: string | null;
  created_at?: string | null;
  modifie_le?: string | null;
  modifiee_le?: string | null;
  updated_at?: string | null;
};

const txt = (v: Text) => (v === null || v === undefined ? "" : String(v).trim());

export async function getEtablissement(publicKey: string): Promise<EtablissementDetail> {
  const { data } = await api.get<{ data?: RawEtablissementDetail } & RawEtablissementDetail>(
    `/etablissements/${encodeURIComponent(publicKey)}`,
  );
  const e = (data?.data ?? data) as RawEtablissementDetail;
  if (__DEV__) console.log("Établissement reçu (détail) :", JSON.stringify(e));
  return {
    public_key: e.public_key || publicKey,
    numero: txt(e.numero),
    name: txt(e.name),
    abbrev: txt(e.abbrev || e.abbreviation),
    type: txt(e.type_etab || e.type),
    catego: txt(e.catego),
    active: e.active === true || e.active === 1 || e.active === "1",
    drena_name: txt(e.drena_name) || named(e.dren),
    drena_key: txt(e.drena_public_key),
    iepp_name: txt(e.iepp_name) || named(e.iep),
    district: named(e.district),
    localisation: txt(e.localisation),
    city: txt(e.city || e.ville),
    commune: txt(e.commune),
    phone: txt(e.phone),
    email_ecole: txt(e.email_ecole),
    autorisation: txt(e.autorisation),
    logo: txt(e.logo),
    dir_civility: txt(e.civility),
    dir_sexe: txt(e.sexe),
    dir_nom: txt(e.dir_nom),
    dir_full_name:
      txt(e.dir_full_name) || [txt(e.dir_nom), txt(e.dir_prenoms)].filter(Boolean).join(" "),
    dir_phone: txt(e.dir_phone),
    dir_mail: txt(e.dir_mail),
    created_at: txt(e.cree_le || e.created_at),
    updated_at: txt(e.modifie_le || e.modifiee_le || e.updated_at),
  };
}

/** Libellé affiché d'une valeur de liste (« college » → « Collège »), sinon la valeur brute */
export const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value.toLowerCase() === value.toLowerCase())?.label ?? value;
