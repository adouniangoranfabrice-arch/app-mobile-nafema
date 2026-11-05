import { apiErrorMessage } from "@/api/client";
import { createDren, deleteDren, updateDren } from "@/api/drens";
import AddDrenaModal from "@/components/gestion/AddDrenaModal";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { Drena } from "@/data/drenas";
import { useDrenaList } from "@/hooks/use-drena-list";
import { IconButton } from "@/organisation/ui";
import { confirmDeleteDrena } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });
const SEARCH_DELAY_MS = 300;

export default function Drenas() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Drena>>(null);

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Drena | null>(null);

  // La recherche se fait sur le serveur : on attend la fin de la frappe
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const {
    shown,
    firstIndex,
    total,
    page,
    pageCount,
    hasNext,
    hasPrevious,
    status,
    next,
    previous,
    refresh,
    reload,
    retry,
  } = useDrenaList(search);

  const openDetail = (d: Drena) =>
    router.push({
      pathname: "/(superadmin)/gestion/drena-detail",
      params: { public_key: d.public_key, slug: d.slug, name: d.name },
    });

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const remove = (d: Drena) =>
    confirmDeleteDrena(d, async () => {
      try {
        await deleteDren(d.public_key);
        reload();
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
    });

  // Chaque page s'ouvre en haut de la liste
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

  const failed = status === "failed";
  const loading = status === "loading";
  const changingPage = status === "changingPage";

  const summary = loading
    ? "Chargement…"
    : shown.length === 0
      ? "0 DRENA"
      : `DRENA ${firstIndex + 1} à ${firstIndex + shown.length}${
          total !== null ? ` sur ${total}` : ""
        }`;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      {/* En-tête et recherche fixes : la liste défile en dessous */}
      <View
        className="border-b border-line"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5 pb-3">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
            >
              <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
            </Pressable>
            <View className="flex-1">
              <Text className="font-inter-bold text-[20px] leading-8 text-ink">
                DRENAs
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                {summary}
              </Text>
            </View>
          </View>

          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une DRENA"
          />

          {/* Bouton d'ajout */}
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              Nouvelle DRENA
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(d) => d.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-3">
            <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <Pressable
                onPress={() => openDetail(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                className="flex-1 active:opacity-70"
              >
                <Text
                  numberOfLines={2}
                  className="font-inter-semibold text-[15px] text-ink"
                >
                  {item.name}
                </Text>
                <Text
                  style={{ fontFamily: MONO }}
                  className="mt-0.5 text-xs text-muted"
                >
                  {item.slug}
                </Text>
              </Pressable>

              {/* Actions : voir, modifier, supprimer */}
              <View className="flex-row items-center gap-1.5">
                <IconButton
                  icon="eye-outline"
                  color="#1B2A41"
                  label="Voir"
                  onPress={() => openDetail(item)}
                />
                <IconButton
                  icon="create-outline"
                  color="#2B5EA8"
                  label="Modifier"
                  onPress={() => setEditing(item)}
                />
                <IconButton
                  icon="trash-outline"
                  color="#DC2626"
                  label="Supprimer"
                  onPress={() => remove(item)}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading || failed ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center rounded-3xl bg-white py-12">
                <Text className="font-inter text-[14px] text-muted">
                  Aucune DRENA trouvée.
                </Text>
              </View>
            </View>
          )
        }
        ListFooterComponent={
          failed ? (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center gap-3 rounded-3xl bg-white py-8">
                <Ionicons
                  name="cloud-offline-outline"
                  size={28}
                  color="#9AA7B8"
                />
                <Text className="text-center font-inter-semibold text-[15px] text-ink">
                  Impossible de charger les DRENA
                </Text>
                <Pressable onPress={retry} className="active:opacity-70">
                  <Text className="font-inter-semibold text-[14px] text-primary">
                    Réessayer
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : loading ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#2B5EA8" />
            </View>
          ) : undefined
        }
      />

      {/* Barre de pagination, toujours visible s'il y a plus d'une page */}
      <PageBar
        page={page}
        pageCount={pageCount}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        busy={changingPage}
        onPrevious={previous}
        onNext={next}
      />

      {/* Formulaire : ajout ou modification */}
      <AddDrenaModal
        visible={adding || editing !== null}
        drena={editing}
        onClose={closeForm}
        onSave={async (data) => {
          if (editing) {
            await updateDren(editing.public_key, data);
            closeForm();
            reload();
            showToast("DRENA modifiée avec succès.");
            return;
          }
          const message = await createDren(data);
          closeForm();
          refresh();
          // La nouvelle DRENA n'est pas forcément sur la première page : on confirme sa création
          showToast(message);
        }}
      />
    </View>
  );
}

