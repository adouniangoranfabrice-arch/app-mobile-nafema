import { Cycle } from "@/api/cycles";
import { apiErrorMessage } from "@/api/client";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Text } from "react-native";

type CycleData = Omit<Cycle, "public_key">;

type Props = {
  visible: boolean;
  cycle?: Cycle | null; // si fourni : mode modification
  nextOrder?: number; // ordre proposé à la création : à la suite des cycles existants
  onClose: () => void;
  onSave: (cycle: CycleData) => Promise<void>;
};

export default function AddCycleModal({
  visible,
  cycle,
  nextOrder,
  onClose,
  onSave,
}: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <CycleForm
        key={cycle?.public_key ?? "new"}
        cycle={cycle ?? null}
        nextOrder={nextOrder}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type Errors = Partial<Record<"abbreviation" | "name" | "order", string>>;

function CycleForm({
  cycle,
  nextOrder,
  onClose,
  onSave,
}: Omit<Props, "visible" | "cycle"> & { cycle: Cycle | null }) {
  const isEdit = !!cycle;

  const [abbreviation, setAbbreviation] = useState(cycle?.abbreviation ?? "");
  const [name, setName] = useState(cycle?.name ?? "");
  const [order, setOrder] = useState(String(cycle?.order ?? nextOrder ?? 1));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: CycleData) => {
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

    if (!abbreviation.trim())
      next.abbreviation = "L'abréviation est obligatoire";
    if (!name.trim()) next.name = "Le nom est obligatoire";
    if (!/^\d+$/.test(order.trim()))
      next.order = "L'ordre doit être un nombre entier";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      abbreviation: abbreviation.trim(),
      name: name.trim(),
      order: Number(order),
    });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier le cycle" : "Nouveau cycle"}
      subtitle={isEdit && cycle ? cycle.name : "Créez un nouveau cycle"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Input
        label="Abréviation"
        icon="barcode-outline"
        placeholder="Ex. PRIMAI"
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
        placeholder="Ex. Primaire"
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
        placeholder="Ex. 4"
        value={order}
        onChangeText={(t) => {
          setOrder(t);
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
