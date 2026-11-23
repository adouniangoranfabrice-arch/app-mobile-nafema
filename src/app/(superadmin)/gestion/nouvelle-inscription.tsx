import { anneeStatus, getAllAnnees } from "@/api/annees";
import { LANGUES_V2 } from "@/api/classes";
import { getMe } from "@/api/auth";
import { apiErrorMessage } from "@/api/client";
import { Eleve, eleveLabel, getAllEleves } from "@/api/eleves";
import { getEtablissement } from "@/api/etablissements";
import { Frais, getFrais, getFraisDetail } from "@/api/frais";
import {
  AFFECTATIONS,
  createInscription,
  GROUPES_SANGUINS,
  InscriptionInput,
  LIENS_PARENT,
  markInscriptionsStale,
  PhotoFile,
  NATIONALITES,
  REGIMES,
  TYPES_INSCRIPTION,
  TYPES_PAIEMENT,
} from "@/api/inscriptions";
import { getNiveaux, Niveau } from "@/api/niveaux";
import { getSeries } from "@/api/series";
import DateField from "@/components/ui/DateField";
import FixedHeader from "@/components/ui/FixedHeader";
import Input from "@/components/ui/Input";
import PhotoPicker from "@/components/ui/PhotoPicker";
import Segmented from "@/components/ui/Segmented";
import Select, { Option } from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { toISO } from "@/organisation/helpers";
import { fieldsFor, niveauRank, niveauxPourCategorie, STAGE_LABELS } from "@/utils/niveaux";
import { PHONE_ERROR, PHONE_INPUT, isPhone, toPhone } from "@/utils/phone";
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

/* ---------- Les étapes (comme sur le site : Identité, puis Parent) ---------- */

type StepInfo = { title: string; icon: keyof typeof Ionicons.glyphMap };

const STEPS: StepInfo[] = [
  { title: "Identité", icon: "person-outline" },
  { title: "Parent", icon: "people-outline" },
];
// Réinscription : un seul écran (l'élève et son parent sont déjà connus)
const STEPS_REINSCRIPTION: StepInfo[] = [{ title: "Réinscription", icon: "refresh-outline" }];

const REINSCRIPTION = "reinscription";

type Step = 0 | 1;

/** Ce que l'utilisateur saisit */
type Form = {
  type: string;
  eleve: string;
  // Identité
  name: string;
  firstname: string;
  birthDay: Date | null;
  birthOf: string;
  gender: string;
  nationality: string;
  nationalMat: string;
  numeroExtrait: string;
  residence: string; // Résidence (ville / commune)
  city: string; // Quartier
  phone: string;
  groupeSang: string;
  observations: string;
  // Scolarité
  ancienEcole: string;
  niveauPrecedant: string;
  niveauActuel: string;
  serie: string;
  langV2: string;
  affectation: string;
  regime: string;
  typePaiement: string;
  fraisOptionnels: string[];
  decision: string;
  // Parent ou tuteur
  nomParent: string;
  prenomsParent: string;
  phoneParent: string;
  lienParent: string;
  jobParent: string;
};

const EMPTY: Form = {
  type: "nouvelle",
  eleve: "",
  name: "",
  firstname: "",
  birthDay: null,
  birthOf: "",
  gender: "",
  nationality: "Ivoirienne",
  nationalMat: "",
  numeroExtrait: "",
  residence: "",
  city: "",
  phone: "",
  groupeSang: "",
  observations: "",
  ancienEcole: "",
  niveauPrecedant: "",
  niveauActuel: "",
  serie: "",
  langV2: "",
  affectation: "non_affecte",
  regime: "non_boursier",
  typePaiement: "total",
  fraisOptionnels: [],
  decision: "",
  nomParent: "",
  prenomsParent: "",
  phoneParent: "",
  lienParent: "PERE",
  jobParent: "",
};

type Errors = Partial<Record<keyof Form, string>>;

/** Un frais de l'année, avec ce qu'en dit son détail */
type FraisNiveau = Frais & { required: boolean; tranchable: boolean };

/** Redoublant : déterminé automatiquement, l'élève reprend le même niveau */
const isRedoublant = (f: Form) => !!f.niveauPrecedant && f.niveauPrecedant === f.niveauActuel;

