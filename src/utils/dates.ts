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

/**
 * Date et heure renvoyées par l'API → « 5 nov. 2026 à 09:24 ».
 * Accepte « 2026-11-05 09:24:37 » (heure locale du serveur) et l'ISO « 2026-11-05T09:24:37.000000Z » (UTC).
 * Renvoie "" si la valeur est absente ou illisible.
 */
export const formatDateTime = (raw?: string | null) => {
  if (!raw) return "";
  // Format français déjà mis en forme par le serveur : « 18/11/2026 22:11 »
  const fr = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T,à]+(\d{1,2})[:h](\d{2}))?/,
  );
  if (fr) {
    const d = new Date(+fr[3], +fr[2] - 1, +fr[1], +(fr[4] ?? 0), +(fr[5] ?? 0));
    if (fr[4] === undefined) return formatDate(d);
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${formatDate(d)} à ${h}:${min}`;
  }
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return "";
  let d: Date;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw)) {
    d = new Date(raw.replace(/\.(\d{3})\d+/, ".$1")); // fuseau donné : converti en heure locale
    if (Number.isNaN(d.getTime())) return "";
  } else {
    d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0));
  }
  if (m[4] === undefined) return formatDate(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} à ${hh}:${mm}`;
};
