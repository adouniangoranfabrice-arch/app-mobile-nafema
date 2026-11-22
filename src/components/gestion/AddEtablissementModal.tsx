import { apiErrorMessage } from "@/api/client";
import { getAllDrens } from "@/api/drens";
import {
  CATEGORIES_ETABLISSEMENT,
  CIVILITES,
  EtablissementDetail,
  EtablissementInput,
  GENRES,
  slugify,
  TYPES_ETABLISSEMENT,
} from "@/api/etablissements";
import { getIepps, Iepp } from "@/api/iepps";
import { SheetModal } from "@/components/ui/FormSheet";
import Input from "@/components/ui/Input";
import Segmented from "@/components/ui/Segmented";
import Select, { Option } from "@/components/ui/Select";
import { showFormError, showToast } from "@/components/ui/Toast";
import { Drena } from "@/data/drenas";
import { normalize } from "@/utils/text";
import { PHONE_ERROR, PHONE_INPUT, isPhone, toPhone } from "@/utils/phone";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  /** Si fourni : mode modification (sans le mot de passe) */
  etablissement?: EtablissementDetail | null;
  onClose: () => void;
  onSave: (input: EtablissementInput) => Promise<void>;
};

export default function AddEtablissementModal({ visible, etablissement, onClose, onSave }: Props) {
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <EtablissementForm
        key={etablissement?.public_key ?? "new"}
        etablissement={etablissement ?? null}
        onClose={onClose}
        onSave={onSave}
      />
    </SheetModal>
  );
}

/* ---------- Les quatre étapes (mêmes champs que le formulaire du site) ---------- */

const STEPS = [
  { title: "Identité", icon: "business-outline" },
  { title: "Rattachement", icon: "map-outline" },
  { title: "Contact", icon: "call-outline" },
  { title: "Dirigeant", icon: "person-outline" },
] as const;

type Step = 0 | 1 | 2 | 3;

type Form = {
  numero: string;
  type: string;
  catego: string;
  name: string;
  slug: string;
  dren: string;
  iep: string;
  localisation: string;
  ville: string;
  commune: string;
  phone: string;
  email_ecole: string;
  autorisation: string;
  civility: string;
  sexe: string;
  dir_nom: string;
  dir_prenoms: string;
  dir_phone: string;
  dir_mail: string;
  mot_passe: string;
};

const EMPTY: Form = {
  numero: "",
  type: "public",
  catego: "",
  name: "",
  slug: "",
  dren: "",
  iep: "",
  localisation: "",
  ville: "",
  commune: "",
  phone: "",
  email_ecole: "",
  autorisation: "",
  civility: "",
  sexe: "",
  dir_nom: "",
  dir_prenoms: "",
  dir_phone: "",
  dir_mail: "",
  mot_passe: "",
};

type Errors = Partial<Record<keyof Form, string>>;

/** Formulaire pré-rempli depuis le détail (GET /etablissements/{etablissement}) */
function fromDetail(d: EtablissementDetail): Form {
  // Le détail donne le nom et le nom complet : les prénoms sont ce qui suit le nom
  const full = d.dir_full_name.trim();
  const prenoms =
    d.dir_nom && normalize(full).startsWith(normalize(d.dir_nom))
      ? full.slice(d.dir_nom.length).trim()
      : full;
  return {
    ...EMPTY,
    numero: d.numero,
    type: d.type.toLowerCase() || "public",
    catego: d.catego.toLowerCase(),
    name: d.name,
    slug: d.abbrev,
    dren: d.drena_key,
    localisation: d.localisation,
    ville: d.city,
    commune: d.commune,
    phone: toPhone(d.phone),
    email_ecole: d.email_ecole,
    autorisation: d.autorisation,
    civility: d.dir_civility,
    sexe: d.dir_sexe.toUpperCase(),
    dir_nom: d.dir_nom,
    dir_prenoms: prenoms,
    dir_phone: toPhone(d.dir_phone),
    dir_mail: d.dir_mail,
  };
}

