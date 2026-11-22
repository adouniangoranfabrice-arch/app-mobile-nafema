/** Un numéro de téléphone compte exactement 10 chiffres (ex. 0707000000) */
export const PHONE_LENGTH = 10;

export const PHONE_PLACEHOLDER = "Ex. 0707000000";

export const PHONE_ERROR = `Le numéro doit comporter ${PHONE_LENGTH} chiffres`;

/**
 * Ne garde que les chiffres, au plus 10.
 * Un numéro déjà enregistré avec l'indicatif (+225 07 00 00 00 00) perd son « 225 ».
 */
export function toPhone(raw: string | null | undefined): string {
  let digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length > PHONE_LENGTH && digits.startsWith("225")) digits = digits.slice(3);
  return digits.slice(0, PHONE_LENGTH);
}

/** Vrai si la saisie compte exactement 10 chiffres */
export const isPhone = (v: string) => new RegExp(`^\\d{${PHONE_LENGTH}}$`).test(v.trim());

/** Propriétés communes des champs téléphone : clavier numérique, 10 caractères au plus */
export const PHONE_INPUT = {
  keyboardType: "number-pad",
  maxLength: PHONE_LENGTH,
  placeholder: PHONE_PLACEHOLDER,
} as const;
