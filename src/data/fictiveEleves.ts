import type { Eleve } from "@/api/eleves";

/*
 * Élèves fictifs d'une classe, en attendant que la base relie les élèves à leur classe.
 * La liste est toujours la même pour une classe donnée (tirage calculé à partir de sa clé).
 */

const NOMS = [
  "KOUASSI", "KONAN", "KOFFI", "YAO", "N'GUESSAN", "KOUAME", "TRAORE", "KONE", "OUATTARA", "COULIBALY",
  "DIABATE", "BAMBA", "TOURE", "SORO", "SILUE", "YEO", "GBAGBO", "ZADI", "GNAHORE", "DJEDJE",
  "AKA", "ASSI", "BROU", "AHOUA", "TANOH", "ESSOH", "DIOMANDE", "FOFANA", "SANOGO", "CISSE",
];
const PRENOMS_F = [
  "Aya", "Affoué", "Adjoua", "Akissi", "Amenan", "Awa", "Mariam", "Fatou", "Aminata", "Grâce",
  "Marie-Ange", "Prisca", "Christelle", "Larissa", "Esther", "Ruth", "Divine", "Océane", "Sarah", "Inès",
];
const PRENOMS_M = [
  "Kouadio", "Koffi", "Yao", "Konan", "Ibrahim", "Moussa", "Seydou", "Adama", "Jean-Marc", "Serge",
  "Hervé", "Franck", "Junior", "Emmanuel", "Cédric", "Ange", "Ismaël", "Lassina", "Daniel", "Josué",
];
// Second prénom (souvent aucun)
const SECONDS_F = ["Marie", "Emmanuelle", "Florence", "Espérance", "Bénédicte", "", "", "", "", ""];
const SECONDS_M = ["Désiré", "Christ", "Pascal", "Joël", "Arsène", "", "", "", "", ""];

/** Générateur pseudo-aléatoire reproductible (mulberry32) */
function random(seedText: string) {
  let seed = 0;
  for (const ch of seedText) seed = (Math.imul(31, seed) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nombre d'élèves fictifs : l'effectif connu, sinon environ 80 % des places, sinon 25 */
export const fictiveCount = (count: number, capacity: number) =>
  count > 0 ? count : capacity > 0 ? Math.max(1, Math.round(capacity * 0.8)) : 25;

/** Élèves fictifs d'une classe, triés par nom */
export function fictiveEleves(classeKey: string, classeName: string, niveauName: string, total: number): Eleve[] {
  const rand = random(classeKey || classeName);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const used = new Set<string>();
  const eleves: Eleve[] = [];

  for (let i = 0; eleves.length < total && i < total * 5; i++) {
    const girl = rand() < 0.5;
    const nom = pick(NOMS);
    const second = pick(girl ? SECONDS_F : SECONDS_M);
    const prenoms = [pick(girl ? PRENOMS_F : PRENOMS_M), second].filter(Boolean).join(" ");
    const full = `${nom} ${prenoms}`;
    if (used.has(full)) continue; // pas deux fois le même élève dans une classe
    used.add(full);
    const matricule = `${String(Math.floor(rand() * 1e8)).padStart(8, "0")}${String.fromCharCode(65 + Math.floor(rand() * 26))}`;
    eleves.push({
      public_key: `FICTIF-${classeKey}-${i}`,
      nom,
      prenoms,
      matricule,
      classe_name: classeName,
      niveau_name: niveauName,
      gender: girl ? "F" : "M",
      etab_name: "",
    });
  }
  return eleves.sort((a, b) => `${a.nom} ${a.prenoms}`.localeCompare(`${b.nom} ${b.prenoms}`, "fr"));
}
