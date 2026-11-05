import { getMe, User } from "@/api/auth";
import { Annee, AnneeData } from "@/api/annees";
import { apiErrorMessage } from "@/api/client";
import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import Select from "@/components/ui/Select";
import { fromISO, toISO } from "@/organisation/helpers";
import { yearLabel } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  year?: Annee | null; // si fourni : mode modification
  existing: Annee[];
  onClose: () => void;
  onSave: (data: AnneeData) => Promise<void>;
};

export default function AddYearModal({
  visible,
  year,
  existing,
  onClose,
  onSave,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* Monté seulement quand le modal est visible : le formulaire est réinitialisé à chaque ouverture */}
      {visible && (
        <YearForm
          key={year?.public_key ?? "new"}
          year={year ?? null}
          existing={existing}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  );
}

type Errors = { school?: string; start?: string; end?: string };

type FormProps = {
  year: Annee | null;
  existing: Annee[];
  onClose: () => void;
  onSave: (data: AnneeData) => Promise<void>;
};

function YearForm({ year, existing, onClose, onSave }: FormProps) {
  const insets = useSafeAreaInsets();
  const isEdit = !!year;

  const [me, setMe] = useState<User | null>(null);
  const [school, setSchool] = useState(year?.etab_public_key ?? "");
  const [start, setStart] = useState<Date | null>(
    year ? fromISO(year.debut) : null,
  );
  const [end, setEnd] = useState<Date | null>(year ? fromISO(year.fin) : null);
  const [active, setActive] = useState(year ? !!year.is_active : true);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Un admin d'école crée pour son établissement : il est choisi d'office
  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (!mounted) return;
        setMe(user);
        if (user.etablissement) {
          const own = user.etablissement.public_key;
          setSchool((current) => current || own);
        }
      })
      .catch(() => {}); // restent les établissements de la liste
    return () => {
      mounted = false;
    };
  }, []);

  // Pas encore de liste d'établissements : ceux des années chargées, plus celui du compte
  const schools = new Map(
    existing.map((a) => [a.etab_public_key, a.etab_name]),
  );
  if (me?.etablissement) {
    schools.set(me.etablissement.public_key, me.etablissement.name);
  }
  const options = [...schools].map(([value, label]) => ({ value, label }));

  // Libellé calculé automatiquement à partir des années de début et de fin
  const label = yearLabel(start, end);

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const submit = async () => {
    if (saving) return;
    const next: Errors = {};

    if (!school) next.school = "Choisis un établissement";
    if (!start) next.start = "Choisis la date de début";
    if (!end) next.end = "Choisis la date de fin";
    if (start && end && end <= start)
      next.end = "La date de fin doit être après la date de début";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setSaveError("");
    try {
      await onSave({
        name: label,
        debut: toISO(start!),
        fin: toISO(end!),
        is_active: active ? 1 : 0,
        etablissement: school,
      });
    } catch (error) {
      setSaveError(apiErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* En-tête */}
      <View
        className="flex-row items-center justify-between gap-3 px-5 pb-3"
        style={{ paddingTop: Platform.OS === "android" ? insets.top + 12 : 20 }}
      >
        <View className="flex-1">
          <Text className="font-inter-bold text-xl text-ink">
            {isEdit ? "Modifier l'année scolaire" : "Nouvelle année scolaire"}
          </Text>
          <Text numberOfLines={1} className="font-inter text-xs text-muted">
            {isEdit && year
              ? `${year.name} · ${year.etab_name}`
              : "Renseigne l'établissement et les dates"}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-soft active:opacity-80"
        >
          <Ionicons name="close" size={20} color="#2B5EA8" />
        </Pressable>
      </View>

      {/* Champs */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Select
          label="Établissement"
          placeholder="Choisir un établissement"
          value={school}
          options={options}
          onChange={(v) => {
            setSchool(v);
            clear("school");
          }}
          error={errors.school}
        />

        <DateField
          label="Date de début"
          value={start}
          defaultValue={new Date()}
          onChange={(d) => {
            setStart(d);
            clear("start");
          }}
          error={errors.start}
        />

        <DateField
          label="Date de fin"
          value={end}
          defaultValue={
            start ? new Date(start.getFullYear() + 1, 5, 25) : undefined
          }
          minimumDate={start ?? undefined}
          onChange={(d) => {
            setEnd(d);
            clear("end");
          }}
          error={errors.end}
        />

        {/* Libellé automatique (non modifiable) */}
        <View className="mb-4">
          <Text className="mb-2 font-inter-semibold text-[15px] text-ink">
            Libellé
          </Text>
          <View className="h-[54px] flex-row items-center gap-2.5 rounded-2xl border border-line bg-soft px-3.5">
            <Ionicons name="pricetag-outline" size={20} color="#2B5EA8" />
            <Text
              className={`flex-1 text-[16px] ${
                label
                  ? "font-inter-bold text-primary"
                  : "font-inter text-[#9AA7B8]"
              }`}
            >
              {label || "Généré à partir des dates"}
            </Text>
            <View className="rounded-full bg-white px-2.5 py-1">
              <Text className="font-inter-semibold text-[11px] text-primary">
                Automatique
              </Text>
            </View>
          </View>
        </View>

        {/* Case à cocher : Active / Inactive */}
        <Pressable
          onPress={() => setActive((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: active }}
          className="flex-row items-center gap-3 rounded-2xl border border-line bg-field p-3.5 active:opacity-90"
        >
          <View
            className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
              active ? "border-primary bg-primary" : "border-[#9AA7B8] bg-white"
            }`}
          >
            {active && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
          <View className="flex-1">
            <Text className="font-inter-semibold text-[15px] text-ink">
              Année active
            </Text>
            <Text className="font-inter text-xs text-muted">
              Cochée : Active · Décochée : Inactive
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${active ? "bg-green-100" : "bg-slate-100"}`}
          >
            <Text
              className={`font-inter-semibold text-xs ${active ? "text-green-700" : "text-muted"}`}
            >
              {active ? "Active" : "Inactive"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View
        className="gap-2 border-t border-line px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {saveError ? (
          <Text className="font-inter text-[13px] text-red-500">
            {saveError}
          </Text>
        ) : null}
        <Button
          title={
            saving
              ? "Enregistrement…"
              : isEdit
                ? "Enregistrer les modifications"
                : "Enregistrer l'année scolaire"
          }
          onPress={submit}
        />
      </View>
    </View>
  );
}
