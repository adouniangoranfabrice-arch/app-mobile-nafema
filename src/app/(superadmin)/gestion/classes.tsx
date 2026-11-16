// Classes (GET /classes) : ajout, voir, modifier et supprimer
import {
  Classe,
  createClasse,
  deleteClasse,
  getClasses,
  takeClassesStale,
  updateClasse,
} from "@/api/classes";
import { apiErrorMessage } from "@/api/client";
import { SkeletonList } from "@/components/ui/Skeleton";
import AddClasseModal from "@/components/gestion/AddClasseModal";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { IconButton } from "@/organisation/ui";
import { confirmDelete } from "@/utils/confirm";
import { formatDateTime } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Classes() {
  const router = useRouter();
  const { canEdit, href } = useGestion();
  const listRef = useRef<FlatList<Classe>>(null);
  const lastRequest = useRef(0);

  const [classes, setClasses] = useState<Classe[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Classe | null>(null);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getClasses();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setClasses(all);
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

  // Retour d'un détail où la classe a été modifiée ou supprimée : on recharge
  useFocusEffect(
    useCallback(() => {
      if (takeClassesStale()) load("refreshing");
    }, [load]),
  );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const remove = (c: Classe) =>
    confirmDelete("Supprimer cette classe ?", c.name, async () => {
      try {
        const message = await deleteClasse(c.public_key);
        load("refreshing");
        showToast(message);
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      }
    });

  const openDetail = (c: Classe) =>
    router.push(
      href("classe-detail", {
        public_key: c.public_key,
        name: c.name,
        max_effectif: c.max_effectif === null ? "" : String(c.max_effectif),
        annee_name: c.annee_name,
        niveau_name: c.niveau_name,
        serie_name: c.serie_name,
        salle_name: c.salle_name,
        annee_key: c.annee_key,
        niveau_key: c.niveau_key,
        serie_key: c.serie_key,
        salle_key: c.salle_key,
        etab_name: c.etab_name,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }),
    );

  // Recherche par nom, niveau, série, salle ou année (sans tenir compte des accents)
  const q = normalize(query);
  const visible = classes.filter(
    (c) =>
      !q ||
      normalize(
        `${c.name} ${c.niveau_name} ${c.serie_name} ${c.salle_name} ${c.annee_name}`,
      ).includes(q),
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
    : `${visible.length} classe${plural(visible.length)}`;

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
              Classes
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
          placeholder="Rechercher une classe"
        />

        {/* Bouton d'ajout */}
        {canEdit && (
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              Nouvelle classe
            </Text>
          </Pressable>
        )}
      </FixedHeader>

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
                <Text className="mt-0.5 font-inter text-xs text-muted">
                  {[item.niveau_name, item.serie_name, item.salle_name]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                  {item.max_effectif !== null ? ` · ${item.max_effectif} élèves max` : ""}
                </Text>
                {/* Année scolaire de la classe */}
                <View className="mt-1 flex-row items-center gap-1">
                  <Ionicons name="calendar-outline" size={12} color="#2B5EA8" />
                  <Text
                    numberOfLines={1}
                    className="font-inter-semibold text-xs text-primary"
                  >
                    {item.annee_name ? `Année ${item.annee_name}` : "Année non renseignée"}
                  </Text>
                </View>
                {!!item.created_at && (
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 font-inter text-[11px] text-muted"
                  >
                    Créée le {formatDateTime(item.created_at)}
                    {item.updated_at && item.updated_at !== item.created_at
                      ? ` · modifiée le ${formatDateTime(item.updated_at)}`
                      : ""}
                  </Text>
                )}
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
                  Aucune classe trouvée.
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
                  Impossible de charger les classes
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
      <AddClasseModal
        visible={adding || editing !== null}
        classe={editing}
        onClose={closeForm}
        onSave={async (data) => {
          const message = editing
            ? await updateClasse(editing.public_key, data)
            : await createClasse(data);
          closeForm();
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}
