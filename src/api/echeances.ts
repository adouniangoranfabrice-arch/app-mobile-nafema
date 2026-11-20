import { api, okMessage } from "@/api/client";
import { fetchAllPages } from "@/api/pages";

/**
 * Mode fictif : les échéances sont gardées dans l'application (en mémoire).
 * false : vraie API (GET/POST /echeances, GET/PUT/DELETE /echeances/{echeance}).
 */
export const ECHEANCES_FICTIVES = false;

/** Une échéance de paiement : une part (pourcentage) des frais à régler avant une date */
export type Echeance = {
  public_key: string;
  name: string;
  /** Frais auquel l'échéance s'applique ("" si la réponse ne le donne pas) */
  frais_key: string;
  frais_name: string;
  /** Nom de la personne (admin école) qui a créé l'échéance, "" si la réponse ne le donne pas */
  cree_par: string;
  annee_name: string;
  /** « 2026-12-15 », "" si absente */
  date_echeance: string;
  ordre: number;
  pourcentage: number;
  /** active | inactive */
  status: string;
  created_at: string;
  updated_at: string;
};

/** Ce que le formulaire produit ; toBody le traduit dans le format de l'API */
export type EcheanceInput = {
  /** public_key du frais */
  frais: string;
  name: string;
  date_echeance: string; // « 2026-12-15 »
  ordre: number;
  pourcentage: number;
  status: "active" | "inactive";
};

/** Corps attendu par POST /echeances (et PUT) */
type EcheanceBody = {
  frais: string;
  name: string;
  validite: string; // « 2026-12-15 », comme le serveur la stocke et la renvoie
  order: number;
  pourcent: number;
  status: string;
};

const toBody = (e: EcheanceInput): EcheanceBody => ({
  frais: e.frais,
  name: e.name,
  // Date seule : le détail renvoie « 2026-11-19 » ; le format long faisait échouer la création
  validite: e.date_echeance,
  order: e.ordre,
  pourcent: e.pourcentage,
  // Valeurs acceptées par le serveur : « active » et « inactive » (« Inactive » est refusé)
  status: e.status,
});

export const STATUTS_ECHEANCE = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const isActive = (e: Pick<Echeance, "status">) =>
  ["active", "actif", "1", "true"].includes(String(e.status).toLowerCase());

/* ---------- Lecture tolérante de l'API ---------- */

type RawEcheance = {
  id?: number;
  public_key?: string;
  name?: string;
  libelle?: string;
  frais?: { public_key?: string; name?: string } | string | null;
  frais_public_key?: string | null;
  frais_name?: string | null;
  // Créateur : plusieurs noms possibles, objet utilisateur ou simple texte
  cree_par?: Person;
  creee_par?: Person;
  created_by?: Person;
  createur?: Person;
  auteur?: Person;
  user?: Person;
  utilisateur?: Person;
  annee_name?: string;
  annee?: { name?: string } | string | null;
  annee_scolaire?: { name?: string } | string | null; // nom utilisé par GET /echeances/{echeance}
  date_echeance?: string | null;
  validite?: string | null;
  date?: string | null;
  ordre?: number | string | null;
  order?: number | string | null;
  pourcentage?: number | string | null;
  pourcent?: number | string | null;
  status?: string | boolean | number | null;
  statut?: string | null;
  created_at?: string | null;
  cree_le?: string | null;
  updated_at?: string | null;
  modifie_le?: string | null;
  modifiee_le?: string | null;
};

type Person =
  | { full_name?: string; name?: string; firstname?: string; nom?: string; prenoms?: string }
  | string
  | null;

/** « KOUASSI Aya » à partir d'un utilisateur imbriqué ou d'un texte */
const personName = (p: Person | undefined) => {
  if (!p) return "";
  if (typeof p === "string") return p;
  return (
    p.full_name ||
    [p.name ?? p.nom, p.firstname ?? p.prenoms].filter(Boolean).join(" ")
  );
};

const refName = (r: { name?: string } | string | null | undefined) =>
  !r ? "" : typeof r === "string" ? r : (r.name ?? "");

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toEcheance = (e: RawEcheance): Echeance => ({
  public_key: e.public_key ?? String(e.id ?? ""),
  name: e.name ?? e.libelle ?? "",
  // frais : objet { public_key, name } ou simple public_key
  frais_key:
    e.frais_public_key ||
    (typeof e.frais === "string" ? e.frais : (e.frais?.public_key ?? "")),
  frais_name: e.frais_name || (typeof e.frais === "object" ? (e.frais?.name ?? "") : ""),
  cree_par: personName(
    e.cree_par ?? e.creee_par ?? e.created_by ?? e.createur ?? e.auteur ?? e.user ?? e.utilisateur,
  ),
  annee_name:
    e.annee_name ||
    refName(e.annee_scolaire) ||
    refName(e.annee),
  date_echeance: (e.validite || e.date_echeance || e.date || "").slice(0, 10),
  ordre: num(e.order ?? e.ordre),
  pourcentage: num(e.pourcent ?? e.pourcentage),
  status:
    typeof e.status === "boolean" || typeof e.status === "number"
      ? e.status
        ? "active"
        : "inactive"
      : (e.status ?? e.statut ?? "active"),
  created_at: e.created_at || e.cree_le || "",
  updated_at: e.updated_at || e.modifiee_le || e.modifie_le || "",
});

