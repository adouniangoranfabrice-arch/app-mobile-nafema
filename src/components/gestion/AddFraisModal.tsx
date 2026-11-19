import { apiErrorMessage } from "@/api/client";
import {
  FraisDetail,
  FraisInput,
  TYPES_FRAIS,
  typeFraisLabel,
} from "@/api/frais";
import { getNiveaux } from "@/api/niveaux";
import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select, { Option } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { fromISO, toISO } from "@/organisation/helpers";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

type Props = {
  visible: boolean;
  frais?: FraisDetail | null; // si fourni : mode modification
  onClose: () => void;
  onSave: (frais: FraisInput) => Promise<void>;
};

export default function AddFraisModal({ visible, frais, ...props }: Props) {
  return (
    <SheetModal visible={visible} onClose={props.onClose}>
      <FraisForm key={frais?.public_key ?? "new"} frais={frais ?? null} {...props} />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof FraisInput, string>>;

/** Valeur de « Tous les niveaux » dans la liste : envoyée à null */
const ALL_LEVELS = "";

function FraisForm({
  frais,
  onClose,
  onSave,
}: Omit<Props, "visible" | "frais"> & { frais: FraisDetail | null }) {
  const isEdit = !!frais;
  // "" : tous les niveaux (envoyé à null)
  const [niveau, setNiveau] = useState(frais?.niveau_public_key ?? ALL_LEVELS);
  const [type, setType] = useState(frais?.type_frais || "SCOLARITE");
  const [name, setName] = useState(frais?.name ?? "");
  const [montant, setMontant] = useState(
    frais ? String(frais.montant_frais) : "",
  );
  // « 2026-11-28 » (ou « 2026-11-28 00:00:00 ») → date locale
  const [validite, setValidite] = useState<Date | null>(
    frais?.validite ? fromISO(frais.validite.slice(0, 10)) : null,
  );
  const [affectation, setAffectation] = useState(frais?.affectation ?? "");
  const [required, setRequired] = useState(frais?.is_required ?? false);
  const [tranchable, setTranchable] = useState(frais?.tranchable ?? false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Niveaux de la base, chargés à l'ouverture ; « Tous les niveaux » en tête
  const [niveaux, setNiveaux] = useState<Option[] | null>(null);
  const [niveauxFailed, setNiveauxFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getNiveaux()
      .then((all) => {
        if (active)
          setNiveaux([
            { value: ALL_LEVELS, label: "Tous les niveaux" },
            ...all.map((n) => ({ value: n.public_key, label: n.name })),
          ]);
      })
      .catch(() => {
        if (!active) return;
        setNiveaux([]);
        setNiveauxFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: FraisInput) => {
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
    const m = montant.replace(/\s/g, "");

    if (!type) next.type_frais = "Choisissez un type";
    if (!name.trim()) next.name = "Le libellé est obligatoire";
    if (!m) next.montant_frais = "Le montant est obligatoire";
    else if (!/^\d+$/.test(m) || Number(m) <= 0)
      next.montant_frais = "Le montant doit être un nombre entier positif";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      niveau: niveau || null, // tous les niveaux
      name: name.trim(),
      type_frais: type,
      montant_frais: Number(m),
      affectation: affectation.trim() || null,
      is_required: required,
      tranchable,
      // Format du modèle de l'API : « 2027-01-31T00:00:00Z » (minuit, sans décalage de fuseau)
      validite: validite ? `${toISO(validite)}T00:00:00Z` : null,
    });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier le frais" : "Nouveau frais"}
      subtitle={isEdit && frais ? frais.name : "Créez un nouveau frais"}
      submitLabel={saving ? "Envoi…" : "Enregistrer le frais"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Select
        label="Niveau *"
        icon="layers-outline"
        placeholder={niveaux ? "Tous les niveaux" : "Chargement…"}
        value={niveau}
        options={niveaux ?? []}
        searchable
        onChange={(v) => {
          setNiveau(v);
          clear("niveau");
        }}
        error={
          errors.niveau ??
          (niveauxFailed ? "Impossible de charger les niveaux." : undefined)
        }
      />

      <Select
        label="Type *"
        icon="pricetag-outline"
        placeholder="Sélectionner un type"
        value={type}
        // Un type venu du serveur mais absent de la liste reste choisissable
        options={
          TYPES_FRAIS.some((t) => t.value === type) || !type
            ? TYPES_FRAIS
            : [...TYPES_FRAIS, { value: type, label: typeFraisLabel(type) }]
        }
        onChange={(v) => {
          setType(v);
          clear("type_frais");
        }}
        error={errors.type_frais}
      />

      <Input
        label="Libellé *"
        icon="text-outline"
        placeholder="Ex. Frais de scolarité"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        error={errors.name}
      />

      <Input
        label="Montant (FCFA) *"
        icon="cash-outline"
        placeholder="Ex. 90000"
        value={montant}
        onChangeText={(t) => {
          setMontant(t);
          clear("montant_frais");
        }}
        keyboardType="number-pad"
        error={errors.montant_frais}
      />

      <DateField
        label="Date d'échéance (optionnel)"
        value={validite}
        onChange={setValidite}
      />

      {/* Options */}
      <View className="mb-3 border-b border-line pb-2">
        <Text className="font-inter-bold text-[16px] text-ink">Options</Text>
      </View>

      <Input
        label="Statut d'affectation (optionnel)"
        icon="bookmark-outline"
        placeholder="Ex. Affecté"
        value={affectation}
        onChangeText={setAffectation}
      />

      <CheckboxRow
        checked={required}
        onToggle={() => setRequired((r) => !r)}
        title="Obligatoire"
        description="Ce frais doit être payé par tous les élèves du niveau"
      />

      <CheckboxRow
        checked={tranchable}
        onToggle={() => setTranchable((t) => !t)}
        title="Fractionnable (tranches)"
        description="Ce frais peut être payé en plusieurs fois"
      />

      {saveError ? (
        <Text className="mt-3 font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
