import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Serie = {
  public_key: string;
  code: string;
  libelle: string;
  type: string | null;
  cycle_id: number;
  cycle_public_key: string;
  cycle_slug: string;
  cycle_name: string;
};

/** Toutes les séries, page après page : la recherche et le filtre se font dans l'application */
export function getSeries() {
  return fetchAllPages<Serie>("/series", (s) => s.public_key);
}

/** Crée une série et renvoie le message de confirmation du serveur */
export async function createSerie(serie: {
  code: string;
  libelle: string;
  type?: string;
  cycle_id: number | string;
}) {
  const { data } = await api.post<{ message: string }>("/series", serie);
  return data.message;
}
