import { api } from "@/api/client";
import { Drena } from "@/data/drenas";

// La réponse de création donne public_key / slug / name, l'exemple de la liste pubkey / code / nom
type RawDren = {
  id?: number;
  public_key?: string;
  pubkey?: string;
  slug?: string;
  code?: string;
  name?: string;
  nom?: string;
};

type DrensResponse = {
  success: boolean;
  data: RawDren[];
  filtres: { recherche: string | null };
  pagination: {
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
};

const toDrena = (d: RawDren): Drena => ({
  id: d.id,
  public_key: d.public_key ?? d.pubkey ?? String(d.id ?? ""),
  slug: d.slug ?? d.code ?? "",
  name: d.name ?? d.nom ?? "",
});

export const PER_PAGE = 20;

/**
 * Une page de DRENA, filtrée par le serveur si une recherche est donnée.
 * `nextQuery` vient de next_page_url : le serveur décide comment on passe à la suite (page ou curseur).
 * Seule sa partie après le « ? » est reprise, pour que le token ne parte jamais vers un autre hôte.
 */
export async function getDrens(nextQuery: string | null, recherche: string) {
  const { data } = await api.get<DrensResponse>(
    nextQuery ? `/drens?${nextQuery}` : "/drens",
    { params: { per_page: PER_PAGE, recherche: recherche || undefined } },
  );
  if (__DEV__) {
    console.log(
      "DRENA reçues",
      JSON.stringify({
        champs: Object.keys(data ?? {}),
        nombre: data?.data?.length,
        premiere: data?.data?.[0],
        pagination: data?.pagination,
      }),
    );
  }
  return {
    drenas: data.data.map(toDrena),
    nextQuery: data.pagination.next_page_url?.split("?")[1] ?? null,
    // last_page ne compte en pages de 20 que si le serveur a bien appliqué per_page
    pageCount:
      Number(data.pagination.per_page) === PER_PAGE
        ? Number(data.pagination.last_page) || null
        : null,
  };
}

/** Toutes les DRENA, page après page : pour les listes de choix des formulaires */
export async function getAllDrens() {
  let all: Drena[] = [];
  let query: string | null = null;
  do {
    const page: Awaited<ReturnType<typeof getDrens>> = await getDrens(query, "");
    const merged = appendDrenas(all, page.drenas);
    // Une page sans rien de nouveau : on s'arrête, sinon on redemanderait sans fin
    query = merged.length > all.length ? page.nextQuery : null;
    all = merged;
  } while (query);
  return all;
}

/** Crée une DRENA et renvoie le message de confirmation du serveur */
export async function createDren(dren: Omit<Drena, "public_key">) {
  const { data } = await api.post<{ message: string }>("/drens", dren);
  return data.message;
}

export async function updateDren(dren: string, data: Omit<Drena, "public_key">) {
  await api.put(`/drens/${dren}`, data);
}

export async function deleteDren(dren: string) {
  await api.delete(`/drens/${dren}`);
}

/** Ajoute une page à la liste sans jamais répéter une DRENA déjà présente */
export function appendDrenas(current: Drena[], page: Drena[]) {
  const seen = new Set(current.map((d) => d.public_key));
  const fresh = page.filter((d) => {
    if (seen.has(d.public_key)) return false;
    seen.add(d.public_key);
    return true;
  });
  return [...current, ...fresh];
}
