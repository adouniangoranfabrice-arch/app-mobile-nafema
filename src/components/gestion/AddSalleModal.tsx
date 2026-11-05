import { apiErrorMessage } from "@/api/client";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Text } from "react-native";

type SalleData = { code: string; libelle: string; capacite?: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (salle: SalleData) => Promise<void>;
};

export default function AddSalleModal({ visible, onClose, onSave }: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <SalleForm onClose={onClose} onSave={onSave} />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof SalleData, string>>;

function SalleForm({ onClose, onSave }: Omit<Props, "visible">) {
  const [code, setCode] = useState("");
  const [libelle, setLibelle] = useState("");
  const [capacite, setCapacite] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: SalleData) => {
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
    const places = capacite.trim();

    if (!code.trim()) next.code = "Le code est obligatoire";
    if (!libelle.trim()) next.libelle = "Le nom est obligatoire";
    if (places && !/^\d+$/.test(places))
      next.capacite = "La capacité doit être un nombre entier";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      code: code.trim(),
      libelle: libelle.trim(),
      capacite: places ? Number(places) : undefined,
    });
    return true;
  };

  return (
    <FormSheet
      title="Nouvelle salle"
      subtitle="Créez une nouvelle salle"
      submitLabel={saving ? "Envoi…" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. LABO-01"
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
        label="Nom"
        icon="text-outline"
        placeholder="Ex. Salle de Physique"
        value={libelle}
        onChangeText={(t) => {
          setLibelle(t);
          clear("libelle");
        }}
        error={errors.libelle}
      />

      <Input
        label="Capacité"
        icon="people-outline"
        placeholder="Ex. 20"
        value={capacite}
        onChangeText={(t) => {
          setCapacite(t);
          clear("capacite");
        }}
        keyboardType="number-pad"
        error={errors.capacite}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
