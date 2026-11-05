import { Stagger } from "@/components/ui/MotionView";
import SearchBar from "@/components/ui/SearchBar";
import { useStudents } from "@/context/StudentsContext";
import { fullName } from "@/data/students";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const plural = (n: number) => (n > 1 ? "s" : "");

export default function ElevesDeLaClasse() {
  const { classe } = useLocalSearchParams<{ classe: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { records, refLabel } = useOrganisation();
  const { students } = useStudents();
  const [query, setQuery] = useState("");

  const current = records("classes").find((c) => c.id === classe);
  const inClass = students
    .filter((s) => s.classe_id === classe)
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName, "fr") ||
        a.firstNames.localeCompare(b.firstNames, "fr"),
    );

  const q = normalize(query);
  const visible = inClass.filter(
    (s) =>
      !q ||
      normalize(`${s.lastName} ${s.firstNames} ${s.matricule}`).includes(q),
  );

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* En-tête avec retour */}
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
                {current ? String(current.libelle) : "Classe introuvable"}
              </Text>
              {current && (
                <Text
                  numberOfLines={1}
                  className="font-inter text-[13px] text-muted"
                >
                  {inClass.length} élève{plural(inClass.length)}
                  {current.effectif_max !== ""
                    ? ` sur ${String(current.effectif_max)} places`
                    : ""}{" "}
                  · {refLabel("niveaux", String(current.niveau))}
                </Text>
              )}
            </View>
          </View>

          {inClass.length > 0 && (
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un élève ou un matricule"
            />
          )}

          {visible.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="people-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                {inClass.length === 0
                  ? "Aucun élève dans cette classe"
                  : "Aucun élève trouvé"}
              </Text>
            </View>
          ) : (
            <Stagger>
              {visible.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(teacher)/classes/eleve-detail",
                      params: { id: s.id },
                    } as Href)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={fullName(s)}
                  className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm active:opacity-80"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-soft">
                    <Text className="font-inter-bold text-[15px] text-primary">
                      {initials(`${s.firstNames} ${s.lastName}`)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-inter-bold text-[16px] text-ink"
                    >
                      {fullName(s)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-inter text-xs text-muted"
                    >
                      {s.matricule || "Sans matricule"} · {s.sex}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${s.active ? "bg-green-100" : "bg-slate-100"}`}
                  >
                    <Text
                      className={`font-inter-semibold text-xs ${s.active ? "text-green-700" : "text-muted"}`}
                    >
                      {s.active ? "Actif" : "Inactif"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Stagger>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
