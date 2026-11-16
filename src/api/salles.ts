import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Salle = {
  public_key: string;
  code: string;
  name: string;
  capacite: number | null;
  type_salle: string;
  etab_public_key: string;
  etab_name: string;
  /** Dates brutes de l'API ("" si absentes) */
  created_at: string;
  updated_at: string;
};

/** Salle telle que renvoyée par l'API : ancien format (code, capacite) ou nouveau (slug, capacity) */
type RawSalle = {
  public_key: string;
  name?: string;
  libelle?: string;
  code?: string;
  slug?: string;
  capacite?: number | string | null;
  capacity?: number | string | null;
  type_salle?: string | null;
  etab_public_key?: string;
  etab_name?: string;
  etablissement?: { public_key?: string; name?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
  cree_le?: string | null;
  modifie_le?: string | null;
};

function toSalle(s: RawSalle): Salle {
  const places = s.capacity ?? s.capacite;
  const n = places === null || places === undefined || places === "" ? NaN : Number(places);
  return {
    public_key: s.public_key,
    code: s.slug ?? s.code ?? "",
    name: s.name ?? s.libelle ?? "",
    capacite: Number.isFinite(n) ? n : null,
    type_salle: s.type_salle ?? "",
    etab_public_key: s.etab_public_key ?? s.etablissement?.public_key ?? "",
    etab_name: s.etab_name ?? s.etablissement?.name ?? "",
    created_at: s.created_at ?? s.cree_le ?? "",
    updated_at: s.updated_at ?? s.modifie_le ?? "",
  };
}

// Une salle modifiée depuis son détail : la liste se recharge à son retour
let stale = false;
export const markSallesStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takeSallesStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Toutes les salles, page après page : la recherche se fait dans l'application */
export async function getSalles() {
  const raw = await fetchAllPages<RawSalle>("/salles", (s) => s.public_key);
  return raw.map(toSalle);
}

/**
 * Une seule salle, plus complète que la liste (dates de création et de modification).
 * La réponse peut être enveloppée dans { data } ou non.
 */
export async function getSalle(publicKey: string) {
  const { data } = await api.get<{ data?: RawSalle } & Partial<RawSalle>>(
    `/salles/${encodeURIComponent(publicKey)}`,
  );
  const raw = (data?.data ?? data) as RawSalle;
  return toSalle({ ...raw, public_key: raw?.public_key ?? publicKey });
}

/** Corps attendu par POST /salles et PUT /salles/{salle} */
export type SalleInput = {
  slug: string;
  name: string;
  capacity: number;
  type_salle: string;
};

/** Crée une salle et renvoie le message de confirmation du serveur */
export async function createSalle(salle: SalleInput) {
  const { data } = await api.post<{ message: string }>("/salles", salle);
  return data.message;
}

/** Modifie une salle (identifiée par sa public_key) et renvoie le message du serveur s'il y en a un */
export async function updateSalle(publicKey: string, salle: SalleInput) {
  const { data } = await api.put<{ message?: string }>(
    `/salles/${encodeURIComponent(publicKey)}`,
    salle,
  );
  return data?.message || "Salle modifiée avec succès.";
}
