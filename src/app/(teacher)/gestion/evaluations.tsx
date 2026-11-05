import FilterChips from "@/components/ui/FilterChips";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { useEvaluations } from "@/context/EvaluationsContext";
import { Evaluation, isUpcoming } from "@/data/evaluations";
import { useGestion } from "@/hooks/use-gestion";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { formatDate } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Evaluations() {
  const router = useRouter();
  const { href } = useGestion();
  const { evaluations } = useEvaluations();
  const classes = useTeacherClasses();
  const listRef = useRef<FlatList<Evaluation>>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [requestedPage, setRequestedPage] = useState(1);

  const classeName = (id: string) =>
    classes.find((c) => c.id === id)?.name ?? "Classe introuvable";

  const upcomingCount = evaluations.filter((e) => isUpcoming(e)).length;

  // Recherche par titre, classe, matière ou type (sans tenir compte des accents)
  const q = normalize(query);
  const visible = evaluations
    .filter((e) => {
      if (filter === "upcoming" && !isUpcoming(e)) return false;
      if (filter === "past" && isUpcoming(e)) return false;
      if (!q) return true;
      return normalize(
        `${e.titre} ${classeName(e.classe_id)} ${e.matiere} ${e.type}`,
      ).includes(q);
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

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
              Évaluations
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {evaluations.length} évaluation{plural(evaluations.length)} ·{" "}
              {upcomingCount} à venir
            </Text>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder="Rechercher une évaluation, une classe"
        />

        <FilterChips
          selected={filter}
          onSelect={(key) => {
            setFilter(key);
            setRequestedPage(1);
          }}
          chips={[
            { key: "all", label: "Toutes", count: evaluations.length },
            { key: "upcoming", label: "À venir", count: upcomingCount },
            {
              key: "past",
              label: "Passées",
              count: evaluations.length - upcomingCount,
            },
          ]}
        />

        {/* Bouton d'ajout */}
        <Pressable
          onPress={() => router.push(href("nouvelle-evaluation"))}
          className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text className="font-inter-semibold text-base text-white">
            Nouvelle évaluation
          </Text>
        </Pressable>
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const upcoming = isUpcoming(item);
          return (
            <View className="w-full max-w-[640px] self-center px-5 pb-3">
              <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                  <Ionicons
                    name="checkmark-done-outline"
                    size={20}
                    color="#2B5EA8"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-inter-bold text-[15px] text-ink"
                  >
                    {item.titre}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 font-inter-semibold text-xs text-primary"
                  >
                    {classeName(item.classe_id)} · {item.matiere}
                  </Text>
                  <Text className="mt-0.5 font-inter text-xs text-muted">
                    {item.type} · {formatDate(item.date)}
                  </Text>
                  <Text className="mt-0.5 font-inter text-xs text-muted">
                    Sur {item.bareme} · Coefficient {item.coefficient}
                  </Text>
                </View>
                <View
                  className={`rounded-full px-3 py-1 ${upcoming ? "bg-soft" : "bg-slate-100"}`}
                >
                  <Text
                    className={`font-inter-semibold text-xs ${upcoming ? "text-primary" : "text-muted"}`}
                  >
                    {upcoming ? "À venir" : "Passée"}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                Aucune évaluation trouvée.
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
