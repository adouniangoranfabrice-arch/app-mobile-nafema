import { useAcademic } from "@/context/AcademicContext";
import { useStudents } from "@/context/StudentsContext";
import { useOrganisation } from "@/organisation/OrganisationContext";

// À remplacer par l'école du compte connecté, et par ses seules classes, quand l'API sera branchée
export const TEACHER_SCHOOL = "Collège des Almadies";

/** Les classes de l'année active de l'école de l'enseignant */
export function useTeacherClasses() {
  const { records, refLabel } = useOrganisation();
  const { years } = useAcademic();
  const { students } = useStudents();

  const year = years.find((y) => y.school === TEACHER_SCHOOL && y.active);

  return records("classes")
    .filter((c) => c.annee === year?.id)
    .map((c) => ({
      id: c.id,
      name: String(c.libelle),
      level: refLabel("niveaux", String(c.niveau)),
      room: c.salle ? refLabel("salles", String(c.salle)) : "Sans salle",
      year: refLabel("annees", String(c.annee)),
      students: students.filter((s) => s.classe_id === c.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
}
