import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Serie = {
  public_key: string;
  code: string;
  libelle: string;
  type: string | null;
  cycle_id: number | null;
  cycle_public_key: string;
  cycle_slug: string;
  cycle_name: string;
};

/** Série telle que renvoyée par l'API : ancien format (code, libelle, type) ou nouveau (slug, name, type_serie) */
type RawSerie = {
  public_key: string;
  code?: string;
  slug?: string;
  libelle?: string;
  name?: string;
  type?: string | null;
  type_serie?: string | null;
  cycle_id?: number | null;
  cycle_public_key?: string;
  cycle_slug?: string;
  cycle_name?: string;
};

function toSerie(s: RawSerie): Serie {
  return {
    public_key: s.public_key,
    code: s.slug ?? s.code ?? "",
    libelle: s.name ?? s.libelle ?? "",
    type: s.type_serie ?? s.type ?? null,
    cycle_id: s.cycle_id ?? null,
    cycle_public_key: s.cycle_public_key ?? "",
    cycle_slug: s.cycle_slug ?? "",
    cycle_name: s.cycle_name ?? "",
  };
}

/** Toutes les séries, page après page : la recherche et le filtre se font dans l'application */
export async function getSeries() {
  const raw = await fetchAllPages<RawSerie>("/series", (s) => s.public_key);
  return raw.map(toSerie);
}

/** Corps attendu par POST /series */
export type SerieInput = {
  slug: string;
  name: string;
  type_serie: string;
};

/** Crée une série et renvoie le message de confirmation du serveur */
export async function createSerie(serie: SerieInput) {
  const { data } = await api.post<{ message: string }>("/series", serie);
  return data.message;
}
