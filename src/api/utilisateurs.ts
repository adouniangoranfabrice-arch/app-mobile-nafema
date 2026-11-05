import { fetchAllPages } from "@/api/pages";

export type Utilisateur = {
  public_key: string | null;
  name: string;
  firstname: string;
  full_name: string;
  sexe: string;
  birth_day: string | null;
  birth_of: string | null;
  phone: string | null;
  photo: string | null;
  roles: { super_admin: boolean; personnel: boolean; parent: boolean };
  etablissement: {
    public_key: string;
    name: string;
    abbrev: string;
    type: string;
  } | null;
};

/** L'API renvoie aujourd'hui public_key à null : on identifie alors l'utilisateur par ses données */
export const utilisateurKey = (u: Utilisateur) =>
  u.public_key ?? `${u.full_name}|${u.birth_day}|${u.phone}`;

/** Tous les utilisateurs, page après page : la recherche se fait dans l'application */
export function getUtilisateurs() {
  return fetchAllPages<Utilisateur>("/utilisateurs", utilisateurKey);
}

const ROLE_LABELS = {
  super_admin: "Super admin",
  personnel: "Personnel",
  parent: "Parent",
} as const;

export const utilisateurRoles = (u: Utilisateur) =>
  (Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[])
    .filter((role) => u.roles?.[role])
    .map((role) => ROLE_LABELS[role]);

// L'utilisateur ouvert reste en mémoire : ses données personnelles ne passent pas par les paramètres de route
let opened: Utilisateur | null = null;

export const openUtilisateur = (u: Utilisateur) => {
  opened = u;
};

export const openedUtilisateur = () => opened;
