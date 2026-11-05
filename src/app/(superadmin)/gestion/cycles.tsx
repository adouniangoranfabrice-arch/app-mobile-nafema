import { apiErrorMessage } from "@/api/client";
import {
  createCycle,
  Cycle,
  deleteCycle,
  getCycles,
  takeCyclesStale,
  updateCycle,
} from "@/api/cycles";
import AddCycleModal from "@/components/gestion/AddCycleModal";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { IconButton } from "@/organisation/ui";
import { confirmDeleteCycle } from "@/utils/confirm";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
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
const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Cycles() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canEdit, href } = useGestion();
  const listRef = useRef<FlatList<Cycle>>(null);
  const lastRequest = useRef(0);

  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Cycle | null>(null);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getCycles();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setCycles(all);
      setStatus("idle");
    } catch {
      if (request === lastRequest.current) setStatus("failed");
    }
  }, []);

  useEffect(() => {
    load("loading");
    return () => {
      lastRequest.current++; // écran quitté : la réponse en cours est ignorée
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (takeCyclesStale()) load("refreshing");
    }, [load]),
  );

  const openDetail = (c: Cycle) =>
    router.push(
      href("cycle-detail", {
        public_key: c.public_key,
        abbreviation: c.abbreviation,
        name: c.name,
        order: String(c.order),
      }),
    );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const remove = (c: Cycle) =>
    confirmDeleteCycle(c, async () => {
      try {
        await deleteCycle(c.public_key);
        load("refreshing");
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
    });

  // Recherche par abréviation ou par nom (sans tenir compte des accents)
  const q = normalize(query);
  const visible = cycles.filter(
    (c) => !q || normalize(`${c.abbreviation} ${c.name}`).includes(q),
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount); // la liste a pu raccourcir
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chaque page s'ouvre en haut de la liste
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

  const loading = status === "loading";
  const failed = status === "failed";

  const summary = loading
    ? "Chargement…"
    : `${visible.length} cycle${plural(visible.length)}`;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      {/* En-tête, recherche et ajout fixes : la liste défile en dessous */}
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
                Cycles
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                {summary}
              </Text>
            </View>
          </View>

          <SearchBar
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setRequestedPage(1);
            }}
            placeholder="Rechercher un cycle"
          />

          {/* Bouton d'ajout */}
          {canEdit && (
            <Pressable
              onPress={() => setAdding(true)}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text className="font-inter-semibold text-base text-white">
                Nouveau cycle
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(c) => c.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-3">
            <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                <Text className="font-inter-bold text-[15px] text-primary">
                  {item.order}
                </Text>
              </View>
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
                  {item.abbreviation}
                </Text>
              </Pressable>

              {/* Actions : voir, supprimer */}
              <View className="flex-row items-center gap-1.5">
                <IconButton
                  icon="eye-outline"
                  color="#1B2A41"
                  label="Voir"
                  onPress={() => openDetail(item)}
                />
                {canEdit && (
                  <>
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
                  </>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading || failed ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center rounded-3xl bg-white py-12">
                <Text className="font-inter text-[14px] text-muted">
                  Aucun cycle trouvé.
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
                  Impossible de charger les cycles
                </Text>
                <Pressable
                  onPress={() => load("loading")}
                  className="active:opacity-70"
                >
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

      <PageBar
        page={page}
        pageCount={pageCount}
        hasPrevious={page > 1}
        hasNext={page < pageCount}
        onPrevious={() => setRequestedPage(page - 1)}
        onNext={() => setRequestedPage(page + 1)}
      />

      {/* Formulaire : ajout ou modification */}
      <AddCycleModal
        visible={adding || editing !== null}
        cycle={editing}
        nextOrder={Math.max(0, ...cycles.map((c) => c.order)) + 1}
        onClose={closeForm}
        onSave={async (data) => {
          if (editing) {
            await updateCycle(editing.public_key, data);
            closeForm();
            load("refreshing");
            showToast("Cycle modifié avec succès.");
            return;
          }
          const message = await createCycle(data);
          closeForm();
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}
