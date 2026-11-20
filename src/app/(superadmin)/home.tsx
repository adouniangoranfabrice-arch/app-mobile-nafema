import { Card, Fill, Split, Tile } from "@/components/PlatformStats";
import { MotionView, PressScale, Reveal } from "@/components/ui/MotionView";
import { Skeleton } from "@/components/ui/Skeleton";
import { fcfa } from "@/data/finances";
import { useGo } from "@/hooks/use-go";
import { useLogout } from "@/hooks/use-logout";
import {
  FICTIF_PLATEFORME,
  usePlatformDashboard,
} from "@/hooks/use-platform-dashboard";
import { useReveal } from "@/hooks/use-reveal";
import { initials } from "@/utils/text";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const SCHOOL_TYPES: Record<string, string> = {
  PRIVE: "Privé",
  PUBLIC: "Public",
};

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const CHART_HEIGHT = 96;
// Décalage entre deux éléments qui apparaissent l'un après l'autre
const STEP_MS = 60;

/* ---------- Formatage ---------- */

const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const percent = (a: number, b: number) =>
  b > 0 ? Math.round((a / b) * 100) : 0;
const plural = (n: number) => (n > 1 ? "s" : "");
const gestion = (screen: string) => `/(superadmin)/gestion/${screen}` as Href;

/* ---------- Écran ---------- */

/**
 * Accueil du super admin. Vraies données : services API, établissements (reconstitués à partir des
 * utilisateurs, années, classes, salles), utilisateurs, élèves, DRENA, IEPP, classes, salles, niveaux,
 * cycles, séries, frais. Encore fictives (marquées « Fictif ») : demandes à traiter, connexions de la semaine.
 */
