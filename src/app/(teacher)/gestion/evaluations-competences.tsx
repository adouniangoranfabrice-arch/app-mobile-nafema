import PedagogyList from "@/components/gestion/PedagogyList";
import { useCompetences } from "@/context/CompetencesContext";
import { usePedagogie } from "@/context/PedagogieContext";
import { COMPETENCE_LEVELS } from "@/data/pedagogie";
import { useGestion } from "@/hooks/use-gestion";
import { useStudentLookup } from "@/hooks/use-student-lookup";
import { formatDate } from "@/utils/dates";
import { useRouter } from "expo-router";

export default function EvaluationsCompetences() {
  const router = useRouter();
  const { href } = useGestion();
  const { evaluationsCompetences } = usePedagogie();
  const { competences } = useCompetences();
  const studentOf = useStudentLookup();

  const items = [...evaluationsCompetences]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .flatMap((e) => {
      const student = studentOf(e.student_id);
      if (!student) return [];
      const competence = competences.find((c) => c.id === e.competence_id);
      return [
        {
          id: e.id,
          title: student.name,
          initials: student.initials,
          highlight: student.classe,
          lines: [
            competence?.intitule ?? "Compétence introuvable",
            formatDate(e.date),
          ],
          badge: {
            label: e.niveau,
            tone:
              COMPETENCE_LEVELS.find((l) => l.value === e.niveau)?.tone ??
              ("slate" as const),
          },
        },
      ];
    });

  return (
    <PedagogyList
      title="Évaluations-compétences"
      summary={`${items.length} évaluation${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="list-outline"
      searchPlaceholder="Rechercher un élève, une compétence"
      emptyLabel="Aucune évaluation trouvée."
      addLabel="Nouvelle évaluation"
      onAdd={() => router.push(href("nouvelle-evaluation-competence"))}
    />
  );
}
