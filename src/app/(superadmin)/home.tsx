import { getMe, User } from "@/api/auth";
import PlatformStats from "@/components/PlatformStats";
import { MotionView, PressScale, Reveal } from "@/components/ui/MotionView";
import { useLogout } from "@/hooks/use-logout";
import { useReveal } from "@/hooks/use-reveal";
import { initials } from "@/utils/text";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Données de démonstration (à remplacer par ton API) ---------- */

const PLATFORM = {
  schools: 48,
  activeSchools: 45,
  users: 12840,
  students: 8420,
  uptime: "99,9 %",
  checkedAt: "09:40",
};

const REQUESTS: {
  id: string;
  count: number;
  singular: string;
  plural: string;
  detail: string;
  icon: IconName;
}[] = [
  {
    id: "q1",
    count: 2,
    singular: "établissement à valider",
    plural: "établissements à valider",
    detail: "Demandes reçues depuis hier",
    icon: "business-outline",
  },
  {
    id: "q2",
    count: 1,
    singular: "signalement à examiner",
    plural: "signalements à examiner",
    detail: "Accès utilisateur · Priorité normale",
    icon: "shield-outline",
  },
];

type SchoolStatus = "active" | "pending";

const SCHOOLS: {
  id: string;
  name: string;
  detail: string;
  status: SchoolStatus;
}[] = [
  {
    id: "e1",
    name: "Lycée Excellence",
    detail: "Thiès · 642 utilisateurs",
    status: "active",
  },
  {
    id: "e2",
    name: "Collège des Almadies",
    detail: "Dakar · 824 utilisateurs",
    status: "active",
  },
  {
    id: "e3",
    name: "École Horizon",
    detail: "Saint-Louis · Dossier du 6 oct.",
    status: "pending",
  },
];

const SCHOOL_STATUS = {
  active: { label: "Actif", badge: "bg-green-100", text: "text-green-700" },
  pending: {
    label: "À valider",
    badge: "bg-[#FFF1A8]",
    text: "text-[#7A5F00]",
  },
} as const;

// Connexions par jour (le dernier jour est « aujourd'hui »)
const WEEK = [
  { id: "w1", day: "J", value: 336 },
  { id: "w2", day: "V", value: 497 },
  { id: "w3", day: "S", value: 242 },
  { id: "w4", day: "D", value: 188 },
  { id: "w5", day: "L", value: 578 },
  { id: "w6", day: "M", value: 685 },
  { id: "w7", day: "M", value: 754, today: true },
];

const CHART_HEIGHT = 96;

// Décalage entre deux éléments qui apparaissent l'un après l'autre
const STEP_MS = 60;

/* ---------- Formatage ---------- */

const fmt = (n: number) =>
  n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const pct = (a: number, b: number, decimals = 0) =>
  ((a / b) * 100).toFixed(decimals).replace(".", ",");

/* ---------- Écran ---------- */

