import { Classe, ClasseInput, LANGUES_V2, langueV2Value } from "@/api/classes";
import { apiErrorMessage } from "@/api/client";
import { getNiveaux } from "@/api/niveaux";
import { getSalles } from "@/api/salles";
import { getSeries } from "@/api/series";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select, { Option } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { fieldsFor } from "@/utils/niveaux";
import { normalize } from "@/utils/text";
import { useEffect, useState } from "react";
import { Text } from "react-native";

/** Ce dont le formulaire a besoin pour se pré-remplir en modification */
export type ClasseToEdit = Pick<
  Classe,
  | "public_key"
  | "name"
  | "max_effectif"
  | "min_effectif"
  | "lang_v2"
  | "annee_key"
  | "niveau_key"
  | "serie_key"
  | "salle_key"
  | "annee_name"
  | "niveau_name"
  | "serie_name"
  | "salle_name"
>;

type Props = {
  visible: boolean;
  classe?: ClasseToEdit | null; // si fournie : mode modification
  onClose: () => void;
  onSave: (classe: ClasseInput) => Promise<void>;
};

export default function AddClasseModal({ visible, classe, ...props }: Props) {
  return (
    <SheetModal visible={visible} onClose={props.onClose}>
      <ClasseForm
        key={classe?.public_key ?? "new"}
        classe={classe ?? null}
        {...props}
      />
    </SheetModal>
  );
}

type Errors = Partial<Record<keyof ClasseInput, string>>;

/** Les choix des listes, chargés depuis la base à l'ouverture du formulaire */
type Choices = {
  niveaux: Option[];
  series: Option[];
  salles: Option[];
  /** Places de chaque salle (null : capacité inconnue) */
  places: Record<string, number | null>;
};

const NO_ROOM = "Aucune salle disponible pour cet effectif maximal !";

const NO_SERIE = "";

const LV2_OPTIONS: Option[] = LANGUES_V2;

/** Retrouve la valeur d'une liste : par sa clé si on l'a, sinon par son nom affiché */
function findValue(options: Option[], key: string, name: string) {
  if (key && options.some((o) => o.value === key)) return key;
  const n = normalize(name);
  if (!n) return "";
  // Le libellé peut porter un complément : « 2026-2027 (en cours) », « Salle 1 · 20 places »
  const hit = options.find((o) => {
    const label = normalize(o.label);
    return label === n || label.startsWith(`${n} (`) || label.startsWith(`${n} ·`);
  });
  return hit?.value ?? "";
}

