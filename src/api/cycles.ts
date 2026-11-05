import { api } from "@/api/client";

export type Cycle = {
  public_key: string;
  abbreviation: string;
  name: string;
  order: number;
};

type CyclesResponse = {
  success: boolean;
  data: Cycle[];
  pagination: {
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
};

const PER_PAGE = 20;

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
  const all = new Map<string, Cycle>();
  let query: string | null = null;
  do {
    const response: { data: CyclesResponse } = await api.get<CyclesResponse>(
      query ? `/cycles?${query}` : "/cycles",
      { params: { per_page: PER_PAGE } },
    );
    const before = all.size;
    response.data.data.forEach((c) => all.set(c.public_key, c));
    // Une page sans rien de nouveau : on s'arrête, sinon on redemanderait sans fin
    query =
      all.size > before
        ? (response.data.pagination.next_page_url?.split("?")[1] ?? null)
        : null;
  } while (query);
  return [...all.values()].sort((a, b) => a.order - b.order);
}

/** Crée un cycle et renvoie le message de confirmation du serveur */
export async function createCycle(cycle: Omit<Cycle, "public_key">) {
  const { data } = await api.post<{ message: string }>("/cycles", cycle);
  return data.message;
}

export async function deleteCycle(publicKey: string) {
  await api.delete(`/cycles/${publicKey}`);
}
