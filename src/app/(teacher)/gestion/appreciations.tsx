import PedagogyList from "@/components/gestion/PedagogyList";
import { usePedagogie } from "@/context/PedagogieContext";
import { useGestion } from "@/hooks/use-gestion";
import { useStudentLookup } from "@/hooks/use-student-lookup";
import { useRouter } from "expo-router";

export default function Appreciations() {
  const router = useRouter();
  const { href } = useGestion();
  const { appreciations } = usePedagogie();
  const studentOf = useStudentLookup();

  const items = appreciations.flatMap((a) => {
    const student = studentOf(a.student_id);
    if (!student) return [];
    return [
      {
        id: a.id,
        title: student.name,
        initials: student.initials,
        highlight: `${student.classe} · ${a.matiere}`,
        lines: [a.periode, a.texte],
      },
    ];
  });

  return (
    <PedagogyList
      title="Appréciations-matières"
      summary={`${items.length} appréciation${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="chatbox-ellipses-outline"
      searchPlaceholder="Rechercher un élève, une matière"
      emptyLabel="Aucune appréciation trouvée."
      addLabel="Nouvelle appréciation"
      onAdd={() => router.push(href("nouvelle-appreciation"))}
    />
  );
}
