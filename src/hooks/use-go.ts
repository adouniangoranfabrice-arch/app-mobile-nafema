import { Href, useRouter } from "expo-router";
import { useCallback } from "react";

/**
 * Ouvre un écran, même s'il est dans un autre onglet (accueil → Gestion, accueil → Classes).
 * withAnchor : la page principale de l'onglet (initialRouteName de son _layout) est placée
 * sous l'écran ouvert, pour que le retour et l'onglet y ramènent toujours.
 * Sans effet de bord quand l'écran est dans la pile courante.
 */
export function useGo() {
  const router = useRouter();
  return useCallback(
    (href: Href) => router.push(href, { withAnchor: true }),
    [router],
  );
}
