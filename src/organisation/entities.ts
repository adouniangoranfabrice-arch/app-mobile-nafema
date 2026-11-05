import { formatDate } from "@/utils/dates";
import { fromISO } from "./helpers";
import { EntityConfig, EntityKey, Field, Option, OrgRecord } from "./types";

const str = (r: OrgRecord, k: string) => String(r[k] ?? "");

/* ================= Établissements (d'après tes captures) ================= */

const etablissements: EntityConfig = {
  key: "etablissements",
  title: "Établissements",
  singular: "établissement",
  feminine: false,
  countLabel: "établissement(s)",
  icon: "business-outline",
  searchPlaceholder: "Rechercher par nom ou code…",
  formSubtitle: "Créez un nouvel établissement scolaire",
  createLabel: "Créer l'établissement",
  filters: [
    { field: "type", allLabel: "Tous les types" },
    { field: "drena_id", allLabel: "Toutes les DRENA" },
  ],
  // Champs de l'API sans place dans le formulaire
  defaults: { logo_path: "", parametres: "", deleted_at: "" },
  fields: [
    {
      key: "code",
      label: "Code (optionnel)",
      type: "code",
      unique: true,
      placeholder: "ex. 000651",
      icon: "barcode-outline",
      section: "Identité",
    },
    {
      key: "type",
      label: "Type",
      type: "select",
      required: true,
      defaultValue: "PUBLIC",
      options: [
        { value: "PUBLIC", label: "Public" },
        { value: "PRIVE", label: "Privé" },
      ],
      icon: "ribbon-outline",
      section: "Identité",
    },
    {
      key: "nom",
      label: "Nom",
      type: "text",
      required: true,
      placeholder: "ex. Collège Saint-Viateur",
      icon: "business-outline",
      section: "Identité",
    },
    {
      key: "slug",
      label: "Slug",
      type: "slug",
      required: true,
      unique: true,
      slugFrom: "nom",
      placeholder: "ex. college-saint-viateur",
      hint: "Utilisé dans les URLs. Généré automatiquement depuis le nom.",
      icon: "link-outline",
      section: "Identité",
    },
    {
      key: "drena_id",
      label: "DRENA",
      type: "ref",
      ref: "drenas",
      required: true,
      placeholder: "Sélectionner une DRENA",
      icon: "map-outline",
      section: "Rattachement administratif",
    },
    {
      key: "iepp_id",
      label: "IEPP (optionnel)",
      type: "ref",
      ref: "iepps",
      searchable: true,
      placeholder: "Sélectionner une IEPP",
      icon: "git-branch-outline",
      section: "Rattachement administratif",
    },
    {
      key: "adresse",
      label: "Adresse",
      type: "text",
      placeholder: "ex. Rue des Jardins",
      icon: "home-outline",
      section: "Localisation",
    },
    {
      key: "ville",
      label: "Ville",
      type: "text",
      placeholder: "ex. Abidjan",
      icon: "location-outline",
      section: "Localisation",
    },
    {
      key: "commune",
      label: "Commune",
      type: "text",
      placeholder: "ex. Cocody",
      icon: "map-outline",
      section: "Localisation",
    },
    {
      key: "telephone",
      label: "Téléphone",
      type: "phone",
      placeholder: "+225 27 22 00 00 00",
      section: "Contact",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      placeholder: "contact@ecole.ci",
      section: "Contact",
    },
    {
      key: "numero_autorisation",
      label: "Numéro d'autorisation",
      type: "text",
      placeholder: "ex. 123/MENA/2024",
      icon: "document-text-outline",
      section: "Contact",
    },
    // Le statut apparaît dans ta liste mais pas dans ton formulaire : je l'ai ajouté (coché par défaut)
    {
      key: "actif",
      label: "Actif",
      type: "checkbox",
      defaultValue: true,
      hint: "Décoché : l'établissement est inactif",
      section: "Statut",
    },
  ],
  label: (r) => str(r, "nom"),
  list: {
    title: (r) => str(r, "nom"),
    code: (r) => str(r, "code"),
    subtitle: (r) =>
      [str(r, "ville"), str(r, "telephone")].filter(Boolean).join(" · "),
    badges: (r) => [
      {
        label: r.type === "PRIVE" ? "PRIVE" : "PUBLIC",
        tone: r.type === "PRIVE" ? "purple" : "blue",
      },
      {
        label: r.actif ? "Actif" : "Inactif",
        tone: r.actif ? "dark" : "slate",
      },
    ],
  },
  // `id` reste une chaîne : les autres rubriques fictives s'y rattachent (et1, et2)
  seed: [
    {
      id: "et1",
      pubkey: "et1",
      code: "DEMO-PRIV-01",
      nom: "[DÉMO] Établissement Privé 1",
      slug: "demo-etablissement-prive-1",
      type: "PRIVE",
      drena_id: "d2",
      iepp_id: "i1",
      adresse: "",
      ville: "Abidjan",
      commune: "",
      telephone: "+225 27 22 00 00 02",
      email: "",
      logo_path: "",
      numero_autorisation: "",
      parametres: "",
      actif: 1,
      deleted_at: "",
      created_at: "2026-11-01T16:21:43Z",
      updated_at: "2026-11-01T16:21:43Z",
    },
    {
      id: "et2",
      pubkey: "et2",
      code: "DEMO-PUB-01",
      nom: "[DÉMO] Établissement Public 1",
      slug: "demo-etablissement-public-1",
      type: "PUBLIC",
      drena_id: "d2",
      iepp_id: "i2",
      adresse: "",
      ville: "Abidjan",
      commune: "",
      telephone: "+225 27 22 00 00 01",
      email: "",
      logo_path: "",
      numero_autorisation: "",
      parametres: "",
      actif: 1,
      deleted_at: "",
      created_at: "2026-11-01T16:21:43Z",
      updated_at: "2026-11-01T16:21:43Z",
    },
  ],
};

