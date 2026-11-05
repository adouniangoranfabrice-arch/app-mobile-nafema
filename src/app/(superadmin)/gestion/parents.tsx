import PedagogyList from "@/components/gestion/PedagogyList";
import { INITIAL_PARENTS, parentName } from "@/data/families";
import { useGestion } from "@/hooks/use-gestion";
import { initials } from "@/utils/text";

export default function Parents() {
  const { school } = useGestion();

  const items = INITIAL_PARENTS.filter((p) => !school || p.school === school)
    .sort((a, b) => parentName(a).localeCompare(parentName(b), "fr"))
    .map((p) => ({
      id: p.id,
      title: parentName(p),
      initials: initials(`${p.firstNames} ${p.lastName}`),
      highlight: p.school,
      lines: [
        [p.phone, p.phone2].filter(Boolean).join(" · "),
        ...(p.email ? [p.email] : []),
        `${p.profession} · ${p.district}`,
      ],
      badge: p.active
        ? { label: "Actif", tone: "green" as const }
        : { label: "Inactif", tone: "slate" as const },
    }));

  return (
    <PedagogyList
      title="Parents"
      summary={`${items.length} parent${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="person-outline"
      searchPlaceholder="Rechercher un parent, un téléphone, une école"
      emptyLabel="Aucun parent trouvé."
    />
  );
}
