import { anneeStatus, getAllAnnees } from "@/api/annees";
import { Classe, getClasses } from "@/api/classes";
import { apiErrorMessage } from "@/api/client";
import { Eleve, eleveLabel, getAllEleves } from "@/api/eleves";
import {
  AFFECTATIONS,
  createInscription,
  GROUPES_SANGUINS,
  InscriptionInput,
  INSCRIPTIONS_FICTIVES,
  markInscriptionsStale,
  NATIONALITES,
  REGIMES,
  TYPES_INSCRIPTION,
} from "@/api/inscriptions";
import { getNiveaux } from "@/api/niveaux";
import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import FixedHeader from "@/components/ui/FixedHeader";
import Input from "@/components/ui/Input";
import Segmented from "@/components/ui/Segmented";
import Select, { Option } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { INITIAL_STUDENTS } from "@/data/students";
import { toISO } from "@/organisation/helpers";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------- Les trois étapes (mêmes champs que le formulaire du site) ---------- */

type StepInfo = { title: string; icon: keyof typeof Ionicons.glyphMap };

// Nouvelle inscription : 3 étapes. Réinscription : un seul écran (l'élève est déjà connu, pas de parent)
const STEPS: StepInfo[] = [
  { title: "Identité", icon: "person-outline" },
  { title: "Scolarité", icon: "school-outline" },
  { title: "Parent / tuteur", icon: "people-outline" },
];
const STEPS_REINSCRIPTION: StepInfo[] = [
  { title: "Réinscription", icon: "refresh-outline" },
];

const stepsOf = (type: string) =>
  type === "REINSCRIPTION" ? STEPS_REINSCRIPTION : STEPS;

type Step = 0 | 1 | 2;

/** Ce que l'utilisateur saisit (tout en texte, converti à l'envoi) */
type Form = {
  // Étape 1 : identité
  type: string;
  eleve: string;
  annee: string;
  name: string;
  firstname: string;
  birthDay: Date | null;
  birthOf: string;
  gender: string;
  nationality: string;
  matriculeNational: string;
  numeroExtrait: string;
  city: string; // Résidence (ville / commune)
  residence: string; // Quartier
  phone: string;
  groupeSang: string;
  observations: string;
  // Étape 2 : informations scolaires
  ancienEcole: string;
  niveauPrecedant: string;
  niveauActuel: string;
  classe: string;
  affectation: string;
  regime: string;
  redoublant: boolean;
  decision: string;
  // Étape 3 : parent ou tuteur
  nomParent: string;
  prenomsParent: string;
  phoneParent: string;
  lienParent: string;
  jobParent: string;
};

const EMPTY: Form = {
  type: "NOUVELLE",
  eleve: "",
  annee: "",
  name: "",
  firstname: "",
  birthDay: null,
  birthOf: "",
  gender: "",
  nationality: "",
  matriculeNational: "",
  numeroExtrait: "",
  city: "",
  residence: "",
  phone: "",
  groupeSang: "",
  observations: "",
  ancienEcole: "",
  niveauPrecedant: "",
  niveauActuel: "",
  classe: "",
  affectation: "AFFECTE",
  regime: "BOURSIER",
  redoublant: false,
  decision: "",
  nomParent: "",
  prenomsParent: "",
  phoneParent: "",
  lienParent: "",
  jobParent: "",
};

type Errors = Partial<Record<keyof Form, string>>;

const LIENS: Option[] = [
  "Père",
  "Mère",
  "Tuteur",
  "Tutrice",
  "Grand-parent",
  "Oncle / tante",
  "Frère / sœur",
  "Autre",
].map((l) => ({ value: l, label: l }));

// Au moins 8 chiffres ; espaces, tirets, points et « + » acceptés
const isPhone = (s: string) =>
  /^[+\d][\d\s.-]*$/.test(s.trim()) && s.replace(/\D/g, "").length >= 8;

