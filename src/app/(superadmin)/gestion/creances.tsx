import PedagogyList from "@/components/gestion/PedagogyList";
import { CREANCES, enRetard, fcfa, reste } from "@/data/finances";
import { useGestion } from "@/hooks/use-gestion";
import { formatDate } from "@/utils/dates";
import { useLocalSearchParams } from "expo-router";

/** Créances des élèves : toutes celles non soldées, ou seulement celles en retard (données fictives) */
export default function CreancesScreen() {
  const { filtre } = useLocalSearchParams<{ filtre?: string }>();
  const retardSeul = filtre === "retard";
  const { school } = useGestion();

  const creances = CREANCES.filter(
    (c) =>
      (!school || c.school === school) &&
      reste(c) > 0 &&
      (!retardSeul || enRetard(c)),
  );
  const total = creances.reduce((s, c) => s + reste(c), 0);

  const items = [...creances]
    .sort((a, b) => a.echeance.getTime() - b.echeance.getTime())
    .map((c) => ({
      id: c.id,
      title: c.eleve,
      highlight: `Reste ${fcfa(reste(c))} · ${c.frais}`,
      lines: [
        `Payé ${fcfa(c.paye)} sur ${fcfa(c.montant)}`,
        `Échéance : ${formatDate(c.echeance)}${school ? "" : ` · ${c.school}`}`,
      ],
      badge: enRetard(c)
        ? { label: "En retard", tone: "amber" as const }
        : c.paye > 0
          ? { label: "Partiel", tone: "blue" as const }
          : { label: "À payer", tone: "slate" as const },
    }));

  return (
    <PedagogyList
      title={retardSeul ? "Créances en retard" : "Créances"}
      summary={`${items.length} créance${items.length > 1 ? "s" : ""} · ${fcfa(total)} à recouvrer`}
      items={items}
      icon="wallet-outline"
      searchPlaceholder="Rechercher un élève, un frais"
      emptyLabel={retardSeul ? "Aucune créance en retard." : "Aucune créance en cours."}
    />
  );
}
