import PedagogyList from "@/components/gestion/PedagogyList";
import { usePedagogie } from "@/context/PedagogieContext";
import { isUpcoming } from "@/data/evaluations";
import { useGestion } from "@/hooks/use-gestion";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { formatDate } from "@/utils/dates";
import { useRouter } from "expo-router";

export default function Examens() {
  const router = useRouter();
  const { href } = useGestion();
  const { examens } = usePedagogie();
  const classes = useTeacherClasses();

  const items = [...examens]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((e) => {
      const upcoming = isUpcoming(e);
      return {
        id: e.id,
        title: e.titre,
        highlight: `${classes.find((c) => c.id === e.classe_id)?.name ?? "Classe introuvable"} · ${e.matiere}`,
        lines: [`${formatDate(e.date)} · Durée : ${e.duree}`],
        badge: upcoming
          ? { label: "À venir", tone: "blue" as const }
          : { label: "Passé", tone: "slate" as const },
      };
    });

  return (
    <PedagogyList
      title="Examens"
      summary={`${items.length} examen${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="document-outline"
      searchPlaceholder="Rechercher un examen, une classe"
      emptyLabel="Aucun examen trouvé."
      addLabel="Nouvel examen"
      onAdd={() => router.push(href("nouvel-examen"))}
    />
  );
}
