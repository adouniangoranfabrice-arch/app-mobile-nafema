import PedagogyList from "@/components/gestion/PedagogyList";
import { useStudents } from "@/context/StudentsContext";
import { INITIAL_LINKS, INITIAL_PARENTS, parentName } from "@/data/families";
import { fullName } from "@/data/students";
import { useGestion } from "@/hooks/use-gestion";
import { initials } from "@/utils/text";

export default function ParentsEleves() {
  const { school } = useGestion();
  const { students } = useStudents();

  const items = INITIAL_LINKS.flatMap((l) => {
    const parent = INITIAL_PARENTS.find((p) => p.id === l.parentId);
    const student = students.find((s) => s.id === l.studentId);
    if (!parent || !student) return [];
    if (school && student.school !== school) return [];

    const roles = [
      l.financialResponsible ? "Responsable financier" : "",
      l.emergencyContact ? "Contact d'urgence" : "",
    ].filter(Boolean);

    return [
      {
        id: l.id,
        title: fullName(student),
        initials: initials(`${student.firstNames} ${student.lastName}`),
        highlight: `${l.relation} : ${parentName(parent)}`,
        lines: [student.school, ...(roles.length ? [roles.join(" · ")] : [])],
      },
    ];
  }).sort((a, b) => a.title.localeCompare(b.title, "fr"));

  return (
    <PedagogyList
      title="Parents - Élèves"
      summary={`${items.length} lien${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="people-outline"
      searchPlaceholder="Rechercher un élève, un parent"
      emptyLabel="Aucun lien trouvé."
    />
  );
}
