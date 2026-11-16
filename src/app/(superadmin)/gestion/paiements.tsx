import PedagogyList from "@/components/gestion/PedagogyList";
import { fcfa, PAIEMENTS } from "@/data/finances";
import { useGestion } from "@/hooks/use-gestion";
import { formatDate } from "@/utils/dates";

/** Paiements reçus, du plus récent au plus ancien (données fictives) */
export default function PaiementsScreen() {
  const { school } = useGestion();
  const paiements = PAIEMENTS.filter((p) => !school || p.school === school);
  const total = paiements.reduce((s, p) => s + p.montant, 0);

  const items = [...paiements]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((p) => ({
      id: p.id,
      title: p.eleve,
      highlight: `${fcfa(p.montant)} · ${p.frais}`,
      lines: [
        `${formatDate(p.date)} · ${p.mode}`,
        school ? p.reference : `${p.reference} · ${p.school}`,
      ],
      badge: { label: "Reçu", tone: "green" as const },
    }));

  return (
    <PedagogyList
      title="Paiements"
      summary={`${items.length} paiement${items.length > 1 ? "s" : ""} · ${fcfa(total)}`}
      items={items}
      icon="card-outline"
      searchPlaceholder="Rechercher un élève, une référence"
      emptyLabel="Aucun paiement trouvé."
    />
  );
}
