import FilterChips from "@/components/ui/FilterChips";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { useStudents } from "@/context/StudentsContext";
import { ABSENCES } from "@/data/absences";
import { fullName } from "@/data/students";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { formatDate } from "@/utils/dates";
import { initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Absences() {
  const router = useRouter();
  const { students } = useStudents();
  const classes = useTeacherClasses();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [requestedPage, setRequestedPage] = useState(1);

  // Chaque absence avec son élève et sa classe : un élève supprimé n'apparaît plus
  const absences = ABSENCES.flatMap((a) => {
    const student = students.find((s) => s.id === a.student_id);
    if (!student) return [];
    const classe = classes.find((c) => c.id === student.classe_id);
    return [
      {
        ...a,
        name: fullName(student),
        initials: initials(`${student.firstNames} ${student.lastName}`),
        classe: classe?.name ?? "Sans classe",
      },
    ];
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  const listRef = useRef<FlatList<(typeof absences)[number]>>(null);

  const justifiedCount = absences.filter((a) => a.justified).length;

  // Recherche par élève, classe, matière ou motif (sans tenir compte des accents)
  const q = normalize(query);
  const visible = absences.filter((a) => {
    if (filter === "justified" && !a.justified) return false;
    if (filter === "unjustified" && a.justified) return false;
    if (!q) return true;
    return normalize(`${a.name} ${a.classe} ${a.matiere} ${a.motif}`).includes(
      q,
    );
  });

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount); // la liste a pu raccourcir
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chaque page s'ouvre en haut de la liste
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

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
              Absences
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {absences.length} absence{plural(absences.length)} ·{" "}
              {absences.length - justifiedCount} non justifiée
              {plural(absences.length - justifiedCount)}
            </Text>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder="Rechercher un élève, une classe"
        />

        <FilterChips
          selected={filter}
          onSelect={(key) => {
            setFilter(key);
            setRequestedPage(1);
          }}
          chips={[
            { key: "all", label: "Toutes", count: absences.length },
            { key: "justified", label: "Justifiées", count: justifiedCount },
            {
              key: "unjustified",
              label: "Non justifiées",
              count: absences.length - justifiedCount,
            },
          ]}
        />
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-3">
            <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-soft">
                <Text className="font-inter-bold text-[14px] text-primary">
                  {item.initials}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[15px] text-ink"
                >
                  {item.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter-semibold text-xs text-primary"
                >
                  {item.classe} · {item.matiere}
                </Text>
                <Text className="mt-0.5 font-inter text-xs text-muted">
                  {formatDate(item.date)} · {item.debut} – {item.fin}
                </Text>
                {!!item.motif && (
                  <Text
                    numberOfLines={2}
                    className="mt-0.5 font-inter text-xs text-muted"
                  >
                    Motif : {item.motif}
                  </Text>
                )}
              </View>
              <View
                className={`rounded-full px-3 py-1 ${item.justified ? "bg-green-100" : "bg-[#FFF1A8]"}`}
              >
                <Text
                  className={`font-inter-semibold text-xs ${item.justified ? "text-green-700" : "text-[#7A5F00]"}`}
                >
                  {item.justified ? "Justifiée" : "Non justifiée"}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                Aucune absence trouvée.
              </Text>
            </View>
          </View>
        }
      />

      <PageBar
        page={page}
        pageCount={pageCount}
        hasPrevious={page > 1}
        hasNext={page < pageCount}
        onPrevious={() => setRequestedPage(page - 1)}
        onNext={() => setRequestedPage(page + 1)}
      />
    </View>
  );
}
