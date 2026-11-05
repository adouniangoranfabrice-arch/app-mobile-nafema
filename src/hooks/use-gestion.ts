import { EntityKey } from "@/organisation/types";
import { Href, useSegments } from "expo-router";

type Access = {
  canEdit: boolean; // créer, modifier, supprimer
  screens: string[];
  entities: EntityKey[];
  school?: string; // limite les listes fictives à cette école
};

// Ce que chaque espace affiche : c'est la navigation, l'API reste seule juge des droits
const ACCESS = {
  "(superadmin)": {
    canEdit: true,
    screens: [
      "drenas",
      "annees",
      "periodes",
      "inscriptions",
      "eleves",
      "evaluations",
      "absences",
      "familles",
      "suppression-periodes",
      "attribution",
      "suivi-modules",
    ],
    entities: [
      "etablissements",
      "niveaux",
      "cycles",
      "series",
      "etablissementsCycles",
      "salles",
      "classes",
      "matieres",
      "utilisateurs",
      "personnels",
      "permissions",
      "roles",
    ],
  },
  "(adminschool)": {
    canEdit: true,
    school: "Collège des Almadies", // à remplacer par l'école du compte quand ces données viendront de l'API
    screens: ["annees", "periodes", "inscriptions", "eleves", "familles"],
    entities: [
      "niveaux",
      "cycles",
      "series",
      "salles",
      "classes",
      "matieres",
      "personnels",
    ],
  },
  "(teacher)": {
    canEdit: false,
    screens: ["eleves", "evaluations", "absences"],
    entities: [],
  },
} satisfies Record<string, Access>;

type Space = keyof typeof ACCESS;

/** Les droits de l'espace courant, et les liens qui restent dans cet espace */
export function useGestion() {
  const first = useSegments()[0] as string;
  const space = (first in ACCESS ? first : "(teacher)") as Space;
  const access: Access = ACCESS[space];

  return {
    canEdit: access.canEdit,
    school: access.school,
    canOpen: (screen: string) => access.screens.includes(screen),
    canUse: (entity: EntityKey) => access.entities.includes(entity),
    href: (screen: string, params?: Record<string, string>) =>
      ({ pathname: `/${space}/gestion/${screen}`, params }) as Href,
  };
}
