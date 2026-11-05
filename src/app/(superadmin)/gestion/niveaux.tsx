import { Cycle, getCycles } from "@/api/cycles";
import { createNiveau, getNiveaux, Niveau } from "@/api/niveaux";
import AddNiveauModal from "@/components/gestion/AddNiveauModal";
import PageBar from "@/components/ui/PageBar";
import SearchFilterBar from "@/components/ui/SearchFilterBar";
import Select from "@/components/ui/Select";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { IconButton } from "@/organisation/ui";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });
const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "x" : "");

export default function Niveaux() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canEdit, href } = useGestion();
  const listRef = useRef<FlatList<Niveau>>(null);
  const lastRequest = useRef(0);

  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cyclesFailed, setCyclesFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getNiveaux();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setNiveaux(all);
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

  // Les vrais cycles, pour le filtre et le formulaire. Rechargés à chaque ouverture du formulaire
  useEffect(() => {
    let active = true;
    getCycles()
      .then((all) => {
        if (!active) return;
        setCycles(all);
        setCyclesFailed(false);
      })
      .catch(() => {
        if (active) setCyclesFailed(true);
      });
    return () => {
      active = false;
    };
  }, [adding]);

  const openDetail = (n: Niveau) =>
    router.push(
      href("niveau-detail", {
        abbreviation: n.abbreviation,
        name: n.name,
        order: String(n.order),
        cycle_name: n.cycle_name,
        cree_le: n.cree_le,
      }),
    );

  // Recherche par abréviation, nom ou cycle (sans tenir compte des accents)
  const q = normalize(query);
  const visible = niveaux.filter(
    (n) =>
      (cycleFilter === "all" || n.cycle_public_key === cycleFilter) &&
      (!q || normalize(`${n.abbreviation} ${n.name} ${n.cycle_name}`).includes(q)),
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
    : `${visible.length} niveau${plural(visible.length)}`;

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
                Niveaux
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                {summary}
              </Text>
            </View>
          </View>

          <SearchFilterBar
            query={query}
            onQueryChange={(t) => {
              setQuery(t);
              setRequestedPage(1);
            }}
            placeholder="Rechercher un niveau"
            activeCount={cycleFilter !== "all" ? 1 : 0}
            onReset={() => {
              setCycleFilter("all");
              setRequestedPage(1);
            }}
          >
            <Select
              label="Cycle"
              icon="sync-outline"
              value={cycleFilter}
              onChange={(v) => {
                setCycleFilter(v);
                setRequestedPage(1);
              }}
              options={[
                { value: "all", label: "Tous les cycles" },
                ...cycles.map((c) => ({ value: c.public_key, label: c.name })),
              ]}
            />
          </SearchFilterBar>

          {/* Bouton d'ajout */}
          {canEdit && (
            <Pressable
              onPress={() => setAdding(true)}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text className="font-inter-semibold text-base text-white">
                Nouveau niveau
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(n) => n.public_key}
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
                {!!item.cycle_name && (
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 font-inter-semibold text-xs text-primary"
                  >
                    {item.cycle_name}
                  </Text>
                )}
              </Pressable>

              <IconButton
                icon="eye-outline"
                color="#1B2A41"
                label="Voir"
                onPress={() => openDetail(item)}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading || failed ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center rounded-3xl bg-white py-12">
                <Text className="font-inter text-[14px] text-muted">
                  Aucun niveau trouvé.
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
                  Impossible de charger les niveaux
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

      {/* Formulaire d'ajout */}
      <AddNiveauModal
        visible={adding}
        cycles={cycles}
        cyclesFailed={cyclesFailed}
        nextOrder={(cycle) =>
          Math.max(
            0,
            ...niveaux
              .filter((n) => n.cycle_public_key === cycle)
              .map((n) => n.order),
          ) + 1
        }
        onClose={() => setAdding(false)}
        onSave={async (data) => {
          const message = await createNiveau(data);
          setAdding(false);
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}
