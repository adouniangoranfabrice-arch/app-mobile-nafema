import { apiErrorMessage } from "@/api/client";
import {
  createIepp,
  deleteIepp,
  getIepps,
  Iepp,
  takeIeppsStale,
  updateIepp,
} from "@/api/iepps";
import AddIeppModal from "@/components/gestion/AddIeppModal";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { IconButton } from "@/organisation/ui";
import { confirmDeleteIepp } from "@/utils/confirm";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });
const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

/** IEPP (GET /iepps) : ajout, voir, modifier et supprimer */
export default function Iepps() {
  const router = useRouter();
  const { canEdit, href } = useGestion();
  const listRef = useRef<FlatList<Iepp>>(null);
  const lastRequest = useRef(0);

  const [iepps, setIepps] = useState<Iepp[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Iepp | null>(null);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getIepps();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setIepps(all);
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

  // Retour d'un détail où l'IEPP a été modifiée ou supprimée : on recharge
  useFocusEffect(
    useCallback(() => {
      if (takeIeppsStale()) load("refreshing");
    }, [load]),
  );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const openDetail = (i: Iepp) =>
    router.push(
      href("iepp-detail", {
        public_key: i.public_key,
        slug: i.slug,
        name: i.name,
        dren_public_key: i.dren_public_key,
        dren_slug: i.dren_slug,
        dren_name: i.dren_name,
        created_at: i.created_at,
        updated_at: i.updated_at,
      }),
    );

  const remove = (i: Iepp) =>
    confirmDeleteIepp(i, async () => {
      try {
        const message = await deleteIepp(i.public_key);
        load("refreshing");
        showToast(message);
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      }
    });

  // Recherche par code, nom ou DRENA (sans tenir compte des accents)
  const q = normalize(query);
  const visible = iepps.filter(
    (i) =>
      !q ||
      normalize(`${i.slug} ${i.name} ${i.dren_name} ${i.dren_slug}`).includes(q),
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
    : `${visible.length} IEPP enregistrée${plural(visible.length)}`;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
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
              IEPP
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
          placeholder="Rechercher une IEPP ou une DRENA"
        />

        {/* Bouton d'ajout */}
        {canEdit && (
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              Nouvelle IEPP
            </Text>
          </Pressable>
        )}
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(i) => i.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
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
                {!!item.slug && (
                  <Text
                    style={{ fontFamily: MONO }}
                    className="mt-0.5 text-xs text-muted"
                  >
                    {item.slug}
                  </Text>
                )}
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter-semibold text-xs text-primary"
                >
                  {item.dren_name || "DRENA non renseignée"}
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
                  Aucune IEPP trouvée.
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
                  Impossible de charger les IEPP
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
            shown.length === 0 ? (
              <SkeletonList />
            ) : (
              <View className="items-center py-4">
                <ActivityIndicator color="#2B5EA8" />
              </View>
            )
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
      <AddIeppModal
        visible={adding || editing !== null}
        iepp={editing}
        onClose={closeForm}
        onSave={async (data) => {
          const message = editing
            ? await updateIepp(editing.public_key, data)
            : await createIepp(data);
          closeForm();
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}
