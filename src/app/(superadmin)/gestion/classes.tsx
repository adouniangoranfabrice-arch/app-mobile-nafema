// Classes (GET /classes) : ajout, voir, modifier et supprimer
import {
  Classe,
  createClasse,
  deleteClasse,
  getClasses,
  classeStatus,
  takeClassesStale,
  updateClasse,
} from "@/api/classes";
import { getMe } from "@/api/auth";
import { apiErrorMessage } from "@/api/client";
import { SkeletonList } from "@/components/ui/Skeleton";
import AddClasseModal from "@/components/gestion/AddClasseModal";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { confirmDelete } from "@/utils/confirm";
import { ofSchool } from "@/utils/school";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
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

/** Écran Classes de la Gestion (super admin, admin école) */
export default function Classes() {
  return <ClassesScreen />;
}

/** L'établissement du compte connecté, pour l'onglet Classes de l'admin école */
type School = { key: string; name: string };

/**
 * Liste des classes. asTab : onglet Classes de l'admin école (pas de bouton retour,
 * seulement les classes de l'établissement du compte, détail dans la pile de l'onglet).
 */
export function ClassesScreen({ asTab = false }: { asTab?: boolean }) {
  const router = useRouter();
  const { canEdit, href } = useGestion();
  const listRef = useRef<FlatList<Classe>>(null);
  const lastRequest = useRef(0);

  const [school, setSchool] = useState<School | null>(null);
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
      // Onglet admin école : l'établissement du compte (GET /me) en même temps que les classes
      const [all, me] = await Promise.all([
        getClasses(),
        asTab ? getMe().catch(() => null) : Promise.resolve(null),
      ]);
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      const etab = me?.etablissement;
      const mine = etab ? { key: etab.public_key, name: etab.name } : null;
      setSchool(mine);
      setClasses(etab ? ofSchool(all, etab) : all);
      setStatus("idle");
    } catch {
      if (request === lastRequest.current) setStatus("failed");
    }
  }, [asTab]);

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

  // Dans l'onglet, le détail s'ouvre dans la pile de l'onglet : le retour revient à cette liste
  const detailHref = (params: Record<string, string>) =>
    asTab
      ? ({ pathname: "/(adminschool)/classes/classe-detail", params } as Href)
      : href("classe-detail", params);

  const openDetail = (c: Classe) =>
    router.push(
      detailHref({
        public_key: c.public_key,
        name: c.name,
        max_effectif: c.max_effectif === null ? "" : String(c.max_effectif),
        min_effectif: c.min_effectif === null ? "" : String(c.min_effectif),
        lang_v2: c.lang_v2,
        total_effectif: c.total_effectif === null ? "" : String(c.total_effectif),
        effectif_actuel: c.effectif_actuel === null ? "" : String(c.effectif_actuel),
        status: c.status,
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
        `${c.name} ${c.niveau_name} ${c.niveau_slug} ${c.serie_name} ${c.salle_name} ${c.annee_name} ${classeStatus(c.status)?.label ?? ""}`,
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

  const count = loading
    ? "Chargement…"
    : `${visible.length} classe${plural(visible.length)}`;
  const summary = asTab && school ? `${school.name} · ${count}` : count;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View className="flex-row items-center gap-3">
          {!asTab && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
            >
              <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
            </Pressable>
          )}
          <View className="flex-1">
            <Text
              className={`font-inter-bold text-ink ${asTab ? "text-[28px] leading-9" : "text-[20px] leading-8"}`}
            >
              Classes
            </Text>
            <Text numberOfLines={1} className="font-inter text-[13px] text-muted">
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
        renderItem={({ item }) => {
          // Mêmes colonnes que la liste du site : libellé, niveau, effectif max., effectif actuel, statut, année
          const st = classeStatus(item.status);
          return (
            <View className="w-full max-w-[640px] self-center px-5 pb-3">
              <View className="rounded-3xl bg-white p-4 shadow-sm">
                <Pressable
                  onPress={() => openDetail(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  className="active:opacity-70"
                >
                  {/* Libellé + statut */}
                  <View className="flex-row items-start justify-between gap-3">
                    <Text
                      numberOfLines={2}
                      className="flex-1 font-inter-bold text-[16px] text-ink"
                    >
                      {item.name}
                    </Text>
                    {st && (
                      <View
                        className={`rounded-full px-3 py-1 ${st.open === false ? "bg-red-600" : st.open ? "bg-green-100" : "bg-slate-100"}`}
                      >
                        <Text
                          className={`font-inter-semibold text-xs ${st.open === false ? "text-white" : st.open ? "text-green-700" : "text-muted"}`}
                        >
                          {st.label}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Niveau « Cinquième (5EME) » */}
                  <Text numberOfLines={1} className="mt-0.5 font-inter text-[13px] text-muted">
                    {item.niveau_name
                      ? item.niveau_slug
                        ? `${item.niveau_name} (${item.niveau_slug})`
                        : item.niveau_name
                      : "Niveau non renseigné"}
                  </Text>

                  {/* Effectif max., effectif actuel, année scolaire */}
                  <View className="mt-3 flex-row gap-2 rounded-2xl bg-page p-3">
                    <Figure label="Effectif max." value={item.max_effectif} />
                    <Figure label="Effectif actuel" value={item.effectif_actuel} />
                    <Figure label="Année scolaire" value={item.annee_name || null} />
                  </View>
                </Pressable>

                {/* Actions : trois boutons de même largeur, séparés de la carte par un trait */}
                <View className="mt-3 flex-row gap-2 border-t border-line pt-3">
                  <CardAction
                    icon="eye-outline"
                    label="Voir"
                    tone="neutral"
                    onPress={() => openDetail(item)}
                  />
                  {canEdit && (
                    <>
                      <CardAction
                        icon="create-outline"
                        label="Modifier"
                        tone="primary"
                        onPress={() => setEditing(item)}
                      />
                      <CardAction
                        icon="trash-outline"
                        label="Supprimer"
                        tone="danger"
                        onPress={() => remove(item)}
                      />
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

/** Une colonne chiffrée de la carte : libellé en petit, valeur en gras */
function Figure({ label, value }: { label: string; value: number | string | null }) {
  return (
    <View className="flex-1">
      <Text numberOfLines={1} className="font-inter text-[11px] text-muted">
        {label}
      </Text>
      <Text numberOfLines={1} className="mt-0.5 font-inter-semibold text-[15px] text-ink">
        {value === null || value === "" ? "—" : String(value)}
      </Text>
    </View>
  );
}

const ACTION_TONES = {
  neutral: { box: "bg-page", text: "text-ink", color: "#1B2A41" },
  primary: { box: "bg-soft", text: "text-primary", color: "#2B5EA8" },
  danger: { box: "bg-red-50", text: "text-red-600", color: "#DC2626" },
} as const;

/** Bouton d'action de la carte : icône + libellé, largeur partagée avec les autres */
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
      <Text numberOfLines={1} className={`font-inter-semibold text-[13px] ${t.text}`}>
        {label}
      </Text>
    </Pressable>
  );
}
