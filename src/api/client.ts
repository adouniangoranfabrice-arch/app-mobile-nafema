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
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    const { status, data } = error.response;
    if (status < 500) {
      // Erreurs de validation : { message, errors: { champ: ["…"] } }
      const details = Object.values(data?.errors ?? {}).flat();
      if (details.length > 0) return details.join("\n");
      if (typeof data?.message === "string") return data.message;
    }
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}
