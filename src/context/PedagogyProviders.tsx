import { CompetencesProvider } from "@/context/CompetencesContext";
import { EvaluationsProvider } from "@/context/EvaluationsContext";
import { PedagogieProvider } from "@/context/PedagogieContext";
import { ReactNode } from "react";

/** Les données de « Pédagogie & évaluations » */
export function PedagogyProviders({ children }: { children: ReactNode }) {
  return (
    <EvaluationsProvider>
      <CompetencesProvider>
        <PedagogieProvider>{children}</PedagogieProvider>
      </CompetencesProvider>
    </EvaluationsProvider>
  );
}
