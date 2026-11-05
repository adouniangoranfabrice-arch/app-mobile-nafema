import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

export type Annee = {
  public_key: string;
  name: string;
  debut: string;
  fin: string;
  is_active: number;
  is_closed: number;
  etab_public_key: string;
  etab_name: string;
  cree_le: string;
};

type AnneesResponse = {
  success: boolean;
  data: Annee[];
  pagination: {
    per_page: number;
    next_cursor: string | null;
    prev_cursor: string | null;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
};

const PER_PAGE = 20;

/** Une page d'années scolaires. Sans curseur : la première page */
export async function getAnnees(cursor: string | null) {
  const { data } = await api.get<AnneesResponse>("/annees", {
    params: { per_page: PER_PAGE, cursor: cursor ?? undefined },
  });
  return { annees: data.data, nextCursor: data.pagination.next_cursor };
}

/** Toutes les années, page après page : pour les listes de choix des formulaires */
export function getAllAnnees() {
  return fetchAllPages<Annee>("/annees", (a) => a.public_key);
}

/** Ce qu'on envoie pour créer ou modifier une année */
export type AnneeData = {
  name: string;
  debut: string;
  fin: string;
  is_active: number;
  etablissement: string; // public_key de l'établissement
};

/** Crée une année et renvoie le message de confirmation du serveur, s'il y en a un */
export async function createAnnee(annee: AnneeData) {
  const { data } = await api.post<{ message?: string }>("/annees", annee);
  return data?.message;
}

export async function updateAnnee(publicKey: string, annee: AnneeData) {
  await api.put(`/annees/${publicKey}`, annee);
}

export async function deleteAnnee(publicKey: string) {
  await api.delete(`/annees/${publicKey}`);
}

export const ANNEE_STATUS = {
  active: { label: "Active", badge: "bg-green-100", text: "text-green-700" },
  inactive: { label: "Inactive", badge: "bg-soft", text: "text-primary" },
  closed: { label: "Clôturée", badge: "bg-slate-100", text: "text-muted" },
} as const;

export const anneeStatus = (a: Pick<Annee, "is_active" | "is_closed">) =>
  a.is_closed ? "closed" : a.is_active ? "active" : "inactive";