/* ---------- Données fictives ---------- */

const pause = (ms: number) => new Promise((done) => setTimeout(done, ms));

const now = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// Trois tranches de l'année pour que la liste ne soit pas vide
const fictives: Echeance[] = [
  { n: 1, name: "1re tranche", date: "2026-10-15", pct: 40 },
  { n: 2, name: "2e tranche", date: "2027-01-15", pct: 35 },
  { n: 3, name: "3e tranche", date: "2027-04-15", pct: 25 },
].map(({ n, name, date, pct }) => ({
  public_key: `FICTIF-ECH${n}`,
  name,
  frais_key: "",
  frais_name: "Frais de scolarité",
  cree_par: "Admin école (exemple)",
  annee_name: "2026-2027",
  date_echeance: date,
  ordre: n,
  pourcentage: pct,
  status: "active",
  created_at: "2026-09-01 08:00:00",
  updated_at: "",
}));

/* ---------- Fonctions ---------- */

export async function getEcheances(): Promise<Echeance[]> {
  if (ECHEANCES_FICTIVES) {
    await pause(300);
    return fictives.map((e) => ({ ...e }));
  }
  const raw = await fetchAllPages<RawEcheance>("/echeances", (e) => toEcheance(e).public_key);
  if (__DEV__ && raw[0]) console.log("Échéance reçue (exemple) :", raw[0]);
  return raw.map(toEcheance);
}

export async function getEcheance(publicKey: string): Promise<Echeance> {
  if (ECHEANCES_FICTIVES) {
    await pause(150);
    const found = fictives.find((e) => e.public_key === publicKey);
    if (!found) throw new Error("Échéance introuvable");
    return { ...found };
  }
  const { data } = await api.get<{ data?: RawEcheance } & RawEcheance>(
    `/echeances/${encodeURIComponent(publicKey)}`,
  );
  const raw = (data?.data ?? data) as RawEcheance;
  if (__DEV__) console.log("Échéance reçue (détail) :", JSON.stringify(raw)); // pour caler les champs
  return toEcheance({ ...raw, public_key: raw?.public_key ?? publicKey });
}

/** anneeName : année en cours, affichée dans la liste en mode fictif */
export async function createEcheance(input: EcheanceInput, anneeName: string) {
  if (ECHEANCES_FICTIVES) {
    await pause(400);
    fictives.push({
      public_key: `FICTIF-${Date.now()}`,
      ...input,
      frais_key: input.frais,
      frais_name: "",
      cree_par: "",
      annee_name: anneeName,
      created_at: now(),
      updated_at: "",
    });
    return "Échéance créée (mode fictif, en attendant le serveur).";
  }
  const { data } = await api.post<{ message?: string }>("/echeances", toBody(input));
  return data?.message || "Échéance créée avec succès.";
}

export async function updateEcheance(publicKey: string, input: EcheanceInput) {
  if (ECHEANCES_FICTIVES) {
    await pause(400);
    const i = fictives.findIndex((e) => e.public_key === publicKey);
    if (i < 0) throw new Error("Échéance introuvable");
    fictives[i] = { ...fictives[i], ...input, updated_at: now() };
    return "Échéance modifiée (mode fictif).";
  }
  const { data } = await api.put<{ message?: string }>(
    `/echeances/${encodeURIComponent(publicKey)}`,
    toBody(input),
  );
  return data?.message || "Échéance modifiée avec succès.";
}

export async function deleteEcheance(publicKey: string) {
  if (ECHEANCES_FICTIVES) {
    await pause(300);
    const i = fictives.findIndex((e) => e.public_key === publicKey);
    if (i >= 0) fictives.splice(i, 1);
    return "Échéance supprimée (mode fictif).";
  }
  const { data } = await api.delete<{ success?: boolean; message?: string }>(
    `/echeances/${encodeURIComponent(publicKey)}`,
  );
  // Réponse 200 mais success: false (échéance utilisée…) : c'est un refus, pas une suppression
  return okMessage(data, "Échéance supprimée avec succès.");
}

// Une échéance modifiée depuis son détail : la liste se recharge à son retour
let stale = false;
export const markEcheancesStale = () => {
  stale = true;
};
export const takeEcheancesStale = () => {
  const was = stale;
  stale = false;
  return was;
};
