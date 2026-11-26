import { normalize } from "@/utils/text";

/** Niveaux du lycée (Seconde → Terminale) : seuls eux ont une série. Accepte « 2nde », « 1re », « Tle »… */
export const isLycee = (niveauName: string) =>
  /(^|[^a-z0-9])(second|2nd|2de|premi|1er|1re|termin|tle)/.test(normalize(niveauName));

/** Quatrième et Troisième. Accepte « 4e », « 4ème », « 3eme », « Quatrième »… */
export const isCollegeHaut = (niveauName: string) =>
  /(^|[^a-z0-9])(quatri|troisi|[34] ?(e|eme|em)([^a-z0-9]|$))/.test(normalize(niveauName));

/**
 * Champs qui dépendent du niveau :
 * - Moyenne section → Cinquième : rien de plus
 * - Quatrième → Troisième : + LV2
 * - Seconde → Terminale : + LV2 et série
 */
export const fieldsFor = (niveauName: string) => {
  const lycee = isLycee(niveauName);
  return { lv2: lycee || isCollegeHaut(niveauName), serie: lycee };
};

/**
 * Rang d'un niveau dans la scolarité : maternelle, primaire, puis 6e → 5e → 4e → 3e → 2nde → 1re → Tle.
 * Accepte « 6ème », « Sixième », « 2nde », « Seconde (2ND) », « Tle D », « Terminale »…
 */
export function niveauRank(name: string): number {
  const n = ` ${normalize(name)} `;
  const has = (re: RegExp) => re.test(n);
  // Maternelle
  if (has(/petite section|[^a-z]ps[^a-z]/)) return 1;
  if (has(/moyenne section|[^a-z]ms[^a-z]/)) return 2;
  if (has(/grande section|[^a-z]gs[^a-z]/)) return 3;
  // Primaire
  if (has(/[^a-z]cp ?1|cours preparatoire 1/)) return 4;
  if (has(/[^a-z]cp ?2|cours preparatoire 2/)) return 5;
  if (has(/[^a-z]cp[^a-z]|cours preparatoire/)) return 4;
  if (has(/[^a-z]ce ?1|cours elementaire 1/)) return 6;
  if (has(/[^a-z]ce ?2|cours elementaire 2/)) return 7;
  if (has(/[^a-z]cm ?1|cours moyen 1/)) return 8;
  if (has(/[^a-z]cm ?2|cours moyen 2/)) return 9;
  // Collège
  if (has(/sixi|[^a-z0-9]6 ?(e|eme|em)[^a-z]/)) return 10;
  if (has(/cinqui|[^a-z0-9]5 ?(e|eme|em)[^a-z]/)) return 11;
  if (has(/quatri|[^a-z0-9]4 ?(e|eme|em)[^a-z]/)) return 12;
  if (has(/troisi|[^a-z0-9]3 ?(e|eme|em)[^a-z]/)) return 13;
  // Lycée
  if (has(/second|[^a-z0-9]2 ?(nd|nde|de)[^a-z]/)) return 14;
  if (has(/premi|[^a-z0-9]1 ?(er|ere|re)[^a-z]/)) return 15;
  if (has(/termin|[^a-z]tle[^a-z]/)) return 16;
  return 99; // inconnu : à la fin
}

/* ---------- Niveaux selon la catégorie de l'établissement ---------- */

/** Cycles d'un établissement : valeurs de « catego » (comme POST /etablissements) */
export type Stage = "prescolaire" | "primaire" | "college" | "lycee";
const STAGES: Stage[] = ["prescolaire", "primaire", "college", "lycee"];

export const STAGE_LABELS: Record<Stage, string> = {
  prescolaire: "du préscolaire",
  primaire: "du primaire",
  college: "du collège",
  lycee: "de la 6e à la Tle",
};

/** Le cycle d'un niveau : d'après son nom, sinon d'après le nom de son cycle ("" si inconnu) */
export function stageOf(niveauName: string, cycleName = ""): Stage | "" {
  const r = niveauRank(niveauName);
  if (r <= 3) return "prescolaire";
  if (r <= 9) return "primaire";
  if (r <= 13) return "college";
  if (r <= 16) return "lycee";
  const c = normalize(cycleName);
  if (/matern|prescol|presco/.test(c)) return "prescolaire";
  if (/primaire|elementaire/.test(c)) return "primaire";
  if (/college|premier cycle|1er cycle/.test(c)) return "college";
  if (/lycee|second cycle|2nd cycle/.test(c)) return "lycee";
  return "";
}

/** Catégorie de l'établissement → cycle (null : tous les cycles, ou catégorie inconnue) */
export function stageOfCategorie(catego: string): Stage | null {
  const c = normalize(catego);
  if (c.startsWith("presco") || c.startsWith("matern")) return "prescolaire";
  if (c.startsWith("primaire")) return "primaire";
  if (c.startsWith("college")) return "college";
  if (c.startsWith("lycee")) return "lycee";
  return null;
}

type NiveauLike = { public_key: string; name: string; cycle_name: string; order: number };

/** Rang d'un niveau pour le tri : son nom, sinon l'ordre donné par la base (après les niveaux reconnus) */
const rankOf = (n: NiveauLike) => {
  const r = niveauRank(n.name);
  return r < 99 ? r : 100 + (n.order || 0);
};

/** Niveaux dans l'ordre de la scolarité (PS → Tle), puis par nom */
export const sortNiveaux = <T extends NiveauLike>(list: T[]) =>
  [...list].sort((a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name, "fr", { numeric: true }));

/**
 * Niveaux proposés à l'inscription selon la catégorie de l'établissement :
 * - actuel : les niveaux du cycle de l'établissement ;
 * - precedent : les mêmes, plus le dernier niveau du cycle d'avant (élève venant d'un autre établissement).
 * Exception : un lycée accueille aussi le collège → 6e à Tle pour les deux listes.
 * Catégorie inconnue, « tous les cycles » ou aucun niveau reconnu : tous les niveaux.
 */
export function niveauxPourCategorie<T extends NiveauLike>(all: T[], catego: string) {
  const sorted = sortNiveaux(all);
  const stage = stageOfCategorie(catego);
  if (!stage) return { actuel: sorted, precedent: sorted, stage: null };
  if (stage === "lycee") {
    const secondaire = sorted.filter((n) => {
      const s = stageOf(n.name, n.cycle_name);
      return s === "college" || s === "lycee";
    });
    if (secondaire.length === 0) return { actuel: sorted, precedent: sorted, stage: null };
    return { actuel: secondaire, precedent: secondaire, stage };
  }
  const actuel = sorted.filter((n) => stageOf(n.name, n.cycle_name) === stage);
  if (actuel.length === 0) return { actuel: sorted, precedent: sorted, stage: null };
  const before = STAGES[STAGES.indexOf(stage) - 1];
  const previousStage = before ? sorted.filter((n) => stageOf(n.name, n.cycle_name) === before) : [];
  const last = previousStage[previousStage.length - 1];
  return { actuel, precedent: last ? [last, ...actuel] : actuel, stage };
}