/** Contrôle d'une étape. Obligatoires (comme sur le site) : type, nom, prénoms, niveau actuel, régime */
function validate(
  step: Step,
  f: Form,
  needs: { lv2: boolean; serie: boolean },
  rankOf: (niveauKey: string) => number,
): Errors {
  const e: Errors = {};
  const scolarite = () => {
    if (!f.niveauActuel) e.niveauActuel = "Choisissez le niveau actuel";
    else if (f.niveauPrecedant && f.niveauPrecedant !== f.niveauActuel) {
      // Niveaux reconnus seulement (rang 99 : nom inconnu, pas de contrôle)
      const avant = rankOf(f.niveauPrecedant);
      const maintenant = rankOf(f.niveauActuel);
      if (avant < 99 && maintenant < 99 && maintenant < avant)
        e.niveauActuel = "Le niveau actuel ne peut pas être inférieur au niveau précédent : vérifiez votre choix";
    }
    if (needs.serie && !f.serie) e.serie = "Choisissez la série";
    if (!f.regime) e.regime = "Choisissez le régime";
  };
  if (f.type === REINSCRIPTION) {
    if (!f.eleve) e.eleve = "Choisissez l'élève à réinscrire";
    scolarite();
    return e;
  }
  if (step === 0) {
    if (!f.name.trim()) e.name = "Le nom est obligatoire";
    if (!f.firstname.trim()) e.firstname = "Les prénoms sont obligatoires";
    if (f.phone.trim() && !isPhone(f.phone)) e.phone = PHONE_ERROR;
    scolarite();
  }
  if (step === 1) {
    if (f.phoneParent.trim() && !isPhone(f.phoneParent)) e.phoneParent = PHONE_ERROR;
  }
  return e;
}

/** Saisie → corps de POST /inscriptions (mêmes clés et valeurs que le site ; vide = "") */
function toInput(f: Form, needs: { lv2: boolean; serie: boolean }): InscriptionInput {
  const reins = f.type === REINSCRIPTION;
  // Réinscription : l'identité et le parent sont déjà connus du serveur
  const id = (s: string) => (reins ? "" : s.trim());
  return {
    type_ins: f.type,
    eleve: reins ? f.eleve : "",
    name: id(f.name),
    firstname: id(f.firstname),
    birth_day: !reins && f.birthDay ? toISO(f.birthDay) : "",
    birth_of: id(f.birthOf),
    gender: id(f.gender),
    nationality: id(f.nationality),
    national_mat: id(f.nationalMat),
    numero_extrait: id(f.numeroExtrait),
    photo: null, // la photo choisie part à part, en fichier (multipart)
    residence: id(f.residence),
    city: id(f.city),
    phone: id(f.phone),
    groupe_sang: id(f.groupeSang),
    observat_medic: id(f.observations),
    ancien_ecole: id(f.ancienEcole),
    nom_parent: id(f.nomParent),
    prenoms_parent: id(f.prenomsParent),
    phone_parent: id(f.phoneParent),
    lien_parent: reins ? "" : f.lienParent,
    job_parent: id(f.jobParent),
    niveau_precedant: f.niveauPrecedant,
    niveau_actuel: f.niveauActuel,
    // Série au lycée, LV2 à partir de la Quatrième (rien n'est envoyé sinon, même choisi avant)
    serie: needs.serie ? f.serie : "",
    affectation: f.affectation,
    regime_eleve: f.regime,
    type_paiement: f.typePaiement,
    lang_v1: "",
    lang_v2: needs.lv2 ? f.langV2 : "",
    redoublant: isRedoublant(f),
    decision_finale: f.decision.trim(),
    sortie_le: "",
    motif_sort: "",
    frais_optionnels: f.fraisOptionnels,
  };
}

