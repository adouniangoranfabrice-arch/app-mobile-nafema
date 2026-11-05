import { Evaluation, INITIAL_EVALUATIONS } from "@/data/evaluations";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type EvaluationsContextValue = {
  evaluations: Evaluation[];
  addEvaluation: (data: Omit<Evaluation, "id">) => void;
};

const EvaluationsContext = createContext<EvaluationsContextValue | null>(null);

export function EvaluationsProvider({ children }: { children: ReactNode }) {
  const [evaluations, setEvaluations] =
    useState<Evaluation[]>(INITIAL_EVALUATIONS);

  const addEvaluation = useCallback((data: Omit<Evaluation, "id">) => {
    setEvaluations((prev) => [{ ...data, id: `ev${Date.now()}` }, ...prev]);
  }, []);

  const value = useMemo(
    () => ({ evaluations, addEvaluation }),
    [evaluations, addEvaluation],
  );

  return (
    <EvaluationsContext.Provider value={value}>
      {children}
    </EvaluationsContext.Provider>
  );
}

export function useEvaluations() {
  const ctx = useContext(EvaluationsContext);
  if (!ctx)
    throw new Error(
      "useEvaluations doit être utilisé dans un EvaluationsProvider",
    );
  return ctx;
}
