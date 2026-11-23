import { Annee, getAllAnnees } from "@/api/annees";
import { getMe } from "@/api/auth";
import { Classe, getClasse, getClasses } from "@/api/classes";
import { Eleve, getAllEleves } from "@/api/eleves";
import { getSalles, Salle } from "@/api/salles";
import { currentYear, ofYear } from "@/hooks/use-school-dashboard";
import { ofSchool } from "@/utils/school";
import { niveauRank } from "@/utils/niveaux";
import { normalize } from "@/utils/text";

export { niveauRank };

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

/** « Salle B2 (SALLE-B2) » : libellé et code de la salle de la classe */
export function salleLabel(c: Pick<Classe, "salle_name" | "salle_slug">) {
  const name = c.salle_name.trim();
  const code = c.salle_slug.trim();
  if (!name && !code) return "Sans salle";
  if (!code || normalize(code) === normalize(name)) return `Salle ${name || code}`.replace(/^Salle salle/i, "Salle");
  if (!name) return `Salle ${code}`;
  return `${/^salle/i.test(name) ? name : `Salle ${name}`} (${code})`;
}

export const eleveName = (e: Eleve) => `${e.nom} ${e.prenoms}`.trim() || "Élève sans nom";

/** Classes dans l'ordre de la scolarité (6e en premier, Tle en dernier), puis par nom : 6e 1, 6e 2… */
const byScolarite = (a: Classe, b: Classe) => {
  // Le niveau de la classe, sinon son nom (« 6e A »)
  const ra = Math.min(niveauRank(a.niveau_name), niveauRank(a.name));
  const rb = Math.min(niveauRank(b.niveau_name), niveauRank(b.name));
  return ra - rb || a.name.localeCompare(b.name, "fr", { numeric: true });
};

/**
 * La salle de chaque classe. La liste GET /classes ne donne souvent que la clé ou le code de la salle :
 * on cherche d'abord dans GET /salles, puis, pour les classes encore sans salle, dans le détail de la classe.
 */
async function withSalles(classes: Classe[], salles: Salle[]): Promise<Classe[]> {
  const byKey = new Map(salles.filter((x) => x.public_key).map((x) => [x.public_key, x]));
  const byCode = new Map(salles.filter((x) => x.code).map((x) => [normalize(x.code), x]));
  const byName = new Map(salles.filter((x) => x.name).map((x) => [normalize(x.name), x]));

  // Libellé et code : ce que donne la classe, complété par la salle retrouvée
  const resolved = classes.map((c) => {
    const salle =
      byKey.get(c.salle_key) ?? byCode.get(normalize(c.salle_slug)) ?? byName.get(normalize(c.salle_name));
    if (!salle) return c;
    return { ...c, salle_name: c.salle_name || salle.name || salle.code, salle_slug: c.salle_slug || salle.code };
  });

  // Dernier recours : le détail des classes encore sans salle (en parallèle)
  const missing = resolved.filter((c) => !c.salle_name && c.public_key);
  if (missing.length === 0) return resolved;
  const details = await Promise.allSettled(missing.map((c) => getClasse(c.public_key)));
  const found = new Map<string, Classe>();
  details.forEach((d, i) => {
    if (d.status !== "fulfilled") return;
    const full = d.value;
    const salle = byKey.get(full.salle_key) ?? byCode.get(normalize(full.salle_slug));
    const name = full.salle_name || salle?.name || salle?.code || "";
    const code = full.salle_slug || salle?.code || byName.get(normalize(name))?.code || "";
    if (name) found.set(missing[i].public_key, { ...missing[i], salle_name: name, salle_slug: code });
  });
  return resolved.map((c) => found.get(c.public_key) ?? c);
}

// Dernier calcul : l'écran d'une classe s'ouvre sans tout recharger
let last: Effectifs | null = null;
export const lastEffectifs = () => last;

/** Élèves, classes et années de la base, ramenés à l'école du compte et à l'année en cours */
export async function loadEffectifs(): Promise<Effectifs> {
  const [me, annees, classes, eleves, salles] = await Promise.allSettled([
    getMe(),
    getAllAnnees(),
    getClasses(),
    getAllEleves(),
    getSalles(),
  ]);
  // Sans classes ni élèves, il n'y a rien à afficher : c'est un échec
  if (classes.status === "rejected" && eleves.status === "rejected") throw classes.reason;

  const school = me.status === "fulfilled" ? (me.value.etablissement ?? null) : null;
  const year = currentYear(ofSchool(annees.status === "fulfilled" ? annees.value : ([] as Annee[]), school));
  const myClasses = await withSalles(
    ofYear(ofSchool(classes.status === "fulfilled" ? classes.value : [], school), year),
    salles.status === "fulfilled" ? salles.value : [],
  );
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
