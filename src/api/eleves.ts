import { fetchAllPages } from "@/api/pages";

/** Un élève tel que l'application l'utilise (choix de l'élève à réinscrire) */
export type Eleve = {
  public_key: string;
  nom: string;
  prenoms: string;
  matricule: string;
  classe_name: string;
  niveau_name: string;
  /** « M », « F » ou "" si l'API ne le donne pas */
  gender: string;
  /** Établissement de l'élève, "" si la réponse ne le donne pas */
  etab_name: string;
};

/** Le format exact de GET /eleves n'est pas encore connu : on accepte les variantes habituelles de l'API */
type RawEleve = {
  id?: number;
  public_key?: string;
  pubkey?: string;
  name?: string;
  nom?: string;
  firstname?: string;
  prenoms?: string;
  full_name?: string;
  matricule?: string;
  matricule_national?: string;
  classe_name?: string;
  niveau_name?: string;
  gender?: string | null;
  sexe?: string | null;
  etab_name?: string;
  etablissement?: { name?: string } | string | null;
};

function toEleve(e: RawEleve): Eleve {
  // « KOUASSI Aya » : on sépare nom et prénoms si seul le nom complet est donné
  const [first, ...rest] = (e.full_name ?? "").trim().split(/\s+/);
  return {
    public_key: e.public_key ?? e.pubkey ?? String(e.id ?? ""),
    nom: e.name ?? e.nom ?? first ?? "",
    prenoms: e.firstname ?? e.prenoms ?? rest.join(" "),
    matricule: e.matricule ?? e.matricule_national ?? "",
    classe_name: e.classe_name ?? "",
    niveau_name: e.niveau_name ?? "",
    gender: (e.gender ?? e.sexe ?? "").trim().toUpperCase().slice(0, 1),
    etab_name:
      e.etab_name ||
      (typeof e.etablissement === "string" ? e.etablissement : (e.etablissement?.name ?? "")),
  };
}

/** Tous les élèves, page après page : la recherche se fait dans l'application */
export async function getAllEleves() {
  const raw = await fetchAllPages<RawEleve>("/eleves", (e) => toEleve(e).public_key);
  if (__DEV__ && raw[0]) console.log("Élève reçu (exemple) :", raw[0]); // pour caler les champs
  return raw.map(toEleve);
}

/** « KOUASSI Aya Marie · 07055027R · 5e A » */
export const eleveLabel = (e: Eleve) =>
  [`${e.nom} ${e.prenoms}`.trim(), e.matricule, e.classe_name]
    .filter(Boolean)
    .join(" · ");
