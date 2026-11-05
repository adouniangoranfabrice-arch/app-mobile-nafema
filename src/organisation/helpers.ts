import { Alert } from "react-native";
import { EntityConfig } from "./types";

const vowel = (s: string) => /^[aeiouhéèêàâîôû]/i.test(s);

/** Nouvel établissement / Nouveau niveau / Nouvelle salle */
export const newWord = (c: EntityConfig) =>
  c.feminine ? "Nouvelle" : vowel(c.singular) ? "Nouvel" : "Nouveau";

/** un nouvel établissement / un nouveau niveau / une nouvelle salle */
export const indefiniteNew = (c: EntityConfig) =>
  c.feminine ? "une nouvelle" : vowel(c.singular) ? "un nouvel" : "un nouveau";

/** l'établissement / le niveau / la salle */
export const definite = (c: EntityConfig) =>
  vowel(c.singular) ? "l'" : c.feminine ? "la " : "le ";

/** de l'établissement / du niveau / de la salle */
export const ofThe = (c: EntityConfig) =>
  vowel(c.singular) ? "de l'" : c.feminine ? "de la " : "du ";

/** cet établissement / ce niveau / cette salle */
export const demonstrative = (c: EntityConfig) =>
  c.feminine ? "cette" : vowel(c.singular) ? "cet" : "ce";

export const shown = (c: EntityConfig) =>
  c.feminine ? "affichée(s)" : "affiché(s)";

export const notFound = (c: EntityConfig) =>
  `${c.feminine ? "Aucune" : "Aucun"} ${c.singular} trouvé${c.feminine ? "e" : ""}.`;

/** "[DÉMO] Établissement Privé 1" → "demo-etablissement-prive-1" */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "1975-02-03" → Date locale */
export const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Date locale → "1975-02-03" */
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Confirmation de suppression. `used` = les rubriques qui utilisent encore cet élément. */
export function confirmDeleteRecord(
  config: EntityConfig,
  name: string,
  used: { title: string; count: number }[],
  onConfirm: () => void,
) {
  if (used.length > 0) {
    Alert.alert(
      "Suppression impossible",
      `${name} est utilisé${config.feminine ? "e" : ""} dans : ${used
        .map((u) => `${u.title} (${u.count})`)
        .join(", ")}.\n\nSupprime d'abord ces éléments.`,
    );
    return;
  }

  Alert.alert(
    `Supprimer ${demonstrative(config)} ${config.singular} ?`,
    `${name}${config.deleteNote ? `\n\n${config.deleteNote}` : ""}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}
