import { api } from "@/api/client";

export type Niveau = {
  public_key: string;
  abbreviation: string;
  name: string;
  order: number;
  cycle_public_key: string;
  cycle_name: string;
  cree_le: string;
};

// La réponse de création donne public_key / abbreviation / name / order,
// l'exemple de la liste pubkey / code / libelle / ordre
type RawNiveau = {
  id?: number;
  public_key?: string;
  pubkey?: string;
  abbreviation?: string;
  code?: string;
  name?: string;
  libelle?: string;
  order?: number;
  ordre?: number;
  cycle_public_key?: string;
  cycle_name?: string;
  cree_le?: string;
};

type NiveauxResponse = {
  success: boolean;
  data: RawNiveau[];
  pagination: { next_page_url: string | null };
};

const toNiveau = (n: RawNiveau): Niveau => ({
  public_key: n.public_key ?? n.pubkey ?? String(n.id ?? ""),
  abbreviation: n.abbreviation ?? n.code ?? "",
  name: n.name ?? n.libelle ?? "",
  order: n.order ?? n.ordre ?? 0,
  cycle_public_key: n.cycle_public_key ?? "",
  cycle_name: n.cycle_name ?? "",
  cree_le: n.cree_le ?? "",
});

const PER_PAGE = 20;

/** Tous les niveaux, page après page : la recherche et le filtre se font dans l'application */
export async function getNiveaux() {
  const all = new Map<string, Niveau>();
  let query: string | null = null;
  do {
    const response: { data: NiveauxResponse } = await api.get<NiveauxResponse>(
      query ? `/niveaux?${query}` : "/niveaux",
      { params: { per_page: PER_PAGE } },
    );
    const before = all.size;
    response.data.data.map(toNiveau).forEach((n) => all.set(n.public_key, n));
    // Une page sans rien de nouveau : on s'arrête, sinon on redemanderait sans fin
    query =
      all.size > before
        ? (response.data.pagination.next_page_url?.split("?")[1] ?? null)
        : null;
  } while (query);
  return [...all.values()];
}

/** Crée un niveau et renvoie le message de confirmation du serveur */
export async function createNiveau(niveau: {
  cycle: string; // public_key du cycle
  abbreviation: string;
  name: string;
  order: number;
}) {
  const { data } = await api.post<{ message: string }>("/niveaux", niveau);
  return data.message;
}
