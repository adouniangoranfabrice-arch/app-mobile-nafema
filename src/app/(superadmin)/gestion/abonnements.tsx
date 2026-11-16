import PedagogyList from "@/components/gestion/PedagogyList";
import { ABONNEMENTS, abonnementActif, fcfa, planOf } from "@/data/finances";
import { useGestion } from "@/hooks/use-gestion";
import { formatDate } from "@/utils/dates";
import { useLocalSearchParams } from "expo-router";

/** Abonnements des établissements : actifs ou expirés (données fictives) */
export default function AbonnementsScreen() {
  const { filtre } = useLocalSearchParams<{ filtre?: string }>();
  const expires = filtre === "expires";
  const { school } = useGestion();

  const items = ABONNEMENTS.filter(
    (a) =>
      (!school || a.school === school) && abonnementActif(a) !== expires,
  )
    .sort((a, b) => a.fin.getTime() - b.fin.getTime())
    .map((a) => {
      const plan = planOf(a);
      return {
        id: a.id,
        title: a.school,
        highlight: plan
          ? `${plan.name} · ${fcfa(plan.prixMensuel)} / mois`
          : "Plan inconnu",
        lines: [`Du ${formatDate(a.debut)} au ${formatDate(a.fin)}`],
        badge: expires
          ? { label: "Expiré", tone: "slate" as const }
          : { label: "Actif", tone: "green" as const },
      };
    });

  return (
    <PedagogyList
      title={expires ? "Abonnements expirés" : "Abonnements actifs"}
      summary={`${items.length} abonnement${items.length > 1 ? "s" : ""}`}
      items={items}
      icon="repeat-outline"
      searchPlaceholder="Rechercher un établissement, un plan"
      emptyLabel={expires ? "Aucun abonnement expiré." : "Aucun abonnement actif."}
    />
  );
}
