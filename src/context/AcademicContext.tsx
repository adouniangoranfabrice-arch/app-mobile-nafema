import {
  AcademicYear,
  INITIAL_PERIODS,
  INITIAL_YEARS,
  Period,
} from "@/data/academic";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type YearData = Omit<AcademicYear, "id">;
type PeriodData = Omit<Period, "id">;

type AcademicContextValue = {
  years: AcademicYear[];
  addYear: (data: YearData) => void;
  updateYear: (id: string, data: YearData) => void;
  deleteYear: (id: string) => void;
  periods: Period[];
  addPeriod: (data: PeriodData) => void;
  updatePeriod: (id: string, data: PeriodData) => void;
  deletePeriod: (id: string) => void;
};

const AcademicContext = createContext<AcademicContextValue | null>(null);

// Une seule année active par établissement : les autres passent en « Clôturée »
const closeOthers = (list: AcademicYear[], school: string, keepId: string) =>
  list.map((y) =>
    y.school === school && y.id !== keepId ? { ...y, active: false } : y,
  );

export function AcademicProvider({ children }: { children: ReactNode }) {
  const [years, setYears] = useState<AcademicYear[]>(INITIAL_YEARS);
  const [periods, setPeriods] = useState<Period[]>(INITIAL_PERIODS);

  /* ----- Années ----- */
  const addYear = useCallback((data: YearData) => {
    const id = `y${Date.now()}`;
    setYears((prev) => {
      const next = [{ ...data, id }, ...prev];
      return data.active ? closeOthers(next, data.school, id) : next;
    });
  }, []);

  const updateYear = useCallback((id: string, data: YearData) => {
    setYears((prev) => {
      const next = prev.map((y) => (y.id === id ? { ...data, id } : y));
      return data.active ? closeOthers(next, data.school, id) : next;
    });
  }, []);

  const deleteYear = useCallback((id: string) => {
    setYears((prev) => prev.filter((y) => y.id !== id));
    setPeriods((prev) => prev.filter((p) => p.yearId !== id)); // suppression en cascade
  }, []);

  /* ----- Périodes ----- */
  const addPeriod = useCallback((data: PeriodData) => {
    setPeriods((prev) => [{ ...data, id: `p${Date.now()}` }, ...prev]);
  }, []);

  const updatePeriod = useCallback((id: string, data: PeriodData) => {
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...data, id } : p)));
  }, []);

  const deletePeriod = useCallback((id: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      years,
      addYear,
      updateYear,
      deleteYear,
      periods,
      addPeriod,
      updatePeriod,
      deletePeriod,
    }),
    [
      years,
      addYear,
      updateYear,
      deleteYear,
      periods,
      addPeriod,
      updatePeriod,
      deletePeriod,
    ],
  );

  return (
    <AcademicContext.Provider value={value}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  const ctx = useContext(AcademicContext);
  if (!ctx)
    throw new Error("useAcademic doit être utilisé dans un AcademicProvider");
  return ctx;
}
