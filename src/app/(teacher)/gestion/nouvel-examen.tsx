import PedagogyForm from "@/components/gestion/PedagogyForm";
import DateField from "@/components/ui/DateField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showFormError, showToast } from "@/components/ui/Toast";
import { usePedagogie } from "@/context/PedagogieContext";
import { useGestion } from "@/hooks/use-gestion";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { useRouter } from "expo-router";
import { useState } from "react";

type Errors = Partial<
  Record<"classe" | "matiere" | "titre" | "date" | "duree", string>
>;

export default function NouvelExamen() {
  const router = useRouter();
  const { href } = useGestion();
  const { addExamen } = usePedagogie();
  const { records } = useOrganisation();
  const classes = useTeacherClasses();

  const [classe, setClasse] = useState("");
  const [matiere, setMatiere] = useState("");
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [duree, setDuree] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const submit = () => {
    const next: Errors = {};
    if (!classe) next.classe = "Choisis une classe";
    if (!matiere) next.matiere = "Choisis une matière";
    if (!titre.trim()) next.titre = "Le titre est obligatoire";
    if (!date) next.date = "Choisis la date";
    if (!duree.trim()) next.duree = "La durée est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      showFormError();
      return;
    }

    addExamen({
      classe_id: classe,
      matiere,
      titre: titre.trim(),
      date: date!,
      duree: duree.trim(),
    });
    showToast("Examen créé avec succès.");
    router.replace(href("examens"));
  };

  return (
    <PedagogyForm
      title="Nouvel examen"
      submitLabel="Créer l'examen"
      onSubmit={submit}
    >
      <Select
        label="Classe *"
        icon="people-outline"
        placeholder="Sélectionner une classe"
        value={classe}
        options={classes.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(v) => {
          setClasse(v);
          clear("classe");
        }}
        error={errors.classe}
      />

      <Select
        label="Matière *"
        icon="book-outline"
        placeholder="Sélectionner une matière"
        value={matiere}
        options={records("matieres").map((m) => ({
          value: String(m.name),
          label: String(m.name),
        }))}
        searchable
        onChange={(v) => {
          setMatiere(v);
          clear("matiere");
        }}
        error={errors.matiere}
      />

      <Input
        label="Titre *"
        icon="text-outline"
        placeholder="Ex. Examen du 1er trimestre"
        value={titre}
        onChangeText={(t) => {
          setTitre(t);
          clear("titre");
        }}
        error={errors.titre}
      />

      <DateField
        label="Date *"
        value={date}
        onChange={(d) => {
          setDate(d);
          clear("date");
        }}
        error={errors.date}
      />

      <Input
        label="Durée *"
        icon="time-outline"
        placeholder="Ex. 2 h"
        value={duree}
        onChangeText={(t) => {
          setDuree(t);
          clear("duree");
        }}
        error={errors.duree}
      />
    </PedagogyForm>
  );
}
