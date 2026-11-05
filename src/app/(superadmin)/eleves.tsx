import FilterChips from "@/components/ui/FilterChips";
import SearchBar from "@/components/ui/SearchBar";
import { fmt, initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Student = {
  id: string;
  name: string;
  classe: string;
  school: string;
  average: number;
  attendance: number;
};

/* ---------- Données fictives (à remplacer par ton API) ---------- */

const TOTAL_STUDENTS = 8420;
const ACTIVE_SCHOOLS = 45;
const PLATFORM_AVERAGE = "12,9/20";
const PLATFORM_ATTENDANCE = "96 %";

const STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Amadou Diallo",
    classe: "3e A",
    school: "Collège des Almadies",
    average: 15.2,
    attendance: 98,
  },
  {
    id: "s2",
    name: "Fatou Diallo",
    classe: "6e B",
    school: "Collège des Almadies",
    average: 13.8,
    attendance: 97,
  },
  {
    id: "s3",
    name: "Aïssatou Ba",
    classe: "4e A",
    school: "Lycée Excellence",
    average: 16.4,
    attendance: 99,
  },
  {
    id: "s4",
    name: "Mamadou Sow",
    classe: "5e C",
    school: "Collège Teranga",
    average: 11.6,
    attendance: 94,
  },
  {
    id: "s5",
    name: "Khadija Ndiaye",
    classe: "3e B",
    school: "Lycée Kajoor",
    average: 14.9,
    attendance: 96,
  },
  {
    id: "s6",
    name: "Ibrahima Fall",
    classe: "6e A",
    school: "École Les Mouettes",
    average: 9.8,
    attendance: 91,
  },
  {
    id: "s7",
    name: "Awa Sarr",
    classe: "4e B",
    school: "Groupe scolaire Bakel",
    average: 12.7,
    attendance: 95,
  },
  {
    id: "s8",
    name: "Moussa Diop",
    classe: "3e A",
    school: "Collège Fouta",
    average: 10.4,
    attendance: 93,
  },
  {
    id: "s9",
    name: "Coumba Seck",
    classe: "5e A",
    school: "Collège des Almadies",
    average: 17.1,
    attendance: 100,
  },
  {
    id: "s10",
    name: "Cheikh Thiam",
    classe: "4e C",
    school: "Collège Teranga",
    average: 13.2,
    attendance: 97,
  },
  {
    id: "s11",
    name: "Ndèye Faye",
    classe: "6e C",
    school: "Lycée Kajoor",
    average: 15.8,
    attendance: 98,
  },
  {
    id: "s12",
    name: "Abdoulaye Kane",
    classe: "3e C",
    school: "Lycée Excellence",
    average: 8.9,
    attendance: 89,
  },
  {
    id: "s13",
    name: "Mame Diarra Gueye",
    classe: "5e B",
    school: "Collège Fouta",
    average: 12.1,
    attendance: 96,
  },
  {
    id: "s14",
    name: "Seydou Camara",
    classe: "4e A",
    school: "Groupe scolaire Bakel",
    average: 14.4,
    attendance: 95,
  },
];

const LEVELS = ["6e", "5e", "4e", "3e"];

const levelOf = (s: Student) => s.classe.split(" ")[0];
const formatAverage = (n: number) => `${n.toFixed(1).replace(".", ",")}/20`;

const averageStyle = (n: number) =>
  n >= 14
    ? { badge: "bg-green-100", text: "text-green-700" }
    : n >= 10
      ? { badge: "bg-soft", text: "text-primary" }
      : { badge: "bg-[#FFF1A8]", text: "text-[#7A5F00]" };

/* ---------- Écran ---------- */

export default function Eleves() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("all");

  const filtered = useMemo(() => {
    const q = normalize(query);
    return STUDENTS.filter((s) => {
      const matchesLevel = level === "all" || levelOf(s) === level;
      const matchesQuery =
        !q ||
        normalize(s.name).includes(q) ||
        normalize(s.school).includes(q) ||
        normalize(s.classe).includes(q);
      return matchesLevel && matchesQuery;
    });
  }, [query, level]);

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
          {/* Titre + export */}
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-bold text-[28px] leading-9 text-ink">
                Élèves
              </Text>
              <Text className="mt-1 font-inter text-[13px] text-muted">
                Toutes les écoles de la plateforme
              </Text>
            </View>
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80">
              <Ionicons name="download-outline" size={20} color="#2B5EA8" />
            </Pressable>
          </View>

          {/* Carte résumé */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="school-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-[22px] text-white">
                  {fmt(TOTAL_STUDENTS)} élèves
                </Text>
                <Text className="font-inter text-[13px] text-white/70">
                  Inscrits dans {ACTIVE_SCHOOLS} établissements actifs
                </Text>
              </View>
            </View>

            <View className="my-4 h-px bg-white/20" />

            <View className="flex-row items-end justify-between gap-4">
              <View>
                <Text className="font-inter-bold text-[28px] leading-9 text-white">
                  {PLATFORM_AVERAGE}
                </Text>
                <Text className="font-inter text-[13px] text-white/70">
                  Moyenne générale
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-inter-bold text-[22px] text-accent">
                  {PLATFORM_ATTENDANCE}
                </Text>
                <Text className="font-inter text-[13px] text-white/70">
                  Présence moyenne
                </Text>
              </View>
            </View>
          </View>

          {/* Recherche + filtres par niveau */}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un élève, une classe, une école"
          />
          <FilterChips
            selected={level}
            onSelect={setLevel}
            chips={[
              { key: "all", label: "Tous", count: STUDENTS.length },
              ...LEVELS.map((l) => ({
                key: l,
                label: l,
                count: STUDENTS.filter((s) => levelOf(s) === l).length,
              })),
            ]}
          />

          <Text className="font-inter text-xs text-muted">
            {filtered.length} élève{filtered.length > 1 ? "s" : ""}
          </Text>

          {/* Liste */}
          {filtered.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="search-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Aucun élève trouvé
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                Essaie un autre nom ou un autre niveau.
              </Text>
            </View>
          ) : (
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              {filtered.map((s, i) => {
                const style = averageStyle(s.average);
                return (
                  <Pressable
                    key={s.id}
                    className={`flex-row items-center gap-3 py-3.5 active:opacity-80 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-soft">
                      <Text className="font-inter-bold text-[14px] text-primary">
                        {initials(s.name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-inter-semibold text-[15px] text-ink"
                      >
                        {s.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="font-inter text-xs text-muted"
                      >
                        {s.classe} · {s.school}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <View className={`rounded-full px-3 py-1 ${style.badge}`}>
                        <Text
                          className={`font-inter-semibold text-[13px] ${style.text}`}
                        >
                          {formatAverage(s.average)}
                        </Text>
                      </View>
                      <Text className="font-inter text-[11px] text-muted">
                        Présence {s.attendance} %
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
