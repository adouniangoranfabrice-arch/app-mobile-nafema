import { Fill } from "@/components/PlatformStats";
import SchoolStats from "@/components/SchoolStats";
import { useLogout } from "@/hooks/use-logout";
import { useReveal } from "@/hooks/use-reveal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Données de démonstration (à remplacer par ton API) ---------- */

const SCHOOL = {
  name: "Collège des Almadies",
  place: "Dakar · Établissement privé",
  term: "1er trimestre · Semaine 5",
  open: true,
};

const TEACHERS = 32;
const ABSENCES_TODAY = 19;

const GROUPS = [
  { id: "g1", label: "6e", classes: 5, students: 138, capacity: 160 },
  { id: "g2", label: "5e", classes: 5, students: 132, capacity: 156 },
  { id: "g3", label: "4e – 3e", classes: 8, students: 216, capacity: 224 },
];

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
    singular: "invitation d'enseignant",
    plural: "invitations d'enseignants",
    detail: "En attente d'acceptation",
    icon: "mail-outline",
  },
  {
    id: "q2",
    count: 3,
    singular: "justificatif d'absence",
    plural: "justificatifs d'absence",
    detail: "Justificatifs transmis par les parents",
    icon: "document-text-outline",
  },
];

/* ---------- Écran ---------- */

export default function AdminHome() {
  const signOut = useLogout();
  const insets = useSafeAreaInsets();
  const { revealed, scrollProps, track } = useReveal();

  // Chiffres calculés à partir des données
  const totalStudents = GROUPS.reduce((s, g) => s + g.students, 0);
  const totalClasses = GROUPS.reduce((s, g) => s + g.classes, 0);
  const totalRequests = REQUESTS.reduce((s, r) => s + r.count, 0);
  const presence = Math.round(
    ((totalStudents - ABSENCES_TODAY) / totalStudents) * 100,
  );
  const pendingInvites = REQUESTS[0].count;

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
        <View className="flex-row gap-40 top-5 px-5 py-2">
          <View className="flex-row  gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-canvas">
              <Image
                source={require("@/assets/images/logo_nefama.png")}
                className="h-9 w-9"
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="font-inter-bold text-base text-primary">
                NAFEMA
              </Text>
              <Text className="font-inter text-xs text-muted">
                Espace admin école
              </Text>
            </View>
          </View>

          <View>
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80">
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#2B5EA8"
              />
              <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
            </Pressable>
          </View>
        </View>
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
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-semibold text-xs tracking-wide text-muted">
                {today}
              </Text>
              <Text className="mt-1 font-inter-bold text-[28px] leading-9 text-ink">
                Mon établissement
              </Text>
              <Text className="mt-1 font-inter text-[13px] text-muted">
                Bonjour, Mariama · Année 2026–2027
              </Text>
            </View>
            <Pressable
              onPress={signOut}
              className="h-14 w-14 items-center justify-center rounded-full bg-soft active:opacity-80"
            >
              <Text className="font-inter-bold text-base text-primary">MN</Text>
            </Pressable>
          </View>

          {/* Carte établissement */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="business-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-[22px] text-white">
                  {SCHOOL.name}
                </Text>
                <Text className="font-inter text-[13px] text-white/70">
                  {SCHOOL.place}
                </Text>
              </View>
            </View>

            <View className="my-4 h-px bg-white/20" />

            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-inter text-[13px] text-white">
                {SCHOOL.term}
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${SCHOOL.open ? "bg-green-100" : "bg-white/20"}`}
              >
                <Text
                  className={`font-inter-semibold text-xs ${SCHOOL.open ? "text-green-700" : "text-white"}`}
                >
                  {SCHOOL.open ? "Ouvert" : "Fermé"}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistiques 2 x 2 */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard
                value={String(totalStudents)}
                icon={
                  <Ionicons name="school-outline" size={20} color="#6B7A90" />
                }
                label="Élèves inscrits"
                sub="+12 cette semaine"
              />
              <StatCard
                value={String(TEACHERS)}
                icon={
                  <Ionicons name="easel-outline" size={20} color="#6B7A90" />
                }
                label="Enseignants"
                sub={`${pendingInvites} invitations en attente`}
              />
            </View>
            <View className="flex-row gap-3">
              <StatCard
                value={String(totalClasses)}
                icon={
                  <Ionicons name="business-outline" size={20} color="#6B7A90" />
                }
                label="Classes"
                sub="De la 6e à la 3e"
              />
              <StatCard
                value={`${presence} %`}
                icon={
                  <MaterialCommunityIcons
                    name="account-check-outline"
                    size={20}
                    color="#6B7A90"
                  />
                }
                label="Présence du jour"
                sub={`${ABSENCES_TODAY} absences signalées`}
              />
            </View>
          </View>

          {/* Statistiques calculées à partir des données de l'application */}
          <View {...track("stats")}>
            <SchoolStats school={SCHOOL.name} start={revealed("stats")} />
          </View>

          {/* Actions rapides */}
          <View className="flex-row gap-3">
            <QuickAction label="Inscrire un élève" icon="person-add-outline" />
            <QuickAction label="Créer une classe" icon="add" />
          </View>

          {/* À traiter */}
          <View className="gap-3">
            <SectionHeader
              title="À traiter"
              action={`${totalRequests} demandes`}
            />
            <View className="gap-4 rounded-3xl bg-[#FFF6BF] p-5">
              {REQUESTS.map((r, i) => (
                <View key={r.id}>
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
                  </View>
                </View>
              ))}

              <Pressable className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80">
                <Text className="font-inter-semibold text-[15px] text-white">
                  Examiner les demandes
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Répartition des classes */}
          <View className="gap-3" {...track("groups")}>
            <SectionHeader title="Répartition des classes" action="Gérer" />
            <View className="gap-4 rounded-3xl bg-white p-4 shadow-sm">
              {GROUPS.map((g, i) => {
                const fill = Math.min(
                  100,
                  Math.round((g.students / g.capacity) * 100),
                );
                return (
                  <View key={g.id} className="gap-2">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-inter-semibold text-[14px] text-ink">
                        {g.label} · {g.classes} classes
                      </Text>
                      <Text className="font-inter text-[13px] text-muted">
                        {g.students} élèves
                      </Text>
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-soft">
                      <Fill
                        start={revealed("groups")}
                        delay={i * 80}
                        width={fill}
                        color="#2B5EA8"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Petits composants ---------- */

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-inter-bold text-lg text-ink">{title}</Text>
      <Pressable hitSlop={8}>
        <Text className="font-inter-semibold text-[13px] text-primary">
          {action}
        </Text>
      </Pressable>
    </View>
  );
}

function StatCard({
  value,
  icon,
  label,
  sub,
}: {
  value: string;
  icon: ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm">
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
  );
}

function QuickAction({ label, icon }: { label: string; icon: IconName }) {
  return (
    <Pressable className="flex-1 items-center gap-2.5 rounded-2xl bg-white px-2 py-4 shadow-sm active:opacity-80">
      <Ionicons name={icon} size={22} color="#2B5EA8" />
      <Text className="text-center font-inter-semibold text-[13px] text-ink">
        {label}
      </Text>
    </Pressable>
  );
}
