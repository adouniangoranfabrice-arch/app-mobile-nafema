import { appendDrenas, getDrens, PER_PAGE } from "@/api/drens";
import { Drena } from "@/data/drenas";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "loading" | "refreshing" | "changingPage" | "idle" | "failed";

let stale = false;

/** À appeler après un changement fait depuis un autre écran : la liste se recharge à son retour */
export const markDrenasStale = () => {
  stale = true;
};

/**
 * Les DRENA de l'API, affichées par pages de 20. Les pages du serveur sont gardées en mémoire et
 * redécoupées ici : l'écran montre toujours 20 DRENA, quel que soit le nombre renvoyé par le serveur.
 */
export function useDrenaList(search: string) {
  const [drenas, setDrenas] = useState<Drena[]>([]);
  const [page, setPage] = useState(1);
  const [nextQuery, setNextQuery] = useState<string | null>(null);
  const [serverPageCount, setServerPageCount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const lastRequest = useRef(0);
  const lastAttempt = useRef<() => void>(() => {});
  const buffer = useRef<{ items: Drena[]; query: string | null }>({
    items: [],
    query: null,
  });

  const load = useCallback(
    async (target: number, fromStart: boolean, next: Status) => {
      const request = ++lastRequest.current;
      lastAttempt.current = () => load(target, fromStart, next);
      setStatus(next);
      try {
        let { items, query } = fromStart
          ? { items: [] as Drena[], query: null }
          : buffer.current;
        let first = fromStart;

        // Charge les pages du serveur jusqu'à pouvoir remplir la page demandée
        while (first || (query && items.length < target * PER_PAGE)) {
          const result = await getDrens(query, search);
          if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
          const merged = appendDrenas(items, result.drenas);
          // Une page sans rien de nouveau : on s'arrête, sinon on redemanderait sans fin
          query = first || merged.length > items.length ? result.nextQuery : null;
          items = merged;
          first = false;
          buffer.current = { items, query };
          setServerPageCount(result.pageCount);
        }

        const lastPage = Math.max(1, Math.ceil(items.length / PER_PAGE));
        setDrenas(items);
        setNextQuery(query);
        setPage(Math.min(target, lastPage));
        setStatus("idle");
      } catch (error) {
        if (__DEV__) console.log("Erreur de chargement des DRENA", String(error));
        if (request === lastRequest.current) setStatus("failed");
      }
    },
    [search],
  );

  useEffect(() => {
    load(1, true, "loading");
    return () => {
      lastRequest.current++; // recherche changée ou écran quitté : la réponse en cours est ignorée
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (stale) {
        stale = false;
        load(page, true, "refreshing");
      }
    }, [load, page]),
  );

  const hasNext = nextQuery !== null || page * PER_PAGE < drenas.length;

  return {
    shown: drenas.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    firstIndex: (page - 1) * PER_PAGE,
    // Connu avec certitude une fois tout chargé, sinon d'après le serveur s'il l'indique
    total: nextQuery === null ? drenas.length : null,
    page,
    pageCount:
      nextQuery === null
        ? Math.max(1, Math.ceil(drenas.length / PER_PAGE))
        : serverPageCount,
    hasNext,
    hasPrevious: page > 1,
    status,
    next: () => {
      if (hasNext) load(page + 1, false, "changingPage");
    },
    previous: () => {
      lastRequest.current++; // annule un changement de page en cours
      setStatus("idle");
      setPage(Math.max(1, page - 1));
    },
    refresh: () => load(1, true, "refreshing"),
    // Après une modification ou une suppression : recharge en restant sur la même page
    reload: () => load(page, true, "refreshing"),
    retry: () => lastAttempt.current(),
  };
}
