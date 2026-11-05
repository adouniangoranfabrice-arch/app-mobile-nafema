import { INITIAL_STUDENTS, Student } from "@/data/students";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

type StudentData = Omit<Student, "id">;

type StudentsContextValue = {
  students: Student[];
  addStudent: (data: StudentData) => void;
  updateStudent: (id: string, data: StudentData) => void;
  deleteStudent: (id: string) => void;
};

const StudentsContext = createContext<StudentsContextValue | null>(null);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);

  const addStudent = useCallback((data: StudentData) => {
    setStudents((prev) => [{ ...data, id: `s${Date.now()}` }, ...prev]);
  }, []);

  const updateStudent = useCallback((id: string, data: StudentData) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...data, id } : s)));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(
    () => ({ students, addStudent, updateStudent, deleteStudent }),
    [students, addStudent, updateStudent, deleteStudent],
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const ctx = useContext(StudentsContext);
  if (!ctx)
    throw new Error("useStudents doit être utilisé dans un StudentsProvider");
  return ctx;
}
