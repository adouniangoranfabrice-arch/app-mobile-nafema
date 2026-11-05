import Button from "@/components/ui/Button";
import FixedHeader from "@/components/ui/FixedHeader";
import Select from "@/components/ui/Select";
import { useStudents } from "@/context/StudentsContext";
import { fullName } from "@/data/students";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Un formulaire de l'espace enseignant : titre fixe, champs, bouton d'envoi */
export default function PedagogyForm({
  title,
  submitLabel,
  onSubmit,
  children,
}: {
  title: string;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const router = useRouter();

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
            {title}
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] self-center px-5">
          {children}
          <Button title={submitLabel} onPress={onSubmit} />
        </View>
      </ScrollView>
    </View>
  );
}

/** Choix d'une classe de l'enseignant, puis d'un élève de cette classe */
export function ClassStudentFields({
  student,
  onStudentChange,
  error,
}: {
  student: string;
  onStudentChange: (id: string) => void;
  error?: string;
}) {
  const classes = useTeacherClasses();
  const { students } = useStudents();
  const [classe, setClasse] = useState("");

  return (
    <>
      <Select
        label="Classe *"
        icon="people-outline"
        placeholder="Sélectionner une classe"
        value={classe}
        options={classes.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(v) => {
          setClasse(v);
          onStudentChange(""); // l'élève choisi n'est peut-être pas dans cette classe
        }}
      />

      <Select
        label="Élève *"
        icon="person-outline"
        placeholder={
          classe ? "Sélectionner un élève" : "Choisis d'abord une classe"
        }
        value={student}
        options={students
          .filter((s) => s.classe_id === classe)
          .map((s) => ({ value: s.id, label: fullName(s) }))}
        onChange={onStudentChange}
        error={error}
      />
    </>
  );
}
