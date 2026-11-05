import { AcademicProvider } from "@/context/AcademicContext";
import { DrenasProvider } from "@/context/DrenasContext";
import { StudentsProvider } from "@/context/StudentsContext";
import { OrganisationProvider } from "@/organisation/OrganisationContext";
import { ReactNode } from "react";

/** Les données dont les écrans de Gestion ont besoin */
export function GestionProviders({ children }: { children: ReactNode }) {
  return (
    <AcademicProvider>
      <StudentsProvider>
        <DrenasProvider>
          <OrganisationProvider>{children}</OrganisationProvider>
        </DrenasProvider>
      </StudentsProvider>
    </AcademicProvider>
  );
}
