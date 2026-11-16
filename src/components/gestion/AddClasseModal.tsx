import { anneeStatus, getAllAnnees } from "@/api/annees";
import { Classe, ClasseInput } from "@/api/classes";
import { apiErrorMessage } from "@/api/client";
import { getNiveaux } from "@/api/niveaux";
import { getSalles } from "@/api/salles";
import { getSeries } from "@/api/series";
import { FormSheet, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select, { Option } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { normalize } from "@/utils/text";
import { useEffect, useState } from "react";
import { Text } from "react-native";

/** Ce dont le formulaire a besoin pour se pré-remplir en modification */
export type ClasseToEdit = Pick<
  Classe,
  | "public_key"
  | "name"
  | "max_effectif"
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
  annees: Option[];
  niveaux: Option[];
  series: Option[];
  salles: Option[];
};

const NO_SERIE = "";

/** Niveaux du lycée (Seconde → Terminale) : seuls eux ont une série. Accepte « 2nde », « 1re », « Tle »… */
const isLycee = (niveauName: string) =>
  /(^|[^a-z0-9])(second|2nd|2de|premi|1er|1re|termin|tle)/.test(
    normalize(niveauName),
  );

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
  const [annee, setAnnee] = useState(classe?.annee_key ?? "");
  const [niveau, setNiveau] = useState(classe?.niveau_key ?? "");
  const [serie, setSerie] = useState(classe?.serie_key ?? NO_SERIE);
  const [salle, setSalle] = useState(classe?.salle_key ?? "");
  const [name, setName] = useState(classe?.name ?? "");
  const [maxEffectif, setMaxEffectif] = useState(
    classe?.max_effectif != null ? String(classe.max_effectif) : "",
  );
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
      safe("années", getAllAnnees()),
      safe("niveaux", getNiveaux()),
      safe("séries", getSeries()),
      safe("salles", getSalles()),
    ]).then(([annees, niveaux, series, salles]) => {
      if (!active) return;
      const next: Choices = {
        annees: annees.map((a) => ({
          value: a.public_key,
          label: anneeStatus(a) === "active" ? `${a.name} (en cours)` : a.name,
        })),
        niveaux: niveaux.map((n) => ({ value: n.public_key, label: n.name })),
        series: series.map((s) => ({
          value: s.public_key,
          label: s.code ? `${s.libelle} (${s.code})` : s.libelle,
        })),
        salles: salles.map((s) => ({
          value: s.public_key,
          label: s.capacite !== null ? `${s.name} · ${s.capacite} places` : s.name,
        })),
      };
      setChoices(next);
      setChoicesFailed(failed);
      if (classe) {
        // Modification : chaque liste reprend l'élément de la classe (clé, ou à défaut nom)
        setAnnee(findValue(next.annees, classe.annee_key, classe.annee_name));
        setNiveau(findValue(next.niveaux, classe.niveau_key, classe.niveau_name));
        setSerie(findValue(next.series, classe.serie_key, classe.serie_name));
        setSalle(findValue(next.salles, classe.salle_key, classe.salle_name));
      } else {
        // L'année en cours est proposée d'office
        const current = annees.find((a) => anneeStatus(a) === "active");
        if (current) setAnnee((v) => v || current.public_key);
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

  // La série ne concerne que le lycée : le champ n'apparaît que pour Seconde, Première, Terminale
  const niveauName = choices?.niveaux.find((o) => o.value === niveau)?.label ?? "";
  const needsSerie = isLycee(niveauName);
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
    const max = maxEffectif.trim();

    if (!annee) next.annee = "Choisissez une année scolaire";
    if (!niveau) next.niveau = "Choisissez un niveau";
    if (needsSerie && !serie) next.serie = "Choisissez une série";
    if (!salle) next.salle = "Choisissez une salle";
    if (!name.trim()) next.name = "Le nom de la classe est obligatoire";
    if (!max) next.max_effectif = "L'effectif maximum est obligatoire";
    else if (!/^\d+$/.test(max) || Number(max) < 1)
      next.max_effectif = "L'effectif maximum doit être un nombre entier (1 ou plus)";

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    save({
      annee,
      niveau,
      // Hors lycée, aucune série n'est envoyée (même si une avait été choisie avant de changer de niveau)
      ...(needsSerie && serie ? { serie } : {}),
      salle,
      name: name.trim(),
      max_effectif: Number(max),
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
        label="Année scolaire"
        icon="calendar-outline"
        placeholder={loadingHint ?? "Sélectionner une année"}
        value={annee}
        options={choices?.annees ?? []}
        onChange={(v) => {
          setAnnee(v);
          clear("annee");
        }}
        error={errors.annee ?? listError("années")}
      />

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
        }}
        error={errors.niveau ?? listError("niveaux")}
        searchable
      />

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

      <Select
        label="Salle"
        icon="cube-outline"
        placeholder={loadingHint ?? "Sélectionner une salle"}
        value={salle}
        options={choices?.salles ?? []}
        onChange={(v) => {
          setSalle(v);
          clear("salle");
        }}
        error={errors.salle ?? listError("salles")}
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

      {saveError ? (
        <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
      ) : null}
    </FormSheet>
  );
}
