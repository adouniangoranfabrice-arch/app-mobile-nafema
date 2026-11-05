import { Annee, getAnnees } from "@/api/annees";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "loading" | "refreshing" | "loadingMore" | "idle" | "failed";

let stale = false;

/** À appeler après un changement fait depuis un autre écran : la liste se recharge à son retour */
export const markAnneesStale = () => {
  stale = true;
};

/** La liste des années scolaires de l'API, chargée page par page */
export function useAnnees() {
  const [annees, setAnnees] = useState<Annee[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const lastRequest = useRef(0);

  const fetchPage = useCallback(async (cursor: string | null, next: Status) => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const page = await getAnnees(cursor);
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setAnnees((prev) => (cursor ? [...prev, ...page.annees] : page.annees));
      setNextCursor(page.nextCursor);
      setStatus("idle");
    } catch {
      if (request === lastRequest.current) setStatus("failed");
    }
  }, []);

  useEffect(() => {
    fetchPage(null, "loading");
    return () => {
      lastRequest.current++; // écran quitté : la réponse en cours est ignorée
    };
  }, [fetchPage]);

  useFocusEffect(
    useCallback(() => {
      if (stale) {
        stale = false;
        fetchPage(null, "refreshing");
      }
    }, [fetchPage]),
  );

  return {
    annees,
    status,
    hasMore: nextCursor !== null,
    // Après un échec, seul « Réessayer » relance : sinon le défilement redemanderait en boucle
    loadMore: () => {
      if (status === "idle" && nextCursor) {
        fetchPage(nextCursor, "loadingMore");
      }
    },
    refresh: () => fetchPage(null, "refreshing"),
    retry: () =>
      fetchPage(nextCursor, annees.length > 0 ? "loadingMore" : "loading"),
  };
}
