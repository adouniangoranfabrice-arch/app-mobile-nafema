import { api } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

/** Un frais tel que renvoyé par GET /frais */
export type Frais = {
  public_key: string;
  name: string;
  annee_name: string;
  niveau_name: string;
  type_frais: string; // ex. SCOLARITE
  montant_frais: number;
};

type RawFrais = Partial<Omit<Frais, "montant_frais">> & {
  montant_frais?: number | string | null;
};

const toFrais = (f: RawFrais): Frais => {
  const montant = Number(f.montant_frais);
  return {
    public_key: f.public_key ?? "",
    name: f.name ?? "",
    annee_name: f.annee_name ?? "",
    niveau_name: f.niveau_name ?? "",
    type_frais: f.type_frais ?? "",
    montant_frais: Number.isFinite(montant) ? montant : 0,
  };
};

/** Tous les frais, page après page : la recherche et le filtre se font dans l'application */
export async function getFrais() {
  const raw = await fetchAllPages<RawFrais>("/frais", (f) => f.public_key ?? "");
  return raw.map(toFrais);
}

/** SCOLARITE → « Scolarité », FRAIS_ANNEXES → « Frais annexes » */
export const typeFraisLabel = (type: string) => {
  const known: Record<string, string> = {
    SCOLARITE: "Scolarité",
    INSCRIPTION: "Inscription",
    CANTINE: "Cantine",
    TRANSPORT: "Transport",
    EXAMEN: "Examen",
  };
  if (known[type]) return known[type];
  const words = type.toLowerCase().replace(/_/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "—";
};

/** Types proposés dans le formulaire : la valeur envoyée, et son libellé */
export const TYPES_FRAIS = [
  "SCOLARITE",
  "INSCRIPTION",
  "CANTINE",
  "TRANSPORT",
  "EXAMEN",
].map((value) => ({ value, label: typeFraisLabel(value) }));

/**
 * Corps attendu par POST et PUT /frais, toujours avec ses 8 champs :
 * niveau est une public_key (null : tous les niveaux), validite une date-heure ISO
 * « 2027-01-31T00:00:00Z » (null si aucune). L'année n'est plus envoyée : le serveur prend l'année en cours.
 */
export type FraisInput = {
  niveau: string | null;
  name: string;
  type_frais: string;
  montant_frais: number;
  affectation: string | null;
  is_required: boolean;
  /** Payable en plusieurs tranches */
  tranchable: boolean;
  validite: string | null;
};

/** Crée un frais et renvoie le message de confirmation du serveur */
export async function createFrais(frais: FraisInput) {
  const { data } = await api.post<{ message?: string }>("/frais", frais);
  return data?.message || "Frais créé avec succès.";
}

/** Détail d'un frais (GET /frais/{frai}) : plus complet que la liste */
export type FraisDetail = Frais & {
  annee_public_key: string;
  niveau_public_key: string;
  is_required: boolean;
  tranchable: boolean;
  validite: string; // « 2026-11-28 », "" si aucune
  affectation: string;
  cree_le: string;
  modifie_le: string;
};

type RawFraisDetail = RawFrais & {
  annee_public_key?: string | null;
  niveau_public_key?: string | null;
  is_required?: boolean | number | string | null;
  tranchable?: boolean | number | string | null;
  validite?: string | null;
  affectation?: string | null;
  cree_le?: string | null;
  modifie_le?: string | null;
  modifiee_le?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Un frais, identifié par sa public_key. La réponse peut être enveloppée dans { data } ou non */
export async function getFraisDetail(publicKey: string): Promise<FraisDetail> {
  const { data } = await api.get<{ data?: RawFraisDetail } & RawFraisDetail>(
    `/frais/${encodeURIComponent(publicKey)}`,
  );
  const raw = (data?.data ?? data) as RawFraisDetail;
  const required = raw.is_required;
  const yes = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";
  return {
    ...toFrais({ ...raw, public_key: raw.public_key ?? publicKey }),
    annee_public_key: raw.annee_public_key ?? "",
    niveau_public_key: raw.niveau_public_key ?? "",
    // 1, "1", true ou "true" : obligatoire
    is_required: yes(required),
    tranchable: yes(raw.tranchable),
    validite: raw.validite ?? "",
    affectation: raw.affectation ?? "",
    cree_le: raw.cree_le ?? raw.created_at ?? "",
    modifie_le: raw.modifie_le ?? raw.modifiee_le ?? raw.updated_at ?? "",
  };
}

/** Modifie un frais (PUT /frais/{frai}, même corps que la création) et renvoie le message du serveur */
export async function updateFrais(publicKey: string, frais: FraisInput) {
  const { data } = await api.put<{ message?: string }>(
    `/frais/${encodeURIComponent(publicKey)}`,
    frais,
  );
  return data?.message || "Frais modifié avec succès.";
}

// Un frais modifié depuis son détail : la liste se recharge à son retour
let stale = false;
export const markFraisStale = () => {
  stale = true;
};

/** Indique si la liste doit se recharger, une seule fois */
export const takeFraisStale = () => {
  const was = stale;
  stale = false;
  return was;
};

/** Supprime un frais (DELETE /frais/{frai}) et renvoie le message du serveur s'il y en a un */
export async function deleteFrais(publicKey: string) {
  const { data } = await api.delete<{ message?: string }>(
    `/frais/${encodeURIComponent(publicKey)}`,
  );
  return data?.message || "Frais supprimé avec succès.";
}
