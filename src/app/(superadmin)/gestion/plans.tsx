import PedagogyList from "@/components/gestion/PedagogyList";
import { ABONNEMENTS, fcfa, PLANS } from "@/data/finances";

/** Plans d'abonnement à NAFEMA (données fictives) */
export default function PlansScreen() {
  const items = PLANS.map((p) => {
    const count = ABONNEMENTS.filter((a) => a.planId === p.id).length;
    return {
      id: p.id,
      title: p.name,
      highlight: `${fcfa(p.prixMensuel)} / mois`,
      lines: [
        p.maxEleves ? `Jusqu'à ${p.maxEleves} élèves` : "Élèves illimités",
        p.modules.join(" · "),
      ],
      badge: {
        label: `${count} établissement${count > 1 ? "s" : ""}`,
        tone: "purple" as const,
      },
    };
  });

  return (
    <PedagogyList
      title="Plans"
      summary={`${items.length} plans`}
      items={items}
      icon="clipboard-outline"
      searchPlaceholder="Rechercher un plan, un module"
      emptyLabel="Aucun plan trouvé."
    />
  );
}
