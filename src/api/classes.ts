import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Classe = {
  public_key: string;
  name: string;
  max_effectif: number | null;
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
type Ref = { public_key?: string; name?: string; libelle?: string } | string | null;

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
  !r ? "" : typeof r === "string" ? r : (r.name ?? r.libelle ?? "");
const refKey = (r: Ref | undefined) =>
  r && typeof r === "object" ? (r.public_key ?? "") : "";

function toClasse(c: RawClasse): Classe {
  const max =
    c.max_effectif === null || c.max_effectif === undefined || c.max_effectif === ""
      ? NaN
      : Number(c.max_effectif);
  return {
    public_key: c.public_key ?? c.pubkey ?? String(c.id ?? ""),
    name: c.name ?? c.libelle ?? "",
    max_effectif: Number.isFinite(max) ? max : null,
    annee_name: c.annee_name ?? refName(c.annee),
    niveau_name: c.niveau_name ?? refName(c.niveau),
    serie_name: c.serie_name ?? c.serie_libelle ?? refName(c.serie),
    salle_name: c.salle_name ?? c.salle_libelle ?? refName(c.salle),
    niveau_slug: c.niveau_slug ?? "",
    salle_slug: c.salle_slug ?? "",
    annee_key: c.annee_public_key ?? refKey(c.annee),
    niveau_key: c.niveau_public_key ?? refKey(c.niveau),
    serie_key: c.serie_public_key ?? refKey(c.serie),
    salle_key: c.salle_public_key ?? refKey(c.salle),
    etab_name: c.etab_name ?? refName(c.etablissement),
    etab_key:
      c.etablissement_public_key ?? c.etab_public_key ?? refKey(c.etablissement),
    created_at: c.created_at ?? c.cree_le ?? "",
    updated_at: c.updated_at ?? c.modifiee_le ?? c.modifie_le ?? "",
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

/** Corps attendu par POST /classes : annee, niveau, serie et salle sont des public_key (serie absente si la classe n'en a pas) */
export type ClasseInput = {
  annee: string;
  niveau: string;
  serie?: string;
  salle: string;
  name: string;
  max_effectif: number;
};

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