/* ================= Niveaux ================= */

// [abréviation, nom, cycle]
const NIVEAUX: [string, string, string][] = [
  ["PS", "Petite section", "cy1"],
  ["MS", "Moyenne section", "cy1"],
  ["GS", "Grande section", "cy1"],
  ["CP1", "CP1", "cy2"],
  ["CP2", "CP2", "cy2"],
  ["CE1", "CE1", "cy2"],
  ["CE2", "CE2", "cy2"],
  ["CM1", "CM1", "cy2"],
  ["CM2", "CM2", "cy2"],
  ["6EME", "Sixième", "cy3"],
  ["5EME", "Cinquième", "cy3"],
  ["4EME", "Quatrième", "cy3"],
  ["3EME", "Troisième", "cy3"],
  ["2NDE", "Seconde", "cy4"],
  ["1ERE", "Première", "cy4"],
  ["TLE", "Terminale", "cy4"],
];

const niveaux: EntityConfig = {
  key: "niveaux",
  title: "Niveaux",
  singular: "niveau",
  feminine: false,
  countLabel: "niveau(x)",
  icon: "stats-chart-outline",
  searchPlaceholder: "Rechercher par nom ou abréviation…",
  filters: [{ field: "cycle", allLabel: "Tous les cycles" }],
  fields: [
    {
      key: "cycle",
      label: "Cycle",
      type: "ref",
      ref: "cycles",
      required: true,
      noStar: true,
      placeholder: "Sélectionner un cycle",
      icon: "sync-outline",
    },
    {
      key: "abbreviation",
      label: "Abréviation",
      type: "code",
      required: true,
      noStar: true,
      unique: true,
      placeholder: "ex. CP1",
      icon: "barcode-outline",
    },
    {
      key: "name",
      label: "Nom",
      type: "text",
      required: true,
      noStar: true,
      placeholder: "ex. Sixième",
      icon: "text-outline",
    },
    {
      key: "order",
      label: "Ordre",
      type: "number",
      defaultValue: 0,
      icon: "swap-vertical-outline",
    },
  ],
  sortValue: (r) => Number(r.order) || 0,
  label: (r) => str(r, "name"),
  list: {
    title: (r) => str(r, "name"),
    code: (r) => str(r, "abbreviation"),
    subtitle: (r, ctx) =>
      `${ctx.refLabel("cycles", str(r, "cycle"))} · Ordre ${str(r, "order")}`,
  },
  // `cycle` contient l'identifiant du cycle, comme la requête de l'API
  seed: NIVEAUX.map(([abbreviation, name, cycle], i) => ({
    id: `ni${i + 1}`,
    public_key: `ni${i + 1}`,
    abbreviation,
    name,
    order: i + 1,
    cycle,
  })),
};

/* ================= Cycles  ================= */

// [abréviation, nom]
const CYCLES: [string, string][] = [
  ["PRESCO", "Cycle Préscolaire"],
  ["PRIM", "Cycle Primaire"],
  ["SEC1", "Cycle Secondaire 1"],
  ["SEC2", "Cycle Secondaire 2"],
];

const cycles: EntityConfig = {
  key: "cycles",
  title: "Cycles",
  singular: "cycle",
  feminine: false,
  countLabel: "cycle(s)",
  icon: "sync-outline",
  searchPlaceholder: "Rechercher par nom ou abréviation…",
  formSubtitle: "Créez un nouveau cycle scolaire",
  createLabel: "Créer le cycle",
  fields: [
    {
      key: "abbreviation",
      label: "Abréviation",
      type: "text",
      required: true,
      unique: true,
      placeholder: "ex. CP",
      icon: "pricetag-outline",
      section: "Identité",
    },
    {
      key: "name",
      label: "Nom",
      type: "text",
      required: true,
      placeholder: "ex. Cycle Primaire",
      icon: "text-outline",
      section: "Identité",
    },
    {
      key: "order",
      label: "Ordre",
      type: "number",
      required: true,
      defaultValue: 0,
      hint: "L'ordre détermine l'affichage des cycles (du plus petit au plus grand).",
      icon: "swap-vertical-outline",
      section: "Identité",
    },
  ],
  sortValue: (r) => Number(r.order) || 0,
  label: (r) => str(r, "name"),
  list: {
    title: (r) => str(r, "name"),
    code: (r) => str(r, "abbreviation"),
    subtitle: (r) => `Ordre ${str(r, "order")}`,
  },
  // `id` reste à côté de public_key : les autres rubriques s'y rattachent (cy1, cy2…)
  seed: CYCLES.map(([abbreviation, name], i) => ({
    id: `cy${i + 1}`,
    public_key: `cy${i + 1}`,
    abbreviation,
    name,
    order: i + 1,
  })),
};