/** Contrôle d'une étape. Obligatoires (comme sur le site) : type, année, nom, prénoms, niveau actuel, classe, affectation, régime */
function validate(step: Step, f: Form): Errors {
  const e: Errors = {};
  // Réinscription : tout est sur un seul écran
  if (f.type === "REINSCRIPTION") {
    if (!f.annee) e.annee = "Choisissez l'année scolaire";
    if (!f.eleve) e.eleve = "Choisissez l'élève à réinscrire";
    if (!f.niveauActuel) e.niveauActuel = "Choisissez le niveau actuel";
    if (!f.classe) e.classe = "Choisissez la classe";
    if (!f.affectation) e.affectation = "Choisissez l'affectation";
    if (!f.regime) e.regime = "Choisissez le régime";
    return e;
  }
  if (step === 0) {
    if (!f.type) e.type = "Choisissez le type d'inscription";
    if (!f.annee) e.annee = "Choisissez l'année scolaire";
    if (!f.name.trim()) e.name = "Le nom est obligatoire";
    if (!f.firstname.trim()) e.firstname = "Les prénoms sont obligatoires";
    if (f.phone.trim() && !isPhone(f.phone))
      e.phone = "Numéro de téléphone invalide";
  }
  if (step === 1) {
    if (!f.niveauActuel) e.niveauActuel = "Choisissez le niveau actuel";
    if (!f.classe) e.classe = "Choisissez la classe";
    if (!f.affectation) e.affectation = "Choisissez l'affectation";
    if (!f.regime) e.regime = "Choisissez le régime";
  }
  if (step === 2) {
    if (f.phoneParent.trim() && !isPhone(f.phoneParent))
      e.phoneParent = "Numéro de téléphone invalide";
  }
  return e;
}

/** Saisie → corps de la requête (les champs facultatifs vides partent à null) */
function toInput(f: Form): InscriptionInput {
  const opt = (s: string) => s.trim() || null;
  // Réinscription : seulement l'élève et sa scolarité, le reste part à null
  if (f.type === "REINSCRIPTION") {
    return {
      annee: f.annee,
      type: "REINSCRIPTION",
      eleve: f.eleve,
      name: null,
      firstname: null,
      gender: null,
      birth_day: null,
      birth_of: null,
      nationality: null,
      matricule_national: null,
      numero_extrait: null,
      photo_path: null,
      residence: null,
      city: null,
      phone: null,
      groupe_sang: null,
      observat_medicales: null,
      nom_parent: null,
      prenoms_parent: null,
      phone_parent: null,
      lien_parent: null,
      job_parent: null,
      ancien_ecole: null,
      niveau_precedant: opt(f.niveauPrecedant),
      niveau_actuel: f.niveauActuel,
      classe: f.classe,
      affectation: f.affectation,
      regime: f.regime,
      est_redoublant: f.redoublant,
      decision_fin_annee: opt(f.decision),
    };
  }
  return {
    annee: f.annee,
    type: "NOUVELLE",
    eleve: null,
    name: f.name.trim(),
    firstname: f.firstname.trim(),
    gender: (f.gender || null) as InscriptionInput["gender"],
    birth_day: f.birthDay ? `${toISO(f.birthDay)}T00:00:00Z` : null,
    birth_of: opt(f.birthOf),
    nationality: opt(f.nationality),
    matricule_national: opt(f.matriculeNational),
    numero_extrait: opt(f.numeroExtrait),
    photo_path: null, // pas encore de prise de photo dans l'application
    residence: opt(f.residence),
    city: opt(f.city),
    phone: opt(f.phone),
    groupe_sang: opt(f.groupeSang),
    observat_medicales: opt(f.observations),
    nom_parent: opt(f.nomParent),
    prenoms_parent: opt(f.prenomsParent),
    phone_parent: opt(f.phoneParent),
    lien_parent: opt(f.lienParent),
    job_parent: opt(f.jobParent),
    ancien_ecole: opt(f.ancienEcole),
    niveau_precedant: opt(f.niveauPrecedant),
    niveau_actuel: f.niveauActuel,
    classe: f.classe,
    affectation: f.affectation,
    regime: f.regime,
    est_redoublant: f.redoublant,
    decision_fin_annee: opt(f.decision),
  };
}

/* ---------- Écran ---------- */

