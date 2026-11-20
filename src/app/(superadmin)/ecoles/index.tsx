import { getAllAnnees } from "@/api/annees";
import { getClasses } from "@/api/classes";
import { getSalles } from "@/api/salles";
import { getAllEleves } from "@/api/eleves";
import {
  createEtablissement,
  getEtablissements,
  typeEtablissementLabel,
} from "@/api/etablissements";
import { getUtilisateurs } from "@/api/utilisateurs";
import AddEtablissementModal from "@/components/gestion/AddEtablissementModal";
import PasswordReveal from "@/components/gestion/PasswordReveal";
import FilterChips from "@/components/ui/FilterChips";
import FixedHeader from "@/components/ui/FixedHeader";
import SearchBar from "@/components/ui/SearchBar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { fmt, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

type Status = "active" | "pending" | "suspended";

type School = {
  id: string;
  /** public_key de l'établissement (GET /etablissements), "" s'il n'est connu que par ses données */
  key: string;
  name: string;
  city: string;
  type: string;
  status: Status;
  students: number;
  personnel: number;
  classes: number;
  salles: number;
  note?: string;
};

/* ---------- Données de la base ---------- */

const truthy = (v: unknown) => v === true || v === 1 || v === "1";

/** L'unique élément d'un ensemble, sinon null (aucun ou plusieurs : on ne devine pas) */
const onlyOne = <T,>(set: Set<T> | undefined) =>
  set?.size === 1 ? [...set][0] : null;

type Building = School & {
  activeYear: boolean;
  apiStatus: "" | Status;
  effectif: number;
};

/**
 * Établissements de la base : GET /etablissements, complété par ce qui y est rattaché
 * (utilisateurs, années, classes, élèves). Regroupés par nom : la base donne parfois deux clés pour la même école.
 */
