import { apiErrorMessage } from "@/api/client";
import { Iepp, IeppInput } from "@/api/iepps";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { useAllDrenas } from "@/hooks/use-all-drenas";
import { useState } from "react";
import { Text } from "react-native";

/** Ce dont le formulaire a besoin pour se pré-remplir en modification */
export type IeppToEdit = Pick<Iepp, "public_key" | "slug" | "name" | "dren_public_key">;

type Props = {
  visible: boolean;
  iepp?: IeppToEdit | null; // si fournie : mode modification
  onClose: () => void;
  onSave: (iepp: IeppInput) => Promise<void>;
};

export default function AddIeppModal({ visible, iepp, onClose, onSave }: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <IeppForm
        key={iepp?.public_key ?? "new"}
        iepp={iepp ?? null}
        visible={visible}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof IeppInput, string>>;

function IeppForm({
  iepp,
  visible,
  onClose,
  onSave,
}: Omit<Props, "iepp"> & { iepp: IeppToEdit | null }) {
  const isEdit = !!iepp;
  // Les DRENA viennent de la base, chargées à l'ouverture du formulaire
  const { drenas, status: drenasStatus } = useAllDrenas(visible);

  const [drena, setDrena] = useState(iepp?.dren_public_key ?? "");
  const [slug, setSlug] = useState(iepp?.slug ?? "");
  const [name, setName] = useState(iepp?.name ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const drenaOptions = [...drenas]
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }))
    .map((d) => ({ value: d.public_key, label: d.name }));

  const save = async (data: IeppInput) => {
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

    if (!drena) next.drena = "Choisissez la DRENA de rattachement";
    if (!slug.trim()) next.slug = "Le code est obligatoire";
    if (!name.trim()) next.name = "Le nom est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({ drena, slug: slug.trim(), name: name.trim() });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier l'IEPP" : "Nouvelle IEPP"}
      subtitle={isEdit && iepp ? iepp.name : "Créez une nouvelle IEPP"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Select
        label="DRENA"
        icon="map-outline"
        placeholder={
          drenasStatus === "loading"
            ? "Chargement des DRENA…"
            : "Sélectionner une DRENA"
        }
        value={drena}
        options={drenaOptions}
        searchable
        onChange={(v) => {
          setDrena(v);
          clear("drena");
        }}
        error={
          errors.drena ??
          (drenasStatus === "failed"
            ? "Impossible de charger les DRENA. Fermez puis rouvrez ce formulaire."
            : undefined)
        }
      />

      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. ABIDJAN-1-N"
        value={slug}
        // Le code est mis en majuscules ; les espaces deviennent des tirets
        onChangeText={(t) => {
          setSlug(t.toUpperCase().replace(/\s+/g, "-"));
          clear("slug");
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.slug}
      />

      <Input
        label="Nom"
        icon="business-outline"
        placeholder="Ex. IEPP Abidjan 1 Nord"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
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