export default function PlatformHome() {
  const signOut = useLogout();
  const insets = useSafeAreaInsets();
  const { revealed, scrollProps, track } = useReveal();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {}); // sans profil, l'accueil reste utilisable : « Bonjour » sans nom
    return () => {
      active = false;
    };
  }, []);

  // Une section s'anime quand elle arrive à l'écran
  const section = (key: string, delay = 0) => ({
    start: revealed(key),
    delay,
    ...track(key),
  });

  const totalRequests = REQUESTS.reduce((s, r) => s + r.count, 0);
  const weekTotal = WEEK.reduce((s, w) => s + w.value, 0);
  const maxValue = Math.max(...WEEK.map((w) => w.value));

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
        {...scrollProps}
      >
        {/* Contenu centré et limité en largeur (tablettes) */}
        <View className="w-full max-w-[640px] gap-5 self-center px-5">
          {/* Titre + avatar (touche l'avatar pour revenir au login) */}
          <Reveal {...section("title")}>
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="font-inter-semibold text-xs tracking-wide text-muted">
                  {today}
                </Text>
                <Text className="mt-1 font-inter-bold text-[28px] leading-9 text-ink">
                  Vue d'ensemble
                </Text>
                <Text className="mt-1 font-inter text-[13px] text-muted">
                  Bonjour{user ? `, ${user.full_name}` : ""} · gestion NAFEMA
                </Text>
              </View>
              <PressScale className="h-14 w-14 items-center justify-center rounded-full bg-soft active:opacity-80">
                {user ? (
                  <Text className="font-inter-bold text-base text-primary">
                    {initials(user.full_name)}
                  </Text>
                ) : (
                  <Ionicons name="person-outline" size={22} color="#2B5EA8" />
                )}
              </PressScale>
            </View>
          </Reveal>

          {/* État des services */}
          <Reveal {...section("services", STEP_MS)}>
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={24}
                    color="#FFE600"
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-inter-bold text-xl text-white">
                    Tous les services actifs
                  </Text>
                  <Text className="font-inter text-[13px] text-white/70">
                    Dernière vérification à {PLATFORM.checkedAt}
                  </Text>
                </View>
              </View>

              <View className="my-4 h-px bg-white/20" />

              <View className="flex-row items-center justify-between">
                <Text className="font-inter text-[14px] text-white">
                  Disponibilité ce mois
                </Text>
                <Text className="font-inter-bold text-[22px] text-accent">
                  {PLATFORM.uptime}
                </Text>
              </View>
            </View>
          </Reveal>

          {/* Statistiques 2 x 2 */}
          <View className="gap-3" {...track("cards")}>
            <View className="flex-row gap-3">
              <StatCard
                start={revealed("cards")}
                delay={2 * STEP_MS}
                value={String(PLATFORM.schools)}
                icon={
                  <Ionicons name="business-outline" size={20} color="#6B7A90" />
                }
                label="Établissements"
                sub="+3 ce mois"
              />
              <StatCard
                start={revealed("cards")}
                delay={3 * STEP_MS}
                value={fmt(PLATFORM.users)}
                icon={
                  <Ionicons name="people-outline" size={20} color="#6B7A90" />
                }
                label="Utilisateurs"
                sub="+286 cette semaine"
              />
            </View>
            <View className="flex-row gap-3">
              <StatCard
                start={revealed("cards")}
                delay={4 * STEP_MS}
                value={fmt(PLATFORM.students)}
                icon={
                  <Ionicons name="school-outline" size={20} color="#6B7A90" />
                }
                label="Élèves"
                sub={`${pct(PLATFORM.students, PLATFORM.users, 1)} % des utilisateurs`}
              />
              <StatCard
                start={revealed("cards")}
                delay={5 * STEP_MS}
                value={`${pct(PLATFORM.activeSchools, PLATFORM.schools)} %`}
                icon={
                  <Ionicons name="pulse-outline" size={20} color="#6B7A90" />
                }
                label="Écoles actives"
                sub={`${PLATFORM.activeSchools} sur ${PLATFORM.schools} cette semaine`}
              />
            </View>
          </View>

          {/* Statistiques calculées à partir des données de l'application */}
          <Reveal {...section("stats")}>
            <PlatformStats start={revealed("stats")} />
          </Reveal>

          {/* gestion */}
          <Reveal {...section("requests")}>
            <View className="gap-3">
              <SectionHeader title="gestion" action="Centre de contrôle" />
              <View className="gap-4 rounded-3xl bg-[#FFF6BF] p-4">
                {REQUESTS.map((r, i) => (
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
                          {r.count} {r.count > 1 ? r.plural : r.singular}
                        </Text>
                        <Text className="font-inter text-xs text-[#7A5F00]">
                          {r.detail}
                        </Text>
                      </View>
                      <Text className="font-inter-bold text-[13px] text-[#7A5F00]">
                        {r.count}
                      </Text>
                    </View>
                  </Reveal>
                ))}

                <PressScale className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80">
                  <Text className="font-inter-semibold text-[15px] text-white">
                    Traiter les demandes{totalRequests > 0 ? "" : ""}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </PressScale>
              </View>
            </View>
          </Reveal>

          {/* Établissements récents */}
          <Reveal {...section("schools")}>
            <View className="gap-3">
              <SectionHeader
                title="Établissements récents"
                action="Voir tout"
              />
              <View className="rounded-3xl bg-white px-4 shadow-sm">
                {SCHOOLS.map((s, i) => {
                  const st = SCHOOL_STATUS[s.status];
                  return (
                    <Reveal
                      key={s.id}
                      start={revealed("schools")}
                      delay={(i + 1) * STEP_MS}
                    >
                      <View
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
                          <Text className="font-inter-semibold text-[15px] text-ink">
                            {s.name}
                          </Text>
                          <Text className="font-inter text-xs text-muted">
                            {s.detail}
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
                    </Reveal>
                  );
                })}
              </View>
            </View>
          </Reveal>

          {/* Activité de la plateforme */}
          <Reveal {...section("activity")}>
            <View className="gap-3">
              <SectionHeader
                title="Activité de la plateforme"
                action="Rapports"
              />
              <View className="rounded-3xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center gap-3">
                  <Text className="font-inter-bold text-[28px] leading-9 text-ink">
                    {fmt(weekTotal)}
                  </Text>
                  <View className="rounded-full bg-green-100 px-2.5 py-1">
                    <Text className="font-inter-semibold text-xs text-green-700">
                      +18 %
                    </Text>
                  </View>
                </View>
                <Text className="font-inter text-[13px] text-muted">
                  Connexions cette semaine
                </Text>

                {/* Histogramme */}
                <View
                  className="mt-5 flex-row items-end gap-2.5"
                  style={{ height: CHART_HEIGHT }}
                >
                  {WEEK.map((w, i) => (
                    <Column
                      key={w.id}
                      start={revealed("activity")}
                      delay={i * STEP_MS}
                      height={Math.max(8, (w.value / maxValue) * CHART_HEIGHT)}
                      color={w.today ? "#FFE600" : "#2B5EA8"}
                    />
                  ))}
                </View>
                <View className="mt-2 flex-row gap-2.5">
                  {WEEK.map((w) => (
                    <Text
                      key={w.id}
                      className="flex-1 text-center font-inter text-[11px] text-muted"
                    >
                      {w.day}
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
              label="Ajouter une école"
              icon={
                <Ionicons name="business-outline" size={22} color="#2B5EA8" />
              }
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
            />
            <QuickAction
              start={revealed("actions")}
              delay={2 * STEP_MS}
              label="Exporter"
              icon={
                <Ionicons name="download-outline" size={22} color="#2B5EA8" />
              }
            />
          </View>
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
    if (start) {
      current.value = withDelay(delay, withTiming(height, { duration: 500 }));
    }
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

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-1 font-inter-bold text-lg text-ink">{title}</Text>
      <Pressable hitSlop={8}>
        <Text className="font-inter-semibold text-[13px] text-primary">
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
}: {
  start: boolean;
  delay: number;
  value: string;
  icon: ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Reveal start={start} delay={delay} style={{ flex: 1 }}>
      <View className="grow rounded-3xl bg-white p-4 shadow-sm">
        <View className="flex-row items-start justify-between">
          <Text className="font-inter-bold text-[32px] leading-9 text-primary">
            {value}
          </Text>
          {icon}
        </View>
        <Text className="mt-3 font-inter-semibold text-[14px] text-ink">
          {label}
        </Text>
        <Text className="mt-0.5 font-inter text-xs text-muted">{sub}</Text>
      </View>
    </Reveal>
  );
}

function QuickAction({
  start,
  delay,
  label,
  icon,
}: {
  start: boolean;
  delay: number;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Reveal start={start} delay={delay} style={{ flex: 1 }}>
      <PressScale
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