/* ================= Séries ================= */

// [code, nom, type, cycle_id]
const SERIES: [string, string, string, string][] = [
  ["A1", "Littéraire", "Générale", "cy4"],
  ["A2", "Littéraire - Langues", "Générale", "cy4"],
  ["B", "Sciences Économiques", "Générale", "cy4"],
  ["C", "Sciences Exactes", "Générale", "cy4"],
  ["D", "Sciences Naturelles", "Générale", "cy4"],
  ["STI2D", "Sciences et Technologies de l'Industrie", "Technique", "cy4"],
];

const series: EntityConfig = {
  key: "series",
  title: "Séries",
  singular: "série",
  feminine: true,
  countLabel: "série(s)",
  icon: "git-branch-outline",
  searchPlaceholder: "Rechercher par nom ou code…",
  formSubtitle: "Créez une nouvelle série",
  filters: [{ field: "cycle_id", allLabel: "Tous les cycles" }],
  fields: [
    {
      key: "code",
      label: "Code de la série",
      type: "code",
      required: true,
      noStar: true,
      unique: true,
      placeholder: "Ex: C, D, STI2D…",
      icon: "barcode-outline",
    },
    {
      key: "name",
      label: "Libellé / Nom de la série",
      type: "text",
      required: true,
      noStar: true,
      placeholder: "Ex: Sciences Exactes, Littéraire…",
      icon: "text-outline",
    },
    {
      key: "type",
      label: "Type",
      type: "text",
      placeholder: "Ex: Générale, Technique, Professionnelle…",
      icon: "pricetag-outline",
    },
    {
      key: "cycle_id",
      label: "Cycle associé",
      type: "ref",
      ref: "cycles",
      placeholder: "Sélectionner un cycle",
      icon: "sync-outline",
    },
  ],
  label: (r) => str(r, "name"),
  list: {
    title: (r) => str(r, "name"),
    code: (r) => str(r, "code"),
    subtitle: (r, ctx) =>
      [
        str(r, "type"),
        r.cycle_id ? ctx.refLabel("cycles", str(r, "cycle_id")) : "",
      ]
        .filter(Boolean)
        .join(" · "),
  },
  // `name` suit la réponse de l'API (la requête dit libelle), `cycle_id` garde le lien vers le cycle
  seed: SERIES.map(([code, name, type, cycle_id], i) => ({
    id: `se${i + 1}`,
    public_key: `se${i + 1}`,
    code,
    name,
    type,
    cycle_id,
  })),
};

/* ================= Établissements & Cycles ================= */

const etablissementsCycles: EntityConfig = {
  key: "etablissementsCycles",
  title: "Établissements & Cycles",
  singular: "association",
  feminine: true,
  countLabel: "association(s)",
  icon: "git-compare-outline",
  searchPlaceholder: "Rechercher par établissement ou cycle…",
  filters: [
    { field: "etablissement_id", allLabel: "Tous les établissements" },
    { field: "cycle_id", allLabel: "Tous les cycles" },
  ],
  uniqueTogether: {
    keys: ["etablissement_id", "cycle_id"],
    message: "Cette association existe déjà",
  },
  fields: [
    {
      key: "etablissement_id",
      label: "Établissement",
      type: "ref",
      ref: "etablissements",
      required: true,
      placeholder: "Sélectionner un établissement",
      icon: "business-outline",
    },
    {
      key: "cycle_id",
      label: "Cycle",
      type: "ref",
      ref: "cycles",
      required: true,
      placeholder: "Sélectionner un cycle",
      icon: "sync-outline",
    },
  ],
  label: (r) => r.id,
  list: {
    title: (r, ctx) =>
      ctx.refLabel("etablissements", str(r, "etablissement_id")),
    subtitle: (r, ctx) => ctx.refLabel("cycles", str(r, "cycle_id")),
  },
  seed: [
    {
      id: "ec1",
      public_key: "ec1",
      etablissement_id: "et1",
      cycle_id: "cy3",
    },
    {
      id: "ec2",
      public_key: "ec2",
      etablissement_id: "et1",
      cycle_id: "cy4",
    },
    {
      id: "ec3",
      public_key: "ec3",
      etablissement_id: "et2",
      cycle_id: "cy2",
    },
  ],
};

/* ================= Salles  ================= */

