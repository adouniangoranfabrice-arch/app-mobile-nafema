export type Drena = {
  id?: number; // seulement si l'API le renvoie : nécessaire pour drena_id
  public_key: string;
  slug: string;
  name: string;
};

// Données fictives (à remplacer par ton API)
export const INITIAL_DRENAS: Drena[] = [
  { public_key: "d1", slug: "ABENGOUROU", name: "DRENA Abengourou" },
  { public_key: "d2", slug: "ABIDJAN-1", name: "DRENA Abidjan 1" },
  { public_key: "d3", slug: "ABIDJAN-2", name: "DRENA Abidjan 2" },
  { public_key: "d4", slug: "ABIDJAN-3", name: "DRENA Abidjan 3" },
  { public_key: "d5", slug: "ABIDJAN-4", name: "DRENA Abidjan 4" },
  { public_key: "d6", slug: "ABOISSO", name: "DRENA Aboisso" },
  { public_key: "d7", slug: "ADZOPE", name: "DRENA Adzopé" },
  { public_key: "d8", slug: "AGBOVILLE", name: "DRENA Agboville" },
  { public_key: "d9", slug: "BONDOUKOU", name: "DRENA Bondoukou" },
  { public_key: "d10", slug: "BOUAFLE", name: "DRENA Bouaflé" },
  { public_key: "d11", slug: "BOUAKE-1", name: "DRENA Bouaké 1" },
  { public_key: "d12", slug: "BOUAKE-2", name: "DRENA Bouaké 2" },
  { public_key: "d13", slug: "DABOU", name: "DRENA Dabou" },
  { public_key: "d14", slug: "DALOA", name: "DRENA Daloa" },
  { public_key: "d15", slug: "DIMBOKRO", name: "DRENA Dimbokro" },
  { public_key: "d16", slug: "DIVO", name: "DRENA Divo" },
  { public_key: "d17", slug: "KORHOGO", name: "DRENA Korhogo" },
  { public_key: "d18", slug: "MAN", name: "DRENA Man" },
  { public_key: "d19", slug: "SAN-PEDRO", name: "DRENA San-Pédro" },
  { public_key: "d20", slug: "YAMOUSSOUKRO", name: "DRENA Yamoussoukro" },
];

/** La DRENA telle qu'elle est renvoyée à l'intérieur d'une IEPP */
export type IeppDren = {
  public_key: string;
  code: string;
  name: string;
};

export type Iepp = {
  public_key: string;
  code: string; // facultatif : peut être vide
  name: string;
  dren: IeppDren; // DRENA de rattachement
};

/** Ce que le formulaire envoie. Tant que les données sont fictives, drena_id contient le public_key de la DRENA */
export type IeppData = {
  drena_id: string;
  code: string;
  nom: string;
};

export const toIeppDren = (d: Drena): IeppDren => ({
  public_key: d.public_key,
  code: d.slug,
  name: d.name,
});

const seed = (
  public_key: string,
  code: string,
  name: string,
  drenaKey: string,
): Iepp => ({
  public_key,
  code,
  name,
  dren: toIeppDren(INITIAL_DRENAS.find((d) => d.public_key === drenaKey)!),
});

// Données fictives (à remplacer par ton API). La dernière valeur est le public_key de la DRENA.
export const INITIAL_IEPPS: Iepp[] = [
  seed("i1", "ABIDJAN-1-N", "IEPP Abidjan 1 Nord", "d2"),
  seed("i2", "ABIDJAN-1-S", "IEPP Abidjan 1 Sud", "d2"),
  seed("i3", "ABIDJAN-2-N", "IEPP Abidjan 2 Nord", "d3"),
  seed("i4", "ABIDJAN-2-S", "IEPP Abidjan 2 Sud", "d3"),
  seed("i5", "ABIDJAN-3-N", "IEPP Abidjan 3 Nord", "d4"),
  seed("i6", "ABIDJAN-3-S", "IEPP Abidjan 3 Sud", "d4"),
  seed("i7", "", "IEPP Abidjan 4 Nord", "d5"),
  seed("i8", "ABIDJAN-4-S", "IEPP Abidjan 4 Sud", "d5"),
  seed("i9", "BOUAKE-1-N", "IEPP Bouaké 1 Nord", "d11"),
  seed("i10", "DALOA-N", "IEPP Daloa Nord", "d14"),
  seed("i11", "KORHOGO-N", "IEPP Korhogo Nord", "d17"),
  seed("i12", "YAMOUSSOUKRO-N", "IEPP Yamoussoukro Nord", "d20"),
];
