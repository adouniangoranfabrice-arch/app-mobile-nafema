import { apiErrorMessage } from "@/api/client";
import {
  createPeriode,
  deletePeriode,
  getPeriodes,
  Periode,
  takePeriodesStale,
  updatePeriode,
} from "@/api/periodes";
import AddPeriodModal from "@/components/gestion/AddPeriodModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { PERIOD_STATUS, periodStatus } from "@/data/academic";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDeletePeriode } from "@/utils/confirm";
import { formatDate } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Periodes() {
  const router = useRouter();
  const { canEdit, canOpen, href } = useGestion();
  const listRef = useRef<FlatList<Periode>>(null);
  const lastRequest = useRef(0);

  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Periode | null>(null);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getPeriodes();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setPeriodes(all);
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
      if (takePeriodesStale()) load("refreshing");
    }, [load]),
  );

  const openDetail = (p: Periode) =>
    router.push(
      href("periode-detail", {
        public_key: p.public_key,
        ordre: String(p.ordre),
        name: p.name,
        type: p.type,
        debut: p.debut,
        fin: p.fin,
        is_locked: p.is_locked ? "1" : "0",
        annee_public_key: p.annee_public_key,
        annee_name: p.annee_name,
        cycle_public_key: p.cycle_public_key,
        cycle_slug: p.cycle_slug,
        cycle_name: p.cycle_name,
        cree_le: p.cree_le,
      }),
    );

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const remove = (p: Periode) =>
    confirmDeletePeriode(p, async () => {
      try {
        await deletePeriode(p.public_key);
        load("refreshing");
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
    });

  // Recherche par libellé, année, cycle, type ou « verrouillée »
  const q = normalize(query);
  const visible = periodes.filter(
    (p) =>
      !q ||
      normalize(
        `${p.name} ${p.annee_name} ${p.cycle_name} ${p.type} ${p.is_locked ? "verrouillee" : ""}`,
      ).includes(q),
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount); // la liste a pu raccourcir
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chaque page s'ouvre en haut de la liste
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

  const lockedCount = periodes.filter((p) => p.is_locked).length;
  const loading = status === "loading";
  const failed = status === "failed";

  const summary = loading
    ? "Chargement…"
    : `${periodes.length} enregistrée${plural(periodes.length)} · ${lockedCount} verrouillée${plural(lockedCount)}`;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        {/* En-tête avec retour */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
          </Pressable>
          <View className="flex-1">
            <Text className="font-inter-bold text-[24px] leading-8 text-ink">
              Périodes
            </Text>
            <Text className="font-inter text-[13px] text-muted">{summary}</Text>
          </View>
        </View>

        {/* Recherche */}
        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder="Rechercher une période, une année, un cycle"
        />

        {/* Bouton d'ajout */}
        {canEdit && (
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              Ajouter une période
            </Text>
          </Pressable>
        )}
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={(p) => p.public_key}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
        renderItem={({ item }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-4">
            <PeriodeCard
              periode={item}
              canEdit={canEdit}
              onOpen={() => openDetail(item)}
              onEdit={() => setEditing(item)}
              onDelete={
                canOpen("suppression-periodes")
                  ? () => remove(item)
                  : undefined
              }
            />
          </View>
        )}
        ListEmptyComponent={
          loading || failed ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center gap-2 rounded-3xl bg-white py-12">
                <Ionicons name="layers-outline" size={28} color="#9AA7B8" />
                <Text className="font-inter-semibold text-[15px] text-ink">
                  Aucune période trouvée
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
                  Impossible de charger les périodes
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
      <AddPeriodModal
        visible={adding || editing !== null}
        period={editing}
        onClose={closeForm}
        onSave={async (data) => {
          if (editing) {
            await updatePeriode(editing.public_key, data);
            closeForm();
            load("refreshing");
            showToast("Période modifiée avec succès.");
            return;
          }
          const message = await createPeriode(data);
          closeForm();
          load("refreshing");
          showToast(message);
        }}
      />
    </View>
  );
}

function PeriodeCard({
  periode: p,
  canEdit,
  onOpen,
  onEdit,
  onDelete,
}: {
  periode: Periode;
  canEdit: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const start = fromISO(p.debut);
  const end = fromISO(p.fin);
  const st = PERIOD_STATUS[periodStatus({ start, end })];

  return (
    <View className="gap-3 rounded-3xl bg-white p-4 shadow-sm">
      {/* Un clic sur la partie haute ouvre le détail */}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={p.name}
        className="flex-row items-center gap-3 active:opacity-80"
      >
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
          <Ionicons name="layers-outline" size={20} color="#2B5EA8" />
        </View>
        <View className="flex-1">
          <Text className="font-inter-bold text-[16px] text-ink">{p.name}</Text>
          <Text
            numberOfLines={1}
            className="font-inter-semibold text-xs text-primary"
          >
            {p.annee_name}
          </Text>
          <Text className="font-inter text-xs text-muted">
            {p.cycle_name} · {p.type} n°{p.ordre}
          </Text>
          <Text className="font-inter text-xs text-muted">
            {formatDate(start)} – {formatDate(end)}
          </Text>
        </View>
        <View className="items-end gap-1.5">
          <View className={`rounded-full px-3 py-1 ${st.badge}`}>
            <Text className={`font-inter-semibold text-xs ${st.text}`}>
              {st.label}
            </Text>
          </View>
          {!!p.is_locked && (
            <View className="flex-row items-center gap-1 rounded-full bg-[#FFF1A8] px-2.5 py-1">
              <Ionicons name="lock-closed" size={11} color="#7A5F00" />
              <Text className="font-inter-semibold text-[11px] text-[#7A5F00]">
                Verrouillée
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      <View className="h-px bg-line" />

      {/* Voir / Modifier / Supprimer */}
      <View className="flex-row gap-2">
        <ActionButton icon="eye-outline" label="Voir" onPress={onOpen} />
        {canEdit && (
          <ActionButton
            icon="create-outline"
            label="Modifier"
            onPress={onEdit}
          />
        )}
        {onDelete && (
          <ActionButton
            icon="trash-outline"
            label="Supprimer"
            variant="danger"
            onPress={onDelete}
          />
        )}
      </View>
    </View>
  );
}
