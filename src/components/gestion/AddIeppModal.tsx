import { apiErrorMessage } from "@/api/client";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { Drena, Iepp, IeppData } from "@/data/drenas";
import { useState } from "react";
import { Text } from "react-native";

type Props = {
  visible: boolean;
  iepp?: Iepp | null; // si fourni : mode modification
  drenas: Drena[];
  drenasStatus?: "loading" | "idle" | "failed"; // quand les DRENA viennent de l'API
  existing: Iepp[];
  onClose: () => void;
  onSave: (iepp: IeppData) => void | Promise<void>;
};

export default function AddIeppModal({
  visible,
  iepp,
  drenas,
  drenasStatus,
  existing,
  onClose,
  onSave,
}: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <IeppForm
        key={iepp?.public_key ?? "new"}
        iepp={iepp ?? null}
        drenas={drenas}
        drenasStatus={drenasStatus}
        existing={existing}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type Errors = Partial<Record<"drenaId" | "code" | "name", string>>;

function IeppForm({
  iepp,
  drenas,
  drenasStatus,
  existing,
  onClose,
  onSave,
}: Omit<Props, "visible" | "iepp"> & { iepp: Iepp | null }) {
  const isEdit = !!iepp;

  const [drenaId, setDrenaId] = useState(iepp?.dren.public_key ?? "");
  const [code, setCode] = useState(iepp?.code ?? "");
  const [name, setName] = useState(iepp?.name ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const others = existing.filter((i) => i.public_key !== iepp?.public_key);
  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const drenaOptions = [...drenas]
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }))
    .map((d) => ({ value: d.public_key, label: d.name }));

  const save = async (data: IeppData) => {
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
    const c = code.trim();

    if (!drenaId) next.drenaId = "Choisis la DRENA de rattachement";
    if (!name.trim()) next.name = "Le nom est obligatoire";

    // Le code est facultatif : on ne le contrôle que s'il est renseigné
    if (c) {
      if (!/^[A-Z0-9-]+$/.test(c))
        next.code =
          "Lettres majuscules, chiffres et tirets uniquement (ex. ABIDJAN-1-N)";
      else if (others.some((i) => i.code === c))
        next.code = "Ce code existe déjà";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({ drena_id: drenaId, code: c, nom: name.trim() });
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
        label="DRENA *"
        icon="map-outline"
        placeholder={
          drenasStatus === "loading"
            ? "Chargement des DRENA…"
            : "Sélectionner une DRENA"
        }
        value={drenaId}
        options={drenaOptions}
        searchable
        onChange={(v) => {
          setDrenaId(v);
          clear("drenaId");
        }}
        error={
          errors.drenaId ??
          (drenasStatus === "failed"
            ? "Impossible de charger les DRENA. Ferme puis rouvre ce formulaire."
            : undefined)
        }
      />

      <Input
        label="Code"
        icon="barcode-outline"
        placeholder="Ex. ABIDJAN-1-N"
        value={code}
        // Le code est mis en majuscules ; les espaces deviennent des tirets
        onChangeText={(t) => {
          setCode(t.toUpperCase().replace(/\s+/g, "-"));
          clear("code");
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        error={errors.code}
      />

      <Input
        label="Nom *"
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