export default function PlatformHome() {
  const signOut = useLogout();
  const go = useGo();
  const insets = useSafeAreaInsets();
  const { revealed, scrollProps, track } = useReveal();
  const { data, status, reload } = usePlatformDashboard();

  const loading = status === "loading";
  const user = data?.user ?? null;

  // Une section s'anime quand elle arrive à l'écran
  const section = (key: string, delay = 0) => ({
    start: revealed(key),
    delay,
    ...track(key),
  });
  const v = (value: string) => (loading ? null : value);

  const etabs = data?.etablissements ?? [];
  const activeSchools = etabs.filter((e) => e.active).length;
  const publics = etabs.filter((e) => e.type === "PUBLIC").length;
  const prives = etabs.filter((e) => e.type === "PRIVE").length;

  const users = data?.utilisateurs ?? null;
  const personnels = users?.filter((u) => u.roles?.personnel).length ?? 0;
  const parents = users?.filter((u) => u.roles?.parent).length ?? 0;

  const eleves = data?.eleves ?? null;
  const students = eleves?.length ?? FICTIF_PLATEFORME.students;
  const girls = eleves?.filter((e) => e.gender === "F").length ?? 0;
  const boys = eleves?.filter((e) => e.gender === "M").length ?? 0;

  const services = data?.services ?? { ok: 0, total: 0, down: [] };
  const allUp = services.total > 0 && services.ok === services.total;
  const checkedAt =
    data?.checkedAt.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }) ?? "";

  const requests: {
    id: string;
    count: number;
    label: string;
    detail: string;
    icon: IconName;
  }[] = [
    {
      id: "q1",
      count: FICTIF_PLATEFORME.pendingSchools,
      label: `établissement${plural(FICTIF_PLATEFORME.pendingSchools)} à valider`,
      detail: "Demandes reçues · fictif",
      icon: "business-outline",
    },
    {
      id: "q2",
      count: FICTIF_PLATEFORME.reports,
      label: `signalement${plural(FICTIF_PLATEFORME.reports)} à examiner`,
      detail: "Accès utilisateur · fictif",
      icon: "shield-outline",
    },
  ];

  // Connexions fictives : le dernier jour est aujourd'hui
  const week = FICTIF_PLATEFORME.week;
  const weekTotal = week.reduce((s, x) => s + x, 0);
  const maxValue = Math.max(...week);
  const todayIndex = new Date().getDay();
  const weekDays = week.map(
    (_, i) => DAYS[(todayIndex - (week.length - 1 - i) + 70) % 7],
  );

  const maxByCycle = Math.max(
    1,
    ...(data?.classesByCycle ?? []).map((c) => c.count),
  );

  const today = new Date()
    .toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      {/* En-tête */}
      <View className=" items-center bg-white py-8">
        <MotionView>
          <View className="flex-row gap-40 top-5 px-5 py-2">
            <View className="flex-row  gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-canvas">
                <Image
                  source={require("@/assets/images/logo_nefama.png")}
                  style={{ width: 36, height: 36 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text className="font-inter-bold text-base text-primary">
                  NAFEMA
                </Text>
                <Text className="font-inter text-xs text-muted">
                  Espace super admin
                </Text>
              </View>
            </View>

            <View>
              <PressScale className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80">
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#2B5EA8"
                />
                <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
              </PressScale>
            </View>
          </View>
        </MotionView>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top - 30,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={status === "refreshing"}
            onRefresh={reload}
            tintColor="#2B5EA8"
          />
        }
        {...scrollProps}
      >
        <View className="w-full max-w-[640px] gap-5 self-center px-5">
          {/* Titre + avatar (touche l'avatar pour se déconnecter) */}
          <Reveal {...section("title")}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-inter-semibold text-xs tracking-wide text-muted">
                  {today}
                </Text>
                <Text className="mt-1 font-inter-bold text-[28px] leading-9 text-ink">
                  Vue d&apos;ensemble
                </Text>
                <Text className="mt-1 font-inter text-[13px] text-muted">
                  Bonjour{user ? `, ${user.full_name}` : ""} · gestion NAFEMA
                </Text>
              </View>
              <PressScale
                onPress={signOut}
                className="h-14 w-14 items-center justify-center rounded-full bg-soft active:opacity-80"
              >
                {user ? (
                  <Text className="font-inter-bold text-base text-primary">
                    {initials(user.full_name)}
                  </Text>
                ) : loading ? (
                  <Skeleton width={56} height={56} radius={28} />
                ) : (
                  <Ionicons name="person-outline" size={22} color="#2B5EA8" />
                )}
              </PressScale>
            </View>
          </Reveal>

          {/* Chiffres clés 2 x 2 */}
          <View className="gap-3" {...track("cards")}>
            <View className="flex-row gap-3">
              <StatCard
                start={revealed("cards")}
                delay={2 * STEP_MS}
                value={v(String(etabs.length))}
                icon={
                  <Ionicons name="business-outline" size={20} color="#6B7A90" />
                }
                label="Établissements"
                sub={
                  publics + prives > 0
                    ? `${publics} public${plural(publics)} · ${prives} privé${plural(prives)}`
                    : "D'après les données"
                }
              />
              <StatCard
                start={revealed("cards")}
                delay={3 * STEP_MS}
                value={v(users ? fmt(users.length) : "—")}
                icon={
                  <Ionicons name="people-outline" size={20} color="#6B7A90" />
                }
                label="Utilisateurs"
                sub={
                  users
                    ? `${personnels} personnel${plural(personnels)} · ${parents} parent${plural(parents)}`
                    : "Liste indisponible"
                }
                onPress={() => go(gestion("utilisateurs"))}
              />
            </View>
            <View className="flex-row gap-3">
              <StatCard
                start={revealed("cards")}
                delay={4 * STEP_MS}
                value={v(fmt(students))}
                icon={
                  <Ionicons name="school-outline" size={20} color="#6B7A90" />
                }
                label="Élèves"
                sub={
                  eleves
                    ? girls + boys > 0
                      ? `${girls} fille${plural(girls)} · ${boys} garçon${plural(boys)}`
                      : `${fmt(data?.placesClasses ?? 0)} places en classe`
                    : "Liste des élèves indisponible"
                }
                fictif={!loading && !eleves}
              />
              <StatCard
                start={revealed("cards")}
                delay={5 * STEP_MS}
                value={v(`${percent(activeSchools, etabs.length)} %`)}
                icon={
                  <Ionicons name="pulse-outline" size={20} color="#6B7A90" />
                }
                label="Établissements actifs"
                sub={`${activeSchools} sur ${etabs.length} avec une année ouverte`}
              />
            </View>
          </View>

          {/* Statistiques de gestion : vraies données */}
          <Reveal {...section("stats")}>
            <View className="gap-3">
              <View>
                <Text className="font-inter-bold text-lg text-ink">
                  Statistiques de gestion
                </Text>
                <Text className="font-inter text-xs text-muted">
                  Données de la base
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.drenas ?? 0}
                  label="DRENA"
                  icon="map-outline"
                />
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.iepps ?? 0}
                  label="IEPP"
                  icon="git-branch-outline"
                />
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.annees.length ?? 0}
                  label="Années"
                  icon="calendar-outline"
                />
              </View>
              <View className="flex-row gap-3">
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.classes.length ?? 0}
                  label="Classes"
                  icon="school-outline"
                />
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.salles.length ?? 0}
                  label="Salles"
                  icon="easel-outline"
                />
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.niveaux ?? 0}
                  label="Niveaux"
                  icon="layers-outline"
                />
              </View>

              {eleves && girls + boys > 0 && (
                <Card title="Répartition des élèves">
                  <Split
                    start={revealed("stats") && !loading}
                    a={{ label: "Filles", value: girls }}
                    b={{ label: "Garçons", value: boys }}
                  />
                </Card>
              )}

              {publics + prives > 0 && (
                <Card title="Types d'établissements">
                  <Split
                    start={revealed("stats") && !loading}
                    a={{ label: "Publics", value: publics }}
                    b={{ label: "Privés", value: prives }}
                  />
                </Card>
              )}

              <Card title="Classes par cycle">
                {loading ? (
                  <Skeleton width="70%" height={14} />
                ) : (data?.classesByCycle.length ?? 0) === 0 ? (
                  <Text className="font-inter text-[13px] text-muted">
                    Aucune classe enregistrée.
                  </Text>
                ) : (
                  data!.classesByCycle.map((c, i) => (
                    <View key={c.name} className="gap-1.5">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text
                          numberOfLines={1}
                          className="flex-1 font-inter text-[13px] text-muted"
                        >
                          {c.name}
                        </Text>
                        <Text className="font-inter-semibold text-[13px] text-ink">
                          {c.count}
                        </Text>
                      </View>
                      <View className="h-3">
                        <Fill
                          start={revealed("stats")}
                          delay={i * 80}
                          width={(c.count / maxByCycle) * 100}
                          color="#2B5EA8"
                        />
                      </View>
                    </View>
                  ))
                )}
                <Text className="font-inter text-xs text-muted">
                  {data?.cycles ?? 0} cycle{plural(data?.cycles ?? 0)}
                  {data?.series !== null && data?.series !== undefined
                    ? ` · ${data.series} série${plural(data.series)}`
                    : ""}
                </Text>
              </Card>

              <View className="flex-row gap-3">
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.placesClasses ?? 0}
                  label="Places en classe"
                  icon="people-outline"
                />
                <Tile
                  start={revealed("stats") && !loading}
                  value={data?.placesSalles ?? 0}
                  label="Places en salle"
                  icon="grid-outline"
                />
              </View>

              <Pressable
                onPress={() => go(gestion("frais"))}
                className="active:opacity-80"
              >
                <Card title="Frais configurés">
                  <View className="flex-row items-end justify-between gap-3">
                    {loading ? (
                      <Skeleton width={150} height={22} />
                    ) : (
                      <Text className="font-inter-bold text-[22px] text-primary">
                        {fcfa(data?.fraisTotal ?? 0)}
                      </Text>
                    )}
                    <Text className="font-inter text-[13px] text-muted">
                      {data?.frais.length ?? 0} frais
                    </Text>
                  </View>
                </Card>
              </Pressable>
            </View>
          </Reveal>

          {/* Demandes à traiter : fictives */}
          <Reveal {...section("requests")}>
            <View className="gap-3">
              <SectionHeader
                title="À traiter"
                action="Centre de contrôle"
                onPress={() => go(gestion("index"))}
              />
              <View className="gap-4 rounded-3xl bg-[#FFF6BF] p-4">
                {requests.map((r, i) => (
                  <Reveal
                    key={r.id}
                    start={revealed("requests")}
                    delay={(i + 1) * STEP_MS}
                  >
                    {i > 0 && <View className="mb-4 h-px bg-[#E6DC8F]" />}
                    <View className="flex-row items-center gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
                        <Ionicons name={r.icon} size={20} color="#2B5EA8" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-inter-semibold text-[15px] text-ink">
                          {r.count} {r.label}
                        </Text>
                        <Text className="font-inter text-xs text-[#7A5F00]">
                          {r.detail}
                        </Text>
                      </View>
                    </View>
                  </Reveal>
                ))}
              </View>
            </View>
          </Reveal>

          {/* Établissements : vraies données */}
          <Reveal {...section("schools")}>
            <View className="gap-3">
              <SectionHeader
                title="Établissements"
                action="Voir tout"
                onPress={() => go("/(superadmin)/ecoles" as Href)}
              />
              <View className="rounded-3xl bg-white px-4 shadow-sm">
                {loading ? (
                  <View className="gap-3 py-4">
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="60%" height={14} />
                  </View>
                ) : etabs.length === 0 ? (
                  <Text className="py-4 font-inter text-[13px] text-muted">
                    Aucun établissement trouvé.
                  </Text>
                ) : (
                  etabs.slice(0, 5).map((s, i) => (
                    <View
                      key={s.name}
                      className={`flex-row items-center gap-3 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                    >
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
                          {[
                            SCHOOL_TYPES[s.type] ?? s.type,
                            `${s.classes} classe${plural(s.classes)}`,
                            `${s.users} utilisateur${plural(s.users)}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      </View>
                      <View
                        className={`rounded-full px-3 py-1 ${s.active ? "bg-green-100" : "bg-[#FFF1A8]"}`}
                      >
                        <Text
                          className={`font-inter-semibold text-xs ${s.active ? "text-green-700" : "text-[#7A5F00]"}`}
                        >
                          {s.active ? "Actif" : "Sans année"}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </Reveal>

          {/* Activité de la plateforme : fictive (pas encore d'API de connexions) */}
          <Reveal {...section("activity")}>
            <View className="gap-3">
              <SectionHeader
                title="Activité de la plateforme"
                action="Fictif"
              />
              <View className="rounded-3xl bg-white p-4 shadow-sm">
                <Text className="font-inter-bold text-[28px] leading-9 text-ink">
                  {fmt(weekTotal)}
                </Text>
                <Text className="font-inter text-[13px] text-muted">
                  Connexions cette semaine (fictif)
                </Text>

                <View
                  className="mt-5 flex-row items-end gap-2.5"
                  style={{ height: CHART_HEIGHT }}
                >
                  {week.map((value, i) => (
                    <Column
                      key={i}
                      start={revealed("activity")}
                      delay={i * STEP_MS}
                      height={Math.max(8, (value / maxValue) * CHART_HEIGHT)}
                      color={i === week.length - 1 ? "#FFE600" : "#2B5EA8"}
                    />
                  ))}
                </View>
                <View className="mt-2 flex-row gap-2.5">
                  {weekDays.map((d, i) => (
                    <Text
                      key={i}
                      className="flex-1 text-center font-inter text-[11px] text-muted"
                    >
                      {d}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </Reveal>

          {/* Actions rapides */}
          <View className="flex-row gap-3" {...track("actions")}>
            <QuickAction
              start={revealed("actions")}
              delay={0}
              label="Établissements"
              icon={
                <Ionicons name="business-outline" size={22} color="#2B5EA8" />
              }
              onPress={() => go("/(superadmin)/ecoles" as Href)}
            />
            <QuickAction
              start={revealed("actions")}
              delay={STEP_MS}
              label="Gérer les accès"
              icon={
                <MaterialCommunityIcons
                  name="account-cog-outline"
                  size={22}
                  color="#2B5EA8"
                />
              }
              onPress={() => go(gestion("utilisateurs"))}
            />
            <QuickAction
              start={revealed("actions")}
              delay={2 * STEP_MS}
              label="Classes"
              icon={
                <Ionicons name="school-outline" size={22} color="#2B5EA8" />
              }
              onPress={() => go(gestion("classes"))}
            />
          </View>

          <Text className="text-center font-inter text-[11px] text-muted">
            « Fictif » : chiffre de démonstration, en attendant l&apos;API
            correspondante.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Petits composants ---------- */

/** Une colonne de l'histogramme, qui monte depuis la base quand la section est visible */
function Column({
  start,
  delay,
  height,
  color,
}: {
  start: boolean;
  delay: number;
  height: number;
  color: string;
}) {
  const current = useSharedValue(0);

  useEffect(() => {
    if (start)
      current.value = withDelay(delay, withTiming(height, { duration: 500 }));
  }, [start, delay, height, current]);

  const columnStyle = useAnimatedStyle(() => ({ height: current.value }));

  return (
    <Animated.View
      style={[
        { flex: 1, borderRadius: 6, backgroundColor: color },
        columnStyle,
      ]}
    />
  );
}

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 font-inter-bold text-lg text-ink">{title}</Text>
      <Pressable hitSlop={8} onPress={onPress} disabled={!onPress}>
        <Text
          className={`font-inter-semibold text-[13px] ${onPress ? "text-primary" : "text-muted"}`}
        >
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

function StatCard({
  start,
  delay,
  value,
  icon,
  label,
  sub,
  fictif,
  onPress,
}: {
  start: boolean;
  delay: number;
  /** null : en chargement */
  value: string | null;
  icon: ReactNode;
  label: string;
  sub: string;
  fictif?: boolean;
  onPress?: () => void;
}) {
  return (
    <Reveal start={start} delay={delay} style={{ flex: 1 }}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="grow rounded-3xl bg-white p-4 shadow-sm active:opacity-80"
      >
        <View className="flex-row items-start justify-between">
          {value === null ? (
            <Skeleton width={64} height={32} />
          ) : (
            <Text className="font-inter-bold text-[32px] leading-9 text-primary">
              {value}
            </Text>
          )}
          {icon}
        </View>
        <View className="mt-3 flex-row items-center gap-1.5">
          <Text className="font-inter-semibold text-[14px] text-ink">
            {label}
          </Text>
          {fictif && (
            <View className="rounded-full bg-soft px-1.5 py-0.5">
              <Text className="font-inter-semibold text-[10px] text-muted">
                Fictif
              </Text>
            </View>
          )}
        </View>
        <Text
          numberOfLines={2}
          className="mt-0.5 font-inter text-xs text-muted"
        >
          {value === null ? " " : sub}
        </Text>
      </Pressable>
    </Reveal>
  );
}

function QuickAction({
  start,
  delay,
  label,
  icon,
  onPress,
}: {
  start: boolean;
  delay: number;
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Reveal start={start} delay={delay} style={{ flex: 1 }}>
      <PressScale
        onPress={onPress}
        style={{ flexGrow: 1 }}
        className="grow items-center gap-2.5 rounded-2xl bg-white px-2 py-4 shadow-sm active:opacity-80"
      >
        {icon}
        <Text className="text-center font-inter-semibold text-xs text-ink">
          {label}
        </Text>
      </PressScale>
    </Reveal>
  );
}
