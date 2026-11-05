import { apiErrorMessage } from "@/api/client";
import { Cycle } from "@/api/cycles";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Text } from "react-native";

type SerieData = {
  cycle: string; // public_key du cycle
  code: string;
  libelle: string;
  type?: string;
};

type Props = {
  visible: boolean;
  cycles: Cycle[];
  cyclesFailed: boolean;
  onClose: () => void;
  onSave: (serie: SerieData) => Promise<void>;
};

export default function AddSerieModal({ visible, ...props }: Props) {
  return (
    <SheetModal visible={visible} onClose={props.onClose}>
      <SerieForm {...props} />
    </SheetModal>
  );
}

type Errors = Partial<Record<"cycle" | "code" | "libelle", string>>;

function SerieForm({
  cycles,
  cyclesFailed,
  onClose,
  onSave,
}: Omit<Props, "visible">) {
  const [cycle, setCycle] = useState("");
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [type, setType] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: SerieData) => {
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
    if (!code.trim()) next.code = "Le code est obligatoire";
    if (!libelle.trim()) next.libelle = "Le libellé est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      cycle,
      code: code.trim(),
      libelle: libelle.trim(),
      type: type.trim() || undefined,
    });
    return true;
  };

  return (
    <FormSheet
      title="Nouvelle série"
      subtitle="Créez une nouvelle série"
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
        }}
        error={
          errors.cycle ??
          (cyclesFailed ? "Impossible de charger les cycles." : undefined)
        }
      />

      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. TLE-D"
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          clear("code");
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.code}
      />

      <Input
        label="Libellé"
        icon="text-outline"
        placeholder="Ex. Terminale D"
        value={libelle}
        onChangeText={(t) => {
          setLibelle(t);
          clear("libelle");
        }}
        error={errors.libelle}
      />

      <Input
        label="Type"
        icon="pricetag-outline"
        placeholder="Facultatif"
        value={type}
        onChangeText={setType}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
