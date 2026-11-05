import { apiErrorMessage } from "@/api/client";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import { Drena } from "@/data/drenas";
import { useState } from "react";
import { Text } from "react-native";

type Props = {
  visible: boolean;
  drena?: Drena | null; // si fourni : mode modification
  onClose: () => void;
  onSave: (drena: Omit<Drena, "public_key">) => Promise<void>;
};

export default function AddDrenaModal({
  visible,
  drena,
  onClose,
  onSave,
}: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <DrenaForm
        key={drena?.public_key ?? "new"}
        drena={drena ?? null}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type Errors = Partial<Record<"code" | "name", string>>;

function DrenaForm({
  drena,
  onClose,
  onSave,
}: {
  drena: Drena | null;
  onClose: () => void;
  onSave: (drena: Omit<Drena, "public_key">) => Promise<void>;
}) {
  const isEdit = !!drena;

  const [code, setCode] = useState(drena?.slug ?? "");
  const [name, setName] = useState(drena?.name ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);

  const save = async (data: Omit<Drena, "public_key">) => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave(data);
    } catch (error) {
      setSaveError(apiErrorMessage(error));
      setSaving(false);
    }
  };

  const submit = () => {
    if (saving) return;
    const next: Errors = {};
    const c = code.trim();

    if (!c) next.code = "Le code est obligatoire";
    // Un code déjà enregistré sur le serveur reste accepté tel quel
    else if (c !== drena?.slug && !/^[A-Z0-9-]+$/.test(c))
      next.code =
        "Lettres majuscules, chiffres et tirets uniquement (ex. ABIDJAN-1)";

    if (!name.trim()) next.name = "Le nom est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({ slug: c, name: name.trim() });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier la DRENA" : "Nouvelle DRENA"}
      subtitle={isEdit && drena ? drena.name : "Créez une nouvelle DRENA"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. ABIDJAN-1"
        value={code}
        // Le code est mis en majuscules ; les espaces deviennent des tirets
        onChangeText={(t) => {
          setCode(t.toUpperCase().replace(/\s+/g, "-"));
          setErrors((e) => ({ ...e, code: undefined }));
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.code}
      />

      <Input
        label="Nom"
        icon="business-outline"
        placeholder="Ex. DRENA Abidjan 1"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        autoCapitalize="words"
        error={errors.name}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
