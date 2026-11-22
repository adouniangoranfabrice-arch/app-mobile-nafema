import { Annee, getAllAnnees } from "@/api/annees";
import { getMe, User } from "@/api/auth";
import { Classe, getClasses } from "@/api/classes";
import { Eleve, getAllEleves } from "@/api/eleves";
import { Frais, getFrais } from "@/api/frais";
import { getInscriptions, Inscription, INSCRIPTIONS_FICTIVES } from "@/api/inscriptions";
import { getNiveaux, Niveau } from "@/api/niveaux";
import { getPeriodes, Periode } from "@/api/periodes";
import { getSalles, Salle } from "@/api/salles";
import { getSeries } from "@/api/series";
import { CREANCES, enRetard, reste } from "@/data/finances";
import { ofSchool } from "@/utils/school";
import { normalize } from "@/utils/text";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

/* ---------- Données encore fictives : pas d'API pour l'instant ---------- */

export const FICTIF = {
  teachers: 32,
  pendingInvites: 2,
  absencesToday: 19,
  justificatifs: 3,
  /** Élèves si GET /eleves ne répond pas */
  students: 486,
};

/* ---------- Calculs ---------- */

/** « 2026-09-01 » ou « 2026-09-01 08:00:00 » → nombre comparable ; 0 si absent */
const dayOf = (raw: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw ?? "");
  return m ? Number(m[1] + m[2] + m[3]) : 0;
};

const todayNumber = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

const truthy = (v: unknown) => v === true || v === 1 || v === "1";

/** L'année active (sinon celle qui contient aujourd'hui, sinon la plus récente) */
export function currentYear(annees: Annee[]) {
  const today = todayNumber();
  return (
    annees.find((a) => truthy(a.is_active) && !truthy(a.is_closed)) ??
    annees.find((a) => dayOf(a.debut) <= today && today <= dayOf(a.fin)) ??
    [...annees].sort((a, b) => dayOf(b.debut) - dayOf(a.debut))[0] ??
    null
  );
}

/** Garde les éléments de l'année ; si aucun ne correspond (noms différents), on garde tout */
export function ofYear<T extends { annee_name: string }>(items: T[], year: Annee | null) {
  if (!year) return items;
  const mine = items.filter((x) => normalize(x.annee_name) === normalize(year.name));
  return mine.length > 0 ? mine : items;
}

export type NiveauGroup = {
  name: string;
  classes: number;
  capacity: number;
  /** null : la liste des élèves n'indique pas leur niveau */
  students: number | null;
};

export type Dashboard = {
  user: User | null;
  year: Annee | null;
  /** Période en cours de l'année, ou la prochaine */
  periode: Periode | null;
  periodeCount: number;
  /** Toutes les classes de l'école, toutes années confondues */
  classes: Classe[];
  /** Nombre de classes de l'année en cours (même nom d'année) */
  classesThisYear: number;
  groups: NiveauGroup[];
  capacity: number;
  salles: Salle[];
  sallesCapacity: number;
  niveaux: number;
  series: number | null;
  /** null : GET /eleves indisponible, on affiche le chiffre fictif */
  eleves: Eleve[] | null;
  frais: Frais[];
  fraisTotal: number;
  inscriptions: Inscription[];
  inscriptionsEnAttente: number;
  inscriptionsFictives: boolean;
  /** Créances encore fictives */
  recouvrement: { attendu: number; paye: number; enRetard: number };
};

/* ---------- Hook ---------- */

