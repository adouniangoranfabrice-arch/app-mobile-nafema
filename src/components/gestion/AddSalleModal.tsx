import { apiErrorMessage } from "@/api/client";
import { Salle, SalleInput } from "@/api/salles";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Text } from "react-native";

/** Ce dont le formulaire a besoin pour se pré-remplir en modification */
export type SalleToEdit = Pick<
  Salle,
  "public_key" | "code" | "name" | "capacite" | "type_salle"
>;

type Props = {
  visible: boolean;
  salle?: SalleToEdit | null; // si fournie : mode modification
  onClose: () => void;
  onSave: (salle: SalleInput) => Promise<void>;
};

export default function AddSalleModal({ visible, salle, onClose, onSave }: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <SalleForm
        key={salle?.public_key ?? "new"}
        salle={salle ?? null}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof SalleInput, string>>;

function SalleForm({
  salle,
  onClose,
  onSave,
}: Omit<Props, "visible" | "salle"> & { salle: SalleToEdit | null }) {
  const isEdit = !!salle;
  const [slug, setSlug] = useState(salle?.code ?? "");
  const [name, setName] = useState(salle?.name ?? "");
  const [capacity, setCapacity] = useState(
    salle?.capacite != null ? String(salle.capacite) : "",
  );
  const [typeSalle, setTypeSalle] = useState(salle?.type_salle ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: SalleInput) => {
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
    const places = capacity.trim();
    const type = typeSalle.trim();

    if (!slug.trim()) next.slug = "Le code est obligatoire";
    if (!name.trim()) next.name = "Le nom est obligatoire";
    if (!places) next.capacity = "La capacité est obligatoire";
    else if (!/^\d+$/.test(places))
      next.capacity = "La capacité doit être un nombre entier";
    if (!type) next.type_salle = "Le type de salle est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      slug: slug.trim(),
      name: name.trim(),
      capacity: Number(places),
      type_salle: type,
    });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier la salle" : "Nouvelle salle"}
      subtitle={isEdit && salle ? salle.name : "Créez une nouvelle salle"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. LABO-01"
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
        label="Nom"
        icon="text-outline"
        placeholder="Ex. Salle de Physique"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        error={errors.name}
      />

      <Input
        label="Capacité"
        icon="people-outline"
        placeholder="Ex. 20"
        value={capacity}
        onChangeText={(t) => {
          setCapacity(t);
          clear("capacity");
        }}
        keyboardType="number-pad"
        error={errors.capacity}
      />

      <Input
        label="Type de salle"
        icon="pricetag-outline"
        placeholder="Ex. Laboratoire"
        value={typeSalle}
        onChangeText={(t) => {
          setTypeSalle(t);
          clear("type_salle");
        }}
        error={errors.type_salle}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