const salles: EntityConfig = {
  key: "salles",
  title: "Salles",
  singular: "salle",
  feminine: true,
  countLabel: "salle(s)",
  icon: "easel-outline",
  searchPlaceholder: "Rechercher par nom ou code…",
  filters: [{ field: "etablissement_id", allLabel: "Tous les établissements" }],
  uniqueTogether: {
    keys: ["etablissement_id", "name"],
    message: "Cette salle existe déjà dans cet établissement",
  },
  fields: [
    // Absent de la requête de l'API, mais la réponse renvoie l'établissement de la salle
    {
      key: "etablissement_id",
      label: "Établissement",
      type: "ref",
      ref: "etablissements",
      required: true,
      placeholder: "Sélectionner un établissement",
      icon: "business-outline",
    },
    {
      key: "code",
      label: "Code",
      type: "code",
      placeholder: "ex. SALLE-01",
      icon: "barcode-outline",
    },
    {
      key: "name",
      label: "Libellé",
      type: "text",
      required: true,
      placeholder: "ex. Salle 1",
      icon: "text-outline",
    },
    {
      key: "capacite",
      label: "Capacité",
      type: "number",
      placeholder: "ex. 40",
      hint: "Nombre de places",
      icon: "people-outline",
    },
  ],
  label: (r) => str(r, "name"),
  optionLabel: (r, ctx) =>
    `${str(r, "name")} · ${ctx.refLabel("etablissements", str(r, "etablissement_id"))}`,
  list: {
    title: (r) => str(r, "name"),
    code: (r) => str(r, "code"),
    subtitle: (r, ctx) =>
      [
        ctx.refLabel("etablissements", str(r, "etablissement_id")),
        r.capacite !== "" ? `${r.capacite} places` : "",
      ]
        .filter(Boolean)
        .join(" · "),
  },
  seed: [
    {
      id: "sa1",
      public_key: "sa1",
      etablissement_id: "et1",
      code: "SALLE-01",
      name: "Salle 1",
      capacite: 40,
    },
    {
      id: "sa2",
      public_key: "sa2",
      etablissement_id: "et1",
      code: "SALLE-02",
      name: "Salle 2",
      capacite: 40,
    },
    {
      id: "sa3",
      public_key: "sa3",
      etablissement_id: "et1",
      code: "LABO",
      name: "Laboratoire",
      capacite: 30,
    },
    {
      id: "sa4",
      public_key: "sa4",
      etablissement_id: "et2",
      code: "SALLE-01",
      name: "Salle 1",
      capacite: 50,
    },
  ],
};

/* ================= Classes  ================= */

const classes: EntityConfig = {
  key: "classes",
  title: "Classes",
  singular: "classe",
  feminine: true,
  countLabel: "classe(s)",
  icon: "school-outline",
  searchPlaceholder: "Rechercher par nom…",
  formSubtitle: "Créez une nouvelle classe",
  filters: [
    { field: "annee", allLabel: "Toutes les années" },
    { field: "niveau", allLabel: "Tous les niveaux" },
  ],
  uniqueTogether: {
    keys: ["annee", "libelle"],
    message: "Cette classe existe déjà pour cette année scolaire",
  },
  fields: [
    {
      key: "libelle",
      label: "Libellé de la classe",
      type: "text",
      required: true,
      noStar: true,
      placeholder: "Ex: 6ème A, Tle D…",
      icon: "text-outline",
    },
    {
      key: "effectif_max",
      label: "Effectif maximum",
      type: "number",
      placeholder: "Ex: 45",
      icon: "people-outline",
    },
    {
      key: "annee",
      label: "Année scolaire",
      type: "ref",
      ref: "annees",
      required: true,
      noStar: true,
      placeholder: "Sélectionner une année",
      icon: "calendar-outline",
    },
    {
      key: "niveau",
      label: "Niveau",
      type: "ref",
      ref: "niveaux",
      required: true,
      noStar: true,
      placeholder: "Sélectionner un niveau",
      icon: "stats-chart-outline",
    },
    {
      key: "serie",
      label: "Série / Option",
      type: "ref",
      ref: "series",
      placeholder: "Sélectionner une série (Optionnel)",
      icon: "git-branch-outline",
    },
    {
      key: "salle",
      label: "Salle attribuée",
      type: "ref",
      ref: "salles",
      placeholder: "Sélectionner une salle",
      icon: "easel-outline",
    },
    {
      key: "enseignant_principal_id",
      label: "Enseignant principal",
      type: "ref",
      ref: "enseignants",
      searchable: true,
      placeholder: "Rechercher un enseignant…",
      icon: "person-outline",
    },
  ],
  label: (r) => str(r, "libelle"),
  list: {
    title: (r) => str(r, "libelle"),
    subtitle: (r, ctx) =>
      [
        ctx.refLabel("niveaux", str(r, "niveau")),
        r.serie ? ctx.refLabel("series", str(r, "serie")) : "",
        ctx.refLabel("annees", str(r, "annee")),
      ]
        .filter(Boolean)
        .join(" · "),
    badges: (r) =>
      r.effectif_max !== ""
        ? [{ label: `Effectif max. ${r.effectif_max}`, tone: "blue" as const }]
        : [],
  },
  // Les liens contiennent des identifiants ; `libelle` suit la réponse de l'API (la requête dit name)
  seed: [
    {
      id: "cl1",
      public_key: "cl1",
      libelle: "6ème A",
      effectif_max: 40,
      annee: "y1",
      niveau: "ni10",
      serie: "",
      salle: "sa1",
      enseignant_principal_id: "t1",
    },
    {
      id: "cl2",
      public_key: "cl2",
      libelle: "6ème B",
      effectif_max: 40,
      annee: "y1",
      niveau: "ni10",
      serie: "",
      salle: "sa2",
      enseignant_principal_id: "t2",
    },
    {
      id: "cl3",
      public_key: "cl3",
      libelle: "3ème A",
      effectif_max: 40,
      annee: "y1",
      niveau: "ni13",
      serie: "",
      salle: "sa3",
      enseignant_principal_id: "t3",
    },
    {
      id: "cl4",
      public_key: "cl4",
      libelle: "Tle D",
      effectif_max: 35,
      annee: "y2",
      niveau: "ni16",
      serie: "se5",
      salle: "",
      enseignant_principal_id: "t4",
    },
    {
      id: "cl5",
      public_key: "cl5",
      libelle: "CP1 A",
      effectif_max: 50,
      annee: "y3",
      niveau: "ni4",
      serie: "",
      salle: "sa4",
      enseignant_principal_id: "t5",
    },
    {
      id: "cl6",
      public_key: "cl6",
      libelle: "CM2 A",
      effectif_max: 50,
      annee: "y3",
      niveau: "ni9",
      serie: "",
      salle: "",
      enseignant_principal_id: "",
    },
  ],
};
/* ================= Matières ================= */

