import { Annee, getAllAnnees } from "@/api/annees";
import { getMe } from "@/api/auth";
import { Classe, getClasses } from "@/api/classes";
import { Eleve, getAllEleves } from "@/api/eleves";
import { currentYear, ofYear } from "@/hooks/use-school-dashboard";
import { ofSchool } from "@/utils/school";
import { normalize } from "@/utils/text";

/** Une classe de l'année avec ses élèves */
export type ClassStat = { classe: Classe; students: Eleve[]; count: number; capacity: number };

export type Effectifs = {
  school: string;
  year: string;
  total: number;
  placed: number;
  seats: number;
  girls: number;
  boys: number;
  classes: ClassStat[];
  unassigned: Eleve[];
};

/** Clé de la carte « Sans classe » */
export const SANS_CLASSE = "sans-classe";

export const eleveName = (e: Eleve) => `${e.nom} ${e.prenoms}`.trim() || "Élève sans nom";

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

/** Classes dans l'ordre de la scolarité (6e en premier, Tle en dernier), puis par nom : 6e 1, 6e 2… */
const byScolarite = (a: Classe, b: Classe) => {
  // Le niveau de la classe, sinon son nom (« 6e A »)
  const ra = Math.min(niveauRank(a.niveau_name), niveauRank(a.name));
  const rb = Math.min(niveauRank(b.niveau_name), niveauRank(b.name));
  return ra - rb || a.name.localeCompare(b.name, "fr", { numeric: true });
};

// Dernier calcul : l'écran d'une classe s'ouvre sans tout recharger
let last: Effectifs | null = null;
export const lastEffectifs = () => last;

/** Élèves, classes et années de la base, ramenés à l'école du compte et à l'année en cours */
export async function loadEffectifs(): Promise<Effectifs> {
  const [me, annees, classes, eleves] = await Promise.allSettled([
    getMe(),
    getAllAnnees(),
    getClasses(),
    getAllEleves(),
  ]);
  // Sans classes ni élèves, il n'y a rien à afficher : c'est un échec
  if (classes.status === "rejected" && eleves.status === "rejected") throw classes.reason;

  const school = me.status === "fulfilled" ? (me.value.etablissement ?? null) : null;
  const year = currentYear(ofSchool(annees.status === "fulfilled" ? annees.value : ([] as Annee[]), school));
  const myClasses = ofYear(ofSchool(classes.status === "fulfilled" ? classes.value : [], school), year);
  const myEleves = ofSchool(eleves.status === "fulfilled" ? eleves.value : [], school);

  // Chaque élève va dans la classe qui porte son nom de classe (et son niveau, si deux classes ont le même nom)
  const groups = [...myClasses].sort(byScolarite).map((classe) => ({ classe, students: [] as Eleve[] }));
  const unassigned: Eleve[] = [];
  for (const e of myEleves) {
    const name = normalize(e.classe_name);
    const candidates = name ? groups.filter((g) => normalize(g.classe.name) === name) : [];
    const target =
      candidates.length > 1 && e.niveau_name
        ? (candidates.find((g) => normalize(g.classe.niveau_name) === normalize(e.niveau_name)) ?? candidates[0])
        : candidates[0];
    if (target) target.students.push(e);
    else unassigned.push(e);
  }

  const classStats: ClassStat[] = groups.map(({ classe, students }) => ({
    classe,
    students: students.sort((a, b) => eleveName(a).localeCompare(eleveName(b), "fr")),
    // L'effectif enregistré sur la classe compte aussi les élèves que la liste ne relie pas encore
    count: Math.max(students.length, classe.effectif_actuel ?? classe.total_effectif ?? 0),
    capacity: classe.max_effectif ?? 0,
  }));
  const placed = classStats.reduce((n, c) => n + c.count, 0);

  last = {
    school: school?.name ?? "",
    year: year?.name ?? "",
    total: Math.max(myEleves.length, placed),
    placed,
    seats: classStats.reduce((n, c) => n + c.capacity, 0),
    girls: myEleves.filter((e) => e.gender === "F").length,
    boys: myEleves.filter((e) => e.gender === "M").length,
    classes: classStats,
    unassigned: unassigned.sort((a, b) => eleveName(a).localeCompare(eleveName(b), "fr")),
  };
  return last;
}
