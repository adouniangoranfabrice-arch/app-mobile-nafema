import { useStudents } from "@/context/StudentsContext";
import { fullName } from "@/data/students";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { initials } from "@/utils/text";

/** Retrouve un élève avec le nom de sa classe, ou null s'il n'existe plus */
export function useStudentLookup() {
  const { students } = useStudents();
  const classes = useTeacherClasses();

  return (id: string) => {
    const student = students.find((s) => s.id === id);
    if (!student) return null;
    return {
      name: fullName(student),
      initials: initials(`${student.firstNames} ${student.lastName}`),
      classe_id: student.classe_id,
      classe:
        classes.find((c) => c.id === student.classe_id)?.name ?? "Sans classe",
    };
  };
}