// [code, nom, abréviation, catégorie]
const MATIERES: [string, string, string, string][] = [
  ["SEC-ANG", "Anglais", "Ang", "SECONDAIRE"],
  ["PRI-ART", "Arts plastiques", "Art", "PRIMAIRE"],
  ["PRI-ECM", "Éducation civique", "ECM", "PRIMAIRE"],
  ["PRI-EPS", "Éducation physique", "EPS", "PRIMAIRE"],
  ["SEC-EPS", "Éducation physique", "EPS", "SECONDAIRE"],
  ["SEC-ESP", "Espagnol", "Esp", "SECONDAIRE"],
  ["PRI-FR", "Français", "Fr", "PRIMAIRE"],
  ["SEC-FR", "Français", "Fr", "SECONDAIRE"],
  ["PRI-HG", "Histoire-Géographie", "HG", "PRIMAIRE"],
  ["SEC-HG", "Histoire-Géographie", "HG", "SECONDAIRE"],
  ["SEC-INFO", "Informatique", "Info", "SECONDAIRE"],
  ["PRI-LEC", "Lecture", "Lec", "PRIMAIRE"],
  ["PRI-MATH", "Mathématiques", "Maths", "PRIMAIRE"],
  ["SEC-MATH", "Mathématiques", "Maths", "SECONDAIRE"],
  ["SEC-PHILO", "Philosophie", "Philo", "SECONDAIRE"],
  ["SEC-PC", "Physique-Chimie", "PC", "SECONDAIRE"],
  ["PRI-SCI", "Sciences", "Sci", "PRIMAIRE"],
  ["SEC-SVT", "Sciences de la vie et de la terre", "SVT", "SECONDAIRE"],
  ["SEC-TECH", "Technologie", "Tech", "SECONDAIRE"],
];

const matieres: EntityConfig = {
  key: "matieres",
  title: "Matières",
  singular: "matière",
  feminine: true,
  countLabel: "matière(s)",
  icon: "book-outline",
  searchPlaceholder: "Rechercher par nom…",
  filters: [{ field: "categorie", allLabel: "Toutes les catégories" }],
  // Une même matière peut exister en primaire et en secondaire, mais pas deux fois dans la même catégorie
  uniqueTogether: {
    keys: ["name", "categorie"],
    message: "Cette matière existe déjà dans cette catégorie",
  },
  fields: [
    {
      key: "code",
      label: "Code",
      type: "code",
      required: true,
      unique: true,
      placeholder: "ex. SEC-ANG",
      icon: "barcode-outline",
    },
    {
      key: "name",
      label: "Nom",
      type: "text",
      required: true,
      placeholder: "ex. Anglais",
      icon: "text-outline",
    },
    {
      key: "abreviation",
      label: "Abréviation",
      type: "text",
      placeholder: "ex. Ang",
      icon: "pricetag-outline",
    },
    {
      key: "categorie",
      label: "Catégorie",
      type: "select",
      required: true,
      placeholder: "Sélectionner une catégorie",
      options: [
        { value: "PRIMAIRE", label: "Primaire" },
        { value: "SECONDAIRE", label: "Secondaire" },
      ],
      icon: "layers-outline",
    },
  ],
  label: (r) => str(r, "name"),
  list: {
    title: (r) => str(r, "name"),
    code: (r) => str(r, "code"),
    subtitle: (r) => str(r, "abreviation"),
    badges: (r) =>
      str(r, "categorie")
        ? [{ label: str(r, "categorie"), tone: "slate" as const }]
        : [],
  },
  seed: MATIERES.map(([code, name, abreviation, categorie], i) => ({
    id: `ma${i + 1}`,
    public_key: `ma${i + 1}`,
    code,
    name,
    abreviation,
    categorie,
  })),
};

/* ================= Export (dans l'ordre du menu) ================= */

export const ENTITY_KEYS: EntityKey[] = [
  "etablissements",
  "niveaux",
  "cycles",
  "series",
  "etablissementsCycles",
  "salles",
  "classes",
  "matieres",
];

/* ============================== ADMINISTRATION ============================== */

const SEXE_OPTIONS: Option[] = [
  { value: "M", label: "Masculin" },
  { value: "F", label: "Féminin" },
];

const GROUPES_SANGUINS: Option[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
].map((g) => ({ value: g, label: g }));

/** Initiales comme sur ta capture : initiale du nom + initiale du dernier prénom (BAKAYOKO Yaya Marc → BM) */
const avatarOf = (r: OrgRecord) =>
  `${str(r, "nom")[0] ?? ""}${(str(r, "prenoms").split(" ").pop() ?? "")[0] ?? ""}`.toUpperCase();