/** Toutes les données de l'accueil admin école, chargées en parallèle ; une source en échec n'empêche pas les autres */
export function useSchoolDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle">("loading");
  const [meFailed, setMeFailed] = useState(false);
  const lastRequest = useRef(0);

  const load = useCallback(async (next: "loading" | "refreshing" | "silent") => {
    const request = ++lastRequest.current;
    if (next !== "silent") setStatus(next); // silent : mise à jour sans indicateur
    const [me, annees, periodes, classes, salles, niveaux, series, eleves, frais, inscriptions] =
      await Promise.allSettled([
        getMe(),
        getAllAnnees(),
        getPeriodes(),
        getClasses(),
        getSalles(),
        getNiveaux(),
        getSeries(),
        getAllEleves(),
        getFrais(),
        getInscriptions(),
      ]);
    if (request !== lastRequest.current) return; // une requête plus récente a pris le relais

    const ok = <T,>(r: PromiseSettledResult<T>, fallback: T) =>
      r.status === "fulfilled" ? r.value : fallback;

    const user = ok(me, null as User | null);
    setMeFailed(me.status === "rejected");
    const school = user?.etablissement ?? null;

    const year = currentYear(ofSchool(ok(annees, [] as Annee[]), school));

    // Périodes de l'année : celle en cours, sinon la prochaine, sinon la dernière
    const yearPeriodes = ok(periodes, [] as Periode[])
      .filter((p) => !year || p.annee_public_key === year.public_key || p.annee_name === year.name)
      .sort((a, b) => dayOf(a.debut) - dayOf(b.debut));
    const today = todayNumber();
    const periode =
      yearPeriodes.find((p) => dayOf(p.debut) <= today && today <= dayOf(p.fin)) ??
      yearPeriodes.find((p) => dayOf(p.debut) > today) ??
      yearPeriodes[yearPeriodes.length - 1] ??
      null;

    // Toutes les classes de l'école, toutes années confondues ; le compte de l'année en cours à part
    const myClasses = ofSchool(ok(classes, [] as Classe[]), school);
    const classesThisYear = year
      ? myClasses.filter((c) => normalize(c.annee_name) === normalize(year.name)).length
      : myClasses.length;
    const mySalles = ofSchool(ok(salles, [] as Salle[]), school);
    const niveauList = ok(niveaux, [] as Niveau[]);
    const eleveList = eleves.status === "fulfilled" ? eleves.value : null;
    const myFrais = ofYear(ok(frais, [] as Frais[]), year);
    const inscriptionList = ofYear(ok(inscriptions, [] as Inscription[]), year);

    // Répartition par niveau, dans l'ordre des niveaux de la base
    const order = new Map(niveauList.map((n) => [normalize(n.name), n.order]));
    const byNiveau = new Map<string, NiveauGroup>();
    for (const c of myClasses) {
      const name = c.niveau_name || "Sans niveau";
      const g = byNiveau.get(name) ?? { name, classes: 0, capacity: 0, students: null };
      g.classes += 1;
      g.capacity += c.max_effectif ?? 0;
      byNiveau.set(name, g);
    }
    const studentsKnowNiveau = !!eleveList?.some((e) => e.niveau_name);
    if (eleveList && studentsKnowNiveau) {
      for (const g of byNiveau.values()) {
        g.students = eleveList.filter((e) => normalize(e.niveau_name) === normalize(g.name)).length;
      }
    }
    const groups = [...byNiveau.values()].sort(
      (a, b) =>
        (order.get(normalize(a.name)) ?? 999) - (order.get(normalize(b.name)) ?? 999) ||
        a.name.localeCompare(b.name),
    );

    const creances = school
      ? CREANCES.filter((c) => normalize(c.school) === normalize(school.name))
      : [];
    const creanceList = creances.length > 0 ? creances : CREANCES;

    setData({
      user,
      year,
      periode,
      periodeCount: yearPeriodes.length,
      classes: myClasses,
      classesThisYear,
      groups,
      capacity: myClasses.reduce((s, c) => s + (c.max_effectif ?? 0), 0),
      salles: mySalles,
      sallesCapacity: mySalles.reduce((s, x) => s + (x.capacite ?? 0), 0),
      niveaux: niveauList.length,
      series: series.status === "fulfilled" ? series.value.length : null,
      eleves: eleveList,
      frais: myFrais,
      fraisTotal: myFrais.reduce((s, f) => s + f.montant_frais, 0),
      inscriptions: inscriptionList,
      inscriptionsEnAttente: inscriptionList.filter((i) => i.statut === "EN_ATTENTE").length,
      inscriptionsFictives: INSCRIPTIONS_FICTIVES,
      recouvrement: {
        attendu: creanceList.reduce((s, c) => s + c.montant, 0),
        paye: creanceList.reduce((s, c) => s + c.paye, 0),
        enRetard: creanceList.filter((c) => enRetard(c) && reste(c) > 0).length,
      },
    });
    setStatus("idle");
  }, []);

  // Retour sur l'accueil (classe ou frais ajoutés ailleurs) : les chiffres se mettent à jour
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

  return { data, status, meFailed, reload: () => load("refreshing") };
}
