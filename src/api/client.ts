import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "nafema.token";

// expo-secure-store n'existe pas sur le web : le token y va dans localStorage, moins sûr
const storage =
  Platform.OS === "web"
    ? {
        get: async () => localStorage.getItem(TOKEN_KEY),
        set: async (token: string) => localStorage.setItem(TOKEN_KEY, token),
        remove: async () => localStorage.removeItem(TOKEN_KEY),
      }
    : {
        get: () => SecureStore.getItemAsync(TOKEN_KEY),
        set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
        remove: () => SecureStore.deleteItemAsync(TOKEN_KEY),
      };

export async function saveToken(token: string) {
  await storage.set(token);
}

export async function clearToken() {
  await storage.remove();
}

/** Le client HTTP unique de l'application */
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

// Ajoute le token à chaque requête
api.interceptors.request.use(async (config) => {
  const token = await storage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Message à afficher quand une requête échoue : le serveur explique déjà ses refus */
/** Le serveur a répondu (statut 200) mais refuse l'opération : { success: false, message } */
export class ServerRefusal extends Error {
  name = "ServerRefusal"; // reconnu par son nom : instanceof n'est pas fiable sur les sous-classes d'Error compilées
}

/** Lève ServerRefusal si la réponse dit success: false ; sinon renvoie le message du serveur ou le message par défaut */
export function okMessage(
  data: { success?: boolean; message?: string } | null | undefined,
  fallback: string,
) {
  if (data?.success === false)
    throw new ServerRefusal(data.message || "Le serveur a refusé l'opération.");
  return data?.message || fallback;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "ServerRefusal") return error.message;
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    const { status, data } = error.response;
    // En développement : ce qui a été envoyé et ce que le serveur a répondu, pour comprendre l'échec
    if (__DEV__) {
      console.log(
        "Échec API",
        JSON.stringify({
          requete: `${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          statut: status,
          envoye: (() => {
            try {
              return JSON.parse(error.config?.data ?? "null");
            } catch {
              return error.config?.data ?? null;
            }
          })(),
          reponse: data,
        }),
      );
    }
    if (status < 500) {
      // Erreurs de validation : { message, errors: { champ: ["…"] } }
      const details = Object.values(data?.errors ?? {}).flat();
      if (details.length > 0) return details.join("\n");
      if (typeof data?.message === "string") return data.message;
    }
    // 500 : le serveur a planté en traitant la demande (le problème est côté serveur)
    if (status >= 500)
      return `Erreur du serveur (${status}). Veuillez réessayer ou contacter l'administrateur.`;
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}
