import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Classe = {
  public_key: string;
  name: string;
  max_effectif: number | null;
  min_effectif: number | null;
  total_effectif: number | null;
  effectif_actuel: number | null;
  /** Statut brut de l'API : « ferme », « ouvert »… ("" si absent) */
  status: string;
  /** Langue vivante 2 (code envoyé à l'API, "" si aucune) */
  lang_v2: string;
  annee_name: string;
  niveau_name: string;
  serie_name: string;
  salle_name: string;
  /** Codes affichés entre parenthèses, comme sur le site : « B2 (SALLE-B2) » ("" si absents) */
  niveau_slug: string;
  salle_slug: string;
  /** public_key des éléments liés ("" si la liste ne les donne pas) : pour pré-remplir la modification */
  annee_key: string;
  niveau_key: string;
  serie_key: string;
  salle_key: string;
  etab_name: string;
  /** public_key de l'établissement de la classe ("" si la liste ne le donne pas) */
  etab_key: string;
  /** Dates brutes de l'API ("" si absentes) */
  created_at: string;
  updated_at: string;
};

/** Un lien vers une autre table : objet imbriqué { public_key, name } ou simple texte */
type Ref =
  | {
      public_key?: string;
      name?: string;
      libelle?: string;
      nom?: string;
      slug?: string;
      code?: string;
    }
  | string
  | null;

/**
 * Classe telle que renvoyée par l'API. Le format exact de la liste n'est pas encore connu :
 * on accepte les champs à plat (niveau_name, niveau_public_key…) comme les objets imbriqués (niveau: { … }).
 */
type RawClasse = {
  id?: number;
  public_key?: string;
  pubkey?: string;
  name?: string;
  libelle?: string;
  max_effectif?: number | string | null;
  min_effectif?: number | string | null;
  total_effectif?: number | string | null;
  effectif_actuel?: number | string | null;
  status?: string | null;
  statut?: string | null;
  lang_v2?: string | null;
  annee?: Ref;
  annee_name?: string;
  annee_public_key?: string;
  niveau?: Ref;
  niveau_name?: string;
  niveau_public_key?: string;
  serie?: Ref;
  serie_name?: string;
  serie_public_key?: string;
  salle?: Ref;
  salle_name?: string;
  salle_libelle?: string;
  salle_nom?: string;
  salle_code?: string;
  date_creation?: string | null;
  date_modification?: string | null;
  salle_slug?: string;
  niveau_slug?: string;
  serie_libelle?: string;
  salle_public_key?: string;
  etablissement?: Ref;
  etab_name?: string;
  etablissement_public_key?: string;
  etab_public_key?: string;
  created_at?: string | null;
  updated_at?: string | null;
  cree_le?: string | null;
  modifie_le?: string | null;
  modifiee_le?: string | null; // nom utilisé par GET /classes/{classe}
};

const refName = (r: Ref | undefined) =>
  !r ? "" : typeof r === "string" ? r : (r.name ?? r.libelle ?? r.nom ?? "");
const refCode = (r: Ref | undefined) =>
  r && typeof r === "object" ? (r.slug ?? r.code ?? "") : "";
const refKey = (r: Ref | undefined) =>
  r && typeof r === "object" ? (r.public_key ?? "") : "";

