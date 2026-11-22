import { Annee, getAllAnnees } from "@/api/annees";
import { getMe, User } from "@/api/auth";
import { Classe, getClasses } from "@/api/classes";
import { Cycle, getCycles } from "@/api/cycles";
import { getAllDrens } from "@/api/drens";
import { Eleve, getAllEleves } from "@/api/eleves";
import { EtablissementApi, getEtablissements } from "@/api/etablissements";
import { Frais, getFrais } from "@/api/frais";
import { getIepps } from "@/api/iepps";
import { getInscriptions, Inscription } from "@/api/inscriptions";
import { getNiveaux, Niveau } from "@/api/niveaux";
import { getSalles, Salle } from "@/api/salles";
import { getSeries } from "@/api/series";
import { getUtilisateurs, Utilisateur } from "@/api/utilisateurs";
import { normalize } from "@/utils/text";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/* ---------- Données encore fictives : pas d'API pour l'instant ---------- */

export const FICTIF_PLATEFORME = {
  /** Élèves si GET /eleves ne répond pas */
  students: 8420,
  /** Connexions par jour (le dernier jour est aujourd'hui) */
  week: [336, 497, 242, 188, 578, 685, 754],
};

/* ---------- Types ---------- */

export type Etablissement = {
  public_key: string;
  name: string;
  city: string;
  /** Statut donné par GET /etablissements : active | pending | suspended | "" */
  status: EtablissementApi["status"];
  /** PUBLIC | PRIVE | "" si inconnu */
  type: string;
  abbrev: string;
  users: number;
  classes: number;
  /** Une année scolaire active et non clôturée */
  active: boolean;
};

export type PlatformDashboard = {
  user: User | null;
  /** Sources qui ont répondu / sources interrogées */
  services: { ok: number; total: number; down: string[] };
  checkedAt: Date;
  etablissements: Etablissement[];
  /** GET /etablissements a répondu (sinon la liste est reconstituée) */
  etablissementsReels: boolean;
  inscriptions: Inscription[] | null;
  utilisateurs: Utilisateur[] | null;
  eleves: Eleve[] | null;
  drenas: number | null;
  iepps: number | null;
  classes: Classe[];
  salles: Salle[];
  niveaux: number;
  cycles: number;
  series: number | null;
  annees: Annee[];
  classesByCycle: { name: string; count: number }[];
  placesClasses: number;
  placesSalles: number;
  frais: Frais[];
  fraisTotal: number;
};

/* ---------- Calculs ---------- */

/** « public », « prive », « semi_prive », « Semi-privé »… → PUBLIC | PRIVE | SEMI_PRIVE */
export function schoolType(raw: string) {
  const t = normalize(raw).replace(/[^a-z]/g, "");
  if (!t) return "";
  if (t.startsWith("semi")) return "SEMI_PRIVE";
  if (t.startsWith("pub")) return "PUBLIC";
  if (t.startsWith("priv")) return "PRIVE";
  return raw.toUpperCase();
}

const truthy = (v: unknown) => v === true || v === 1 || v === "1";

/**
 * Les établissements : ceux de GET /etablissements, complétés par les utilisateurs, années, classes et salles
 * (et reconstitués à partir de ces données si la liste ne répond pas).
 * Regroupés par nom : la base donne parfois deux clés pour la même école.
 */
function buildEtablissements(
  api: EtablissementApi[] | null,
  utilisateurs: Utilisateur[],
  annees: Annee[],
  classes: Classe[],
  salles: Salle[],
) {
  const map = new Map<string, Etablissement>();
  const get = (name: string, create = !api) => {
    const id = normalize(name);
    if (!id) return null;
    let e = map.get(id);
    if (!e && create) {
      e = { public_key: "", name, city: "", status: "", type: "", abbrev: "", users: 0, classes: 0, active: false };
      map.set(id, e);
    }
    return e ?? null;
  };
  for (const a of api ?? []) {
    const e = get(a.name, true);
    if (!e) continue;
    e.public_key ||= a.public_key;
    e.type ||= schoolType(a.type);
    e.abbrev ||= a.abbrev;
    e.city ||= a.city;
    e.status ||= a.status;
  }
  for (const u of utilisateurs) {
    const e = u.etablissement && get(u.etablissement.name);
    if (!e) continue;
    e.users += 1;
    e.type ||= schoolType(u.etablissement?.type ?? "");
    e.abbrev ||= u.etablissement?.abbrev ?? "";
  }
  for (const a of annees) {
    const e = get(a.etab_name);
    if (e && truthy(a.is_active) && !truthy(a.is_closed)) e.active = true;
  }
  for (const c of classes) {
    const e = get(c.etab_name);
    if (e) e.classes += 1;
  }
  for (const s of salles) get(s.etab_name);
  return [...map.values()].sort((a, b) => b.users + b.classes - (a.users + a.classes));
}