export default function NouvelleInscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);

  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [visited, setVisited] = useState<Set<Step>>(new Set([0]));
  const [saving, setSaving] = useState(false);

  // Listes de la base, chargées à l'ouverture
  const [annees, setAnnees] = useState<Option[] | null>(null);
  const [niveaux, setNiveaux] = useState<Option[] | null>(null);
  const [classes, setClasses] = useState<Classe[] | null>(null);
  const [eleves, setEleves] = useState<Eleve[] | null>(null);
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const fail = (what: string) => {
      if (active) setFailed((f) => [...f, what]);
    };
    getAllAnnees()
      .then((all) => {
        if (!active) return;
        setAnnees(
          all.map((a) => ({
            value: a.public_key,
            label:
              anneeStatus(a) === "active" ? `${a.name} (en cours)` : a.name,
          })),
        );
        // L'année en cours est proposée d'office
        const current = all.find((a) => anneeStatus(a) === "active");
        if (current)
          setForm((f) => (f.annee ? f : { ...f, annee: current.public_key }));
      })
      .catch(() => {
        setAnnees([]);
        fail("années");
      });
    getNiveaux()
      .then((all) => {
        if (active)
          setNiveaux(all.map((n) => ({ value: n.public_key, label: n.name })));
      })
      .catch(() => {
        setNiveaux([]);
        fail("niveaux");
      });
    getAllEleves()
      .then((all) => {
        if (active) setEleves(all);
      })
      .catch(() => {
        if (INSCRIPTIONS_FICTIVES) {
          // Mode fictif : sans la vraie liste, des élèves de démonstration permettent de tester la réinscription
          if (active)
            setEleves(
              INITIAL_STUDENTS.map((st) => ({
                public_key: `FICTIF-${st.id}`,
                nom: st.lastName,
                prenoms: st.firstNames,
                matricule: st.matricule,
                etab_name: "",
                classe_name: "",
                niveau_name: "",
                gender: st.sex.startsWith("F") ? "F" : "M",
              })),
            );
          return;
        }
        setEleves([]);
        fail("élèves");
      });
    getClasses()
      .then((all) => {
        if (active) setClasses(all);
      })
      .catch(() => {
        setClasses([]);
        fail("classes");
      });
    return () => {
      active = false;
    };
  }, []);

  /** Met à jour un champ et efface son erreur */
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const steps = stepsOf(form.type);
  const reinscription = form.type === "REINSCRIPTION";

  // Changer de type change le formulaire : on repart de son premier écran
  const changeType = (type: string) => {
    set("type", type);
    setErrors({});
    setStep(0);
    setVisited(new Set([0]));
  };

  const goTo = (next: Step) => {
    setStep(next);
    setVisited((v) => new Set(v).add(next));
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // « Suivant » contrôle l'étape en cours ; on peut toujours revenir en arrière
  const next = () => {
    const e = validate(step, form);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showToast("Veuillez corriger les champs en rouge.", "error");
      return;
    }
    goTo((step + 1) as Step);
  };

  // Noms affichés dans la liste (la requête ne contient que des clés)
  const display = () => {
    const eleve = eleves?.find((e) => e.public_key === form.eleve);
    const classe = classes?.find((c) => c.public_key === form.classe);
    return {
      eleve_name: reinscription
        ? eleve
          ? `${eleve.nom} ${eleve.prenoms}`.trim()
          : ""
        : `${form.name.trim()} ${form.firstname.trim()}`.trim(),
      matricule: reinscription
        ? (eleve?.matricule ?? "")
        : form.matriculeNational.trim(),
      classe_name: classe?.name ?? "",
      niveau_name: niveaux?.find((n) => n.value === form.niveauActuel)?.label ?? "",
      // « 2026-2027 (en cours) » → « 2026-2027 »
      annee_name: (annees?.find((a) => a.value === form.annee)?.label ?? "").replace(/ \(en cours\)$/, ""),
    };
  };

  const submit = async () => {
    if (saving) return;
    // Tout est contrôlé : on ouvre la première étape qui a une erreur
    for (const s of steps.map((_, i) => i as Step)) {
      const e = validate(s, form);
      if (Object.keys(e).length > 0) {
        setErrors(e);
        goTo(s);
        showToast(
          steps.length > 1
            ? `Étape « ${steps[s].title} » : veuillez corriger les champs en rouge.`
            : "Veuillez corriger les champs en rouge.",
          "error",
        );
        return;
      }
    }
    setSaving(true);
    try {
      const message = await createInscription(toInput(form), display());
      markInscriptionsStale(); // la liste des inscriptions se recharge au retour
      showToast(message);
      router.back();
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
      setSaving(false);
    }
  };

  // Les classes viennent de la table des classes (GET /classes). On propose d'abord celles du niveau choisi :
  // par clé, ou par nom (« Seconde » trouve « Seconde (2ND) »). Si aucune ne correspond, toutes sont proposées.
  const niveauName =
    niveaux?.find((n) => n.value === form.niveauActuel)?.label ?? "";
  const sameNiveau = (c: Classe) => {
    if (c.niveau_key) return c.niveau_key === form.niveauActuel;
    const a = normalize(c.niveau_name);
    const b = normalize(niveauName);
    return !!a && !!b && (a === b || a.startsWith(`${b} (`) || b.startsWith(`${a} (`));
  };
  const ofNiveau = (classes ?? []).filter(sameNiveau);
  const classesShown = ofNiveau.length > 0 ? ofNiveau : (classes ?? []);
  const allClasses = ofNiveau.length === 0 && classesShown.length > 0;
  const classOptions: Option[] = classesShown.map((c) => ({
    value: c.public_key,
    label: [
      c.name,
      // Liste complète : on précise le niveau pour s'y retrouver
      allClasses ? c.niveau_name : "",
      c.max_effectif ? `${c.max_effectif} places` : "",
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const listError = (what: string) =>
    failed.includes(what) ? `Impossible de charger les ${what}.` : undefined;
  const last = step === steps.length - 1;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
          </Pressable>
          <View className="flex-1">
            <Text className="font-inter-bold text-[20px] leading-8 text-ink">
              {reinscription ? "Réinscription" : "Nouvelle inscription"}
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {steps.length > 1
                ? `Étape ${step + 1} sur ${steps.length} · ${steps[step].title}`
                : "Élève déjà inscrit · scolarité de la nouvelle année"}
            </Text>
          </View>
        </View>

        {/* Étapes : on peut revenir à une étape déjà ouverte */}
        {steps.length > 1 && (
          <View className="flex-row gap-2">
            {steps.map((s, i) => {
              const active = i === step;
              const done = visited.has(i as Step) && i < step;
              const reachable = visited.has(i as Step);
              return (
                <Pressable
                  key={s.title}
                  disabled={!reachable || active}
                  onPress={() => goTo(i as Step)}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: active,
                    disabled: !reachable,
                  }}
                  accessibilityLabel={`Étape ${i + 1} : ${s.title}`}
                  className="flex-1 active:opacity-80"
                >
                  <View
                    className={`h-1.5 rounded-full ${active || done ? "bg-primary" : "bg-line"}`}
                  />
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
        )}
      </FixedHeader>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {step === 0 && (
              <>
                <Section title="Inscription">
                  <Segmented
                    label="Type *"
                    value={form.type}
                    options={TYPES_INSCRIPTION}
                    onChange={changeType}
                  />
                  {reinscription && (
                    <Select
                      label="Élève *"
                      icon="person-outline"
                      placeholder={
                        eleves
                          ? "Sélectionner un élève"
                          : "Chargement des élèves…"
                      }
                      value={form.eleve}
                      options={(eleves ?? []).map((e) => ({
                        value: e.public_key,
                        label: eleveLabel(e),
                      }))}
                      searchable
                      onChange={(v) => set("eleve", v)}
                      error={errors.eleve ?? listError("élèves")}
                    />
                  )}
                  <Select
                    label="Année scolaire *"
                    icon="calendar-outline"
                    placeholder={
                      annees ? "Sélectionner une année" : "Chargement…"
                    }
                    value={form.annee}
                    options={annees ?? []}
                    onChange={(v) => set("annee", v)}
                    error={errors.annee ?? listError("années")}
                  />
                </Section>

                {/* Nouvelle inscription seulement : l'élève réinscrit est déjà connu */}
                {!reinscription && (
                  <>
                    <Section title="Identité">
                      <Input
                        label="Nom *"
                        icon="person-outline"
                        placeholder="Ex. KOUASSI"
                        value={form.name}
                        onChangeText={(t) => set("name", t.toUpperCase())}
                        autoCapitalize="characters"
                        error={errors.name}
                      />
                      <Input
                        label="Prénoms *"
                        icon="person-outline"
                        placeholder="Ex. Aya Marie"
                        value={form.firstname}
                        onChangeText={(t) => set("firstname", t)}
                        autoCapitalize="words"
                        error={errors.firstname}
                      />
                      <DateField
                        label="Date de naissance"
                        value={form.birthDay}
                        defaultValue={
                          new Date(new Date().getFullYear() - 10, 0, 1)
                        }
                        maximumDate={new Date()}
                        onChange={(d) => set("birthDay", d)}
                      />
                      <Input
                        label="Lieu de naissance"
                        icon="location-outline"
                        placeholder="Ex. Abidjan"
                        value={form.birthOf}
                        onChangeText={(t) => set("birthOf", t)}
                      />
                      <Segmented
                        label="Sexe"
                        value={form.gender}
                        options={[
                          { value: "M", label: "Masculin" },
                          { value: "F", label: "Féminin" },
                        ]}
                        onChange={(v) => set("gender", v)}
                      />
                      <Select
                        label="Nationalité"
                        icon="flag-outline"
                        placeholder="Sélectionner une nationalité…"
                        value={form.nationality}
                        options={NATIONALITES.map((n) => ({
                          value: n,
                          label: n,
                        }))}
                        searchable
                        onChange={(v) => set("nationality", v)}
                      />
                      <Input
                        label="Matricule national"
                        icon="barcode-outline"
                        placeholder="Ex. 07055027R"
                        value={form.matriculeNational}
                        onChangeText={(t) =>
                          set("matriculeNational", t.toUpperCase())
                        }
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                      <Input
                        label="N° extrait de naissance"
                        icon="document-text-outline"
                        placeholder="Ex. 106 du 19/04/2019"
                        value={form.numeroExtrait}
                        onChangeText={(t) => set("numeroExtrait", t)}
                        autoCorrect={false}
                      />
                    </Section>

                    <Section title="Coordonnées et santé">
                      <Input
                        label="Résidence (Ville/Commune)"
                        icon="business-outline"
                        placeholder="Ex. Cocody"
                        value={form.city}
                        onChangeText={(t) => set("city", t)}
                      />
                      <Input
                        label="Quartier"
                        icon="home-outline"
                        placeholder="Ex. Angré"
                        value={form.residence}
                        onChangeText={(t) => set("residence", t)}
                      />
                      <Input
                        label="Téléphone"
                        icon="call-outline"
                        placeholder="Ex. 07 07 00 00 00"
                        value={form.phone}
                        onChangeText={(t) => set("phone", t)}
                        keyboardType="phone-pad"
                        error={errors.phone}
                      />
                      <Select
                        label="Groupe sanguin"
                        icon="water-outline"
                        placeholder="Groupe sanguin"
                        value={form.groupeSang}
                        options={GROUPES_SANGUINS.map((g) => ({
                          value: g,
                          label: g,
                        }))}
                        onChange={(v) => set("groupeSang", v)}
                      />
                      <Input
                        label="Observations médicales"
                        icon="medkit-outline"
                        placeholder="Allergies, traitements…"
                        value={form.observations}
                        onChangeText={(t) => set("observations", t)}
                        multiline
                      />
                    </Section>
                  </>
                )}
              </>
            )}

            {/* Scolarité : 2e étape d'une nouvelle inscription, ou suite de l'écran de réinscription */}
            {(step === 1 || reinscription) && (
              <>
                <Section title="Parcours">
                  {!reinscription && (
                    <Input
                      label="Ancien établissement"
                      icon="business-outline"
                      placeholder="Ex. Lycée moderne de Cocody"
                      value={form.ancienEcole}
                      onChangeText={(t) => set("ancienEcole", t)}
                    />
                  )}
                  <Select
                    label="Niveau précédent"
                    icon="arrow-undo-outline"
                    placeholder={
                      niveaux
                        ? "Sélectionner le niveau précédent"
                        : "Chargement…"
                    }
                    value={form.niveauPrecedant}
                    options={niveaux ?? []}
                    searchable
                    onChange={(v) => set("niveauPrecedant", v)}
                  />
                </Section>

                <Section title="Niveau et classe">
                  <Select
                    label="Niveau actuel *"
                    icon="layers-outline"
                    placeholder={
                      niveaux ? "Sélectionner le niveau actuel" : "Chargement…"
                    }
                    value={form.niveauActuel}
                    options={niveaux ?? []}
                    searchable
                    onChange={(v) => {
                      set("niveauActuel", v);
                      set("classe", ""); // la classe dépend du niveau
                    }}
                    error={errors.niveauActuel ?? listError("niveaux")}
                  />
                  <Select
                    label="Classe *"
                    icon="school-outline"
                    placeholder={
                      !classes
                        ? "Chargement…"
                        : !form.niveauActuel
                          ? "Choisissez d'abord le niveau actuel"
                          : !classOptions.length
                            ? "Aucune classe enregistrée"
                            : allClasses
                              ? "Aucune classe de ce niveau : toutes les classes"
                              : "Sélectionner une classe"
                    }
                    value={form.classe}
                    options={form.niveauActuel ? classOptions : []}
                    searchable
                    onChange={(v) => set("classe", v)}
                    error={errors.classe ?? listError("classes")}
                  />
                </Section>

                <Section title="Statut">
                  <Segmented
                    label="Affectation *"
                    value={form.affectation}
                    options={AFFECTATIONS}
                    onChange={(v) => set("affectation", v)}
                  />
                  <Segmented
                    label="Régime *"
                    value={form.regime}
                    options={REGIMES}
                    onChange={(v) => set("regime", v)}
                  />
                  <CheckboxRow
                    checked={form.redoublant}
                    onToggle={() => set("redoublant", !form.redoublant)}
                    title="Redoublant"
                    description="L'élève reprend le même niveau"
                  />
                  <View className="mt-4">
                    <Input
                      label="Décision fin d'année"
                      icon="ribbon-outline"
                      placeholder="Ex. Admis en classe supérieure"
                      value={form.decision}
                      onChangeText={(t) => set("decision", t)}
                    />
                  </View>
                </Section>
              </>
            )}

            {step === 2 && (
              <Section title="Parent ou tuteur">
                <Input
                  label="Nom du parent/tuteur"
                  icon="person-outline"
                  placeholder="Ex. KOUASSI"
                  value={form.nomParent}
                  onChangeText={(t) => set("nomParent", t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <Input
                  label="Prénoms du parent/tuteur"
                  icon="person-outline"
                  placeholder="Ex. Jean"
                  value={form.prenomsParent}
                  onChangeText={(t) => set("prenomsParent", t)}
                  autoCapitalize="words"
                />
                <Input
                  label="Téléphone du parent/tuteur"
                  icon="call-outline"
                  placeholder="Ex. 07 07 00 00 00"
                  value={form.phoneParent}
                  onChangeText={(t) => set("phoneParent", t)}
                  keyboardType="phone-pad"
                  error={errors.phoneParent}
                />
                <Select
                  label="Lien de parenté"
                  icon="git-merge-outline"
                  placeholder="Lien de parenté"
                  value={form.lienParent}
                  options={LIENS}
                  onChange={(v) => set("lienParent", v)}
                />
                <Input
                  label="Profession du parent/tuteur"
                  icon="briefcase-outline"
                  placeholder="Ex. Commerçant"
                  value={form.jobParent}
                  onChangeText={(t) => set("jobParent", t)}
                />
              </Section>
            )}
          </View>
        </ScrollView>

        {/* Navigation entre les étapes */}
        <View
          className="gap-2 border-t border-line bg-white px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-row gap-3">
            {step > 0 && (
              <Pressable
                onPress={() => goTo((step - 1) as Step)}
                disabled={saving}
                className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-line bg-white active:opacity-80"
              >
                <Ionicons name="chevron-back" size={18} color="#2B5EA8" />
                <Text className="font-inter-semibold text-base text-primary">
                  Précédent
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={last ? submit : next}
              disabled={saving}
              className={`h-[54px] flex-[1.4] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80 ${saving ? "opacity-70" : ""}`}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  {last && (
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  )}
                  <Text className="font-inter-semibold text-base text-white">
                    {last ? "Créer" : "Suivant"}
                  </Text>
                  {!last && (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#FFFFFF"
                    />
                  )}
                </>
              )}
            </Pressable>
          </View>
          {/* Annuler : comme sur le site */}
          <Pressable
            onPress={() => router.back()}
            disabled={saving}
            hitSlop={6}
            className="items-center py-1 active:opacity-70"
          >
            <Text className="font-inter-semibold text-[14px] text-muted">
              Annuler
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------- Petits blocs ---------- */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="rounded-3xl bg-white p-5 shadow-sm">
      <Text className="mb-4 font-inter-bold text-[12px] uppercase tracking-wider text-primary">
        {title}
      </Text>
      {children}
    </View>
  );
}
