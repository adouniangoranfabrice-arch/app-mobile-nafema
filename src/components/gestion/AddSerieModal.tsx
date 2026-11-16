import { apiErrorMessage } from "@/api/client";
import { SerieInput } from "@/api/series";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Text } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (serie: SerieInput) => Promise<void>;
};

export default function AddSerieModal({ visible, ...props }: Props) {
  return (
    <SheetModal visible={visible} onClose={props.onClose}>
      <SerieForm {...props} />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof SerieInput, string>>;

function SerieForm({ onClose, onSave }: Omit<Props, "visible">) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [typeSerie, setTypeSerie] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: SerieInput) => {
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

    if (!slug.trim()) next.slug = "Le code est obligatoire";
    if (!name.trim()) next.name = "Le libellé est obligatoire";
    if (!typeSerie.trim()) next.type_serie = "Le type de série est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      slug: slug.trim(),
      name: name.trim(),
      type_serie: typeSerie.trim(),
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
      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. TLE-D"
        value={slug}
        onChangeText={(t) => {
          setSlug(t.toUpperCase());
          clear("slug");
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.slug}
      />

      <Input
        label="Libellé"
        icon="text-outline"
        placeholder="Ex. Terminale D"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        error={errors.name}
      />

      <Input
        label="Type de série"
        icon="pricetag-outline"
        placeholder="Ex. Scientifique"
        value={typeSerie}
        onChangeText={(t) => {
          setTypeSerie(t);
          clear("type_serie");
        }}
        error={errors.type_serie}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