/* ---------- Hook ---------- */

/** Toutes les données de l'accueil super admin, en parallèle ; une source en échec n'empêche pas les autres */
export function usePlatformDashboard() {
  const [data, setData] = useState<PlatformDashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle">("loading");
  const lastRequest = useRef(0);

  const load = useCallback(async (next: "loading" | "refreshing" | "silent") => {
    const request = ++lastRequest.current;
    if (next !== "silent") setStatus(next); // silent : mise à jour sans indicateur

    const sources = {
      Profil: getMe(),
      Établissements: getEtablissements(),
      Inscriptions: getInscriptions(),
      Utilisateurs: getUtilisateurs(),
      Élèves: getAllEleves(),
      DRENA: getAllDrens(),
      IEPP: getIepps(),
      "Années scolaires": getAllAnnees(),
      Classes: getClasses(),
      Salles: getSalles(),
      Niveaux: getNiveaux(),
      Cycles: getCycles(),
      Séries: getSeries(),
      Frais: getFrais(),
    };
    const names = Object.keys(sources);
    const results = await Promise.allSettled(Object.values(sources));
    if (request !== lastRequest.current) return; // une requête plus récente a pris le relais

    const r = Object.fromEntries(names.map((n, i) => [n, results[i]])) as Record<
      keyof typeof sources,
      PromiseSettledResult<unknown>
    >;
    const val = <T,>(name: keyof typeof sources, fallback: T): T => {
      const x = r[name];
      return x.status === "fulfilled" ? (x.value as T) : fallback;
    };
    const has = (name: keyof typeof sources) => r[name].status === "fulfilled";

    const utilisateurs = has("Utilisateurs") ? val<Utilisateur[]>("Utilisateurs", []) : null;
    const annees = val<Annee[]>("Années scolaires", []);
    const classes = val<Classe[]>("Classes", []);
    const salles = val<Salle[]>("Salles", []);
    const niveaux = val<Niveau[]>("Niveaux", []);
    const cycles = val<Cycle[]>("Cycles", []);
    const frais = val<Frais[]>("Frais", []);

    // Classes par cycle : niveau de la classe → cycle du niveau
    const cycleOfNiveau = new Map<string, string>();
    for (const n of niveaux) {
      if (n.public_key) cycleOfNiveau.set(n.public_key, n.cycle_name);
      cycleOfNiveau.set(normalize(n.name), n.cycle_name);
    }
    const byCycle = new Map<string, number>();
    for (const c of classes) {
      const cycle =
        cycleOfNiveau.get(c.niveau_key) || cycleOfNiveau.get(normalize(c.niveau_name)) || "Autre";
      byCycle.set(cycle, (byCycle.get(cycle) ?? 0) + 1);
    }
    const cycleOrder = new Map(cycles.map((c) => [normalize(c.name), c.order]));
    const classesByCycle = [...byCycle.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => (cycleOrder.get(normalize(a.name)) ?? 999) - (cycleOrder.get(normalize(b.name)) ?? 999));

    const down = names.filter((n) => r[n as keyof typeof sources].status === "rejected");

    setData({
      user: val<User | null>("Profil", null),
      services: { ok: names.length - down.length, total: names.length, down },
      checkedAt: new Date(),
      etablissements: buildEtablissements(
        has("Établissements") ? val<EtablissementApi[]>("Établissements", []) : null,
        utilisateurs ?? [],
        annees,
        classes,
        salles,
      ),
      etablissementsReels: has("Établissements"),
      inscriptions: has("Inscriptions") ? val<Inscription[]>("Inscriptions", []) : null,
      utilisateurs,
      eleves: has("Élèves") ? val<Eleve[]>("Élèves", []) : null,
      drenas: has("DRENA") ? val<unknown[]>("DRENA", []).length : null,
      iepps: has("IEPP") ? val<unknown[]>("IEPP", []).length : null,
      classes,
      salles,
      niveaux: niveaux.length,
      cycles: cycles.length,
      series: has("Séries") ? val<unknown[]>("Séries", []).length : null,
      annees,
      classesByCycle,
      placesClasses: classes.reduce((s, c) => s + (c.max_effectif ?? 0), 0),
      placesSalles: salles.reduce((s, x) => s + (x.capacite ?? 0), 0),
      frais,
      fraisTotal: frais.reduce((s, f) => s + f.montant_frais, 0),
    });
    setStatus("idle");
  }, []);

  // Retour sur l'accueil : les chiffres se mettent à jour
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) load("silent");
      focusedOnce.current = true;
    }, [load]),
  );

  useEffect(() => {
    load("loading");
    return () => {
      lastRequest.current++; // écran quitté : la réponse en cours est ignorée
    };
  }, [load]);

  return { data, status, reload: () => load("refreshing") };
}
