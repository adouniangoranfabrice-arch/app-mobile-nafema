import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { Tone } from "@/organisation/types";
import { Badge } from "@/organisation/ui";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;

export type PedagogyItem = {
  id: string;
  title: string;
  highlight: string; // la ligne en couleur sous le titre
  lines: string[];
  badge?: { label: string; tone: Tone };
  initials?: string; // à la place de l'icône
};

/** Une liste de l'espace enseignant : titre, recherche et ajout fixes, puis des cartes par pages de 20 */
export default function PedagogyList({
  title,
  summary,
  items,
  icon,
  searchPlaceholder,
  emptyLabel,
  addLabel,
  onAdd,
}: {
  title: string;
  summary: string;
  items: PedagogyItem[];
  icon: keyof typeof Ionicons.glyphMap;
  searchPlaceholder: string;
  emptyLabel: string;
  addLabel?: string;
  onAdd?: () => void;
}) {
  const router = useRouter();
  const listRef = useRef<FlatList<PedagogyItem>>(null);
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  // Recherche dans tout le texte de la carte (sans tenir compte des accents)
  const q = normalize(query);
  const visible = items.filter(
    (i) =>
      !q ||
      normalize(
        [i.title, i.highlight, ...i.lines, i.badge?.label ?? ""].join(" "),
      ).includes(q),
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
              {title}
            </Text>
            <Text className="font-inter text-[13px] text-muted">{summary}</Text>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder={searchPlaceholder}
        />

        {/* Bouton d'ajout */}
        {addLabel && onAdd && (
          <Pressable
            onPress={onAdd}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              {addLabel}
            </Text>
          </Pressable>
        )}
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-3">
            <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              {item.initials ? (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-soft">
                  <Text className="font-inter-bold text-[14px] text-primary">
                    {item.initials}
                  </Text>
                </View>
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                  <Ionicons name={icon} size={20} color="#2B5EA8" />
                </View>
              )}
              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[15px] text-ink"
                >
                  {item.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter-semibold text-xs text-primary"
                >
                  {item.highlight}
                </Text>
                {item.lines.map((line) => (
                  <Text
                    key={line}
                    className="mt-0.5 font-inter text-xs text-muted"
                  >
                    {line}
                  </Text>
                ))}
              </View>
              {item.badge && (
                <Badge label={item.badge.label} tone={item.badge.tone} />
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                {emptyLabel}
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
