import { EntityKey } from "@/organisation/types";
import { Href, useSegments } from "expo-router";

type Access = {
  canEdit: boolean; // créer, modifier, supprimer
  screens: string[];
  entities: EntityKey[];
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
    screens: ["annees", "periodes", "inscriptions", "eleves"],
    entities: [
      "niveaux",
      "cycles",
      "series",
      "salles",
      "classes",
      "matieres",
      "utilisateurs",
      "personnels",
    ],
  },
  "(teacher)": {
    canEdit: false,
    screens: ["periodes", "eleves"],
    entities: ["salles", "classes"],
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
    canOpen: (screen: string) => access.screens.includes(screen),
    canUse: (entity: EntityKey) => access.entities.includes(entity),
    href: (screen: string, params?: Record<string, string>) =>
      ({ pathname: `/${space}/gestion/${screen}`, params }) as Href,
  };
}
