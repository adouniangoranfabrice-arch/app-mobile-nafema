import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import { FormSheet, SectionTitle, SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import {
    definite,
    fromISO,
    indefiniteNew,
    newWord,
    slugify,
    toISO,
} from "@/organisation/helpers";
import { useOrganisation } from "@/organisation/OrganisationContext";
import {
    EntityConfig,
    Field,
    FieldType,
    IconName,
    Option,
    OrgRecord,
    Value,
} from "@/organisation/types";
import { Fragment, ReactNode, useState } from "react";
import { Text, View } from "react-native";

type Props = {
  visible: boolean;
  config: EntityConfig;
  record?: OrgRecord | null; // si fourni : mode modification
  presets?: Record<string, Value>; // valeurs proposées à la création (ex. le guard sélectionné)
  onClose: () => void;
  onSave: (values: Record<string, Value>) => void;
};

export default function EntityFormModal({
  visible,
  config,
  record,
  presets,
  onClose,
  onSave,
}: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <EntityForm
        key={record?.id ?? "new"}
        config={config}
        record={record ?? null}
        presets={presets}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

type FormValues = Record<string, string | boolean>;

const DEFAULT_ICON: Record<FieldType, IconName> = {
  text: "create-outline",
  code: "barcode-outline",
  slug: "link-outline",
  number: "keypad-outline",
  email: "mail-outline",
  phone: "call-outline",
  date: "calendar-outline",
  password: "lock-closed-outline",
  select: "list-outline",
  ref: "link-outline",
  checkbox: "checkmark-outline",
};

function EntityForm({
  config,
  record,
  presets,
  onClose,
  onSave,
}: {
  config: EntityConfig;
  record: OrgRecord | null;
  presets?: Record<string, Value>;
  onClose: () => void;
  onSave: (values: Record<string, Value>) => void;
}) {
  const { records, options } = useOrganisation();
  const isEdit = !!record;
  const others = records(config.key).filter((r) => r.id !== record?.id);

  const [values, setValues] = useState<FormValues>(() => {
    const init: FormValues = {};
    for (const f of config.fields) {
      const existing = record?.[f.key];
      const start =
        existing !== undefined
          ? existing
          : presets?.[f.key] !== undefined
            ? presets[f.key]
            : f.defaultValue;
      init[f.key] =
        f.type === "checkbox"
          ? Boolean(start ?? false)
          : start !== undefined
            ? String(start)
            : "";
    }
    return init;
  });
  const [slugEdited, setSlugEdited] = useState(isEdit); // le slug n'est plus généré une fois modifié à la main
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasErrors = Object.values(errors).some(Boolean);

  const setValue = (key: string, v: string | boolean) => {
    setValues((prev) => {
      const next = { ...prev, [key]: v };
      if (typeof v === "string" && !slugEdited) {
        for (const f of config.fields) {
          if (f.type === "slug" && f.slugFrom === key) next[f.key] = slugify(v);
        }
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const onText = (f: Field, raw: string) => {
    let t = raw;
    if (f.type === "code") t = raw.toUpperCase().replace(/\s+/g, "-");
    else if (f.type === "slug") {
      t = raw.toLowerCase().replace(/\s+/g, "-");
      setSlugEdited(true);
    } else if (f.type === "number") t = raw.replace(/[^0-9]/g, "");
    setValue(f.key, t);
  };

  const isMandatory = (f: Field) =>
    Boolean(f.required || (f.requiredOnCreate && !isEdit));

  const submit = () => {
    const next: Record<string, string> = {};

    for (const f of config.fields) {
      if (f.type === "checkbox") continue;
      const v = String(values[f.key] ?? "").trim();

      if (!v) {
        if (isMandatory(f)) next[f.key] = "Ce champ est obligatoire";
        else if (f.matches && String(values[f.matches] ?? "").trim())
          next[f.key] = "Confirme le mot de passe";
        continue;
      }

      if (f.type === "code" && !/^[A-Z0-9-]+$/.test(v)) {
        next[f.key] = "Lettres majuscules, chiffres et tirets uniquement";
      } else if (f.type === "email" && !/^\S+@\S+\.\S+$/.test(v)) {
        next[f.key] = "Adresse e-mail invalide";
      } else if (f.type === "phone" && !/^[+0-9\s().-]{8,20}$/.test(v)) {
        next[f.key] = "Numéro de téléphone invalide";
      } else if (f.type === "number" && !/^\d+$/.test(v)) {
        next[f.key] = "Nombre entier positif attendu";
      } else if (f.type === "date" && f.past && fromISO(v) > new Date()) {
        next[f.key] = "La date ne peut pas être dans le futur";
      } else if (f.type === "password" && v.length < 8) {
        next[f.key] = "8 caractères minimum";
      } else if (f.matches && v !== String(values[f.matches] ?? "").trim()) {
        next[f.key] = "Les mots de passe ne correspondent pas";
      } else if (
        f.unique &&
        others.some(
          (r) => String(r[f.key] ?? "").toLowerCase() === v.toLowerCase(),
        )
      ) {
        next[f.key] = "Cette valeur existe déjà";
      }
    }

    // Combinaison unique (ex. un même établissement ne peut avoir deux fois la même salle)
    if (config.uniqueTogether && Object.keys(next).length === 0) {
      const { keys, message } = config.uniqueTogether;
      const signature = (get: (k: string) => string) =>
        keys.map((k) => get(k).trim().toLowerCase()).join("|");
      const mine = signature((k) => String(values[k] ?? ""));
      if (others.some((r) => signature((k) => String(r[k] ?? "")) === mine)) {
        next[keys[keys.length - 1]] = message;
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return false;

    const out: Record<string, Value> = {};
    for (const f of config.fields) {
      if (f.transient) continue; // les mots de passe ne sont jamais enregistrés ici
      const raw = values[f.key];
      if (f.type === "checkbox") out[f.key] = Boolean(raw);
      else if (f.type === "number") {
        const v = String(raw ?? "").trim();
        out[f.key] = v === "" ? "" : Number(v);
      } else out[f.key] = String(raw ?? "").trim();
    }
    onSave(out);
    return true;
  };

  const renderField = (f: Field): ReactNode => {
    const label = f.label + (isMandatory(f) && !f.noStar ? " *" : "");
    const error = errors[f.key] || undefined;
    const icon = f.icon ?? DEFAULT_ICON[f.type];
    const hint = isEdit && f.editHint ? f.editHint : f.hint;

    if (f.type === "checkbox") {
      return (
        <View key={f.key} className="mb-4">
          <CheckboxRow
            checked={Boolean(values[f.key])}
            onToggle={() => setValue(f.key, !values[f.key])}
            title={f.label}
            description={f.hint}
          />
        </View>
      );
    }

    if (f.type === "date") {
      const iso = String(values[f.key] ?? "");
      const today = new Date();
      return (
        <DateField
          key={f.key}
          label={label}
          value={iso ? fromISO(iso) : null}
          defaultValue={
            f.past ? new Date(today.getFullYear() - 30, 0, 1) : undefined
          }
          maximumDate={f.past ? today : undefined}
          onChange={(d) => setValue(f.key, toISO(d))}
          error={error}
        />
      );
    }

    if (f.type === "select" || f.type === "ref") {
      const base: Option[] =
        f.type === "ref" && f.ref ? options(f.ref) : (f.options ?? []);
      const list = f.required
        ? base
        : [{ value: "", label: "Non renseigné" }, ...base];
      return (
        <Select
          key={f.key}
          label={label}
          icon={icon}
          placeholder={f.placeholder}
          value={String(values[f.key] ?? "")}
          options={list}
          onChange={(v) => setValue(f.key, v)}
          error={error}
          searchable={f.searchable}
        />
      );
    }

    return (
      <Fragment key={f.key}>
        <Input
          label={label}
          icon={icon}
          placeholder={f.placeholder}
          value={String(values[f.key] ?? "")}
          onChangeText={(t) => onText(f, t)}
          isPassword={f.type === "password"}
          keyboardType={
            f.type === "number"
              ? "number-pad"
              : f.type === "phone"
                ? "phone-pad"
                : f.type === "email"
                  ? "email-address"
                  : "default"
          }
          autoCapitalize={
            f.type === "code"
              ? "characters"
              : f.type === "text"
                ? "sentences"
                : "none"
          }
          autoCorrect={false}
          error={error}
        />
        {hint ? (
          <Text className="-mt-3 mb-5 font-inter text-xs text-muted">
            {hint}
          </Text>
        ) : null}
      </Fragment>
    );
  };

  // Les champs, avec un titre à chaque changement de section
  const nodes: ReactNode[] = [];
  let lastSection: string | undefined;
  for (const f of config.fields) {
    if (f.section && f.section !== lastSection) {
      nodes.push(
        <SectionTitle key={`section-${f.section}`}>{f.section}</SectionTitle>,
      );
      lastSection = f.section;
    }
    nodes.push(renderField(f));
  }

  return (
    <FormSheet
      title={
        isEdit
          ? `Modifier ${definite(config)}${config.singular}`
          : `${newWord(config)} ${config.singular}`
      }
      subtitle={
        isEdit && record
          ? config.label(record)
          : (config.formSubtitle ??
            `Créez ${indefiniteNew(config)} ${config.singular}`)
      }
      submitLabel={isEdit ? "Enregistrer" : (config.createLabel ?? "Créer")}
      showError={hasErrors}
      onClose={onClose}
      onSubmit={submit}
    >
      {nodes}
    </FormSheet>
  );
}
