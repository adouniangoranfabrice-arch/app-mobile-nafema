import { api } from "@/api/client";

type PageResponse<T> = {
  data: T[];
  pagination: { next_page_url: string | null };
};

const PER_PAGE = 20;

/**
 * Tous les éléments d'une liste de l'API, page après page, sans doublon.
 * Le lien next_page_url décide comment on passe à la suite (page ou curseur) :
 * seule sa partie après le « ? » est reprise, pour que le token ne parte jamais vers un autre hôte.
 */
export async function fetchAllPages<T>(
  path: string,
  keyOf: (item: T) => string,
) {
  const all = new Map<string, T>();
  let query: string | null = null;
  do {
    const response: { data: PageResponse<T> } = await api.get<PageResponse<T>>(
      query ? `${path}?${query}` : path,
      { params: { per_page: PER_PAGE } },
    );
    const before = all.size;
    response.data.data.forEach((item) => all.set(keyOf(item), item));
    // Une page sans rien de nouveau : on s'arrête, sinon on redemanderait sans fin
    query =
      all.size > before
        ? (response.data.pagination.next_page_url?.split("?")[1] ?? null)
        : null;
  } while (query);
  return [...all.values()];
}
