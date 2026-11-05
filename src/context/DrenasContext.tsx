import {
  Drena,
  Iepp,
  IeppData,
  INITIAL_DRENAS,
  INITIAL_IEPPS,
  toIeppDren,
} from "@/data/drenas";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type DrenaData = Omit<Drena, "public_key">;

type DrenasContextValue = {
  drenas: Drena[];
  addDrena: (data: DrenaData) => void;
  updateDrena: (id: string, data: DrenaData) => void;
  deleteDrena: (id: string) => void;
  iepps: Iepp[];
  addIepp: (iepp: Iepp) => void;
  updateIepp: (id: string, data: IeppData) => void;
  deleteIepp: (id: string) => void;
};

const DrenasContext = createContext<DrenasContextValue | null>(null);

export function DrenasProvider({ children }: { children: ReactNode }) {
  const [drenas, setDrenas] = useState<Drena[]>(INITIAL_DRENAS);
  const [iepps, setIepps] = useState<Iepp[]>(INITIAL_IEPPS);

  /* ----- DRENA ----- */
  const addDrena = useCallback((data: DrenaData) => {
    setDrenas((prev) => [{ ...data, public_key: `d${Date.now()}` }, ...prev]);
  }, []);

  const updateDrena = useCallback((id: string, data: DrenaData) => {
    const updated = { ...data, public_key: id };
    setDrenas((prev) => prev.map((d) => (d.public_key === id ? updated : d)));
    // Les IEPP gardent une copie de leur DRENA : on la tient à jour
    setIepps((prev) =>
      prev.map((i) =>
        i.dren.public_key === id ? { ...i, dren: toIeppDren(updated) } : i,
      ),
    );
  }, []);

  const deleteDrena = useCallback((id: string) => {
    setDrenas((prev) => prev.filter((d) => d.public_key !== id));
  }, []);

  /* ----- IEPP ----- */
  // Reçoit le format du formulaire et produit celui de la réponse de l'API
  const toIepp = useCallback(
    (public_key: string, data: IeppData): Iepp | null => {
      const dren = drenas.find((d) => d.public_key === data.drena_id);
      if (!dren) return null;
      return {
        public_key,
        code: data.code,
        name: data.nom,
        dren: toIeppDren(dren),
      };
    },
    [drenas],
  );

  // Reçoit l'IEPP renvoyée par l'API après sa création
  const addIepp = useCallback((iepp: Iepp) => {
    setIepps((prev) => [iepp, ...prev]);
  }, []);

  const updateIepp = useCallback(
    (id: string, data: IeppData) => {
      const updated = toIepp(id, data);
      if (!updated) return;
      setIepps((prev) =>
        prev.map((i) => (i.public_key === id ? updated : i)),
      );
    },
    [toIepp],
  );

  const deleteIepp = useCallback((id: string) => {
    setIepps((prev) => prev.filter((i) => i.public_key !== id));
  }, []);

  const value = useMemo(
    () => ({
      drenas,
      addDrena,
      updateDrena,
      deleteDrena,
      iepps,
      addIepp,
      updateIepp,
      deleteIepp,
    }),
    [
      drenas,
      addDrena,
      updateDrena,
      deleteDrena,
      iepps,
      addIepp,
      updateIepp,
      deleteIepp,
    ],
  );

  return (
    <DrenasContext.Provider value={value}>{children}</DrenasContext.Provider>
  );
}

export function useDrenas() {
  const ctx = useContext(DrenasContext);
  if (!ctx)
    throw new Error("useDrenas doit être utilisé dans un DrenasProvider");
  return ctx;
}