/** Critères du mot de passe du dirigeant : 12 caractères, majuscule, minuscule, chiffre, caractère spécial */
const passwordRules = (p: string) => [
  { label: "Au moins 12 caractères", ok: p.length >= 12 },
  { label: "Une lettre majuscule", ok: /[A-Z]/.test(p) },
  { label: "Une lettre minuscule", ok: /[a-z]/.test(p) },
  { label: "Un chiffre", ok: /\d/.test(p) },
  { label: "Un caractère spécial", ok: /[^A-Za-z0-9\s]/.test(p) },
];

const isEmail =(v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Contrôle d'une étape. Obligatoires (comme sur le site) : type, catégorie, nom, slug, DRENA et le dirigeant */
function validate(step: Step, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!f.type) e.type = "Choisissez le type";
    if (!f.catego) e.catego = "Choisissez la catégorie";
    if (!f.name.trim()) e.name = "Le nom est obligatoire";
    if (!f.slug.trim()) e.slug = "Le slug est obligatoire";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug.trim()))
      e.slug = "Lettres minuscules, chiffres et tirets uniquement";
  }
  if (step === 1) {
    if (!f.dren) e.dren = "Choisissez la DRENA";
  }
  if (step === 2) {
    if (f.phone.trim() && !isPhone(f.phone)) e.phone = PHONE_ERROR;
    if (f.email_ecole.trim() && !isEmail(f.email_ecole)) e.email_ecole = "Adresse e-mail invalide";
  }
  if (step === 3) {
    if (!f.civility) e.civility = "Choisissez la civilité";
    if (!f.sexe) e.sexe = "Choisissez le genre";
    if (!f.dir_nom.trim()) e.dir_nom = "Le nom est obligatoire";
    if (!f.dir_prenoms.trim()) e.dir_prenoms = "Les prénoms sont obligatoires";
    if (!f.dir_phone.trim()) e.dir_phone = "Le téléphone est obligatoire";
    else if (!isPhone(f.dir_phone)) e.dir_phone = PHONE_ERROR;
    if (!f.dir_mail.trim()) e.dir_mail = "L'e-mail de connexion est obligatoire";
    else if (!isEmail(f.dir_mail)) e.dir_mail = "Adresse e-mail invalide";
    if (f.mot_passe) {
      const missing = passwordRules(f.mot_passe).filter((r) => !r.ok);
      if (missing.length > 0)
        e.mot_passe = `Mot de passe trop faible : ${missing.map((r) => r.label.toLowerCase()).join(", ")} (ou laissez vide)`;
    }
  }
  return e;
}

const toInput = (f: Form): EtablissementInput => ({
  numero: f.numero.trim(),
  name: f.name.trim(),
  abbreviation: f.slug.trim(),
  type: f.type,
  catego: f.catego,
  dren: f.dren,
  iep: f.iep,
  localisation: f.localisation.trim(),
  ville: f.ville.trim(),
  commune: f.commune.trim(),
  phone: f.phone.trim(),
  email_ecole: f.email_ecole.trim(),
  autorisation: f.autorisation.trim(),
  civility: f.civility,
  sexe: f.sexe,
  dir_nom: f.dir_nom.trim(),
  dir_prenoms: f.dir_prenoms.trim(),
  dir_phone: f.dir_phone.trim(),
  dir_mail: f.dir_mail.trim(),
  mot_passe: f.mot_passe,
});

