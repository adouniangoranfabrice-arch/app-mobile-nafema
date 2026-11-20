import { fetchAllPages } from "@/api/pages";

/** Un établissement tel que GET /etablissements le renvoie (champs lus avec tolérance) */
export type EtablissementApi = {
  public_key: string;
  name: string;
  abbrev: string;
  /** PUBLIC | PRIVE | "" */
  type: string;
  city: string;
  /** active | pending | suspended | "" si la réponse ne le dit pas */
  status: "" | "active" | "pending" | "suspended";
};

type Named = { name?: string; libelle?: string; nom?: string } | string | null | undefined;

type RawEtablissement = {
  id?: number;
  public_key?: string;
  name?: string;
  nom?: string;
  libelle?: string;
  abbrev?: string;
  abreviation?: string;
  sigle?: string;
  type?: string;
  type_etab?: string;
  statut_etab?: string;
  ville?: Named;
  city?: Named;
  commune?: Named;
  localite?: Named;
  localisation?: Named;
  iepp?: Named;
  iepp_name?: string;
  status?: string | boolean | number | null;
  statut?: string | null;
  active?: boolean | number | null;
  is_active?: boolean | number | null;
};

const named = (v: Named) =>
  !v ? "" : typeof v === "string" ? v : (v.name || v.libelle || v.nom || "");

function toStatus(e: RawEtablissement): EtablissementApi["status"] {
  const flag = e.active ?? e.is_active;
  if (typeof e.status === "boolean" || typeof e.status === "number") return e.status ? "active" : "suspended";
  const s = String(e.status ?? e.statut ?? "").toLowerCase();
  if (/^(actif|active|valide|ouvert)/.test(s)) return "active";
  if (/(attente|pending|valider|nouveau)/.test(s)) return "pending";
  if (/(suspendu|suspended|inactif|inactive|bloque|ferme)/.test(s)) return "suspended";
  if (flag !== undefined && flag !== null) return flag ? "active" : "suspended";
  return "";
}

const toEtablissement = (e: RawEtablissement): EtablissementApi => ({
  public_key: e.public_key ?? String(e.id ?? ""),
  name: e.name || e.nom || e.libelle || "",
  abbrev: e.abbrev || e.abreviation || e.sigle || "",
  type: e.type || e.type_etab || e.statut_etab || "",
  city:
    named(e.ville) ||
    named(e.city) ||
    named(e.commune) ||
    named(e.localite) ||
    named(e.localisation) ||
    e.iepp_name ||
    named(e.iepp),
  status: toStatus(e),
});

/** Tous les établissements de la plateforme (super admin) */
export async function getEtablissements() {
  const raw = await fetchAllPages<RawEtablissement>(
    "/etablissements",
    (e) => toEtablissement(e).public_key || toEtablissement(e).name,
  );
  if (__DEV__ && raw[0]) console.log("Établissement reçu (exemple) :", JSON.stringify(raw[0])); // pour caler les champs
  return raw.map(toEtablissement);
}

/** « PUBLIC » → « Établissement public » */
export const typeEtablissementLabel = (type: string) => {
  const t = type.toLowerCase();
  if (t.startsWith("pub")) return "Établissement public";
  if (t.startsWith("priv")) return "Établissement privé";
  if (t.includes("confess")) return "Établissement confessionnel";
  return type ? `Établissement ${t}` : "Établissement";
};