function ClasseForm({
  classe,
  onClose,
  onSave,
}: Omit<Props, "visible" | "classe"> & { classe: ClasseToEdit | null }) {
  const isEdit = !!classe;
  const [niveau, setNiveau] = useState(classe?.niveau_key ?? "");
  const [serie, setSerie] = useState(classe?.serie_key ?? NO_SERIE);
  const [salle, setSalle] = useState(classe?.salle_key ?? "");
  const [name, setName] = useState(classe?.name ?? "");
  const [minEffectif, setMinEffectif] = useState(
    classe?.min_effectif != null ? String(classe.min_effectif) : "",
  );
  const [maxEffectif, setMaxEffectif] = useState(
    classe?.max_effectif != null ? String(classe.max_effectif) : "",
  );
  // Une LV2 inconnue de la liste (venue du serveur) reste sélectionnable
  const [langV2, setLangV2] = useState(langueV2Value(classe?.lang_v2 ?? ""));
  const lv2Options =
    langV2 && !LV2_OPTIONS.some((o) => o.value === langV2)
      ? [...LV2_OPTIONS, { value: langV2, label: langV2 }]
      : LV2_OPTIONS;
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [choices, setChoices] = useState<Choices | null>(null);
  const [choicesFailed, setChoicesFailed] = useState<string[]>([]);

  // Chaque liste est chargée séparément : une liste en échec n'empêche pas les autres
  useEffect(() => {
    let active = true;
    const failed: string[] = [];
    const safe = <T,>(label: string, p: Promise<T[]>) =>
      p.catch(() => {
        failed.push(label);
        return [] as T[];
      });

    Promise.all([
      safe("niveaux", getNiveaux()),
      safe("séries", getSeries()),
      safe("salles", getSalles()),
    ]).then(([niveaux, series, salles]) => {
      if (!active) return;
      const next: Choices = {
        niveaux: niveaux.map((n) => ({ value: n.public_key, label: n.name })),
        series: series.map((s) => ({
          value: s.public_key,
          label: s.code ? `${s.libelle} (${s.code})` : s.libelle,
        })),
        salles: salles.map((s) => ({
          value: s.public_key,
          label: s.capacite !== null ? `${s.name} · ${s.capacite} places` : s.name,
        })),
        places: Object.fromEntries(salles.map((s) => [s.public_key, s.capacite])),
      };
      setChoices(next);
      setChoicesFailed(failed);
      if (classe) {
        // Modification : chaque liste reprend l'élément de la classe (clé, ou à défaut nom)
        setNiveau(findValue(next.niveaux, classe.niveau_key, classe.niveau_name));
        setSerie(findValue(next.series, classe.serie_key, classe.serie_name));
        setSalle(findValue(next.salles, classe.salle_key, classe.salle_name));
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargé une fois, à l'ouverture
  }, []);

  const hasErrors = Object.values(errors).some(Boolean);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const loadingHint = choices ? undefined : "Chargement…";

  // LV2 à partir de la Quatrième, série au lycée seulement
  const niveauName = choices?.niveaux.find((o) => o.value === niveau)?.label ?? "";
  const { lv2: needsLv2, serie: needsSerie } = fieldsFor(niveauName);
  // Salle : grisée tant que l'effectif maximum n'est pas saisi ; seules les salles assez grandes sont proposées
  const maxValue = /^\d+$/.test(maxEffectif.trim()) ? Number(maxEffectif.trim()) : null;
  const salleLocked = maxValue === null || maxValue < 1;
  const fittingSalles = salleLocked
    ? []
    : (choices?.salles ?? []).filter((o) => {
        const places = choices?.places[o.value];
        return places == null || places >= (maxValue ?? 0); // capacité inconnue : proposée
      });
  const noRoom = !salleLocked && !!choices && fittingSalles.length === 0;
  // Une salle devenue trop petite (effectif augmenté) n'est plus retenue
  const chosenSalle = fittingSalles.some((o) => o.value === salle) ? salle : "";

  const listError = (label: string) =>
    choicesFailed.includes(label) ? `Impossible de charger les ${label}.` : undefined;

  const save = async (data: ClasseInput) => {
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
    const min = minEffectif.trim();
    const max = maxEffectif.trim();

    if (!niveau) next.niveau = "Choisissez un niveau";
    if (needsLv2 && !langV2) next.lang_v2 = "Choisissez la langue vivante 2";
    if (needsSerie && !serie) next.serie = "Choisissez une série";
    if (!chosenSalle)
      next.salle = noRoom
        ? NO_ROOM
        : salleLocked
          ? "Saisissez d'abord l'effectif maximum"
          : "Choisissez une salle";
    if (!name.trim()) next.name = "Le nom de la classe est obligatoire";
    if (!max) next.max_effectif = "L'effectif maximum est obligatoire";
    else if (!/^\d+$/.test(max) || Number(max) < 1)
      next.max_effectif = "L'effectif maximum doit être un nombre entier (1 ou plus)";
    if (!min) next.min_effectif = "L'effectif minimum est obligatoire";
    else if (!/^\d+$/.test(min))
      next.min_effectif = "L'effectif minimum doit être un nombre entier (0 ou plus)";
    else if (!next.max_effectif && Number(min) > Number(max))
      next.min_effectif = "L'effectif minimum ne peut pas dépasser le maximum";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      niveau,
      // Hors lycée, aucune série n'est envoyée (même si une avait été choisie avant de changer de niveau)
      ...(needsSerie && serie ? { serie } : {}),
      salle: chosenSalle,
      name: name.trim(),
      min_effectif: Number(min),
      max_effectif: Number(max),
      // Avant la Quatrième, aucune LV2 n'est envoyée (même choisie avant de changer de niveau)
      ...(needsLv2 && langV2 ? { lang_v2: langV2 } : {}),
    });
    return true;
  };

  return (
    <FormSheet
      title={isEdit ? "Modifier la classe" : "Nouvelle classe"}
      subtitle={isEdit && classe ? classe.name : "Créez une nouvelle classe"}
      submitLabel={saving ? "Envoi…" : isEdit ? "Enregistrer" : "Créer"}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      <Select
        label="Niveau"
        icon="layers-outline"
        placeholder={loadingHint ?? "Sélectionner un niveau"}
        value={niveau}
        options={choices?.niveaux ?? []}
        onChange={(v) => {
          setNiveau(v);
          clear("niveau");
          clear("serie");
          clear("lang_v2");
        }}
        error={errors.niveau ?? listError("niveaux")}
        searchable
      />

      <Input
        label="Nom de la classe"
        icon="text-outline"
        placeholder="Ex. 6e A"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clear("name");
        }}
        error={errors.name}
      />

      <Input
        label="Effectif minimum"
        icon="people-outline"
        placeholder="Ex. 20"
        value={minEffectif}
        onChangeText={(t) => {
          setMinEffectif(t);
          clear("min_effectif");
        }}
        keyboardType="number-pad"
        error={errors.min_effectif}
      />

      <Input
        label="Effectif maximum"
        icon="people-outline"
        placeholder="Ex. 45"
        value={maxEffectif}
        onChangeText={(t) => {
          setMaxEffectif(t);
          clear("max_effectif");
        }}
        keyboardType="number-pad"
        error={errors.max_effectif}
      />

      <Select
        label="Salle"
        icon="cube-outline"
        placeholder={
          loadingHint ??
          (salleLocked ? "Saisissez d'abord l'effectif maximum" : "Sélectionner une salle")
        }
        value={chosenSalle}
        options={fittingSalles}
        disabled={salleLocked}
        onChange={(v) => {
          setSalle(v);
          clear("salle");
        }}
        error={noRoom ? NO_ROOM : (errors.salle ?? listError("salles"))}
        searchable
      />

      {needsLv2 && (
        <Select
          label="Langue vivante 2"
          icon="language-outline"
          placeholder="Sélectionner une langue"
          value={langV2}
          options={lv2Options}
          onChange={(v) => {
            setLangV2(v);
            clear("lang_v2");
          }}
          error={errors.lang_v2}
        />
      )}

      {needsSerie && (
        <Select
          label="Série"
          icon="git-branch-outline"
          placeholder={loadingHint ?? "Sélectionner une série"}
          value={serie}
          options={choices?.series ?? []}
          onChange={(v) => {
            setSerie(v);
            clear("serie");
          }}
          error={errors.serie ?? listError("séries")}
          searchable
        />
      )}

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
