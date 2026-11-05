import { logout } from "@/api/auth";
import { useRouter } from "expo-router";

/** Déconnecte l'utilisateur et le ramène à l'écran de connexion */
export function useLogout() {
  const router = useRouter();

  return async () => {
    await logout();
    router.replace("/(auth)/login");
  };
}
