import { getAllDrens } from "@/api/drens";
import { Drena } from "@/data/drenas";
import { useEffect, useState } from "react";

/** Les vraies DRENA pour une liste de choix, chargées quand `enabled` passe à vrai (ouverture du formulaire) */
export function useAllDrenas(enabled: boolean) {
  const [drenas, setDrenas] = useState<Drena[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "failed">(
    "loading",
  );

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setStatus("loading");
    getAllDrens()
      .then((all) => {
        if (!active) return;
        setDrenas(all);
        setStatus("idle");
      })
      .catch(() => {
        if (active) setStatus("failed");
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  return { drenas, status };
}
