import { Ionicons } from "@expo/vector-icons";

export type IconName = keyof typeof Ionicons.glyphMap;

export type EntityKey =
  | "etablissements"
  | "niveaux"
  | "cycles"
  | "series"
  | "etablissementsCycles"
  | "salles"
  | "classes"
  | "matieres"
  | "utilisateurs"
  | "personnels"
  | "permissions"
  | "roles";

/** Source d'une liste déroulante : une autre rubrique, les DRENA, les IEPP, les années scolaires ou les enseignants */
export type RefSource =
  | EntityKey
  | "drenas"
  | "iepps"
  | "annees"
  | "enseignants";

export type Value = string | number | boolean;
export type OrgRecord = { id: string } & Record<string, Value>;
export type Option = { value: string; label: string };

export type FieldType =
  | "text"
  | "code" // majuscules, chiffres, tirets
  | "slug" // minuscules et tirets, généré depuis un autre champ
  | "number"
  | "email"
  | "phone"
  | "date" // stockée au format AAAA-MM-JJ
  | "password"
  | "select" // liste fixe (options)
  | "ref" // liste alimentée par une autre rubrique (ref)
  | "checkbox";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  requiredOnCreate?: boolean; // obligatoire seulement à la création (ex. mot de passe)
  noStar?: boolean; // obligatoire, mais sans astérisque
  unique?: boolean; // valeur unique dans la rubrique
  matches?: string; // doit être identique à un autre champ (ex. confirmation du mot de passe)
  transient?: boolean; // vérifié mais jamais enregistré (mots de passe)
  past?: boolean; // date : pas de date dans le futur
  placeholder?: string;
  hint?: string;
  editHint?: string; // astuce affichée seulement en modification
  icon?: IconName;
  section?: string;
  options?: Option[];
  ref?: RefSource;
  searchable?: boolean;
  slugFrom?: string;
  defaultValue?: Value;
};

export type Tone = "green" | "blue" | "purple" | "slate" | "dark" | "amber";
export type Badge = { label: string; tone: Tone };

/** Permet aux configurations d'afficher le nom d'un élément lié */
export type Ctx = { refLabel: (source: RefSource, id: string) => string };

export type EntityConfig = {
  key: EntityKey;
  title: string; // « Niveaux »
  singular: string; // « niveau »
  feminine: boolean;
  countLabel: string; // « niveau(x) »
  icon: IconName;
  searchPlaceholder: string;
  formSubtitle?: string;
  createLabel?: string;
  deleteNote?: string; // phrase ajoutée à l'alerte de suppression
  fields: Field[];
  uniqueTogether?: { keys: string[]; message: string };
  filters?: { field: string; allLabel: string }[];
  /** Bascule affichée au-dessus de la liste (ex. guard web / sanctum) */
  segment?: {
    field: string;
    label: string;
    options: Option[];
    defaultValue: string;
  };
  /** Valeurs ajoutées à la création (champs non affichés dans le formulaire) */
  defaults?: Record<string, Value>;
  /** Texte supplémentaire pris en compte par la recherche */
  searchText?: (r: OrgRecord, ctx: Ctx) => string;
  sortValue?: (r: OrgRecord, ctx: Ctx) => string | number;
  /** Libellé court, utilisé dans les listes déroulantes des autres rubriques */
  label: (r: OrgRecord) => string;
  /** Libellé plus précis dans les listes déroulantes (ex. « Salle 1 · Établissement X ») */
  optionLabel?: (r: OrgRecord, ctx: Ctx) => string;
  list: {
    title: (r: OrgRecord, ctx: Ctx) => string;
    avatar?: (r: OrgRecord) => string; // initiales dans un rond (colonne « Photo »)
    code?: (r: OrgRecord) => string;
    subtitle?: (r: OrgRecord, ctx: Ctx) => string;
    details?: (r: OrgRecord, ctx: Ctx) => string;
    badges?: (r: OrgRecord) => Badge[];
  };
  seed: OrgRecord[];
};
