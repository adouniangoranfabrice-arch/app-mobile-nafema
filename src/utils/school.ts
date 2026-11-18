import { normalize } from "@/utils/text";

/** L'établissement du compte connecté (GET /me) */
export type SchoolRef = { public_key: string; name: string };

type Owned = { etab_key?: string; etab_public_key?: string; etab_name?: string };

/**
 * Un élément appartient à l'école si sa clé OU son nom d'établissement correspondent
 * (la base donne parfois deux clés différentes pour le même établissement).
 * Sans information d'établissement, on suppose que le serveur a déjà filtré.
 */
export const belongsToSchool = (x: Owned, school: SchoolRef) => {
  const key = x.etab_key || x.etab_public_key || "";
  const name = x.etab_name ?? "";
  if (!key && !name) return true;
  return (
    (!!key && key === school.public_key) ||
    (!!name && normalize(name) === normalize(school.name))
  );
};

/**
 * Les éléments de l'école. Si le filtre n'en garde aucun alors que le serveur en renvoie,
 * c'est que les identifiants ne concordent pas : le serveur filtre déjà pour l'admin école, on garde tout.
 */
export function ofSchool<T extends Owned>(items: T[], school: SchoolRef | null | undefined) {
  if (!school) return items;
  const mine = items.filter((x) => belongsToSchool(x, school));
  return mine.length > 0 ? mine : items;
}
