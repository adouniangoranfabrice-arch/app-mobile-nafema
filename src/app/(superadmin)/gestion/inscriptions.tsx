import { apiErrorMessage } from "@/api/client";
import {
  deleteInscription,
  getInscriptions,
  humanize,
  Inscription,
  takeInscriptionsStale,
  typeLabel,
} from "@/api/inscriptions";
import FilterChips from "@/components/ui/FilterChips";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useGestion } from "@/hooks/use-gestion";
import { Badge, IconButton } from "@/organisation/ui";
import { fromISO } from "@/organisation/helpers";
import { confirmDelete } from "@/utils/confirm";
import { formatDate } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, Text, View } from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

/** « 2026-11-16 19:59:18 » ou ISO → « 16 nov. 2026 » */
const shortDate = (raw: string) =>
  /^\d{4}-\d{2}-\d{2}/.test(raw) ? formatDate(fromISO(raw.slice(0, 10))) : raw;

/** Inscriptions (GET /inscriptions) : recherche, filtre par type, voir le détail, nouvelle inscription */
export default function Inscriptions() {
  const router = useRouter();
  const { canEdit, href } = useGestion();
  const listRef = useRef<FlatList<Inscription>>(null);
  const lastRequest = useRef(0);

  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [requestedPage, setRequestedPage] = useState(1);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getInscriptions();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      // Les plus récentes d'abord
      all.sort((a, b) => (b.cree_le || b.date).localeCompare(a.cree_le || a.date));
      setInscriptions(all);
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

  // Retour du formulaire après une nouvelle inscription : on recharge
  useFocusEffect(
    useCallback(() => {
      if (takeInscriptionsStale()) load("refreshing");
    }, [load]),
  );

  const openDetail = (i: Inscription) =>
    router.push(
      href("inscription-detail", {
        public_key: i.public_key,
        eleve_name: i.eleve_name,
        matricule: i.matricule,
        classe_name: i.classe_name,
        niveau_name: i.niveau_name,
        annee_name: i.annee_name,
        type: i.type,
        statut: i.statut,
        date: i.date,
        est_redoublant: i.est_redoublant ? "1" : "0",
        affectation: i.affectation,
        regime: i.regime,
        decision_fin_annee: i.decision_fin_annee,
      }),
    );

  const remove = (i: Inscription) =>
    confirmDelete(
      "Supprimer cette inscription ?",
      [i.eleve_name, i.matricule, i.annee_name].filter(Boolean).join(" · "),
      async () => {
        try {
          const message = await deleteInscription(i.public_key);
          load("refreshing");
          showToast(message);
        } catch (error) {
          showToast(apiErrorMessage(error), "error");
        }
      },
    );

  // Recherche par élève, type ou statut (comme sur le site), et aussi classe et année
  const q = normalize(query);
  const visible = inscriptions.filter(
    (i) =>
      (typeFilter === "all" || i.type === typeFilter) &&
      (!q ||
        normalize(
          `${i.eleve_name} ${i.matricule} ${typeLabel(i.type)} ${i.statut} ${humanize(i.statut)} ${i.classe_name} ${i.annee_name}`,
        ).includes(q)),
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
  const count = (t: string) => inscriptions.filter((i) => i.type === t).length;

  const summary = loading
    ? "Chargement…"
    : `${visible.length} inscription${plural(visible.length)} affichée${plural(visible.length)}`;

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
              Inscriptions
            </Text>
            <Text className="font-inter text-[13px] text-muted">{summary}</Text>
          </View>
        </View>

        {/* Recherche + bouton Filtrer */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <SearchBar
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setRequestedPage(1);
              }}
              placeholder="Rechercher par élève, type ou statut…"
            />
          </View>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Filtrer"
            accessibilityState={{ expanded: showFilters }}
            className={`h-[50px] w-[50px] items-center justify-center rounded-2xl border active:opacity-80 ${showFilters || typeFilter !== "all" ? "border-primary bg-soft" : "border-line bg-white"}`}
          >
            <Ionicons name="options-outline" size={20} color="#2B5EA8" />
          </Pressable>
        </View>

        {showFilters && (
          <FilterChips
            chips={[
              { key: "all", label: "Toutes", count: inscriptions.length },
              { key: "NOUVELLE", label: "Nouvelles", count: count("NOUVELLE") },
              { key: "REINSCRIPTION", label: "Réinscriptions", count: count("REINSCRIPTION") },
            ]}
            selected={typeFilter}
            onSelect={(k) => {
              setTypeFilter(k);
              setRequestedPage(1);
            }}
          />
        )}

        {/* Bouton d'ajout */}
        {canEdit && (
          <Pressable
            onPress={() => router.push(href("nouvelle-inscription"))}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              Nouvelle inscription
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
            <View className="rounded-3xl bg-white p-4 shadow-sm">
              <Pressable
                onPress={() => openDetail(item)}
                accessibilityRole="button"
                accessibilityLabel={item.eleve_name || "Inscription"}
                className="active:opacity-70"
              >
                {/* Matricule + statut */}
                <View className="flex-row items-center gap-2">
                  <Text
                    numberOfLines={1}
                    className="flex-1 font-mono text-[12px] text-muted"
                    style={{ fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) }}
                  >
                    {item.matricule || "Sans matricule"}
                  </Text>
                  {!!item.statut && <Badge label={humanize(item.statut)} tone="slate" />}
                </View>

                {/* Élève */}
                <Text numberOfLines={1} className="mt-1 font-inter-bold text-[16px] uppercase text-ink">
                  {item.eleve_name || "Élève non renseigné"}
                </Text>

                {/* Classe, année, date, redoublant */}
                <View className="mt-3 flex-row flex-wrap gap-y-2">
                  <Info label="Classe" value={item.classe_name || "Non attribuée"} muted={!item.classe_name} />
                  <Info label="Année scolaire" value={item.annee_name || "—"} />
                  <Info label="Date d'inscription" value={item.date ? shortDate(item.date) : "—"} />
                  <Info label="Redoublant" value={item.est_redoublant ? "Oui" : "Non"} />
                </View>

                {!!item.type && (
                  <View className="mt-3 flex-row">
                    <Badge
                      label={typeLabel(item.type)}
                      tone={item.type === "REINSCRIPTION" ? "purple" : "blue"}
                    />
                  </View>
                )}
              </Pressable>

              {/* Actions : encaisser, voir, supprimer */}
              <View className="mt-3 flex-row items-center gap-2 border-t border-line pt-3">
                {canEdit && (
                  <Pressable
                    onPress={() => router.push(href("paiements"))}
                    accessibilityRole="button"
                    accessibilityLabel={`Encaisser pour ${item.eleve_name}`}
                    className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-green-600 active:opacity-80"
                  >
                    <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
                    <Text className="font-inter-semibold text-[14px] text-white">Encaisser</Text>
                  </Pressable>
                )}
                {!canEdit && <View className="flex-1" />}
                <IconButton icon="eye-outline" color="#1B2A41" label="Voir" onPress={() => openDetail(item)} />
                {canEdit && (
                  <IconButton icon="trash-outline" color="#DC2626" label="Supprimer" onPress={() => remove(item)} />
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
                  Aucune inscription trouvée.
                </Text>
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
                  Impossible de charger les inscriptions
                </Text>
                <Pressable onPress={() => load("loading")} className="active:opacity-70">
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
    </View>
  );
}

/** Une information de la carte, sur une demi-largeur */
function Info({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View className="w-1/2 pr-2">
      <Text className="font-inter text-[11px] text-muted">{label}</Text>
      <Text numberOfLines={1} className={`font-inter-semibold text-[14px] ${muted ? "text-muted" : "text-ink"}`}>
        {value}
      </Text>
    </View>
  );
}
