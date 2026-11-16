import { apiErrorMessage } from "@/api/client";
import {
  createFrais,
  deleteFrais,
  Frais,
  FraisDetail,
  getFrais,
  getFraisDetail,
  takeFraisStale,
  typeFraisLabel,
  updateFrais,
} from "@/api/frais";
import AddFraisModal from "@/components/gestion/AddFraisModal";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { fcfa } from "@/data/finances";
import { useGestion } from "@/hooks/use-gestion";
import { Badge, IconButton } from "@/organisation/ui";
import { confirmDelete } from "@/utils/confirm";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;

/** Frais (GET /frais), par année puis niveau : voir, ajouter (POST) et modifier (PUT /frais/{frai}) */
export default function FraisScreen() {
  const router = useRouter();
  const { canEdit, canOpen, href } = useGestion();
  const canDelete = canOpen("suppression-frais"); // super admin uniquement
  const listRef = useRef<FlatList<Frais>>(null);
  const lastRequest = useRef(0);

  const [frais, setFrais] = useState<Frais[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FraisDetail | null>(null);
  const [opening, setOpening] = useState<string | null>(null); // frais dont on charge le détail

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getFrais();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      // Année la plus récente d'abord, puis niveau et nom
      all.sort(
        (a, b) =>
          b.annee_name.localeCompare(a.annee_name) ||
          a.niveau_name.localeCompare(b.niveau_name, "fr") ||
          a.name.localeCompare(b.name, "fr"),
      );
      setFrais(all);
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

  // Retour d'un détail où le frais a été modifié : on recharge
  useFocusEffect(
    useCallback(() => {
      if (takeFraisStale()) load("refreshing");
    }, [load]),
  );

  // La liste ne contient pas tout (date, affectation…) : on charge le détail avant d'ouvrir le formulaire
  const openEdit = async (f: Frais) => {
    if (opening) return;
    setOpening(f.public_key);
    try {
      setEditing(await getFraisDetail(f.public_key));
    } catch (error) {
      showToast(apiErrorMessage(error), "error");
    } finally {
      setOpening(null);
    }
  };

  const remove = (f: Frais) =>
    confirmDelete(
      "Supprimer ce frais ?",
      `${f.name} · ${fcfa(f.montant_frais)}${f.niveau_name ? ` · ${f.niveau_name}` : ""}`,
      async () => {
        try {
          const message = await deleteFrais(f.public_key);
          load("refreshing");
          showToast(message);
        } catch (error) {
          showToast(apiErrorMessage(error), "error");
        }
      },
    );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  // Le détail s'ouvre avec ce que la liste connaît, puis GET /frais/{frai} le complète
  const openDetail = (f: Frais) =>
    router.push(
      href("frais-detail", {
        public_key: f.public_key,
        name: f.name,
        annee_name: f.annee_name,
        niveau_name: f.niveau_name,
        type_frais: f.type_frais,
        montant_frais: String(f.montant_frais),
      }),
    );

  // Recherche par nom, niveau, année ou type (sans tenir compte des accents)
  const q = normalize(query);
  const visible = frais.filter(
    (f) =>
      !q ||
      normalize(
        `${f.name} ${f.niveau_name} ${f.annee_name} ${f.type_frais} ${typeFraisLabel(f.type_frais)}`,
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
    : `${visible.length} frais`;

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
              Frais
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
          placeholder="Rechercher un frais, un niveau, une année"
        />

        {/* Bouton d'ajout */}
        {canEdit && (
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              Nouveau frais
            </Text>
          </Pressable>
        )}
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(f) => f.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-3">
            <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                <Ionicons name="cash-outline" size={20} color="#2B5EA8" />
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
                <Text className="mt-0.5 font-inter-bold text-[14px] text-primary">
                  {fcfa(item.montant_frais)}
                </Text>
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-inter text-xs text-muted"
                >
                  {[item.niveau_name, item.annee_name].filter(Boolean).join(" · ") || "—"}
                </Text>
                {!!item.type_frais && (
                  <View className="mt-1.5 self-start">
                    <Badge label={typeFraisLabel(item.type_frais)} tone="blue" />
                  </View>
                )}
              </Pressable>
              {/* Actions : voir, modifier, supprimer (super admin) */}
              <View className="flex-row items-center gap-1.5">
                <IconButton
                  icon="eye-outline"
                  color="#1B2A41"
                  label="Voir"
                  onPress={() => openDetail(item)}
                />
                {canEdit &&
                  (opening === item.public_key ? (
                    <View className="h-9 w-9 items-center justify-center">
                      <ActivityIndicator color="#2B5EA8" />
                    </View>
                  ) : (
                    <IconButton
                      icon="create-outline"
                      color="#2B5EA8"
                      label="Modifier"
                      onPress={() => openEdit(item)}
                    />
                  ))}
                {canDelete && (
                  <IconButton
                    icon="trash-outline"
                    color="#DC2626"
                    label="Supprimer"
                    onPress={() => remove(item)}
                  />
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
                  Aucun frais trouvé.
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
                  Impossible de charger les frais
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
      <AddFraisModal
        visible={adding || editing !== null}
        frais={editing}
        onClose={closeForm}
        onSave={async (data) => {
          const message = editing
            ? await updateFrais(editing.public_key, data)
            : await createFrais(data);
          closeForm();
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}
