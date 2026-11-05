import { apiErrorMessage } from "@/api/client";
import { Cycle } from "@/api/cycles";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Text } from "react-native";

type NiveauData = {
  cycle: string;
  abbreviation: string;
  name: string;
  order: number;
};

type Props = {
  visible: boolean;
  cycles: Cycle[];
  cyclesFailed: boolean;
  nextOrder: (cycle: string) => number; // ordre proposé : à la suite des niveaux du cycle
  onClose: () => void;
  onSave: (niveau: NiveauData) => Promise<void>;
};

export default function AddNiveauModal({ visible, ...props }: Props) {
  return (
    <SheetModal visible={visible} onClose={props.onClose}>
      <NiveauForm {...props} />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof NiveauData, string>>;

function NiveauForm({
  cycles,
  cyclesFailed,
  nextOrder,
  onClose,
  onSave,
}: Omit<Props, "visible">) {
  const [cycle, setCycle] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [name, setName] = useState("");
  const [order, setOrder] = useState("");
  const [orderTouched, setOrderTouched] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: NiveauData) => {
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

    if (!cycle) next.cycle = "Choisis un cycle";
    if (!abbreviation.trim())
      next.abbreviation = "L'abréviation est obligatoire";
    if (!name.trim()) next.name = "Le nom est obligatoire";
    if (!/^\d+$/.test(order.trim()))
      next.order = "L'ordre doit être un nombre entier";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      cycle,
      abbreviation: abbreviation.trim(),
      name: name.trim(),
      order: Number(order),
    });
    return true;
  };

  return (
    <FormSheet
      title="Nouveau niveau"
      subtitle="Créez un nouveau niveau"
      submitLabel={saving ? "Envoi…" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Select
        label="Cycle"
        icon="sync-outline"
        placeholder="Sélectionner un cycle"
        value={cycle}
        options={cycles.map((c) => ({ value: c.public_key, label: c.name }))}
        onChange={(v) => {
          setCycle(v);
          clear("cycle");
          if (!orderTouched) {
            setOrder(String(nextOrder(v)));
            clear("order");
          }
        }}
        error={
          errors.cycle ??
          (cyclesFailed ? "Impossible de charger les cycles." : undefined)
        }
      />

      <Input
        label="Abréviation"
        icon="barcode-outline"
        placeholder="Ex. CP1"
        value={abbreviation}
        onChangeText={(t) => {
          setAbbreviation(t.toUpperCase());
          clear("abbreviation");
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.abbreviation}
      />

      <Input
        label="Nom"
        icon="text-outline"
        placeholder="Ex. Sixième"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        error={errors.name}
      />

      <Input
        label="Ordre"
        icon="swap-vertical-outline"
        placeholder="Ex. 1"
        value={order}
        onChangeText={(t) => {
          setOrder(t);
          setOrderTouched(true);
          clear("order");
        }}
        keyboardType="number-pad"
        error={errors.order}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
