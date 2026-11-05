import {
  Annee,
  ANNEE_STATUS,
  anneeStatus,
  createAnnee,
  deleteAnnee,
  updateAnnee,
} from "@/api/annees";
import { apiErrorMessage } from "@/api/client";
import AddYearModal from "@/components/gestion/AddYearModal";
import ActionButton from "@/components/ui/ActionButton";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { useAnnees } from "@/hooks/use-annees";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDeleteYear } from "@/utils/confirm";
import { formatDate } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Annees() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { annees, status, hasMore, loadMore, refresh, retry } = useAnnees();
  const { canEdit, href } = useGestion();

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Annee | null>(null);
  const q = normalize(query);

  const activeCount = annees.filter((a) => anneeStatus(a) === "active").length;

  // Recherche par libellé, établissement ou statut (sans tenir compte des accents)
  const visible = useMemo(
    () =>
      annees.filter((a) => {
        if (!q) return true;
        const haystack = normalize(
          `${a.name} ${a.etab_name} ${ANNEE_STATUS[anneeStatus(a)].label}`,
        );
        return haystack.includes(q);
      }),
    [annees, q],
  );

  // La recherche se fait ici : elle doit voir toutes les pages, pas seulement celles déjà chargées
  useEffect(() => {
    if (q && hasMore && status === "idle") loadMore();
  }, [q, hasMore, status, loadMore]);

  const openDetail = (a: Annee) =>
    router.push(
      href("annee-detail", {
        public_key: a.public_key,
        name: a.name,
        debut: a.debut,
        fin: a.fin,
        is_active: String(a.is_active),
        is_closed: String(a.is_closed),
        etab_public_key: a.etab_public_key,
        etab_name: a.etab_name,
        cree_le: a.cree_le,
      }),
    );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const askDelete = (a: Annee) =>
    confirmDeleteYear(a, async () => {
      try {
        await deleteAnnee(a.public_key);
        refresh();
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
    });

  const failed = status === "failed";
  const loading = status === "loading";

  const summary = loading
    ? "Chargement…"
    : `${annees.length}${hasMore ? "+" : ""} année${plural(annees.length)}${
        hasMore ? "" : ` · ${activeCount} active${plural(activeCount)}`
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
                Années scolaires
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                {summary}
              </Text>
            </View>
          </View>

          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une année ou un établissement"
          />

          {/* Bouton d'ajout */}
          {canEdit && (
            <Pressable
              onPress={() => setAdding(true)}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text className="font-inter-semibold text-base text-white">
                Ajouter une année scolaire
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        className="flex-1"
        data={visible}
        keyExtractor={(a) => a.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View className="w-full max-w-[640px] gap-4 self-center px-5 pb-4">
            {q !== "" && (
              <Text className="font-inter text-xs text-muted">
                {visible.length} résultat{plural(visible.length)}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-4">
            <AnneeCard
              annee={item}
              canEdit={canEdit}
              onOpen={() => openDetail(item)}
              onEdit={() => setEditing(item)}
              onDelete={() => askDelete(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          loading || failed || hasMore ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center gap-2 rounded-3xl bg-white py-12">
                <Ionicons name="calendar-outline" size={28} color="#9AA7B8" />
                <Text className="font-inter-semibold text-[15px] text-ink">
                  Aucune année trouvée
                </Text>
                {q !== "" && (
                  <Text className="font-inter text-[13px] text-muted">
                    Essaie une autre recherche.
                  </Text>
                )}
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
                  Impossible de charger les années
                </Text>
                <Pressable onPress={retry} className="active:opacity-70">
                  <Text className="font-inter-semibold text-[14px] text-primary">
                    Réessayer
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : loading || status === "loadingMore" ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#2B5EA8" />
            </View>
          ) : undefined
        }
      />

      {/* Formulaire : ajout ou modification */}
      <AddYearModal
        visible={adding || editing !== null}
        year={editing}
        existing={annees}
        onClose={closeForm}
        onSave={async (data) => {
          if (editing) {
            await updateAnnee(editing.public_key, data);
            closeForm();
            refresh();
            showToast("Année scolaire modifiée avec succès.");
            return;
          }
          const message = await createAnnee(data);
          closeForm();
          refresh();
          showToast(message ?? "Année scolaire créée avec succès.");
        }}
      />

    </View>
  );
}

function AnneeCard({
  annee,
  canEdit,
  onOpen,
  onEdit,
  onDelete,
}: {
  annee: Annee;
  canEdit: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const key = anneeStatus(annee);
  const st = ANNEE_STATUS[key];

  return (
    <View
      className={`gap-3 rounded-3xl border-[1.5px] bg-white p-4 shadow-sm ${
        key === "active" ? "border-primary" : "border-transparent"
      }`}
    >
      {/* Un clic sur la partie haute ouvre le détail */}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${annee.name}, ${annee.etab_name}, ${st.label}`}
        className="flex-row items-center gap-3 active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
          <Ionicons name="calendar-outline" size={20} color="#2B5EA8" />
        </View>
        <View className="flex-1">
          <Text className="font-inter-bold text-[17px] text-ink">
            {annee.name}
          </Text>
          <Text
            numberOfLines={1}
            className="font-inter-semibold text-xs text-primary"
          >
            {annee.etab_name}
          </Text>
          <Text className="font-inter text-xs text-muted">
            {formatDate(fromISO(annee.debut))} –{" "}
            {formatDate(fromISO(annee.fin))}
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1 ${st.badge}`}>
          <Text className={`font-inter-semibold text-xs ${st.text}`}>
            {st.label}
          </Text>
        </View>
      </Pressable>

      {canEdit && (
        <>
          <View className="h-px bg-line" />

          {/* Voir / Modifier / Supprimer */}
          <View className="flex-row gap-2">
            <ActionButton icon="eye-outline" label="Voir" onPress={onOpen} />
            <ActionButton
              icon="create-outline"
              label="Modifier"
              onPress={onEdit}
            />
            <ActionButton
              icon="trash-outline"
              label="Supprimer"
              variant="danger"
              onPress={onDelete}
            />
          </View>
        </>
      )}
    </View>
  );
}
