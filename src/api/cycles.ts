import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Cycle = {
  public_key: string;
  abbreviation: string;
  name: string;
  order: number;
};

let stale = false;

/** À appeler après un changement fait depuis un autre écran : la liste se recharge à son retour */
export const markCyclesStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takeCyclesStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Tous les cycles, page après page : ils sont peu nombreux et la recherche se fait dans l'application */
export async function getCycles() {
  const all = await fetchAllPages<Cycle>("/cycles", (c) => c.public_key);
  return all.sort((a, b) => a.order - b.order);
}

/** Crée un cycle et renvoie le message de confirmation du serveur */
export async function createCycle(cycle: Omit<Cycle, "public_key">) {
  const { data } = await api.post<{ message: string }>("/cycles", cycle);
  return data.message;
}

export async function updateCycle(
  publicKey: string,
  cycle: Omit<Cycle, "public_key">,
) {
  await api.put(`/cycles/${publicKey}`, cycle);
}

export async function deleteCycle(publicKey: string) {
  await api.delete(`/cycles/${publicKey}`);
}