const money = (n: number) => `${n.toLocaleString("fr-FR")} F CFA`;

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
  // Photo facultative, envoyée avec l'inscription
  const [photo, setPhoto] = useState<PhotoFile | null>(null);

  // Listes de la base, chargées à l'ouverture
  const [allNiveaux, setAllNiveaux] = useState<Niveau[] | null>(null);
  // Catégorie de l'établissement du compte (prescolaire, primaire, college, lycee, tous) : "" si inconnue
  const [catego, setCatego] = useState("");
  const [series, setSeries] = useState<Option[] | null>(null);
  const [eleves, setEleves] = useState<Eleve[] | null>(null);
  const [frais, setFrais] = useState<Frais[] | null>(null);
  const [anneeName, setAnneeName] = useState("");
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const fail = (what: string) => {
      if (active) setFailed((f) => [...f, what]);
    };
    getNiveaux()
      .then((all) => active && setAllNiveaux(all))
      .catch(() => {
        setAllNiveaux([]);
        fail("niveaux");
      });
    // Catégorie : dans le détail de l'établissement du compte (le profil ne la donne pas)
    getMe()
      .then((me) => (me.etablissement?.public_key ? getEtablissement(me.etablissement.public_key) : null))
      .then((etab) => {
        if (active && etab) setCatego(etab.catego);
      })
      .catch(() => {}); // sans catégorie : tous les niveaux
    getSeries()
      .then(
        (all) =>
          active &&
          setSeries(
            all.map((s) => ({
              value: s.public_key,
              label: s.code ? `${s.libelle} (${s.code})` : s.libelle,
            })),
          ),
      )
      .catch(() => {
        setSeries([]);
        fail("séries");
      });
    getAllEleves()
      .then((all) => active && setEleves(all))
      .catch(() => {
        setEleves([]);
        fail("élèves");
      });
    getFrais()
      .then((all) => active && setFrais(all))
      .catch(() => setFrais([])); // sans les frais : paiement total, sans frais optionnels
    // Les frais proposés sont ceux de l'année en cours
    getAllAnnees()
      .then((all) => {
        const current = all.find((a) => anneeStatus(a) === "active");
        if (active && current) setAnneeName(current.name);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  /** Met à jour un champ et efface son erreur */
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const reinscription = form.type === REINSCRIPTION;
  const steps = reinscription ? STEPS_REINSCRIPTION : STEPS;

  // Niveaux proposés selon la catégorie de l'établissement, dans l'ordre de la scolarité
  const choix = allNiveaux ? niveauxPourCategorie(allNiveaux, catego) : null;
  const toOptions = (list: Niveau[]): Option[] => list.map((n) => ({ value: n.public_key, label: n.name }));
  const niveaux = choix ? toOptions(choix.actuel) : null;
  const niveauxPrecedents = choix ? toOptions(choix.precedent) : null;
  const niveauxHint = choix?.stage ? `Niveaux ${STAGE_LABELS[choix.stage]}, selon la catégorie de l'établissement` : "";
  const rankOfKey = (key: string) => niveauRank(allNiveaux?.find((n) => n.public_key === key)?.name ?? "");

  // Série et LV2 selon le niveau actuel
  const niveauName = allNiveaux?.find((n) => n.public_key === form.niveauActuel)?.name ?? "";
  const needs = fieldsFor(niveauName);

  /* Frais du niveau choisi : leur détail dit s'ils sont obligatoires et fractionnables */
  const details = useRef(new Map<string, { required: boolean; tranchable: boolean }>());
  const [fraisNiveau, setFraisNiveau] = useState<FraisNiveau[] | null>(null);

  useEffect(() => {
    if (!form.niveauActuel || !frais) {
      setFraisNiveau(null);
      return;
    }
    let active = true;
    const n = normalize(niveauName);
    const a = normalize(anneeName);
    // Frais du niveau ou de « tous les niveaux » (sans niveau), de l'année en cours si on la connaît
    const list = frais.filter((f) => {
      const fn = normalize(f.niveau_name);
      const sameNiveau = !fn || fn === n || fn.includes("tous");
      const sameAnnee = !a || !f.annee_name || normalize(f.annee_name) === a;
      return sameNiveau && sameAnnee;
    });
    setFraisNiveau(null);
    Promise.allSettled(
      list.map(async (f) => {
        let d = details.current.get(f.public_key);
        if (!d) {
          const full = await getFraisDetail(f.public_key);
          d = { required: full.is_required, tranchable: full.tranchable };
          details.current.set(f.public_key, d);
        }
        return { ...f, ...d };
      }),
    ).then((results) => {
      if (!active) return;
      const ok = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      setFraisNiveau(ok);
      // Les choix qui ne concernent plus ce niveau sont retirés
      setForm((f) => {
        const optional = new Set(ok.filter((x) => !x.required).map((x) => x.public_key));
        const fractionnable = ok.some((x) => x.required && x.tranchable);
        return {
          ...f,
          fraisOptionnels: f.fraisOptionnels.filter((k) => optional.has(k)),
          typePaiement: fractionnable ? f.typePaiement : "total",
        };
      });
    });
    return () => {
      active = false;
    };
  }, [form.niveauActuel, frais, niveauName, anneeName]);

  const fractionnable = !!fraisNiveau?.some((x) => x.required && x.tranchable);
  const optionnels = (fraisNiveau ?? []).filter((x) => !x.required);

  const toggleFrais = (key: string) =>
    set(
      "fraisOptionnels",
      form.fraisOptionnels.includes(key)
        ? form.fraisOptionnels.filter((k) => k !== key)
        : [...form.fraisOptionnels, key],
    );

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
    const e = validate(step, form, needs, rankOfKey);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      showToast("Veuillez corriger les champs en rouge.", "error");
      return;
    }
    goTo((step + 1) as Step);
  };

  // Noms affichés dans la liste (mode fictif seulement)
  const display = () => {
    const eleve = eleves?.find((e) => e.public_key === form.eleve);
    return {
      eleve_name: reinscription
        ? eleve
          ? `${eleve.nom} ${eleve.prenoms}`.trim()
          : ""
        : `${form.name.trim()} ${form.firstname.trim()}`.trim(),
      matricule: reinscription ? (eleve?.matricule ?? "") : form.nationalMat.trim(),
      classe_name: "",
      niveau_name: niveauName,
      annee_name: anneeName,
    };
  };

  const submit = async () => {
    if (saving) return;
    // Tout est contrôlé : on ouvre la première étape qui a une erreur
    for (const s of steps.map((_, i) => i as Step)) {
      const e = validate(s, form, needs, rankOfKey);
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
      const message = await createInscription(toInput(form, needs), display(), reinscription ? null : photo);
      markInscriptionsStale(); // la liste des inscriptions se recharge au retour
      showToast(message);
      router.back();
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
      setSaving(false);
    }
  };

  const listError = (what: string) =>
    failed.includes(what) ? `Impossible de charger les ${what}.` : undefined;
  const last = step === steps.length - 1;
  const redoublant = isRedoublant(form);

  /* La scolarité : sur l'étape Identité (nouvelle) ou l'écran de réinscription */
  const scolarite = (
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
          placeholder={niveauxPrecedents ? "Sélectionner le niveau précédent" : "Chargement…"}
          value={form.niveauPrecedant}
          options={niveauxPrecedents ?? []}
          searchable
          onChange={(v) => set("niveauPrecedant", v)}
        />
        <Select
          label="Niveau actuel *"
          icon="layers-outline"
          placeholder={niveaux ? "Sélectionner le niveau actuel" : "Chargement…"}
          value={form.niveauActuel}
          options={niveaux ?? []}
          searchable
          onChange={(v) => set("niveauActuel", v)}
          error={errors.niveauActuel ?? listError("niveaux")}
        />
        {!!niveauxHint && (
          <Text className="-mt-2 font-inter text-xs text-muted">{niveauxHint}</Text>
        )}
        {needs.serie && (
          <Select
            label="Série *"
            icon="git-branch-outline"
            placeholder={series ? "Sélectionner la série" : "Chargement…"}
            value={form.serie}
            options={series ?? []}
            searchable
            onChange={(v) => set("serie", v)}
            error={errors.serie ?? listError("séries")}
          />
        )}
        {needs.lv2 && (
          <Select
            label="Langue vivante 2"
            icon="language-outline"
            placeholder="Sélectionner la LV2"
            value={form.langV2}
            options={LANGUES_V2}
            onChange={(v) => set("langV2", v)}
          />
        )}

        {/* Redoublant : déterminé automatiquement (même niveau que l'an passé) */}
        <View
          accessibilityRole="checkbox"
          accessibilityState={{ checked: redoublant, disabled: true }}
          className="flex-row items-center gap-3 rounded-2xl bg-soft px-4 py-3"
        >
          <Ionicons
            name={redoublant ? "checkbox" : "square-outline"}
            size={22}
            color={redoublant ? "#2B5EA8" : "#9AA7B8"}
          />
          <View className="flex-1">
            <Text className="font-inter-semibold text-[14px] text-ink">Redoublant</Text>
            <Text className="font-inter text-xs text-muted">
              Déterminé automatiquement : même niveau précédent et actuel
            </Text>
          </View>
        </View>
      </Section>

      <Section title="Statut et paiement">
        <Segmented
          label="Affectation"
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
        <Select
          label="Mode de paiement"
          icon="card-outline"
          value={form.typePaiement}
          options={TYPES_PAIEMENT}
          disabled={!fractionnable}
          onChange={(v) => set("typePaiement", v)}
        />
        {!fractionnable && (
          <Text className="-mt-3 mb-4 font-inter text-xs text-muted">
            {!form.niveauActuel
              ? "Choisissez le niveau actuel pour connaître les modes de paiement."
              : form.niveauActuel && !fraisNiveau
                ? "Vérification des frais du niveau…"
                : "Aucun frais obligatoire fractionnable — paiement en total uniquement."}
          </Text>
        )}

        {/* Frais facultatifs du niveau (cantine, transport…) */}
        {optionnels.length > 0 && (
          <View className="mb-4 gap-2">
            <Text className="font-inter-semibold text-[15px] text-ink">Frais optionnels</Text>
            {optionnels.map((f) => {
              const checked = form.fraisOptionnels.includes(f.public_key);
              return (
                <Pressable
                  key={f.public_key}
                  onPress={() => toggleFrais(f.public_key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 active:opacity-80 ${checked ? "border-primary bg-soft" : "border-line bg-white"}`}
                >
                  <Ionicons
                    name={checked ? "checkbox" : "square-outline"}
                    size={22}
                    color={checked ? "#2B5EA8" : "#9AA7B8"}
                  />
                  <Text className="flex-1 font-inter-semibold text-[14px] text-ink">{f.name}</Text>
                  <Text className="font-inter text-[13px] text-muted">{money(f.montant_frais)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Input
          label="Décision fin d'année"
          icon="ribbon-outline"
          placeholder="Ex. Admis en classe supérieure"
          value={form.decision}
          onChangeText={(t) => set("decision", t)}
        />
      </Section>
    </>
  );

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
        )}
      </FixedHeader>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
                    label="Type d'inscription *"
                    value={form.type}
                    options={TYPES_INSCRIPTION}
                    onChange={changeType}
                  />
                  {reinscription && (
                    <Select
                      label="Élève *"
                      icon="person-outline"
                      placeholder={eleves ? "Sélectionner un élève" : "Chargement des élèves…"}
                      value={form.eleve}
                      options={(eleves ?? []).map((e) => ({ value: e.public_key, label: eleveLabel(e) }))}
                      searchable
                      onChange={(v) => set("eleve", v)}
                      error={errors.eleve ?? listError("élèves")}
                    />
                  )}
                </Section>

                {/* Nouvelle inscription seulement : l'élève réinscrit est déjà connu */}
                {!reinscription && (
                  <>
                    <Section title="Identité">
                      <PhotoPicker label="Photo de l'élève" value={photo} onChange={setPhoto} />
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
                        defaultValue={new Date(new Date().getFullYear() - 10, 0, 1)}
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
                        options={NATIONALITES.map((n) => ({ value: n, label: n }))}
                        searchable
                        onChange={(v) => set("nationality", v)}
                      />
                      <Input
                        label="Matricule national"
                        icon="barcode-outline"
                        placeholder="Ex. 07055027R"
                        value={form.nationalMat}
                        onChangeText={(t) => set("nationalMat", t.toUpperCase())}
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
                        value={form.residence}
                        onChangeText={(t) => set("residence", t)}
                      />
                      <Input
                        label="Quartier"
                        icon="home-outline"
                        placeholder="Ex. Angré"
                        value={form.city}
                        onChangeText={(t) => set("city", t)}
                      />
                      <Input
                        label="Téléphone"
                        icon="call-outline"
                        {...PHONE_INPUT}
                        value={form.phone}
                        onChangeText={(t) => set("phone", toPhone(t))}
                        error={errors.phone}
                      />
                      <Select
                        label="Groupe sanguin"
                        icon="water-outline"
                        placeholder="Groupe sanguin"
                        value={form.groupeSang}
                        options={GROUPES_SANGUINS.map((g) => ({ value: g, label: g }))}
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

                {scolarite}
              </>
            )}

            {step === 1 && (
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
                  {...PHONE_INPUT}
                  value={form.phoneParent}
                  onChangeText={(t) => set("phoneParent", toPhone(t))}
                  error={errors.phoneParent}
                />
                <Select
                  label="Lien de parenté"
                  icon="git-merge-outline"
                  value={form.lienParent}
                  options={LIENS_PARENT}
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
                <Text className="font-inter-semibold text-base text-primary">Précédent</Text>
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
                  {last && <Ionicons name="save-outline" size={18} color="#FFFFFF" />}
                  <Text className="font-inter-semibold text-base text-white">{last ? "Créer" : "Suivant"}</Text>
                  {!last && <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />}
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
            <Text className="font-inter-semibold text-[14px] text-muted">Annuler</Text>
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
      <Text className="mb-4 font-inter-bold text-[12px] uppercase tracking-wider text-primary">{title}</Text>
      {children}
    </View>
  );
}
