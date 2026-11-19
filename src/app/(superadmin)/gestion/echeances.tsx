// Échéances : liste (libellé, année, date, ordre, pourcentage, statut), ajout, voir, modifier, supprimer
import { anneeStatus, getAllAnnees } from "@/api/annees";
import { apiErrorMessage } from "@/api/client";
import {
  createEcheance,
  deleteEcheance,
  Echeance,
  ECHEANCES_FICTIVES,
  getEcheances,
  isActive,
  takeEcheancesStale,
  updateEcheance,
} from "@/api/echeances";
import AddEcheanceModal from "@/components/gestion/AddEcheanceModal";
import FilterChips from "@/components/ui/FilterChips";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDelete } from "@/utils/confirm";
import { formatDate } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;
const plural = (n: number) => (n > 1 ? "s" : "");
const shortDate = (raw: string) => (raw ? formatDate(fromISO(raw)) : "—");

export default function Echeances() {
  const router = useRouter();
  const { canEdit, canOpen, href } = useGestion();
  // Supprimer : super admin seulement
  const canDelete = canOpen("suppression-echeances");
  const space = useSegments()[0];
  // Contrôle en développement : l'espace où l'écran est ouvert décide du bouton Supprimer
  useEffect(() => {
    if (__DEV__) console.log("Échéances · espace :", space, "· bouton Supprimer :", canDelete ? "affiché" : "masqué");
  }, [space, canDelete]);
  const listRef = useRef<FlatList<Echeance>>(null);
  const lastRequest = useRef(0);

  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle" | "failed">("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Echeance | null>(null);
  const [anneeName, setAnneeName] = useState("");

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getEcheances();
      if (request !== lastRequest.current) return;
      all.sort((a, b) => a.ordre - b.ordre || a.date_echeance.localeCompare(b.date_echeance));
      setEcheances(all);
      setStatus("idle");
    } catch {
      if (request === lastRequest.current) setStatus("failed");
    }
  }, []);

  useEffect(() => {
    load("loading");
    // Année en cours : affichée sur les nouvelles échéances
    getAllAnnees()
      .then((all) => setAnneeName(all.find((a) => anneeStatus(a) === "active")?.name ?? ""))
      .catch(() => {});
    return () => {
      lastRequest.current++;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (takeEcheancesStale()) load("refreshing");
    }, [load]),
  );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const remove = (e: Echeance) => {
    // DELETE /echeances/{public_key} : sans clé, la requête viserait une mauvaise adresse
    if (!e.public_key) {
      showToast("Impossible de supprimer : la liste ne fournit pas la clé de cette échéance.", "error");
      return;
    }
    confirmDelete("Supprimer cette échéance ?", e.name, async () => {
      try {
        const message = await deleteEcheance(e.public_key);
        load("refreshing");
        showToast(message);
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      }
    });
  };

  const openDetail = (e: Echeance) =>
    router.push(href("echeance-detail", { public_key: e.public_key }));

  // Recherche par libellé (comme le site), et aussi par année
  const q = normalize(query);
  const visible = echeances.filter(
    (e) =>
      (filter === "all" || (filter === "active") === isActive(e)) &&
      (!q || normalize(`${e.name} ${e.annee_name}`).includes(q)),
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

  const loading = status === "loading";
  const failed = status === "failed";
  const actives = echeances.filter(isActive).length;
  const total = echeances.filter(isActive).reduce((s, e) => s + e.pourcentage, 0);
  const nextOrdre = echeances.reduce((m, e) => Math.max(m, e.ordre), 0) + 1;

  const summary = loading
    ? "Chargement…"
    : `${visible.length} échéance${plural(visible.length)} affichée${plural(visible.length)}${ECHEANCES_FICTIVES ? " · fictif" : ""}`;

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
            <Text className="font-inter-bold text-[20px] leading-8 text-ink">Échéances</Text>
            <Text className="font-inter text-[13px] text-muted">{summary}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchBar
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setRequestedPage(1);
              }}
              placeholder="Rechercher par libellé…"
            />
          </View>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Filtrer"
            className={`h-[50px] w-[50px] items-center justify-center rounded-2xl border active:opacity-80 ${showFilters || filter !== "all" ? "border-primary bg-soft" : "border-line bg-white"}`}
          >
            <Ionicons name="options-outline" size={20} color="#2B5EA8" />
          </Pressable>
        </View>

        {showFilters && (
          <FilterChips
            chips={[
              { key: "all", label: "Toutes", count: echeances.length },
              { key: "active", label: "Actives", count: actives },
              { key: "inactive", label: "Inactives", count: echeances.length - actives },
            ]}
            selected={filter}
            onSelect={(k) => {
              setFilter(k);
              setRequestedPage(1);
            }}
          />
        )}

        {canEdit && (
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">Nouvelle échéance</Text>
          </Pressable>
        )}
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(e) => e.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
        ListHeaderComponent={
          !loading && echeances.length > 0 ? (
            <View className="w-full max-w-[640px] self-center px-5 pb-3">
              {/* Les échéances actives doivent couvrir 100 % des frais */}
              <Text className={`font-inter text-xs ${total === 100 ? "text-green-700" : "text-[#7A5F00]"}`}>
                Échéances actives : {total} % des frais
                {total === 100 ? " ✓" : total < 100 ? ` · il manque ${100 - total} %` : ` · ${total - 100} % en trop`}
              </Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => {
          const active = isActive(item);
          return (
            <View className="w-full max-w-[640px] self-center px-5 pb-3">
              <View className="rounded-3xl bg-white p-4 shadow-sm">
                <Pressable onPress={() => openDetail(item)} accessibilityRole="button" className="active:opacity-70">
                  <View className="flex-row items-start justify-between gap-3">
                    <Text numberOfLines={2} className="flex-1 font-inter-bold text-[16px] text-ink">
                      {item.name}
                    </Text>
                    <View className={`rounded-full px-3 py-1 ${active ? "bg-green-100" : "bg-slate-100"}`}>
                      <Text className={`font-inter-semibold text-xs ${active ? "text-green-700" : "text-muted"}`}>
                        {active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-0.5 font-inter text-[13px] text-muted">
                    {item.annee_name ? `Année ${item.annee_name}` : "Année non renseignée"}
                  </Text>

                  <View className="mt-3 flex-row gap-2 rounded-2xl bg-page p-3">
                    <Figure label="Date" value={shortDate(item.date_echeance)} />
                    <Figure label="Ordre" value={String(item.ordre)} />
                    <Figure label="Pourcentage" value={`${item.pourcentage} %`} />
                  </View>
                </Pressable>

                <View className="mt-3 flex-row gap-2 border-t border-line pt-3">
                  <CardAction icon="eye-outline" label="Voir" tone="neutral" onPress={() => openDetail(item)} />
                  {canEdit && (
                    <>
                      <CardAction icon="create-outline" label="Modifier" tone="primary" onPress={() => setEditing(item)} />
                      {canDelete && (
                        <CardAction icon="trash-outline" label="Supprimer" tone="danger" onPress={() => remove(item)} />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading || failed ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center rounded-3xl bg-white py-12">
                <Text className="font-inter text-[14px] text-muted">Aucune échéance trouvée.</Text>
              </View>
            </View>
          )
        }
        ListFooterComponent={
          failed ? (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center gap-3 rounded-3xl bg-white py-8">
                <Ionicons name="cloud-offline-outline" size={28} color="#9AA7B8" />
                <Text className="text-center font-inter-semibold text-[15px] text-ink">
                  Impossible de charger les échéances
                </Text>
                <Pressable onPress={() => load("loading")} className="active:opacity-70">
                  <Text className="font-inter-semibold text-[14px] text-primary">Réessayer</Text>
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

      <AddEcheanceModal
        visible={adding || editing !== null}
        echeance={editing}
        nextOrdre={nextOrdre}
        onClose={closeForm}
        onSave={async (data) => {
          const message = editing
            ? await updateEcheance(editing.public_key, data)
            : await createEcheance(data, anneeName);
          closeForm();
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text numberOfLines={1} className="font-inter text-[11px] text-muted">{label}</Text>
      <Text numberOfLines={1} className="mt-0.5 font-inter-semibold text-[15px] text-ink">{value}</Text>
    </View>
  );
}

const ACTION_TONES = {
  neutral: { box: "bg-page", text: "text-ink", color: "#1B2A41" },
  primary: { box: "bg-soft", text: "text-primary", color: "#2B5EA8" },
  danger: { box: "bg-red-50", text: "text-red-600", color: "#DC2626" },
} as const;

function CardAction({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: keyof typeof ACTION_TONES;
  onPress: () => void;
}) {
  const t = ACTION_TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className={`h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl ${t.box} active:opacity-70`}
    >
      <Ionicons name={icon} size={17} color={t.color} />
      <Text numberOfLines={1} className={`font-inter-semibold text-[13px] ${t.text}`}>{label}</Text>
    </Pressable>
  );
}
