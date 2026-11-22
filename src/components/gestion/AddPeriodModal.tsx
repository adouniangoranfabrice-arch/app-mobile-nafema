import { Annee, anneeStatus, getAllAnnees } from "@/api/annees";
import { apiErrorMessage } from "@/api/client";
import { Cycle, getCycles } from "@/api/cycles";
import { Periode, PeriodeData } from "@/api/periodes";
import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select, { Option } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { PERIOD_TYPES, periodTypeLabel, periodTypeValue, suggestLabel } from "@/data/academic";
import { fromISO, toISO } from "@/organisation/helpers";
import { formatDate } from "@/utils/dates";
import { useEffect, useState } from "react";
import { Text } from "react-native";

type Props = {
  visible: boolean;
  period?: Periode | null; // si fourni : mode modification
  onClose: () => void;
  onSave: (period: PeriodeData) => Promise<void>;
};

export default function AddPeriodModal({ visible, period, onClose, onSave }: Props) {
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

type Errors = Partial<Record<"annee" | "cycle" | "ordre" | "name" | "debut" | "fin", string>>;

/** Nombre de périodes dans une année : 3 trimestres, 2 semestres (pas de limite pour les autres types) */
const MAX_ORDRE: Record<string, number> = { trimestre: 3, semestre: 2 };

/** Ajoute la valeur actuelle si la liste chargée ne la contient pas (modification) */
const withCurrent = (options: Option[], value: string, label: string) =>
  value && !options.some((o) => o.value === value) ? [...options, { value, label }] : options;

function PeriodForm({
  period,
  onClose,
  onSave,
}: Omit<Props, "visible" | "period"> & { period: Periode | null }) {
  const isEdit = !!period;
  const initialType = periodTypeValue(period?.type ?? "Trimestre");

  const [annees, setAnnees] = useState<Annee[] | null>(null);
  const [cycles, setCycles] = useState<Cycle[] | null>(null);
  const [choicesFailed, setChoicesFailed] = useState(false);

  const [annee, setAnnee] = useState(period?.annee_public_key ?? "");
  const [cycle, setCycle] = useState(period?.cycle_public_key ?? "");
  const [ordre, setOrdre] = useState(String(period?.ordre ?? 1));
  const [type, setType] = useState(initialType);
  const [name, setName] = useState(period?.name ?? suggestLabel(initialType, 1));
  const [nameEdited, setNameEdited] = useState(isEdit); // le libellé n'est plus suggéré une fois modifié à la main
  const [debut, setDebut] = useState<Date | null>(period ? fromISO(period.debut) : null);
  const [fin, setFin] = useState<Date | null>(period ? fromISO(period.fin) : null);
  const [locked, setLocked] = useState(!!period?.is_locked);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Les vraies années et les vrais cycles : le serveur attend leur public_key
  useEffect(() => {
    let active = true;
    Promise.all([getAllAnnees(), getCycles()])
      .then(([allAnnees, allCycles]) => {
        if (!active) return;
        setAnnees(allAnnees);
        setCycles(allCycles);
        // Nouvelle période : l'année en cours est proposée d'office
        const current = allAnnees.find((a) => anneeStatus(a) === "active");
        if (current) setAnnee((v) => v || current.public_key);
        // Un seul cycle : il est choisi d'office
        if (allCycles.length === 1) setCycle((v) => v || allCycles[0].public_key);
      })
      .catch(() => {
        if (active) setChoicesFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // En modification, la valeur actuelle reste affichée pendant le chargement et même si la liste ne la contient pas
  const anneeOptions = withCurrent(
    (annees ?? []).map((a) => ({
      value: a.public_key,
      label: anneeStatus(a) === "active" ? `${a.name} (en cours)` : a.name,
    })),
    period?.annee_public_key ?? "",
    period?.annee_name ?? "",
  );
  const cycleOptions = withCurrent(
    (cycles ?? []).map((c) => ({ value: c.public_key, label: c.name })),
    period?.cycle_public_key ?? "",
    period?.cycle_name ?? "",
  );
  // Une valeur inconnue venue du serveur reste sélectionnable
  const typeOptions = withCurrent(PERIOD_TYPES, type, periodTypeLabel(type));

  // Les dates de la période restent dans celles de l'année choisie
  const selectedYear = annees?.find((a) => a.public_key === annee);
  const yearStart = selectedYear ? fromISO(selectedYear.debut) : undefined;
  const yearEnd = selectedYear ? fromISO(selectedYear.fin) : undefined;
  const maxOrdre = MAX_ORDRE[type];

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (...keys: (keyof Errors)[]) =>
    setErrors((e) => ({ ...e, ...Object.fromEntries(keys.map((k) => [k, undefined])) }));

  // Le libellé se met à jour tout seul tant qu'on ne l'a pas écrit soi-même
  const suggest = (t: string, o: string) => {
    const n = parseInt(o, 10);
    if (!nameEdited && n > 0) setName(suggestLabel(t, n));
  };

  const onOrdreChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, "");
    setOrdre(clean);
    clear("ordre");
    suggest(type, clean);
  };

  const onTypeChange = (value: string) => {
    setType(value);
    clear("ordre");
    suggest(value, ordre);
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

    if (!annee) next.annee = "Choisissez une année scolaire";
    if (!cycle) next.cycle = "Choisissez un cycle";
    if (!(n >= 1)) next.ordre = "Numéro invalide (entier à partir de 1)";
    else if (maxOrdre && n > maxOrdre)
      next.ordre = `Une année compte au plus ${maxOrdre} ${periodTypeLabel(type).toLowerCase()}s`;
    if (!name.trim()) next.name = "Le libellé est obligatoire";
    if (!debut) next.debut = "Choisissez la date de début";
    if (!fin) next.fin = "Choisissez la date de fin";
    if (debut && fin && fin <= debut) next.fin = "La date de fin doit être après la date de début";
    if (yearStart && debut && debut < yearStart)
      next.debut = `La période commence avant l'année scolaire (${formatDate(yearStart)})`;
    if (yearEnd && fin && fin > yearEnd)
      next.fin = `La période finit après l'année scolaire (${formatDate(yearEnd)})`;

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
    ? "Impossible de charger les choix. Fermez puis rouvrez ce formulaire."
    : undefined;

  return (
    <FormSheet
      title={isEdit ? "Modifier la période" : "Nouvelle période"}
      subtitle={isEdit && period ? period.name : "Une période de l'année scolaire"}
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
          clear("annee", "debut", "fin");
        }}
        error={errors.annee ?? choicesError}
      />
      {selectedYear && (
        <Text className="-mt-3 mb-4 font-inter text-xs text-muted">
          Du {formatDate(fromISO(selectedYear.debut))} au {formatDate(fromISO(selectedYear.fin))}
        </Text>
      )}

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

      <Select label="Type *" icon="layers-outline" value={type} options={typeOptions} onChange={onTypeChange} />

      <Input
        label="Numéro *"
        icon="keypad-outline"
        placeholder="1"
        value={ordre}
        onChangeText={onOrdreChange}
        keyboardType="number-pad"
        maxLength={1}
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

      <DateField
        label="Date de début *"
        value={debut}
        defaultValue={yearStart}
        minimumDate={yearStart}
        maximumDate={yearEnd}
        onChange={(d) => {
          setDebut(d);
          clear("debut", "fin");
        }}
        error={errors.debut}
      />

      <DateField
        label="Date de fin *"
        value={fin}
        defaultValue={debut ?? yearEnd}
        minimumDate={debut ?? yearStart}
        maximumDate={yearEnd}
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
        description="Plus aucune note ne peut être saisie sur cette période"
      />

      {saveError ? (
        <Text className="mt-4 font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
