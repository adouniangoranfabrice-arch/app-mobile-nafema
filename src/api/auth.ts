import { api, clearToken, saveToken } from "@/api/client";
import { DeviceInfo, deviceLabel } from "@/utils/device";
import axios from "axios";

/** En développement uniquement : affiche des données dans le terminal (jamais le token) */
function showJson(title: string, data: unknown) {
  if (__DEV__) console.log(title, JSON.stringify(data, null, 2));
}

export type UserRole = "super_admin" | "admin" | "enseignant";

type Profile = {
  pubkey: string;
  public_key: string;
  name: string;
  firstname: string;
  full_name: string;
  sexe: string;
  birth_day: string | null;
  birth_of: string | null;
  phone: string;
  photo: string | null;
  civility: string;
  sang: string | null;
  residence: string | null;
  adresse_email: string;
  active: boolean;
  super_admin: boolean;
  connected_at: string;
  cree_le: string;
  modifie_le: string;
  etablissement: {
    public_key: string;
    name: string;
    abbrev: string;
    type: string;
  } | null;
  personnel: {
    public_key: string;
    profession: string;
    matricul_pers: string;
  } | null;
  parent: { public_key: string; profession: string } | null;
};

export type User = Profile & { roles: string[]; permissions: string[] };

type LoginResponse = {
  success: boolean;
  message: string;
  data: { token: string };
};

// Les rôles et les permissions sont à côté du profil, pas dedans
type MeResponse = {
  success: boolean;
  data: Profile;
  roles: string[];
  permissions: string[];
};

export function hasRole(user: User, role: UserRole) {
  return (
    user.roles.includes(role) || (role === "super_admin" && user.super_admin)
  );
}

/** Le profil complet de l'utilisateur connecté */
export async function getMe(): Promise<User> {
  const { data } = await api.get<MeResponse>("/me");
  return { ...data.data, roles: data.roles, permissions: data.permissions };
}

/** Connecte l'utilisateur, enregistre son token et renvoie son profil complet */
export async function login(
  identifiant: string, // téléphone ou e-mail
  mot_de_passe: string,
  device: DeviceInfo,
): Promise<User> {
  const deviceName = deviceLabel(device);
  showJson("Appareil utilisé", { ...device, envoye_au_serveur: deviceName });

  const { data } = await api.post<LoginResponse>("/login", {
    identifiant,
    mot_de_passe,
    device: deviceName, // l'API attend une chaîne de caractères
  });
  await saveToken(data.data.token);

  try {
    const user = await getMe();
    showJson("Utilisateur connecté", user);
    return user;
  } catch (error) {
    await clearToken(); // pas de session à moitié ouverte
    throw error;
  }
}

/** Ferme la session sur le serveur. Le token local est effacé même si le serveur ne répond pas */
export async function logout() {
  try {
    await api.post("/logout", null, { timeout: 5000 });
  } catch (error) {
    showJson("Erreur de déconnexion", String(error));
  } finally {
    await clearToken();
  }
}

/** En développement : affiche le détail d'un échec, avec le JSON renvoyé par le serveur */
export function showLoginError(error: unknown) {
  showJson(
    "Erreur de connexion",
    axios.isAxiosError(error)
      ? {
          url: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
          status: error.response?.status ?? null,
          message: error.message,
          data: error.response?.data ?? null,
        }
      : String(error),
  );
}

/** Message à afficher à l'utilisateur quand la connexion échoue */
export function loginErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error))
    return "Une erreur est survenue. Veuillez réessayer.";
  if (!error.response)
    return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  const { status, data } = error.response;
  if (status === 401) return "Adresse e-mail ou mot de passe incorrect.";
  // Autres refus (champ invalide, compte désactivé…) : l'API explique déjà pourquoi
  if (status < 500 && typeof data?.message === "string") return data.message;
  return "Une erreur est survenue. Veuillez réessayer.";
}