async function loadSchools(): Promise<School[]> {
  const [etabs, users, annees, classes, eleves, salles] =
    await Promise.allSettled([
      getEtablissements(),
      getUtilisateurs(),
      getAllAnnees(),
      getClasses(),
      getAllEleves(),
      getSalles(),
    ]);
  if ([etabs, users, annees, classes].every((r) => r.status === "rejected")) {
    throw new Error("Aucune source n'a répondu");
  }
  const ok = <T,>(r: PromiseSettledResult<T[]>): T[] =>
    r.status === "fulfilled" ? r.value : [];

  const map = new Map<string, Building>();
  const get = (name: string | undefined) => {
    const id = normalize(name ?? "");
    if (!id) return null;
    let s = map.get(id);
    if (!s) {
      s = {
        id,
        key: "",
        name: name ?? "",
        city: "",
        type: "",
        status: "pending",
        students: 0,
        personnel: 0,
        classes: 0,
        salles: 0,
        activeYear: false,
        apiStatus: "",
        effectif: 0,
      };
      map.set(id, s);
    }
    return s;
  };

  // Clé d'établissement → établissement : classes et salles ne donnent souvent que la clé
  const byKey = new Map<string, Building>();
  const link = (key: string | undefined, s: Building | null) => {
    if (key && s && !byKey.has(key)) byKey.set(key, s);
  };
  /** Par nom d'abord, sinon par clé */
  const find = (name: string | undefined, key: string | undefined) =>
    (name ? get(name) : null) ?? (key ? (byKey.get(key) ?? null) : null);

  for (const e of ok(etabs)) {
    const s = get(e.name);
    if (!s) continue;
    link(e.public_key, s);
    s.key ||= e.public_key;
    s.city ||= e.city;
    s.type ||= e.type;
    s.apiStatus ||= e.status;
  }
  for (const u of ok(users)) {
    const s = get(u.etablissement?.name);
    if (!s) continue;
    link(u.etablissement?.public_key, s);
    if (u.roles?.personnel) s.personnel += 1;
    s.type ||= u.etablissement?.type ?? "";
  }
  // Année → établissement, pour les classes qui ne donnent que leur année
  const etabOfAnnee = new Map<string, Building>();
  // Nom d'année (« 2026-2027 ») → établissements qui en ont une de ce nom
  const etabsOfAnneeName = new Map<string, Set<Building>>();
  for (const a of ok(annees)) {
    const s = find(a.etab_name, a.etab_public_key);
    if (!s) continue;
    link(a.etab_public_key, s);
    if (a.public_key) etabOfAnnee.set(a.public_key, s);
    const n = normalize(a.name);
    if (n)
      etabsOfAnneeName.set(n, (etabsOfAnneeName.get(n) ?? new Set()).add(s));
    if (truthy(a.is_active) && !truthy(a.is_closed)) s.activeYear = true;
  }
  // Salles : comptées par établissement ; salle → établissement pour les classes
  const etabOfSalle = new Map<string, Building>();
  for (const x of ok(salles)) {
    const s = find(x.etab_name, x.etab_public_key);
    if (!s) continue;
    link(x.etab_public_key, s);
    s.salles += 1;
    if (x.public_key) etabOfSalle.set(x.public_key, s);
  }
  let orphanClasses = 0;
  for (const c of ok(classes)) {
    const s =
      find(c.etab_name, c.etab_key) ??
      etabOfAnnee.get(c.annee_key) ??
      etabOfSalle.get(c.salle_key) ??
      onlyOne(etabsOfAnneeName.get(normalize(c.annee_name))) ??
      null;
    if (!s) {
      orphanClasses += 1;
      continue;
    }
    s.classes += 1;
    s.effectif += c.effectif_actuel ?? c.total_effectif ?? 0;
  }
  if (__DEV__ && orphanClasses > 0) {
    console.log(
      `Établissements : ${orphanClasses} classe(s) sans établissement reconnu (la réponse de GET /classes ne donne pas leur établissement)`,
    );
  }
  for (const e of ok(eleves)) {
    const s = e.etab_name ? map.get(normalize(e.etab_name)) : undefined;
    if (s) s.students += 1;
  }

  return [...map.values()]
    .map(({ activeYear, apiStatus, effectif, ...s }): School => {
      // Statut donné par la base ; sinon : actif s'il a une année scolaire en cours
      const status: Status = apiStatus || (activeYear ? "active" : "pending");
      return {
        ...s,
        // Élèves rattachés par GET /eleves, sinon l'effectif inscrit dans ses classes
        students: Math.max(s.students, effectif),
        type: typeEtablissementLabel(s.type),
        status,
        note:
          status === "suspended"
            ? "Accès suspendu"
            : status === "pending" && !apiStatus
              ? "Aucune année scolaire active"
              : undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

const STATUS = {
  active: { label: "Actif", badge: "bg-green-100", text: "text-green-700" },
  pending: {
    label: "À valider",
    badge: "bg-[#FFF1A8]",
    text: "text-[#7A5F00]",
  },
  suspended: { label: "Suspendu", badge: "bg-red-100", text: "text-red-700" },
} as const;

/* ---------- Écran ---------- */

export default function Ecoles() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loadState, setLoadState] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [adding, setAdding] = useState(false);
  // Identifiants du gérant après une création : affichés 3 minutes, puis oubliés
  const [access, setAccess] = useState<{
    school: string;
    email: string;
    password: string;
  } | null>(null);
  const hideAccess = useCallback(() => setAccess(null), []);
  const lastRequest = useRef(0);

  const load = useCallback(
    async (next: "loading" | "refreshing" | "silent") => {
      const request = ++lastRequest.current;
      if (next !== "silent") setLoadState(next);
      try {
        const list = await loadSchools();
        if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
        setSchools(list);
        setLoadState("idle");
      } catch {
        if (request === lastRequest.current && next !== "silent")
          setLoadState("failed");
      }
    },
    [],
  );

  useEffect(() => {
    load("loading");
    return () => {
      lastRequest.current++; // écran quitté : la réponse en cours est ignorée
    };
  }, [load]);

  // Retour sur l'onglet : la liste se met à jour sans indicateur
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) load("silent");
      focusedOnce.current = true;
    }, [load]),
  );

  const loading = loadState === "loading";
  const countOf = (s: Status) => schools.filter((x) => x.status === s).length;

  const totalStudents = schools.reduce((sum, s) => sum + s.students, 0);
  const totalPersonnel = schools.reduce((sum, s) => sum + s.personnel, 0);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return schools.filter((s) => {
      const matchesFilter = filter === "all" || s.status === filter;
      const matchesQuery =
        !q || normalize(`${s.name} ${s.city} ${s.type}`).includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [schools, query, filter]);

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      {/* Haut fixe : titre, résumé, recherche et filtres */}
      <FixedHeader>
        {/* Titre + bouton d'ajout */}
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="font-inter-bold text-[20px] leading-9 text-ink">
              Établissements
            </Text>
            <Text className="mt-1 font-inter text-[13px] text-muted">
              Tous les établissements de la plateforme
            </Text>
          </View>
          <Pressable
            onPress={() => setAdding(true)}
            accessibilityRole="button"
            accessibilityLabel="Nouvel établissement"
            className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Résumé */}
        <View className="flex-row rounded-3xl bg-white py-4 shadow-sm">
          <Summary
            value={loading ? "…" : String(schools.length)}
            label="Établissements"
          />
          <Summary
            value={loading ? "…" : fmt(totalStudents)}
            label="Élèves"
            bordered
          />
          <Summary
            value={loading ? "…" : fmt(totalPersonnel)}
            label="Personnel"
            bordered
          />
        </View>

        {/* Recherche + filtres */}
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un établissement ou une ville"
        />
        <FilterChips
          selected={filter}
          onSelect={(k) => setFilter(k as "all" | Status)}
          chips={[
            { key: "all", label: "Tous", count: schools.length },
            { key: "active", label: "Actifs", count: countOf("active") },
            { key: "pending", label: "À valider", count: countOf("pending") },
            {
              key: "suspended",
              label: "Suspendus",
              count: countOf("suspended"),
            },
          ]}
        />
      </FixedHeader>

      {/* Seule la liste défile, sous les filtres */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadState === "refreshing"}
            onRefresh={() => load("refreshing")}
            tintColor="#2B5EA8"
            colors={["#2B5EA8"]}
          />
        }
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {access && (
            <PasswordReveal
              school={access.school}
              email={access.email}
              password={access.password}
              onDone={hideAccess}
            />
          )}

          <Text className="font-inter text-xs text-muted">
            {loading
              ? "Chargement…"
              : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""}`}
          </Text>

          {/* Liste */}
          {loading ? (
            <SkeletonList />
          ) : loadState === "failed" ? (
            <View className="items-center gap-3 rounded-3xl bg-white py-12">
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="#9AA7B8"
              />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Impossible de charger les établissements
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
          ) : filtered.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="search-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Aucun établissement trouvé
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                Essayez un autre nom ou un autre filtre.
              </Text>
            </View>
          ) : (
            filtered.map((s) => {
              const st = STATUS[s.status];
              return (
                <Pressable
                  key={s.id}
                  disabled={!s.key}
                  onPress={() =>
                    router.push({
                      pathname: "/(superadmin)/ecoles/etablissement-detail",
                      params: { public_key: s.key, name: s.name },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={s.name}
                  className="gap-3 rounded-3xl bg-white p-4 shadow-sm active:opacity-90"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color="#2B5EA8"
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-inter-semibold text-[15px] text-ink"
                      >
                        {s.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="font-inter text-xs text-muted"
                      >
                        {[s.city, s.type].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${st.badge}`}>
                      <Text
                        className={`font-inter-semibold text-xs ${st.text}`}
                      >
                        {st.label}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px bg-line" />

                  <View className="flex-row">
                    <Metric value={fmt(s.students)} label="Élèves" />
                    <Metric value={String(s.personnel)} label="Personnel" />
                    <Metric value={String(s.classes)} label="Classes" />
                    <Metric value={String(s.salles)} label="Salles" />
                  </View>
                  {s.note && (
                    <Text
                      className={`font-inter text-[13px] ${
                        s.status === "suspended"
                          ? "text-red-600"
                          : "text-[#7A5F00]"
                      }`}
                    >
                      {s.note}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <AddEtablissementModal
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={async (input) => {
          const { message, password } = await createEtablissement(input);
          setAdding(false);
          if (password) {
            showToast(message);
            setAccess({ school: input.name, email: input.dir_mail, password });
          } else {
            // Compte créé, mais le serveur n'a pas renvoyé le mot de passe généré
            showToast(
              `${message} Le mot de passe généré n'a pas été renvoyé par le serveur.`,
              "error",
            );
          }
          load("refreshing");
        }}
      />
    </View>
  );
}

/* ---------- Petits composants ---------- */

function Summary({
  value,
  label,
  bordered,
}: {
  value: string;
  label: string;
  bordered?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center ${bordered ? "border-l border-line" : ""}`}
    >
      <Text className="font-inter-bold text-2xl text-primary">{value}</Text>
      <Text className="font-inter text-xs text-muted">{label}</Text>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1">
      <Text className="font-inter-semibold text-[15px] text-ink">{value}</Text>
      <Text className="font-inter text-[11px] text-muted">{label}</Text>
    </View>
  );
}
