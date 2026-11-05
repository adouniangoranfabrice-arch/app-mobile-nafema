import { Competence, INITIAL_COMPETENCES } from "@/data/competences";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type CompetencesContextValue = {
  competences: Competence[];
  addCompetence: (data: Omit<Competence, "id">) => void;
};

const CompetencesContext = createContext<CompetencesContextValue | null>(null);

export function CompetencesProvider({ children }: { children: ReactNode }) {
  const [competences, setCompetences] =
    useState<Competence[]>(INITIAL_COMPETENCES);

  const addCompetence = useCallback((data: Omit<Competence, "id">) => {
    setCompetences((prev) => [{ ...data, id: `co${Date.now()}` }, ...prev]);
  }, []);

  const value = useMemo(
    () => ({ competences, addCompetence }),
    [competences, addCompetence],
  );

  return (
    <CompetencesContext.Provider value={value}>
      {children}
    </CompetencesContext.Provider>
  );
}

export function useCompetences() {
  const ctx = useContext(CompetencesContext);
  if (!ctx)
    throw new Error(
      "useCompetences doit être utilisé dans un CompetencesProvider",
    );
  return ctx;
}