function EtablissementForm({
  etablissement,
  onClose,
  onSave,
}: Omit<Props, "visible" | "etablissement"> & { etablissement: EtablissementDetail | null }) {
  const isEdit = !!etablissement;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [step, setStep] = useState<Step>(0);
  const [visited, setVisited] = useState<Set<Step>>(new Set([0]));
  const [form, setForm] = useState<Form>(() => (etablissement ? fromDetail(etablissement) : EMPTY));
  const [errors, setErrors] = useState<Errors>({});
  // Slug généré depuis le nom tant que l'utilisateur ne l'a pas modifié lui-même
  // En modification, le slug existant est gardé
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // DRENA et IEPP de la base
  const [drenas, setDrenas] = useState<Drena[] | null>(null);
  const [iepps, setIepps] = useState<Iepp[] | null>(null);
  const [refsFailed, setRefsFailed] = useState(false);
  useEffect(() => {
    let active = true;
    getAllDrens()
      .then((all) => active && setDrenas(all))
      .catch(() => {
        if (!active) return;
        setDrenas([]);
        setRefsFailed(true);
      });
    getIepps()
      .then((all) => {
        if (!active) return;
        setIepps(all);
        // Modification : le détail ne donne que le nom de l'IEPP, on retrouve sa clé
        if (etablissement?.iepp_name) {
          const hit = all.find(
            (i) =>
              normalize(i.name) === normalize(etablissement.iepp_name) &&
              (!etablissement.drena_key || !i.dren_public_key || i.dren_public_key === etablissement.drena_key),
          );
          if (hit) setForm((f) => (f.iep ? f : { ...f, iep: hit.public_key }));
        }
      })
      .catch(() => active && setIepps([]));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargé une fois, à l'ouverture
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const drenaOptions: Option[] = (drenas ?? []).map((d) => ({
    value: d.public_key,
    label: d.name,
  }));
  // IEPP de la DRENA choisie seulement
  const chosenDrena = drenas?.find((d) => d.public_key === form.dren);
  const ieppOptions: Option[] = (iepps ?? [])
    .filter(
      (i) =>
        !chosenDrena ||
        i.dren_public_key === chosenDrena.public_key ||
        (!i.dren_public_key && i.dren_name === chosenDrena.name),
    )
    .map((i) => ({ value: i.public_key, label: i.name }));

  const goTo = (s: Step) => {
    setStep(s);
    setVisited((v) => new Set(v).add(s));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const next = () => {
    const e = validate(step, form);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showFormError();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    goTo((step + 1) as Step);
  };

  const submit = async () => {
    if (saving) return;
    // Tout est contrôlé : on ouvre la première étape qui a une erreur
    for (const s of [0, 1, 2, 3] as Step[]) {
      const e = validate(s, form);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        goTo(s);
        showToast(`Étape « ${STEPS[s].title} » : veuillez corriger les champs en rouge.`, "error");
        return;
      }
    }
    setSaving(true);
    setSaveError("");
    try {
      await onSave(toInput(form));
    } catch (error) {
      const message = apiErrorMessage(error);
      setSaveError(message);
      showToast(message, "error");
      setSaving(false);
    }
  };

  const last = step === STEPS.length - 1;

  return (
    <View className="flex-1 bg-white">
      {/* En-tête */}
      <View
        className="gap-4 px-5 pb-3"
        style={{ paddingTop: Platform.OS === "android" ? insets.top + 12 : 20 }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text numberOfLines={1} className="font-inter-bold text-xl text-ink">
              {isEdit ? "Modifier l'établissement" : "Nouvel établissement"}
            </Text>
            <Text numberOfLines={1} className="font-inter text-xs text-muted">
              Étape {step + 1} sur {STEPS.length} · {STEPS[step].title}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            className="h-9 w-9 items-center justify-center rounded-full bg-soft active:opacity-80"
          >
            <Ionicons name="close" size={20} color="#2B5EA8" />
          </Pressable>
        </View>

        {/* Étapes : on peut revenir à une étape déjà ouverte */}
        <View className="flex-row gap-2">
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = visited.has(i as Step) && i < step;
            const reachable = visited.has(i as Step);
            return (
              <Pressable
                key={s.title}
                disabled={!reachable || active || saving}
                onPress={() => goTo(i as Step)}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: !reachable }}
                accessibilityLabel={`Étape ${i + 1} : ${s.title}`}
                className="flex-1 active:opacity-80"
              >
                <View className={`h-1.5 rounded-full ${active || done ? "bg-primary" : "bg-line"}`} />
                <View className="mt-1.5 flex-row items-center gap-1">
                  <Ionicons
                    name={done ? "checkmark-circle" : s.icon}
                    size={14}
                    color={active || done ? "#2B5EA8" : "#9AA7B8"}
                  />
                  <Text
                    numberOfLines={1}
                    className={`flex-1 font-inter-semibold text-[12px] ${active || done ? "text-primary" : "text-muted"}`}
                  >
                    {s.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <Input
              label="Code (optionnel)"
              icon="barcode-outline"
              placeholder="ex. 000651"
              value={form.numero}
              onChangeText={(t) => set("numero", t)}
            />
            <Segmented
              label="Type"
              value={form.type}
              options={TYPES_ETABLISSEMENT}
              onChange={(v) => set("type", v)}
            />
            <Select
              label="Catégorie"
              icon="layers-outline"
              placeholder="Sélectionner la catégorie"
              value={form.catego}
              options={CATEGORIES_ETABLISSEMENT}
              onChange={(v) => set("catego", v)}
              error={errors.catego}
            />
            <Input
              label="Nom"
              icon="business-outline"
              placeholder="ex. Collège Saint-Viateur"
              value={form.name}
              onChangeText={(t) => {
                setForm((f) => ({ ...f, name: t, slug: slugTouched ? f.slug : slugify(t) }));
                setErrors((e) => ({ ...e, name: undefined, slug: slugTouched ? e.slug : undefined }));
              }}
              error={errors.name}
            />
            <Input
              label="Slug"
              icon="link-outline"
              placeholder="ex. college-saint-viateur"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.slug}
              onChangeText={(t) => {
                setSlugTouched(true);
                set("slug", t.toLowerCase());
              }}
              error={errors.slug}
            />
            <Text className="-mt-3 mb-2 font-inter text-xs text-muted">
              Utilisé dans les URLs. Généré automatiquement depuis le nom.
            </Text>
          </>
        )}

        {step === 1 && (
          <>
            <Text className="mb-3 font-inter-bold text-[16px] text-ink">Rattachement administratif</Text>
            <Select
              label="DRENA"
              icon="map-outline"
              placeholder={drenas ? "Sélectionner une DRENA" : "Chargement…"}
              value={form.dren}
              options={drenaOptions}
              searchable
              onChange={(v) => {
                setForm((f) => ({ ...f, dren: v, iep: "" })); // l'IEPP dépend de la DRENA
                setErrors((e) => ({ ...e, dren: undefined }));
              }}
              error={
                errors.dren ??
                (refsFailed ? "Impossible de charger les DRENA." : undefined)
              }
            />
            <Select
              label="IEPP (optionnel)"
              icon="git-branch-outline"
              placeholder={
                !form.dren
                  ? "Choisissez d'abord la DRENA"
                  : iepps
                    ? ieppOptions.length
                      ? "Sélectionner une IEPP"
                      : "Aucune IEPP pour cette DRENA"
                    : "Chargement…"
              }
              value={form.iep}
              options={ieppOptions}
              searchable
              disabled={!form.dren || ieppOptions.length === 0}
              onChange={(v) => set("iep", v)}
            />

            <Text className="mb-3 mt-2 font-inter-bold text-[16px] text-ink">Localisation</Text>
            <Input
              label="Adresse"
              icon="location-outline"
              placeholder="ex. Rue des Jardins"
              value={form.localisation}
              onChangeText={(t) => set("localisation", t)}
            />
            <Input
              label="Ville"
              icon="business-outline"
              placeholder="ex. Abidjan"
              value={form.ville}
              onChangeText={(t) => set("ville", t)}
            />
            <Input
              label="Commune"
              icon="navigate-outline"
              placeholder="ex. Cocody"
              value={form.commune}
              onChangeText={(t) => set("commune", t)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Input
              label="Téléphone"
              icon="call-outline"
              {...PHONE_INPUT}
              value={form.phone}
              onChangeText={(t) => set("phone", toPhone(t))}
              error={errors.phone}
            />
            <Input
              label="E-mail"
              icon="mail-outline"
              placeholder="contact@ecole.ci"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.email_ecole}
              onChangeText={(t) => set("email_ecole", t)}
              error={errors.email_ecole}
            />
            <Input
              label="Numéro d'autorisation"
              icon="document-text-outline"
              placeholder="ex. 123/MENA/2024"
              value={form.autorisation}
              onChangeText={(t) => set("autorisation", t)}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text className="mb-3 font-inter-bold text-[16px] text-ink">
              Informations du dirigeant (administrateur)
            </Text>
            <Select
              label="Civilité"
              icon="person-outline"
              placeholder="Sélectionner"
              value={form.civility}
              options={CIVILITES}
              onChange={(v) => set("civility", v)}
              error={errors.civility}
            />
            <Select
              label="Genre"
              icon="male-female-outline"
              placeholder="Sélectionner"
              value={form.sexe}
              options={GENRES}
              onChange={(v) => set("sexe", v)}
              error={errors.sexe}
            />
            <Input
              label="Nom"
              icon="person-outline"
              placeholder="ex. Kouassi"
              value={form.dir_nom}
              onChangeText={(t) => set("dir_nom", t)}
              error={errors.dir_nom}
            />
            <Input
              label="Prénoms"
              icon="person-outline"
              placeholder="ex. Jean-Baptiste"
              value={form.dir_prenoms}
              onChangeText={(t) => set("dir_prenoms", t)}
              error={errors.dir_prenoms}
            />
            <Input
              label="Téléphone"
              icon="call-outline"
              {...PHONE_INPUT}
              value={form.dir_phone}
              onChangeText={(t) => set("dir_phone", toPhone(t))}
              error={errors.dir_phone}
            />
            <Input
              label="E-mail de connexion"
              icon="mail-outline"
              placeholder="directeur@ecole.ci"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.dir_mail}
              onChangeText={(t) => set("dir_mail", t)}
              error={errors.dir_mail}
            />
            {/* Mot de passe : à la création seulement (il ne se modifie pas ici) */}
            {!isEdit && (
              <>
            <Input
              label="Mot de passe (optionnel)"
              icon="lock-closed-outline"
              placeholder="Généré automatiquement si vide"
              isPassword
              autoCapitalize="none"
              value={form.mot_passe}
              onChangeText={(t) => set("mot_passe", t)}
              error={errors.mot_passe}
            />
            {/* Critères cochés au fil de la saisie */}
            <View className="-mt-3 mb-4 gap-1.5 rounded-2xl bg-page p-3.5">
              {passwordRules(form.mot_passe).map((r) => {
                const ok = !!form.mot_passe && r.ok;
                return (
                  <View key={r.label} className="flex-row items-center gap-2">
                    <Ionicons
                      name={ok ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={ok ? "#15803D" : "#9AA7B8"}
                    />
                    <Text className={`font-inter text-[13px] ${ok ? "text-green-700" : "text-muted"}`}>
                      {r.label}
                    </Text>
                  </View>
                );
              })}
              <Text className="mt-1 font-inter text-xs text-muted">
                Laissez vide pour qu&apos;un mot de passe soit généré automatiquement.
              </Text>
            </View>
              </>
            )}
          </>
        )}

        {saveError ? (
          <Text className="font-inter text-[13px] text-red-500">{saveError}</Text>
        ) : null}
      </ScrollView>

      {/* Navigation entre les étapes */}
      <View
        className="flex-row gap-3 border-t border-line bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={step > 0 ? () => goTo((step - 1) as Step) : onClose}
          disabled={saving}
          className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-line bg-white active:opacity-80"
        >
          {step > 0 && <Ionicons name="chevron-back" size={18} color="#2B5EA8" />}
          <Text className={`font-inter-semibold text-base ${step > 0 ? "text-primary" : "text-ink"}`}>
            {step > 0 ? "Précédent" : "Annuler"}
          </Text>
        </Pressable>
        <Pressable
          onPress={last ? submit : next}
          disabled={saving}
          className={`h-[54px] flex-[1.4] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80 ${saving ? "opacity-70" : ""}`}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              {last && <Ionicons name="save-outline" size={18} color="#FFFFFF" />}
              <Text className="font-inter-semibold text-base text-white">
                {last ? (isEdit ? "Enregistrer" : "Créer") : "Suivant"}
              </Text>
              {!last && <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