/** Nombre ou null (champ absent, vide ou invalide) */
const toCount = (v: number | string | null | undefined) => {
  const n = v === null || v === undefined || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

function toClasse(c: RawClasse): Classe {
  return {
    public_key: c.public_key ?? c.pubkey ?? String(c.id ?? ""),
    name: c.name ?? c.libelle ?? "",
    max_effectif: toCount(c.max_effectif),
    min_effectif: toCount(c.min_effectif),
    total_effectif: toCount(c.total_effectif),
    effectif_actuel: toCount(c.effectif_actuel),
    status: c.status ?? c.statut ?? "",
    lang_v2: c.lang_v2 ?? "",
    annee_name: c.annee_name ?? refName(c.annee),
    niveau_name: c.niveau_name ?? refName(c.niveau),
    serie_name: c.serie_name ?? c.serie_libelle ?? refName(c.serie),
    // || : un champ présent mais vide (null, "") laisse la place au suivant
    salle_name:
      c.salle_name || c.salle_libelle || c.salle_nom || refName(c.salle),
    niveau_slug: c.niveau_slug ?? "",
    salle_slug: c.salle_slug || c.salle_code || refCode(c.salle),
    annee_key: c.annee_public_key ?? refKey(c.annee),
    niveau_key: c.niveau_public_key ?? refKey(c.niveau),
    serie_key: c.serie_public_key ?? refKey(c.serie),
    salle_key: c.salle_public_key ?? refKey(c.salle),
    etab_name: c.etab_name ?? refName(c.etablissement),
    etab_key:
      c.etablissement_public_key ??
      c.etab_public_key ??
      refKey(c.etablissement),
    created_at: c.created_at || c.cree_le || c.date_creation || "",
    updated_at:
      c.updated_at ||
      c.modifiee_le ||
      c.modifie_le ||
      c.date_modification ||
      "",
  };
}

// Une classe modifiée ou supprimée depuis son détail : la liste se recharge à son retour
let stale = false;
export const markClassesStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takeClassesStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Toutes les classes, page après page : la recherche se fait dans l'application */
export async function getClasses() {
  const raw = await fetchAllPages<RawClasse>(
    "/classes",
    (c) => toClasse(c).public_key,
  );
  if (__DEV__ && raw[0]) console.log("Classe reçue (exemple) :", raw[0]); // pour caler les champs
  return raw.map(toClasse);
}

/**
 * Une seule classe, plus complète que la liste (salle, série, dates).
 * La réponse peut être enveloppée dans { data } ou non.
 */
export async function getClasse(publicKey: string) {
  const { data } = await api.get<{ data?: RawClasse } & RawClasse>(
    `/classes/${encodeURIComponent(publicKey)}`,
  );
  const raw = (data?.data ?? data) as RawClasse;
  if (__DEV__) console.log("Classe reçue (détail) :", raw); // pour caler les champs
  return toClasse({ ...raw, public_key: raw?.public_key ?? publicKey });
}

/**
 * Corps attendu par POST et PUT /classes : niveau, serie et salle sont des public_key.
 * serie et lang_v2 sont absents quand la classe n'en a pas. L'année n'est plus envoyée : le serveur prend l'année en cours.
 */
export type ClasseInput = {
  niveau: string;
  serie?: string;
  salle: string;
  name: string;
  min_effectif: number;
  max_effectif: number;
  lang_v2?: string;
};

/** Langues vivantes 2 : valeurs exactes attendues par l'API (comme le site web) */
export const LANGUES_V2 = [
  { value: "Espagnol", label: "Espagnol" },
  { value: "Allemand", label: "Allemand" },
];

/** « ferme » → Fermée (rouge), « ouvert » → Ouverte (vert) ; autre valeur : affichée telle quelle */
export function classeStatus(raw: string) {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.startsWith("ferm") || v === "closed")
    return { label: "Fermée", open: false };
  if (v.startsWith("ouv") || v === "open")
    return { label: "Ouverte", open: true };
  return {
    label: raw[0].toUpperCase() + raw.slice(1).replace(/_/g, " "),
    open: null,
  };
}

/** La valeur de la liste qui correspond, sans tenir compte des majuscules (« ALLEMAND » → « Allemand ») */
export const langueV2Value = (v: string) =>
  LANGUES_V2.find((l) => l.value.toLowerCase() === v.trim().toLowerCase())?.value ?? v;

/** Libellé affiché ; une valeur inconnue est affichée telle quelle */
export const langueV2Label = (v: string) =>
  LANGUES_V2.find((l) => l.value === langueV2Value(v))?.label ?? v;

/** Crée une classe et renvoie le message de confirmation du serveur */
export async function createClasse(classe: ClasseInput) {
  const { data } = await api.post<{ message?: string }>("/classes", classe);
  return data?.message || "Classe créée avec succès.";
}

/** Modifie une classe (PUT /classes/{classe}) et renvoie le message du serveur s'il y en a un */
export async function updateClasse(publicKey: string, classe: ClasseInput) {
  const { data } = await api.put<{ message?: string }>(
    `/classes/${encodeURIComponent(publicKey)}`,
    classe,
  );
  return data?.message || "Classe modifiée avec succès.";
}

/** Supprime une classe (DELETE /classes/{classe}) et renvoie le message du serveur s'il y en a un */
export async function deleteClasse(publicKey: string) {
  const { data } = await api.delete<{ message?: string }>(
    `/classes/${encodeURIComponent(publicKey)}`,
  );
  return data?.message || "Classe supprimée avec succès.";
}
