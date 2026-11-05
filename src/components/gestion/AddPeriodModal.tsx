import Button from "@/components/ui/Button";
import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
    AcademicYear,
    CYCLES,
    PERIOD_TYPES,
    Period,
    suggestLabel,
} from "@/data/academic";
import { day, formatDate, yearLabel } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  period?: Period | null; // si fourni : mode modification
  years: AcademicYear[];
  existing: Period[];
  onClose: () => void;
  onSave: (period: Omit<Period, "id">) => void;
};

export default function AddPeriodModal({
  visible,
  period,
  years,
  existing,
  onClose,
  onSave,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* Monté seulement quand le modal est visible : formulaire réinitialisé à chaque ouverture */}
      {visible && (
        <PeriodForm
          key={period?.id ?? "new"}
          period={period ?? null}
          years={years}
          existing={existing}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

type Errors = {
  year?: string;
  cycle?: string;
  number?: string;
  label?: string;
  start?: string;
  end?: string;
};

type FormProps = {
  period: Period | null;
  years: AcademicYear[];
  existing: Period[];
  onClose: () => void;
  onSave: (period: Omit<Period, "id">) => void;
};

function PeriodForm({ period, years, existing, onClose, onSave }: FormProps) {
  const insets = useSafeAreaInsets();
  const isEdit = !!period;

  const [yearId, setYearId] = useState(period?.yearId ?? "");
  const [cycle, setCycle] = useState(period?.cycle ?? "");
  const [number, setNumber] = useState(String(period?.number ?? 1));
  const [type, setType] = useState(period?.type ?? "TRIMESTRE");
  const [label, setLabel] = useState(
    period?.label ?? suggestLabel("TRIMESTRE", 1),
  );
  const [labelEdited, setLabelEdited] = useState(isEdit); // le libellé n'est plus suggéré une fois modifié à la main
  const [start, setStart] = useState<Date | null>(period?.start ?? null);
  const [end, setEnd] = useState<Date | null>(period?.end ?? null);
  const [locked, setLocked] = useState(period?.locked ?? false);
  const [errors, setErrors] = useState<Errors>({});

  const others = existing.filter((p) => p.id !== period?.id);
  const selectedYear = years.find((y) => y.id === yearId);

  const yearOptions = [...years]
    .sort((a, b) => b.start.getTime() - a.start.getTime())
    .map((y) => ({
      value: y.id,
      label: `${yearLabel(y.start, y.end)} · ${y.school}`,
    }));

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  // Le libellé se met à jour tout seul tant qu'on ne l'a pas écrit soi-même
  const onNumberChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, "");
    setNumber(clean);
    clear("number");
    const n = parseInt(clean, 10);
    if (!labelEdited && n > 0) setLabel(suggestLabel(type, n));
  };

  const onTypeChange = (value: string) => {
    setType(value);
    const n = parseInt(number, 10);
    if (!labelEdited && n > 0) setLabel(suggestLabel(value, n));
  };

  const submit = () => {
    const next: Errors = {};
    const n = parseInt(number, 10);

    if (!yearId) next.year = "Choisis une année scolaire";
    if (!cycle) next.cycle = "Choisis un cycle";
    if (!number || !(n >= 1))
      next.number = "Numéro invalide (entier à partir de 1)";
    if (!label.trim()) next.label = "Le libellé est obligatoire";
    if (!start) next.start = "Choisis la date de début";
    if (!end) next.end = "Choisis la date de fin";

    if (start && end) {
      if (day(end) <= day(start)) {
        next.end = "La date de fin doit être après la date de début";
      } else if (
        selectedYear &&
        (day(start) < day(selectedYear.start) ||
          day(end) > day(selectedYear.end))
      ) {
        next.end = `Les dates doivent être comprises entre le ${formatDate(selectedYear.start)} et le ${formatDate(
          selectedYear.end,
        )}`;
      }
    }

    if (
      yearId &&
      cycle &&
      n >= 1 &&
      others.some(
        (p) =>
          p.yearId === yearId &&
          p.cycle === cycle &&
          p.type === type &&
          p.number === n,
      )
    ) {
      next.number = "Cette période existe déjà pour cette année et ce cycle";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      yearId,
      cycle,
      number: n,
      label: label.trim(),
      type,
      start: day(start!),
      end: day(end!),
      locked,
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* En-tête */}
      <View
        className="flex-row items-center justify-between gap-3 px-5 pb-3"
        style={{ paddingTop: Platform.OS === "android" ? insets.top + 12 : 20 }}
      >
        <View className="flex-1">
          <Text className="font-inter-bold text-xl text-ink">
            {isEdit ? "Modifier la période" : "Nouvelle période"}
          </Text>
          <Text numberOfLines={1} className="font-inter text-xs text-muted">
            {isEdit && period ? period.label : "Crée une nouvelle période"}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-soft active:opacity-80"
        >
          <Ionicons name="close" size={20} color="#2B5EA8" />
        </Pressable>
      </View>

      {/* Champs */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Select
          label="Année scolaire *"
          icon="calendar-outline"
          placeholder="Sélectionner une année"
          value={yearId}
          options={yearOptions}
          onChange={(v) => {
            setYearId(v);
            clear("year");
          }}
          error={errors.year}
        />

        <Select
          label="Cycle *"
          icon="school-outline"
          placeholder="Sélectionner un cycle"
          value={cycle}
          options={CYCLES.map((c) => ({ value: c, label: c }))}
          onChange={(v) => {
            setCycle(v);
            clear("cycle");
          }}
          error={errors.cycle}
        />

        <Input
          label="Numéro *"
          icon="keypad-outline"
          placeholder="1"
          value={number}
          onChangeText={onNumberChange}
          keyboardType="number-pad"
          maxLength={2}
          error={errors.number}
        />

        <Input
          label="Libellé *"
          icon="pricetag-outline"
          placeholder="Ex. 1er trimestre"
          value={label}
          onChangeText={(t) => {
            setLabel(t);
            setLabelEdited(true);
            clear("label");
          }}
          error={errors.label}
        />

        <Select
          label="Type *"
          icon="layers-outline"
          value={type}
          options={PERIOD_TYPES.map((t) => ({ value: t, label: t }))}
          onChange={onTypeChange}
        />

        <DateField
          label="Date début *"
          value={start}
          defaultValue={selectedYear?.start}
          minimumDate={selectedYear?.start}
          maximumDate={selectedYear?.end}
          onChange={(d) => {
            setStart(d);
            clear("start");
          }}
          error={errors.start}
        />

        <DateField
          label="Date fin *"
          value={end}
          defaultValue={selectedYear?.end}
          minimumDate={start ?? selectedYear?.start}
          maximumDate={selectedYear?.end}
          onChange={(d) => {
            setEnd(d);
            clear("end");
          }}
          error={errors.end}
        />

        <CheckboxRow
          checked={locked}
          onToggle={() => setLocked((v) => !v)}
          title="Verrouillée"
          description="Une période verrouillée ne peut pas être supprimée"
        />
      </ScrollView>

      {/* Annuler / Créer */}
      <View
        className="flex-row gap-3 border-t border-line px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={onClose}
          className="h-[54px] flex-1 items-center justify-center rounded-2xl border border-line bg-white active:opacity-80"
        >
          <Text className="font-inter-semibold text-base text-ink">
            Annuler
          </Text>
        </Pressable>
        <View className="flex-1">
          <Button title={isEdit ? "Enregistrer" : "Créer"} onPress={submit} />
        </View>
      </View>
    </View>
  );
}
