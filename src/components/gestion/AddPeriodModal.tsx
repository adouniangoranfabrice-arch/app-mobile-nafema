import { Annee, getAllAnnees } from "@/api/annees";
import { apiErrorMessage } from "@/api/client";
import { Cycle, getCycles } from "@/api/cycles";
import { Periode, PeriodeData } from "@/api/periodes";
import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { PERIOD_TYPES, suggestLabel } from "@/data/academic";
import { fromISO, toISO } from "@/organisation/helpers";
import { useEffect, useState } from "react";
import { Text } from "react-native";

type Props = {
  visible: boolean;
  period?: Periode | null; // si fourni : mode modification
  onClose: () => void;
  onSave: (period: PeriodeData) => Promise<void>;
};

export default function AddPeriodModal({
  visible,
  period,
  onClose,
  onSave,
}: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <PeriodForm
        key={period?.public_key ?? "new"}
        period={period ?? null}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type Errors = Partial<
  Record<"annee" | "cycle" | "ordre" | "name" | "debut" | "fin", string>
>;

function PeriodForm({
  period,
  onClose,
  onSave,
}: Omit<Props, "visible" | "period"> & { period: Periode | null }) {
  const isEdit = !!period;

  const [annees, setAnnees] = useState<Annee[] | null>(null);
  const [cycles, setCycles] = useState<Cycle[] | null>(null);
  const [choicesFailed, setChoicesFailed] = useState(false);

  const [annee, setAnnee] = useState(period?.annee_public_key ?? "");
  const [cycle, setCycle] = useState(period?.cycle_public_key ?? "");
  const [ordre, setOrdre] = useState(String(period?.ordre ?? 1));
  const [type, setType] = useState(period?.type ?? "TRIMESTRE");
  const [name, setName] = useState(
    period?.name ?? suggestLabel("TRIMESTRE", 1),
  );
  const [nameEdited, setNameEdited] = useState(isEdit); // le libellé n'est plus suggéré une fois modifié à la main
  const [debut, setDebut] = useState<Date | null>(
    period ? fromISO(period.debut) : null,
  );
  const [fin, setFin] = useState<Date | null>(
    period ? fromISO(period.fin) : null,
  );
  const [locked, setLocked] = useState(!!period?.is_locked);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Les vraies années et les vrais cycles, le serveur attend leur public_key
  useEffect(() => {
    let active = true;
    Promise.all([getAllAnnees(), getCycles()])
      .then(([allAnnees, allCycles]) => {
        if (!active) return;
        setAnnees(allAnnees);
        setCycles(allCycles);
      })
      .catch(() => {
        if (active) setChoicesFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // En modification, la valeur actuelle reste affichée pendant le chargement
  const anneeOptions =
    annees?.map((a) => ({
      value: a.public_key,
      label: `${a.name}`,
    })) ??
    (period
      ? [{ value: period.annee_public_key, label: period.annee_name }]
      : []);
  const cycleOptions =
    cycles?.map((c) => ({ value: c.public_key, label: c.name })) ??
    (period
      ? [{ value: period.cycle_public_key, label: period.cycle_name }]
      : []);
  const typeOptions = [...new Set([...PERIOD_TYPES, type])].map((t) => ({
    value: t,
    label: t,
  }));

  const selectedYear = annees?.find((a) => a.public_key === annee);

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  // Le libellé se met à jour tout seul tant qu'on ne l'a pas écrit soi-même
  const onOrdreChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, "");
    setOrdre(clean);
    clear("ordre");
    const n = parseInt(clean, 10);
    if (!nameEdited && n > 0) setName(suggestLabel(type, n));
  };

  const onTypeChange = (value: string) => {
    setType(value);
    const n = parseInt(ordre, 10);
    if (!nameEdited && n > 0) setName(suggestLabel(value, n));
  };

  const save = async (data: PeriodeData) => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(data);
    } catch (error) {
      const message = apiErrorMessage(error);
      setSaveError(message);
      showToast(message, "error");
      setSaving(false);
    }
  };

  const submit = () => {
    if (saving) return;
    const next: Errors = {};
    const n = parseInt(ordre, 10);

    if (!annee) next.annee = "Choisis une année scolaire";
    if (!cycle) next.cycle = "Choisis un cycle";
    if (!(n >= 1)) next.ordre = "Numéro invalide (entier à partir de 1)";
    if (!name.trim()) next.name = "Le libellé est obligatoire";
    if (!debut) next.debut = "Choisis la date de début";
    if (!fin) next.fin = "Choisis la date de fin";
    if (debut && fin && fin <= debut)
      next.fin = "La date de fin doit être après la date de début";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      annee,
      cycle,
      ordre: n,
      name: name.trim(),
      type,
      debut: toISO(debut!),
      fin: toISO(fin!),
      is_locked: locked,
    });
    return true;
  };

  const loading = !choicesFailed && (annees === null || cycles === null);
  const choicesError = choicesFailed
    ? "Impossible de charger les choix. Ferme puis rouvre ce formulaire."
    : undefined;

  return (
    <FormSheet
      title={isEdit ? "Modifier la période" : "Nouvelle période"}
      subtitle={isEdit && period ? period.name : "Crée une nouvelle période"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Select
        label="Année scolaire *"
        icon="calendar-outline"
        placeholder={loading ? "Chargement…" : "Sélectionner une année"}
        value={annee}
        options={anneeOptions}
        onChange={(v) => {
          setAnnee(v);
          clear("annee");
        }}
        error={errors.annee ?? choicesError}
      />

      <Select
        label="Cycle *"
        icon="school-outline"
        placeholder={loading ? "Chargement…" : "Sélectionner un cycle"}
        value={cycle}
        options={cycleOptions}
        onChange={(v) => {
          setCycle(v);
          clear("cycle");
        }}
        error={errors.cycle ?? choicesError}
      />

      <Input
        label="Numéro *"
        icon="keypad-outline"
        placeholder="1"
        value={ordre}
        onChangeText={onOrdreChange}
        keyboardType="number-pad"
        maxLength={2}
        error={errors.ordre}
      />

      <Input
        label="Libellé *"
        icon="pricetag-outline"
        placeholder="Ex. 1er trimestre"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setNameEdited(true);
          clear("name");
        }}
        error={errors.name}
      />

      <Select
        label="Type *"
        icon="layers-outline"
        value={type}
        options={typeOptions}
        onChange={onTypeChange}
      />

      <DateField
        label="Date début *"
        value={debut}
        defaultValue={selectedYear ? fromISO(selectedYear.debut) : undefined}
        onChange={(d) => {
          setDebut(d);
          clear("debut");
        }}
        error={errors.debut}
      />

      <DateField
        label="Date fin *"
        value={fin}
        defaultValue={selectedYear ? fromISO(selectedYear.fin) : undefined}
        minimumDate={debut ?? undefined}
        onChange={(d) => {
          setFin(d);
          clear("fin");
        }}
        error={errors.fin}
      />

      <CheckboxRow
        checked={locked}
        onToggle={() => setLocked((v) => !v)}
        title="Verrouillée"
      />

      {saveError ? (
        <Text className="mt-4 font-inter text-[13px] text-red-500">
          {saveError}
        </Text>
      ) : null}
    </FormSheet>
  );
}
