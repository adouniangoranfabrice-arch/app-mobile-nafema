/** Minuscules sans accents, pour une recherche tolérante (« ecole » trouve « École »). */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** 12840 → "12 840" */
export const fmt = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

/** "Amadou Diallo" → "AD" */
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
