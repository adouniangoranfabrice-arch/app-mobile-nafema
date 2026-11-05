import {
  Appreciation,
  EvaluationCompetence,
  Examen,
  INITIAL_APPRECIATIONS,
  INITIAL_EVALUATIONS_COMPETENCES,
  INITIAL_EXAMENS,
} from "@/data/pedagogie";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type PedagogieContextValue = {
  evaluationsCompetences: EvaluationCompetence[];
  addEvaluationCompetence: (data: Omit<EvaluationCompetence, "id">) => void;
  appreciations: Appreciation[];
  addAppreciation: (data: Omit<Appreciation, "id">) => void;
  examens: Examen[];
  addExamen: (data: Omit<Examen, "id">) => void;
};

const PedagogieContext = createContext<PedagogieContextValue | null>(null);

export function PedagogieProvider({ children }: { children: ReactNode }) {
  const [evaluationsCompetences, setEvaluationsCompetences] = useState(
    INITIAL_EVALUATIONS_COMPETENCES,
  );
  const [appreciations, setAppreciations] = useState(INITIAL_APPRECIATIONS);
  const [examens, setExamens] = useState(INITIAL_EXAMENS);

  const addEvaluationCompetence = useCallback(
    (data: Omit<EvaluationCompetence, "id">) => {
      setEvaluationsCompetences((prev) => [
        { ...data, id: `ec${Date.now()}` },
        ...prev,
      ]);
    },
    [],
  );

  const addAppreciation = useCallback((data: Omit<Appreciation, "id">) => {
    setAppreciations((prev) => [{ ...data, id: `ap${Date.now()}` }, ...prev]);
  }, []);

  const addExamen = useCallback((data: Omit<Examen, "id">) => {
    setExamens((prev) => [{ ...data, id: `ex${Date.now()}` }, ...prev]);
  }, []);

  const value = useMemo(
    () => ({
      evaluationsCompetences,
      addEvaluationCompetence,
      appreciations,
      addAppreciation,
      examens,
      addExamen,
    }),
    [
      evaluationsCompetences,
      addEvaluationCompetence,
      appreciations,
      addAppreciation,
      examens,
      addExamen,
    ],
  );

  return (
    <PedagogieContext.Provider value={value}>
      {children}
    </PedagogieContext.Provider>
  );
}

export function usePedagogie() {
  const ctx = useContext(PedagogieContext);
  if (!ctx)
    throw new Error("usePedagogie doit être utilisé dans un PedagogieProvider");
  return ctx;
}