/* ----- Utilisateurs (d'après tes captures) ----- */

const utilisateurs: EntityConfig = {
  key: "utilisateurs",
  title: "Utilisateurs",
  singular: "utilisateur",
  feminine: false,
  countLabel: "utilisateur(s)",
  icon: "people-outline",
  searchPlaceholder: "Rechercher par nom, téléphone ou email…",
  formSubtitle: "Créer un nouvel utilisateur",
  createLabel: "Créer l'utilisateur",
  filters: [
    { field: "sexe", allLabel: "Tous les sexes" },
    { field: "etablissementId", allLabel: "Tous les établissements" },
  ],
  fields: [
    {
      key: "nom",
      label: "Nom",
      type: "text",
      required: true,
      icon: "person-outline",
    },
    {
      key: "prenoms",
      label: "Prénoms",
      type: "text",
      required: true,
      icon: "person-outline",
    },
    {
      key: "sexe",
      label: "Sexe",
      type: "select",
      options: SEXE_OPTIONS,
      placeholder: "—",
      icon: "male-female-outline",
    },
    {
      key: "civilite",
      label: "Civilité",
      type: "select",
      options: [
        { value: "M.", label: "M." },
        { value: "Mme", label: "Mme" },
        { value: "Mlle", label: "Mlle" },
      ],
      placeholder: "—",
      icon: "ribbon-outline",
    },
    { key: "telephone", label: "Téléphone", type: "phone" },
    { key: "email", label: "Email", type: "email" },
    {
      key: "dateNaissance",
      label: "Date de naissance",
      type: "date",
      past: true,
    },
    {
      key: "lieuNaissance",
      label: "Lieu de naissance",
      type: "text",
      icon: "location-outline",
    },
    {
      key: "residence",
      label: "Résidence",
      type: "text",
      icon: "home-outline",
    },
    {
      key: "groupeSanguin",
      label: "Groupe sanguin",
      type: "select",
      options: GROUPES_SANGUINS,
      placeholder: "—",
      icon: "water-outline",
    },
    // L'établissement apparaît dans ta liste mais pas dans ton formulaire : je l'ai ajouté (facultatif)
    {
      key: "etablissementId",
      label: "Établissement",
      type: "ref",
      ref: "etablissements",
      placeholder: "—",
      icon: "business-outline",
    },
    {
      key: "motDePasse",
      label: "Mot de passe",
      type: "password",
      requiredOnCreate: true,
      transient: true,
      editHint: "Laisser vide pour conserver le mot de passe actuel.",
    },
    {
      key: "confirmation",
      label: "Confirmation",
      type: "password",
      requiredOnCreate: true,
      matches: "motDePasse",
      transient: true,
    },
  ],
  label: (r) => `${str(r, "nom")} ${str(r, "prenoms")}`,
  searchText: (r) => str(r, "email"),
  list: {
    title: (r) => `${str(r, "nom").toUpperCase()} ${str(r, "prenoms")}`,
    avatar: avatarOf,
    subtitle: (r, ctx) =>
      [
        str(r, "telephone"),
        r.etablissementId
          ? ctx.refLabel("etablissements", str(r, "etablissementId"))
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
    details: (r) =>
      [
        r.dateNaissance
          ? `Né(e) le ${formatDate(fromISO(str(r, "dateNaissance")))}`
          : "",
        r.lieuNaissance ? `à ${str(r, "lieuNaissance")}` : "",
        str(r, "sexe"),
      ]
        .filter(Boolean)
        .join(" · "),
  },
  seed: [
    {
      id: "us1",
      nom: "Bakayoko",
      prenoms: "Yaya Marc",
      sexe: "M",
      civilite: "M.",
      telephone: "+225 07 33 33 33 33",
      email: "",
      dateNaissance: "1975-02-03",
      lieuNaissance: "",
      residence: "",
      groupeSanguin: "",
      etablissementId: "et1",
    },
    {
      id: "us2",
      nom: "Blessy",
      prenoms: "Alain Constant",
      sexe: "M",
      civilite: "M.",
      telephone: "+225 07 44 44 44 44",
      email: "",
      dateNaissance: "1985-03-12",
      lieuNaissance: "",
      residence: "",
      groupeSanguin: "",
      etablissementId: "et2",
    },
    {
      id: "us3",
      nom: "Diomandé",
      prenoms: "Ahmed Sékou",
      sexe: "M",
      civilite: "M.",
      telephone: "+225 07 11 11 11 11",
      email: "",
      dateNaissance: "1978-04-12",
      lieuNaissance: "",
      residence: "",
      groupeSanguin: "",
      etablissementId: "et2",
    },
    {
      id: "us4",
      nom: "Koné",
      prenoms: "Awa Fatoumata",
      sexe: "F",
      civilite: "Mme",
      telephone: "+225 07 22 22 22 22",
      email: "",
      dateNaissance: "1990-08-25",
      lieuNaissance: "",
      residence: "",
      groupeSanguin: "",
      etablissementId: "et2",
    },
    {
      id: "us5",
      nom: "Kouassi",
      prenoms: "Jean-Philippe",
      sexe: "M",
      civilite: "M.",
      telephone: "+225 07 00 00 00 00",
      email: "",
      dateNaissance: "1982-06-15",
      lieuNaissance: "",
      residence: "",
      groupeSanguin: "",
      etablissementId: "",
    },
    {
      id: "us6",
      nom: "Yao",
      prenoms: "Ahou Marie-Laure",
      sexe: "F",
      civilite: "Mme",
      telephone: "+225 05 55 55 55 55",
      email: "",
      dateNaissance: "1988-11-20",
      lieuNaissance: "",
      residence: "",
      groupeSanguin: "",
      etablissementId: "et2",
    },
  ],
};

/* ----- Personnels (proposé : pas de capture) ----- */

const personnels: EntityConfig = {
  key: "personnels",
  title: "Personnels",
  singular: "personnel",
  feminine: false,
  countLabel: "personnel(s)",
  icon: "briefcase-outline",
  searchPlaceholder: "Rechercher par nom, téléphone ou email…",
  formSubtitle: "Créer un nouveau membre du personnel",
  filters: [
    { field: "fonction", allLabel: "Toutes les fonctions" },
    { field: "etablissementId", allLabel: "Tous les établissements" },
  ],
  fields: [
    {
      key: "nom",
      label: "Nom",
      type: "text",
      required: true,
      icon: "person-outline",
      section: "Identité",
    },
    {
      key: "prenoms",
      label: "Prénoms",
      type: "text",
      required: true,
      icon: "person-outline",
      section: "Identité",
    },
    {
      key: "sexe",
      label: "Sexe",
      type: "select",
      options: SEXE_OPTIONS,
      placeholder: "—",
      icon: "male-female-outline",
      section: "Identité",
    },
    {
      key: "fonction",
      label: "Fonction",
      type: "select",
      required: true,
      placeholder: "Sélectionner une fonction",
      options: [
        "Directeur",
        "Censeur",
        "Économe",
        "Éducateur",
        "Surveillant général",
        "Secrétaire",
        "Agent d'entretien",
      ].map((f) => ({ value: f, label: f })),
      icon: "ribbon-outline",
      section: "Poste",
    },
    {
      key: "etablissementId",
      label: "Établissement",
      type: "ref",
      ref: "etablissements",
      placeholder: "Sélectionner un établissement",
      icon: "business-outline",
      section: "Poste",
    },
    {
      key: "dateEmbauche",
      label: "Date d'embauche",
      type: "date",
      past: true,
      section: "Poste",
    },
    { key: "telephone", label: "Téléphone", type: "phone", section: "Contact" },
    { key: "email", label: "Email", type: "email", section: "Contact" },
    {
      key: "active",
      label: "Actif",
      type: "checkbox",
      defaultValue: true,
      hint: "Décoché : le membre du personnel est inactif",
      section: "Statut",
    },
  ],
  label: (r) => `${str(r, "nom")} ${str(r, "prenoms")}`,
  searchText: (r) => str(r, "email"),
  list: {
    title: (r) => `${str(r, "nom").toUpperCase()} ${str(r, "prenoms")}`,
    avatar: avatarOf,
    subtitle: (r, ctx) =>
      [
        str(r, "fonction"),
        r.etablissementId
          ? ctx.refLabel("etablissements", str(r, "etablissementId"))
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
    details: (r) => str(r, "telephone"),
    badges: (r) => [
      {
        label: r.active ? "Actif" : "Inactif",
        tone: r.active ? "dark" : "slate",
      },
    ],
  },
  seed: [
    {
      id: "pe1",
      nom: "Konaté",
      prenoms: "Issouf",
      sexe: "M",
      fonction: "Censeur",
      etablissementId: "et1",
      dateEmbauche: "2015-09-01",
      telephone: "+225 07 10 20 30 40",
      email: "",
      active: true,
    },
    {
      id: "pe2",
      nom: "Traoré",
      prenoms: "Mariam",
      sexe: "F",
      fonction: "Économe",
      etablissementId: "et1",
      dateEmbauche: "2018-10-01",
      telephone: "+225 05 11 22 33 44",
      email: "",
      active: true,
    },
    {
      id: "pe3",
      nom: "Bamba",
      prenoms: "Seydou",
      sexe: "M",
      fonction: "Surveillant général",
      etablissementId: "et2",
      dateEmbauche: "2012-09-15",
      telephone: "+225 07 55 66 77 88",
      email: "",
      active: true,
    },
    {
      id: "pe4",
      nom: "Yapi",
      prenoms: "Clarisse",
      sexe: "F",
      fonction: "Secrétaire",
      etablissementId: "et2",
      dateEmbauche: "2020-01-06",
      telephone: "+225 01 23 45 67 89",
      email: "",
      active: false,
    },
  ],
};

/* ----- Permissions et rôles (d'après tes captures) ----- */

const GUARD_OPTIONS: Option[] = [
  { value: "web", label: "web" },
  { value: "sanctum", label: "sanctum" },
];
const GUARDS = GUARD_OPTIONS.map((g) => g.value);

const RESOURCES = [
  "classe",
  "cycle",
  "dren",
  "eleve",
  "etablissement",
  "iepp",
  "inscription",
  "matiere",
  "niveau",
  "note",
  "paiement",
  "periode",
  "personnel",
  "plan",
  "programme",
  "role",
  "salle",
  "serie",
  "tuteur",
  "user",
  "year",
];
const ACTIONS = ["create", "delete", "update", "view"];

// 85 permissions par guard : assign-permission + 4 actions × 21 ressources
const PERMISSION_NAMES = [
  "assign-permission",
  ...ACTIONS.flatMap((a) => RESOURCES.map((r) => `${a}-${r}`)),
].sort();

const permId = (guard: string, name: string) => `perm-${guard}-${name}`;

// L'admin a 65 permissions : toutes sauf quelques-unes, comme sur ta capture
const ADMIN_EXCLUDED = new Set([
  "assign-permission",
  "create-etablissement",
  "create-role",
]);
const ADMIN_DELETE_KEPT = new Set([
  "delete-note",
  "delete-plan",
  "delete-programme",
  "delete-salle",
]);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSION_NAMES.filter(
    (n) =>
      !ADMIN_EXCLUDED.has(n) &&
      (!n.startsWith("delete-") || ADMIN_DELETE_KEPT.has(n)),
  ),
  censeur: ["view-classe", "view-eleve", "view-note", "view-periode"],
  econome: [
    "view-eleve",
    "view-paiement",
    "create-paiement",
    "update-paiement",
  ],
  educateur: ["view-classe", "view-eleve", "view-inscription"],
  eleve: ["view-note", "view-plan", "view-programme"],
  enseignant: [
    "view-classe",
    "view-eleve",
    "view-matiere",
    "view-note",
    "create-note",
    "update-note",
    "view-programme",
  ],
  nounou: ["view-eleve", "view-tuteur"],
  parent: ["view-eleve", "view-note", "view-paiement", "view-plan"],
  surveillant_general: ["view-classe", "view-eleve", "view-periode"],
};

const permCount = (r: OrgRecord) =>
  String(r.permissionIds ?? "")
    .split(",")
    .filter(Boolean).length;

const permissions: EntityConfig = {
  key: "permissions",
  title: "Permissions",
  singular: "permission",
  feminine: true,
  countLabel: "permission(s)",
  icon: "key-outline",
  searchPlaceholder: "Rechercher une permission…",
  formSubtitle: "",
  createLabel: "Enregistrer",
  deleteNote: "Elle sera aussi retirée des rôles qui l'utilisent.",
  segment: {
    field: "guard",
    label: "Guard",
    options: GUARD_OPTIONS,
    defaultValue: "web",
  },
  uniqueTogether: {
    keys: ["guard", "name"],
    message: "Cette permission existe déjà pour ce guard",
  },
  fields: [
    {
      key: "name",
      label: "Nom",
      type: "text",
      required: true,
      noStar: true,
      placeholder: "ex. create-classe",
      icon: "key-outline",
    },
    {
      key: "guard",
      label: "Guard",
      type: "select",
      required: true,
      noStar: true,
      options: GUARD_OPTIONS,
      defaultValue: "sanctum",
      icon: "shield-outline",
    },
  ],
  label: (r) => str(r, "name"),
  list: {
    title: (r) => str(r, "name"),
    badges: (r) => [{ label: str(r, "guard"), tone: "slate" as const }],
  },
  seed: GUARDS.flatMap((guard) =>
    PERMISSION_NAMES.map((name) => ({ id: permId(guard, name), name, guard })),
  ),
};

const roles: EntityConfig = {
  key: "roles",
  title: "Rôles",
  singular: "rôle",
  feminine: false,
  countLabel: "rôle(s)",
  icon: "shield-checkmark-outline",
  searchPlaceholder: "Rechercher un rôle…",
  formSubtitle: "",
  createLabel: "Enregistrer",
  segment: {
    field: "guard",
    label: "Guard",
    options: GUARD_OPTIONS,
    defaultValue: "web",
  },
  defaults: { permissionIds: "" }, // les permissions se gèrent dans l'écran d'attribution
  uniqueTogether: {
    keys: ["guard", "name"],
    message: "Ce rôle existe déjà pour ce guard",
  },
  fields: [
    {
      key: "name",
      label: "Nom",
      type: "text",
      required: true,
      noStar: true,
      placeholder: "ex. enseignant",
      icon: "shield-outline",
    },
    {
      key: "guard",
      label: "Guard",
      type: "select",
      required: true,
      noStar: true,
      options: GUARD_OPTIONS,
      defaultValue: "sanctum",
      icon: "shield-outline",
    },
  ],
  label: (r) => str(r, "name"),
  list: {
    title: (r) => str(r, "name"),
    subtitle: (r) => `${permCount(r)} permission(s)`,
    badges: (r) => [{ label: str(r, "guard"), tone: "slate" as const }],
  },
  seed: GUARDS.flatMap((guard) =>
    Object.entries(ROLE_PERMISSIONS).map(([name, names]) => ({
      id: `role-${guard}-${name}`,
      name,
      guard,
      permissionIds: names.map((n) => permId(guard, n)).join(","),
    })),
  ),
};

/* Toutes les rubriques, y compris celles de l'administration */
export const ALL_KEYS: EntityKey[] = [
  ...ENTITY_KEYS,
  "utilisateurs",
  "personnels",
  "permissions",
  "roles",
];

export const ENTITIES: Record<EntityKey, EntityConfig> = {
  etablissements,
  niveaux,
  cycles,
  series,
  etablissementsCycles,
  salles,
  classes,
  matieres,
  utilisateurs,
  personnels,
  permissions,
  roles,
};

export type { Field };
