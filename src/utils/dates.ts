const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** Crée une date locale : ymd(2026, 9, 7) → 7 septembre 2026 */
export const ymd = (y: number, m: number, d: number) => new Date(y, m - 1, d);

/** Même jour à minuit (retire l'heure) */
export const day = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** 7 sept. 2026 */
export const formatDate = (d: Date) =>
  `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** Libellé automatique : 2025-2026 (ou juste 2026 si début et fin sont la même année) */
export const yearLabel = (start: Date | null, end: Date | null) => {
  if (!start || !end) return "";
  const a = start.getFullYear();
  const b = end.getFullYear();
  return a === b ? String(a) : `${a}-${b}`;
};

/** Âge en années révolues */
export const ageOf = (birth: Date, now = new Date()) => {
  let age = now.getFullYear() - birth.getFullYear();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
};
