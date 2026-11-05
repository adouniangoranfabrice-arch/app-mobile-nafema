import FilterChips from "@/components/ui/FilterChips";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { useEvaluations } from "@/context/EvaluationsContext";
import { useStudents } from "@/context/StudentsContext";
import { NOTES } from "@/data/notes";
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
const fmt = (n: number) => String(n).replace(".", ",");

export default function Notes() {
  const router = useRouter();
  const { evaluations } = useEvaluations();
  const { students } = useStudents();
  const classes = useTeacherClasses();

  const [query, setQuery] = useState("");
  const [classe, setClasse] = useState("all");
  const [requestedPage, setRequestedPage] = useState(1);

  // Chaque note avec son évaluation et son élève
  const notes = NOTES.flatMap((n) => {
    const evaluation = evaluations.find((e) => e.id === n.evaluation_id);
    const student = students.find((s) => s.id === n.student_id);
    if (!evaluation || !student) return [];
    return [
      {
        ...n,
        evaluation,
        name: fullName(student),
        initials: initials(`${student.firstNames} ${student.lastName}`),
        classe_id: evaluation.classe_id,
        classe:
          classes.find((c) => c.id === evaluation.classe_id)?.name ??
          "Classe introuvable",
      },
    ];
  }).sort(
    (a, b) =>
      b.evaluation.date.getTime() - a.evaluation.date.getTime() ||
      a.name.localeCompare(b.name, "fr"),
  );

  const listRef = useRef<FlatList<(typeof notes)[number]>>(null);

  // Recherche par élève ou évaluation (sans tenir compte des accents)
  const q = normalize(query);
  const visible = notes.filter(
    (n) =>
      (classe === "all" || n.classe_id === classe) &&
      (!q || normalize(`${n.name} ${n.evaluation.titre}`).includes(q)),
  );

  // Moyenne ramenée sur 20, car les barèmes diffèrent d'une évaluation à l'autre
  const average =
    visible.length > 0
      ? visible.reduce(
          (sum, n) => sum + (n.valeur / n.evaluation.bareme) * 20,
          0,
        ) / visible.length
      : null;

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
              Notes
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {visible.length} note{plural(visible.length)}
              {average !== null ? ` · Moyenne ${fmt(Number(average.toFixed(1)))} / 20` : ""}
            </Text>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder="Rechercher un élève, une évaluation"
        />

        <FilterChips
          selected={classe}
          onSelect={(key) => {
            setClasse(key);
            setRequestedPage(1);
          }}
          chips={[
            { key: "all", label: "Toutes", count: notes.length },
            ...classes.map((c) => ({
              key: c.id,
              label: c.name,
              count: notes.filter((n) => n.classe_id === c.id).length,
            })),
          ]}
        />
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(n) => n.id}
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
                  {item.classe} · {item.evaluation.titre}
                </Text>
                <Text className="mt-0.5 font-inter text-xs text-muted">
                  {item.evaluation.type} · {formatDate(item.evaluation.date)}
                </Text>
              </View>
              <Text className="font-inter-bold text-[17px] text-ink">
                {fmt(item.valeur)}
                <Text className="font-inter text-xs text-muted">
                  {" "}
                  / {item.evaluation.bareme}
                </Text>
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                Aucune note trouvée.
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
