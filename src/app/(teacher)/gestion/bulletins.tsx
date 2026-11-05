import PedagogyList from "@/components/gestion/PedagogyList";
import { BULLETINS, mention } from "@/data/pedagogie";
import { useStudentLookup } from "@/hooks/use-student-lookup";

export default function Bulletins() {
  const studentOf = useStudentLookup();

  const rows = BULLETINS.flatMap((b) => {
    const student = studentOf(b.student_id);
    return student ? [{ ...b, student }] : [];
  });

  // Le rang se calcule dans la classe, sur la même période
  const sameGroup = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
    a.student.classe_id === b.student.classe_id && a.periode === b.periode;

  const items = rows
    .sort(
      (a, b) =>
        a.student.classe.localeCompare(b.student.classe, "fr", {
          numeric: true,
        }) || b.moyenne - a.moyenne,
    )
    .map((b) => {
      const group = rows.filter((other) => sameGroup(other, b));
      const rank = group.filter((other) => other.moyenne > b.moyenne).length + 1;
      return {
        id: b.id,
        title: b.student.name,
        initials: b.student.initials,
        highlight: `${b.student.classe} · ${b.periode}`,
        lines: [
          `Moyenne : ${String(b.moyenne).replace(".", ",")} / 20`,
          `Rang : ${rank}${rank === 1 ? "er" : "e"} sur ${group.length}`,
        ],
        badge: mention(b.moyenne),
      };
    });

  return (
    <PedagogyList
      title="Bulletins"
      summary={`${items.length} bulletin${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="document-text-outline"
      searchPlaceholder="Rechercher un élève, une classe"
      emptyLabel="Aucun bulletin trouvé."
    />
  );
}
