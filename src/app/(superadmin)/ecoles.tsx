import FilterChips from "@/components/ui/FilterChips";
import SearchBar from "@/components/ui/SearchBar";
import { fmt, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Status = "active" | "pending" | "suspended";

type School = {
  id: string;
  name: string;
  city: string;
  type: string;
  status: Status;
  students: number;
  teachers: number;
  classes: number;
  note?: string;
};

/* ---------- Données fictives (à remplacer par ton API) ---------- */

const INITIAL_SCHOOLS: School[] = [
  {
    id: "e1",
    name: "Collège des Almadies",
    city: "Dakar",
    type: "Établissement privé",
    status: "active",
    students: 486,
    teachers: 32,
    classes: 18,
  },
  {
    id: "e2",
    name: "Lycée Excellence",
    city: "Thiès",
    type: "Établissement privé",
    status: "active",
    students: 580,
    teachers: 48,
    classes: 22,
  },
  {
    id: "e3",
    name: "École Horizon",
    city: "Saint-Louis",
    type: "Établissement privé",
    status: "pending",
    students: 0,
    teachers: 0,
    classes: 0,
    note: "Dossier reçu le 6 oct.",
  },
  {
    id: "e4",
    name: "Groupe scolaire Les Baobabs",
    city: "Mbour",
    type: "Établissement privé",
    status: "pending",
    students: 0,
    teachers: 0,
    classes: 0,
    note: "Dossier reçu le 5 oct.",
  },
  {
    id: "e5",
    name: "Collège Teranga",
    city: "Rufisque",
    type: "Établissement public",
    status: "active",
    students: 612,
    teachers: 41,
    classes: 20,
  },
  {
    id: "e6",
    name: "Lycée Kajoor",
    city: "Louga",
    type: "Établissement public",
    status: "active",
    students: 704,
    teachers: 52,
    classes: 24,
  },
  {
    id: "e7",
    name: "École Les Mouettes",
    city: "Ziguinchor",
    type: "Établissement privé",
    status: "active",
    students: 238,
    teachers: 16,
    classes: 9,
  },
  {
    id: "e8",
    name: "Collège Sainte-Marie",
    city: "Kaolack",
    type: "Établissement privé",
    status: "suspended",
    students: 301,
    teachers: 21,
    classes: 12,
    note: "Accès suspendu depuis le 28 sept.",
  },
  {
    id: "e9",
    name: "Groupe scolaire Bakel",
    city: "Bakel",
    type: "Établissement public",
    status: "active",
    students: 355,
    teachers: 25,
    classes: 14,
  },
  {
    id: "e10",
    name: "Collège Fouta",
    city: "Matam",
    type: "Établissement public",
    status: "active",
    students: 410,
    teachers: 29,
    classes: 16,
  },
];

const STATUS = {
  active: { label: "Actif", badge: "bg-green-100", text: "text-green-700" },
  pending: {
    label: "À valider",
    badge: "bg-[#FFF1A8]",
    text: "text-[#7A5F00]",
  },
  suspended: { label: "Suspendu", badge: "bg-red-100", text: "text-red-700" },
} as const;

/* ---------- Écran ---------- */

export default function Ecoles() {
  const insets = useSafeAreaInsets();
  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");

  const countOf = (s: Status) => schools.filter((x) => x.status === s).length;

  const totalStudents = schools.reduce((sum, s) => sum + s.students, 0);
  const totalTeachers = schools.reduce((sum, s) => sum + s.teachers, 0);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return schools.filter((s) => {
      const matchesFilter = filter === "all" || s.status === filter;
      const matchesQuery =
        !q || normalize(s.name).includes(q) || normalize(s.city).includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [schools, query, filter]);

  const validate = (id: string) =>
    setSchools((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "active", note: undefined } : s,
      ),
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
          {/* Titre + bouton d'ajout */}
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-bold text-[28px] leading-9 text-ink">
                Établissements
              </Text>
              <Text className="mt-1 font-inter text-[13px] text-muted">
                Toutes les écoles de la plateforme
              </Text>
            </View>
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80">
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Résumé */}
          <View className="flex-row rounded-3xl bg-white py-4 shadow-sm">
            <Summary value={String(schools.length)} label="Écoles" />
            <Summary value={fmt(totalStudents)} label="Élèves" bordered />
            <Summary value={fmt(totalTeachers)} label="Enseignants" bordered />
          </View>

          {/* Recherche + filtres */}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une école ou une ville"
          />
          <FilterChips
            selected={filter}
            onSelect={(k) => setFilter(k as "all" | Status)}
            chips={[
              { key: "all", label: "Toutes", count: schools.length },
              { key: "active", label: "Actives", count: countOf("active") },
              { key: "pending", label: "À valider", count: countOf("pending") },
              {
                key: "suspended",
                label: "Suspendues",
                count: countOf("suspended"),
              },
            ]}
          />

          <Text className="font-inter text-xs text-muted">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </Text>

          {/* Liste */}
          {filtered.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="search-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Aucun établissement trouvé
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                Essaie un autre nom ou un autre filtre.
              </Text>
            </View>
          ) : (
            filtered.map((s) => {
              const st = STATUS[s.status];
              return (
                <Pressable
                  key={s.id}
                  className="gap-3 rounded-3xl bg-white p-4 shadow-sm active:opacity-90"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color="#2B5EA8"
                      />
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
                        {s.city} · {s.type}
                      </Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${st.badge}`}>
                      <Text
                        className={`font-inter-semibold text-xs ${st.text}`}
                      >
                        {st.label}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-line" />

                  {s.status === "pending" ? (
                    <View className="gap-3">
                      <Text className="font-inter text-[13px] text-[#7A5F00]">
                        {s.note}
                      </Text>
                      <Pressable
                        onPress={() => validate(s.id)}
                        className="h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
                      >
                        <Text className="font-inter-semibold text-[14px] text-white">
                          Valider le dossier
                        </Text>
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <View className="flex-row">
                        <Metric value={fmt(s.students)} label="Élèves" />
                        <Metric
                          value={String(s.teachers)}
                          label="Enseignants"
                        />
                        <Metric value={String(s.classes)} label="Classes" />
                      </View>
                      {s.note && (
                        <Text className="font-inter text-[13px] text-red-600">
                          {s.note}
                        </Text>
                      )}
                    </>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Petits composants ---------- */

function Summary({
  value,
  label,
  bordered,
}: {
  value: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center ${bordered ? "border-l border-line" : ""}`}
    >
      <Text className="font-inter-bold text-2xl text-primary">{value}</Text>
      <Text className="font-inter text-xs text-muted">{label}</Text>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1">
      <Text className="font-inter-semibold text-[15px] text-ink">{value}</Text>
      <Text className="font-inter text-[11px] text-muted">{label}</Text>
    </View>
  );
}
