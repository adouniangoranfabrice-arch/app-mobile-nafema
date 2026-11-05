import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { useCompetences } from "@/context/CompetencesContext";
import { Competence } from "@/data/competences";
import { useGestion } from "@/hooks/use-gestion";
import { MONO } from "@/organisation/ui";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Competences() {
  const router = useRouter();
  const { href } = useGestion();
  const { competences } = useCompetences();
  const listRef = useRef<FlatList<Competence>>(null);

  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  // Recherche par code, intitulé ou matière (sans tenir compte des accents)
  const q = normalize(query);
  const visible = competences.filter(
    (c) => !q || normalize(`${c.code} ${c.intitule} ${c.matiere}`).includes(q),
  );

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
              Compétences
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {visible.length} compétence{plural(visible.length)}
            </Text>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder="Rechercher une compétence, une matière"
        />

        {/* Bouton d'ajout */}
        <Pressable
          onPress={() => router.push(href("nouvelle-competence"))}
          className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text className="font-inter-semibold text-base text-white">
            Nouvelle compétence
          </Text>
        </Pressable>
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-3">
            <View className="flex-row items-start gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                <Ionicons name="locate-outline" size={20} color="#2B5EA8" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-[15px] text-ink">
                  {item.intitule}
                </Text>
                <Text
                  style={{ fontFamily: MONO }}
                  className="mt-0.5 text-xs text-muted"
                >
                  {item.code}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter-semibold text-xs text-primary"
                >
                  {item.matiere}
                </Text>
                {!!item.description && (
                  <Text className="mt-1 font-inter text-xs text-muted">
                    {item.description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                Aucune compétence trouvée.
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
