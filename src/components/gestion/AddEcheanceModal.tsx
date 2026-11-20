import { apiErrorMessage } from "@/api/client";
import { Echeance, EcheanceInput, isActive, STATUTS_ECHEANCE } from "@/api/echeances";
import DateField from "@/components/ui/DateField";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Segmented from "@/components/ui/Segmented";
import { showToast } from "@/components/ui/Toast";
import { fromISO, toISO } from "@/organisation/helpers";
import { getFrais } from "@/api/frais";
import Select, { Option } from "@/components/ui/Select";
import { fcfa } from "@/data/finances";
import { useEffect, useState } from "react";
import { Text } from "react-native";

type Props = {
  visible: boolean;
  echeance?: Echeance | null; // si fournie : mode modification
  /** Ordre proposé pour une nouvelle échéance (la suivante) */
  nextOrdre?: number;
  onClose: () => void;
  onSave: (echeance: EcheanceInput) => Promise<void>;
};

export default function AddEcheanceModal({ visible, echeance, ...props }: Props) {
  return (
    <SheetModal visible={visible} onClose={props.onClose}>
      <EcheanceForm key={echeance?.public_key ?? "new"} echeance={echeance ?? null} {...props} />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof EcheanceInput, string>>;

/** Nouvelle échéance : libellé, date, ordre, pourcentage, statut (comme le formulaire du site) */
function EcheanceForm({
  echeance,
  nextOrdre = 1,
  onClose,
  onSave,
}: Omit<Props, "visible" | "echeance"> & { echeance: Echeance | null }) {
  const isEdit = !!echeance;
  const [frais, setFrais] = useState(echeance?.frais_key ?? "");
  const [name, setName] = useState(echeance?.name ?? "");

  // Frais de la base : le serveur ne renvoie que ceux de l'école du compte connecté
  const [fraisOptions, setFraisOptions] = useState<Option[] | null>(null);
  const [fraisFailed, setFraisFailed] = useState(false);
  useEffect(() => {
    let active = true;
    getFrais()
      .then((all) => {
        if (!active) return;
        const options = all
          .filter((f) => f.public_key)
          .map((f) => ({
            value: f.public_key,
            label: [f.name, fcfa(f.montant_frais), f.niveau_name || "Tous les niveaux"].join(" · "),
          }));
        setFraisOptions(options);
        // Modification : la réponse ne donnait que le nom du frais, on retrouve sa clé
        if (!frais && echeance?.frais_name) {
          const hit = all.find((f) => f.name === echeance.frais_name);
          if (hit) setFrais(hit.public_key);
        }
      })
      .catch(() => {
        if (!active) return;
        setFraisOptions([]);
        setFraisFailed(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargé une fois, à l'ouverture
  }, []);
  const [date, setDate] = useState<Date | null>(
    echeance?.date_echeance ? fromISO(echeance.date_echeance) : null,
  );
  const [ordre, setOrdre] = useState(String(echeance?.ordre ?? nextOrdre));
  const [pourcentage, setPourcentage] = useState(
    echeance ? String(echeance.pourcentage) : "",
  );
  const [status, setStatus] = useState<"active" | "inactive">(
    !echeance || isActive(echeance) ? "active" : "inactive",
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) => setErrors((e) => ({ ...e, [key]: undefined }));

  const save = async (data: EcheanceInput) => {
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
    const o = ordre.trim();
    const p = pourcentage.trim().replace(",", ".");

    if (!frais) next.frais = "Choisissez le frais concerné";
    if (!name.trim()) next.name = "Le libellé est obligatoire";
    if (!date) next.date_echeance = "Choisissez la date d'échéance";
    if (!/^\d+$/.test(o) || Number(o) < 1) next.ordre = "L'ordre doit être un nombre entier (1 ou plus)";
    if (!p) next.pourcentage = "Le pourcentage est obligatoire";
    else if (!/^\d+(\.\d+)?$/.test(p) || Number(p) <= 0 || Number(p) > 100)
      next.pourcentage = "Le pourcentage doit être compris entre 0 et 100";

    setErrors(next);
    if (Object.keys(next).length > 0 || !date) return false;

    save({
      frais,
      name: name.trim(),
      date_echeance: toISO(date),
      ordre: Number(o),
      pourcentage: Number(p),
      status,
    });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier l'échéance" : "Nouvelle échéance"}
      subtitle={isEdit && echeance ? echeance.name : "Créez une nouvelle échéance"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Select
        label="Frais"
        icon="cash-outline"
        placeholder={fraisOptions ? "Sélectionner un frais" : "Chargement…"}
        value={frais}
        options={fraisOptions ?? []}
        searchable
        onChange={(v) => {
          setFrais(v);
          clear("frais");
        }}
        error={
          errors.frais ??
          (fraisFailed
            ? "Impossible de charger les frais."
            : fraisOptions && fraisOptions.length === 0
              ? "Aucun frais enregistré : créez d'abord un frais."
              : undefined)
        }
      />

      <Input
        label="Libellé"
        icon="text-outline"
        placeholder="Ex. 1re tranche"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        error={errors.name}
      />

      <DateField
        label="Date d'échéance"
        value={date}
        onChange={(d) => {
          setDate(d);
          clear("date_echeance");
        }}
        error={errors.date_echeance}
      />

      <Input
        label="Ordre"
        icon="list-outline"
        placeholder="1"
        value={ordre}
        onChangeText={(t) => {
          setOrdre(t);
          clear("ordre");
        }}
        keyboardType="number-pad"
        error={errors.ordre}
      />

      <Input
        label="Pourcentage"
        icon="pie-chart-outline"
        placeholder="Ex. 40"
        value={pourcentage}
        onChangeText={(t) => {
          setPourcentage(t);
          clear("pourcentage");
        }}
        keyboardType="decimal-pad"
        error={errors.pourcentage}
      />

      <Segmented
        label="Statut"
        value={status}
        options={STATUTS_ECHEANCE}
        onChange={(v) => setStatus(v as "active" | "inactive")}
      />

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
