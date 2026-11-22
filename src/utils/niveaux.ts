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
