import Button from "@/components/ui/Button";
import DateField from "@/components/ui/DateField";
import FixedHeader from "@/components/ui/FixedHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showFormError, showToast } from "@/components/ui/Toast";
import { useEvaluations } from "@/context/EvaluationsContext";
import { EVALUATION_TYPES } from "@/data/evaluations";
import { useGestion } from "@/hooks/use-gestion";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Errors = Partial<
  Record<
    "classe" | "matiere" | "titre" | "date" | "bareme" | "coefficient",
    string
  >
>;

const isPositiveInteger = (text: string) => /^[1-9]\d*$/.test(text.trim());

export default function NouvelleEvaluation() {
  const router = useRouter();
  const { href } = useGestion();
  const { addEvaluation } = useEvaluations();
  const { records } = useOrganisation();
  const classes = useTeacherClasses();

  const [classe, setClasse] = useState("");
  const [matiere, setMatiere] = useState("");
  const [type, setType] = useState(EVALUATION_TYPES[0]);
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [bareme, setBareme] = useState("20");
  const [coefficient, setCoefficient] = useState("1");
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const submit = () => {
    const next: Errors = {};

    if (!classe) next.classe = "Choisis une classe";
    if (!matiere) next.matiere = "Choisis une matière";
    if (!titre.trim()) next.titre = "Le titre est obligatoire";
    if (!date) next.date = "Choisis la date";
    if (!isPositiveInteger(bareme))
      next.bareme = "La note maximale doit être un entier supérieur à 0";
    if (!isPositiveInteger(coefficient))
      next.coefficient = "Le coefficient doit être un entier supérieur à 0";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      showFormError();
      return;
    }

    addEvaluation({
      titre: titre.trim(),
      classe_id: classe,
      matiere,
      type,
      date: date!,
      bareme: Number(bareme),
      coefficient: Number(coefficient),
    });
    showToast("Évaluation créée avec succès.");
    router.replace(href("evaluations"));
  };

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
          <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
            Nouvelle évaluation
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] self-center px-5">
          <Select
            label="Classe *"
            icon="people-outline"
            placeholder="Sélectionner une classe"
            value={classe}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setClasse(v);
              clear("classe");
            }}
            error={errors.classe}
          />

          <Select
            label="Matière *"
            icon="book-outline"
            placeholder="Sélectionner une matière"
            value={matiere}
            options={records("matieres").map((m) => ({
              value: String(m.name),
              label: String(m.name),
            }))}
            searchable
            onChange={(v) => {
              setMatiere(v);
              clear("matiere");
            }}
            error={errors.matiere}
          />

          <Select
            label="Type *"
            icon="layers-outline"
            value={type}
            options={EVALUATION_TYPES.map((t) => ({ value: t, label: t }))}
            onChange={setType}
          />

          <Input
            label="Titre *"
            icon="text-outline"
            placeholder="Ex. Fractions et proportions"
            value={titre}
            onChangeText={(t) => {
              setTitre(t);
              clear("titre");
            }}
            error={errors.titre}
          />

          <DateField
            label="Date *"
            value={date}
            onChange={(d) => {
              setDate(d);
              clear("date");
            }}
            error={errors.date}
          />

          <Input
            label="Note maximale *"
            icon="ribbon-outline"
            placeholder="Ex. 20"
            value={bareme}
            onChangeText={(t) => {
              setBareme(t);
              clear("bareme");
            }}
            keyboardType="number-pad"
            error={errors.bareme}
          />

          <Input
            label="Coefficient *"
            icon="calculator-outline"
            placeholder="Ex. 2"
            value={coefficient}
            onChangeText={(t) => {
              setCoefficient(t);
              clear("coefficient");
            }}
            keyboardType="number-pad"
            error={errors.coefficient}
          />

          <Button title="Créer l'évaluation" onPress={submit} />
        </View>
      </ScrollView>
    </View>
  );
}
