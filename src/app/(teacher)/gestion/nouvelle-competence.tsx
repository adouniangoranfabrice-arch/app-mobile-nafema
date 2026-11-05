import Button from "@/components/ui/Button";
import FixedHeader from "@/components/ui/FixedHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showFormError, showToast } from "@/components/ui/Toast";
import { useCompetences } from "@/context/CompetencesContext";
import { useGestion } from "@/hooks/use-gestion";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Errors = Partial<Record<"matiere" | "code" | "intitule", string>>;

export default function NouvelleCompetence() {
  const router = useRouter();
  const { href } = useGestion();
  const { addCompetence } = useCompetences();
  const { records } = useOrganisation();

  const [matiere, setMatiere] = useState("");
  const [code, setCode] = useState("");
  const [intitule, setIntitule] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const submit = () => {
    const next: Errors = {};

    if (!matiere) next.matiere = "Choisis une matière";
    if (!code.trim()) next.code = "Le code est obligatoire";
    if (!intitule.trim()) next.intitule = "L'intitulé est obligatoire";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      showFormError();
      return;
    }

    addCompetence({
      matiere,
      code: code.trim(),
      intitule: intitule.trim(),
      description: description.trim(),
    });
    showToast("Compétence créée avec succès.");
    router.replace(href("competences"));
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
            Nouvelle compétence
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

          <Input
            label="Code *"
            icon="barcode-outline"
            placeholder="Ex. MATH-CALC"
            value={code}
            onChangeText={(t) => {
              setCode(t.toUpperCase());
              clear("code");
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.code}
          />

          <Input
            label="Intitulé *"
            icon="text-outline"
            placeholder="Ex. Calculer avec des fractions"
            value={intitule}
            onChangeText={(t) => {
              setIntitule(t);
              clear("intitule");
            }}
            error={errors.intitule}
          />

          <Input
            label="Description"
            icon="document-text-outline"
            placeholder="Facultatif"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Button title="Créer la compétence" onPress={submit} />
        </View>
      </ScrollView>
    </View>
  );
}
