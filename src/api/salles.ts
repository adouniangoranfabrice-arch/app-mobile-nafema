import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Salle = {
  public_key: string;
  code: string;
  name: string;
  capacite: number | null;
  etab_public_key: string;
  etab_name: string;
};

/** Toutes les salles, page après page : la recherche se fait dans l'application */
export function getSalles() {
  return fetchAllPages<Salle>("/salles", (s) => s.public_key);
}

/** Crée une salle et renvoie le message de confirmation du serveur */
export async function createSalle(salle: {
  code: string;
  libelle: string;
  capacite?: number;
}) {
  const { data } = await api.post<{ message: string }>("/salles", salle);
  return data.message;
}
