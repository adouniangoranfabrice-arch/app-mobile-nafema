import PedagogyForm, {
  ClassStudentFields,
} from "@/components/gestion/PedagogyForm";
import DateField from "@/components/ui/DateField";
import Select from "@/components/ui/Select";
import { showFormError, showToast } from "@/components/ui/Toast";
import { useCompetences } from "@/context/CompetencesContext";
import { usePedagogie } from "@/context/PedagogieContext";
import { COMPETENCE_LEVELS } from "@/data/pedagogie";
import { useGestion } from "@/hooks/use-gestion";
import { useRouter } from "expo-router";
import { useState } from "react";

type Errors = Partial<Record<"student" | "competence" | "date", string>>;

export default function NouvelleEvaluationCompetence() {
  const router = useRouter();
  const { href } = useGestion();
  const { addEvaluationCompetence } = usePedagogie();
  const { competences } = useCompetences();

  const [student, setStudent] = useState("");
  const [competence, setCompetence] = useState("");
  const [niveau, setNiveau] = useState(COMPETENCE_LEVELS[0].value);
  const [date, setDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const submit = () => {
    const next: Errors = {};
    if (!student) next.student = "Choisis un élève";
    if (!competence) next.competence = "Choisis une compétence";
    if (!date) next.date = "Choisis la date";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      showFormError();
      return;
    }

    addEvaluationCompetence({
      student_id: student,
      competence_id: competence,
      niveau,
      date: date!,
    });
    showToast("Évaluation créée avec succès.");
    router.replace(href("evaluations-competences"));
  };

  return (
    <PedagogyForm
      title="Nouvelle évaluation"
      submitLabel="Créer l'évaluation"
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
        label="Compétence *"
        icon="locate-outline"
        placeholder="Sélectionner une compétence"
        value={competence}
        options={competences.map((c) => ({ value: c.id, label: c.intitule }))}
        onChange={(v) => {
          setCompetence(v);
          clear("competence");
        }}
        error={errors.competence}
      />

      <Select
        label="Niveau *"
        icon="ribbon-outline"
        value={niveau}
        options={COMPETENCE_LEVELS.map((l) => ({
          value: l.value,
          label: l.value,
        }))}
        onChange={setNiveau}
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
    </PedagogyForm>
  );
}
