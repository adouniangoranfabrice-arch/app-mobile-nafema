import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

/** Une IEPP telle que renvoyée par GET /iepps */
export type Iepp = {
  public_key: string;
  slug: string;
  name: string;
  dren_public_key: string;
  dren_slug: string;
  dren_name: string;
  /** Dates brutes de l'API ("" si absentes) */
  created_at: string;
  updated_at: string;
};

type RawIepp = Partial<Iepp> & {
  code?: string;
  nom?: string;
  cree_le?: string | null;
  modifie_le?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const toIepp = (i: RawIepp): Iepp => ({
  public_key: i.public_key ?? "",
  slug: i.slug ?? i.code ?? "",
  name: i.name ?? i.nom ?? "",
  dren_public_key: i.dren_public_key ?? "",
  dren_slug: i.dren_slug ?? "",
  dren_name: i.dren_name ?? "",
  created_at: i.created_at ?? i.cree_le ?? "",
  updated_at: i.updated_at ?? i.modifie_le ?? "",
});

// Une IEPP modifiée ou supprimée depuis son détail : la liste se recharge à son retour
let stale = false;
export const markIeppsStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takeIeppsStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Toutes les IEPP, page après page : la recherche et le filtre se font dans l'application */
export async function getIepps() {
  const raw = await fetchAllPages<RawIepp>("/iepps", (i) => i.public_key ?? "");
  return raw.map(toIepp);
}

/** Corps attendu par POST /iepps et PUT /iepps/{iepp} : drena est la public_key de la DRENA */
export type IeppInput = {
  drena: string;
  slug: string;
  name: string;
};

/** Crée une IEPP et renvoie le message de confirmation du serveur */
export async function createIepp(iepp: IeppInput) {
  const { data } = await api.post<{ message?: string }>("/iepps", iepp);
  return data?.message || "IEPP créée avec succès.";
}

/** Modifie une IEPP et renvoie le message du serveur s'il y en a un */
export async function updateIepp(publicKey: string, iepp: IeppInput) {
  const { data } = await api.put<{ message?: string }>(
    `/iepps/${encodeURIComponent(publicKey)}`,
    iepp,
  );
  return data?.message || "IEPP modifiée avec succès.";
}

/** Supprime une IEPP et renvoie le message du serveur s'il y en a un */
export async function deleteIepp(publicKey: string) {
  const { data } = await api.delete<{ message?: string }>(
    `/iepps/${encodeURIComponent(publicKey)}`,
  );
  return data?.message || "IEPP supprimée avec succès.";
}
