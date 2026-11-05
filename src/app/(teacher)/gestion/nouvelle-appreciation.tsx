import PedagogyForm, {
  ClassStudentFields,
} from "@/components/gestion/PedagogyForm";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showFormError, showToast } from "@/components/ui/Toast";
import { usePedagogie } from "@/context/PedagogieContext";
import { PERIODES } from "@/data/pedagogie";
import { useGestion } from "@/hooks/use-gestion";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { useRouter } from "expo-router";
import { useState } from "react";

type Errors = Partial<Record<"student" | "matiere" | "texte", string>>;

export default function NouvelleAppreciation() {
  const router = useRouter();
  const { href } = useGestion();
  const { addAppreciation } = usePedagogie();
  const { records } = useOrganisation();

  const [student, setStudent] = useState("");
  const [matiere, setMatiere] = useState("");
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [texte, setTexte] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const submit = () => {
    const next: Errors = {};
    if (!student) next.student = "Choisis un élève";
    if (!matiere) next.matiere = "Choisis une matière";
    if (!texte.trim()) next.texte = "L'appréciation est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      showFormError();
      return;
    }

    addAppreciation({
      student_id: student,
      matiere,
      periode,
      texte: texte.trim(),
    });
    showToast("Appréciation créée avec succès.");
    router.replace(href("appreciations"));
  };

  return (
    <PedagogyForm
      title="Nouvelle appréciation"
      submitLabel="Créer l'appréciation"
      onSubmit={submit}
    >
      <ClassStudentFields
        student={student}
        onStudentChange={(id) => {
          setStudent(id);
          clear("student");
        }}
        error={errors.student}
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

      <Select
        label="Période *"
        icon="layers-outline"
        value={periode}
        options={PERIODES.map((p) => ({ value: p, label: p }))}
        onChange={setPeriode}
      />

      <Input
        label="Appréciation *"
        icon="chatbox-ellipses-outline"
        placeholder="Ex. Élève sérieux et appliqué"
        value={texte}
        onChangeText={(t) => {
          setTexte(t);
          clear("texte");
        }}
        multiline
        error={errors.texte}
      />
    </PedagogyForm>
  );
}
