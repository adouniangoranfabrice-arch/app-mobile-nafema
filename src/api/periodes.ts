import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Periode = {
  public_key: string;
  ordre: number;
  name: string;
  type: string;
  debut: string;
  fin: string;
  is_locked: number | boolean;
  annee_public_key: string;
  annee_name: string;
  cycle_public_key: string;
  cycle_slug: string;
  cycle_name: string;
  cree_le: string;
};

/** Ce qu'on envoie pour créer ou modifier une période */
export type PeriodeData = {
  annee: string; // public_key de l'année
  cycle: string; // public_key du cycle
  ordre: number;
  name: string;
  type: string;
  debut: string;
  fin: string;
  is_locked: boolean;
};

let stale = false;

/** À appeler après un changement fait depuis un autre écran : la liste se recharge à son retour */
export const markPeriodesStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takePeriodesStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Toutes les périodes, page après page : la recherche se fait dans l'application */
export function getPeriodes() {
  return fetchAllPages<Periode>("/periodes", (p) => p.public_key);
}

/** Crée une période et renvoie le message de confirmation du serveur */
export async function createPeriode(periode: PeriodeData) {
  const { data } = await api.post<{ message: string }>("/periodes", periode);
  return data.message;
}

export async function updatePeriode(publicKey: string, periode: PeriodeData) {
  await api.put(`/periodes/${publicKey}`, periode);
}

export async function deletePeriode(publicKey: string) {
  await api.delete(`/periodes/${publicKey}`);
}
