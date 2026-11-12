import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

type Child = {
  id: string;
  firstName: string;
  fullName: string;
  classe: string;
  school: string;
  average: string;
  delta: string;
  absences: number;
  absenceDate: string;
  messages: number;
  results: {
    id: string;
    subject: string;
    detail: string;
    score: number;
    icon: IconName;
  }[];
  lastMessage: { from: string; meta: string; preview: string; unread: boolean };
};

// Données de démonstration : à remplacer par ton API
const CHILDREN: Child[] = [
  {
    id: "1",
    firstName: "Amadou",
    fullName: "Amadou Diallo",
    classe: "3e A",
    school: "Collège des Almadies · Année 2026–2027",
    average: "15,2/20",
    delta: "+1,4 point",
    absences: 1,
    absenceDate: "Mardi 6 octobre",
    messages: 3,
    results: [
      {
        id: "r1",
        subject: "Mathématiques",
        detail: "Contrôle · 5 octobre",
        score: 17,
        icon: "calculator-outline",
      },
      {
        id: "r2",
        subject: "Français",
        detail: "Expression écrite · 2 octobre",
        score: 14,
        icon: "book-outline",
      },
    ],
    lastMessage: {
      from: "Mme Ndiaye · Français",
      meta: "Aujourd'hui, 08:15 · Non lu",
      preview:
        "Amadou progresse à l'oral. Pensons ensemble à préparer sa prochaine présentation.",
      unread: true,
    },
  },
  {
    id: "2",
    firstName: "Fatou",
    fullName: "Fatou Diallo",
    classe: "6e B",
    school: "Collège des Almadies · Année 2026–2027",
    average: "13,8/20",
    delta: "+0,6 point",
    absences: 0,
    absenceDate: "",
    messages: 1,
    results: [
      {
        id: "r3",
        subject: "Histoire-Géo",
        detail: "Interrogation · 4 octobre",
        score: 16,
        icon: "book-outline",
      },
      {
        id: "r4",
        subject: "Mathématiques",
        detail: "Devoir · 1 octobre",
        score: 12,
        icon: "calculator-outline",
      },
    ],
    lastMessage: {
      from: "M. Sow · Mathématiques",
      meta: "Hier, 16:40 · Lu",
      preview: "Fatou a bien participé en classe cette semaine.",
      unread: false,
    },
  },
];

const QUICK_ACTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "q1", label: "Emploi du temps", icon: "calendar-outline" },
  { id: "q2", label: "Documents", icon: "document-text-outline" },
  { id: "q3", label: "Établissement", icon: "business-outline" },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState(CHILDREN[0].id);
  const child = CHILDREN.find((c) => c.id === selectedId) ?? CHILDREN[0];

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
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="font-inter-bold text-base text-primary">
                NAFEMA
              </Text>
              <Text className="font-inter text-xs text-muted">
                Espace parent
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
      >
        {/* Contenu centré et limité en largeur (tablettes) */}
        <View className="w-full max-w-[640px] gap-5 self-center px-5 py-2">
          {/* Bienvenue */}
          <View>
            <Text className="font-inter-semibold text-xs tracking-wide text-muted">
              {today}
            </Text>
            <Text className="mt-1 font-inter-bold text-[26px] leading-8 text-ink">
              Bienvenue M/Mme Koffi
            </Text>
          </View>

          {/* Mes enfants */}
          <View className="gap-3">
            <SectionHeader
              title="Mes enfants"
              action={`${CHILDREN.length} enfants`}
            />
            <View className="flex-row gap-3">
              {CHILDREN.map((c) => {
                const active = c.id === selectedId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedId(c.id)}
                    className={`flex-1 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3 active:opacity-90 ${
                      active ? "bg-primary" : "bg-white"
                    }`}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={active ? "#FFE600" : "#2B5EA8"}
                    />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className={`font-inter-semibold text-[15px] ${active ? "text-white" : "text-ink"}`}
                      >
                        {c.firstName}
                      </Text>
                      <Text
                        className={`font-inter text-xs ${active ? "text-white/70" : "text-muted"}`}
                      >
                        {c.classe}
                      </Text>
                    </View>
                    {active && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Carte résumé de l'enfant */}
          <View className="rounded-3xl bg-primary p-5">
            <Text className="font-inter-bold text-[22px] text-white">
              {child.fullName}
            </Text>
            <Text className="mt-1 font-inter text-[13px] text-white/70">
              {child.school}
            </Text>

            <View className="my-4 h-px bg-white/20" />

            <View className="flex-row items-end justify-between gap-4">
              <View>
                <Text className="font-inter-bold text-[34px] leading-10 text-white">
                  {child.average}
                </Text>
                <Text className="font-inter text-[13px] text-white/70">
                  Moyenne générale
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-inter-bold text-[17px] text-accent">
                  {child.delta}
                </Text>
                <Text className="font-inter text-[13px] text-white/70">
                  Depuis le trimestre passé
                </Text>
              </View>
            </View>
          </View>

          {/* Absences + messages */}
          <View className="flex-row gap-3">
            <StatCard
              value={String(child.absences)}
              icon="calendar-outline"
              label={
                child.absences > 1
                  ? "Absences à justifier"
                  : "Absence à justifier"
              }
              sub={child.absences > 0 ? child.absenceDate : "Aucune absence"}
              subClass={child.absences > 0 ? "text-red-600" : "text-muted"}
            />
            <StatCard
              value={String(child.messages)}
              icon="chatbubble-outline"
              label="Nouveaux messages"
              sub="Équipe pédagogique"
              subClass="text-muted"
            />
          </View>

          {/* Derniers résultats */}
          <View className="gap-3">
            <SectionHeader title="Derniers résultats" action="Bulletin" />
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              {child.results.map((r, i) => {
                const good = r.score >= 16;
                return (
                  <View
                    key={r.id}
                    className={`flex-row items-center gap-3 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <IconBox name={r.icon} />
                    <View className="flex-1">
                      <Text className="font-inter-semibold text-[15px] text-ink">
                        {r.subject}
                      </Text>
                      <Text className="font-inter text-xs text-muted">
                        {r.detail}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${good ? "bg-green-100" : "bg-soft"}`}
                    >
                      <Text
                        className={`font-inter-semibold text-[13px] ${good ? "text-green-700" : "text-primary"}`}
                      >
                        {r.score}/20
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Bannière : absence à justifier */}
          {child.absences > 0 && (
            <View className="gap-4 rounded-3xl bg-[#FFF6BF] p-5">
              <View className="gap-1">
                <Text className="font-inter-bold text-base text-ink">
                  Absence à justifier
                </Text>
                <Text className="font-inter text-[13px] leading-5 text-ink/80">
                  {child.firstName} était absent(e){" "}
                  {child.absenceDate.toLowerCase()}. Transmettez un justificatif
                  à la vie scolaire.
                </Text>
              </View>
              <Pressable className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80">
                <Text className="font-inter-semibold text-[15px] text-white">
                  Justifier l'absence
                </Text>
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* Messages */}
          <View className="gap-3">
            <SectionHeader title="Messages" action="Ouvrir" />
            <View className="gap-3 rounded-3xl bg-white p-4 shadow-sm">
              <View className="flex-row items-center gap-3">
                <IconBox name="chatbubble-outline" />
                <View className="flex-1">
                  <Text className="font-inter-semibold text-[15px] text-ink">
                    {child.lastMessage.from}
                  </Text>
                  <Text className="font-inter text-xs text-muted">
                    {child.lastMessage.meta}
                  </Text>
                </View>
                {child.lastMessage.unread && (
                  <View className="rounded-full bg-soft px-3 py-1">
                    <Text className="font-inter-semibold text-xs text-primary">
                      Nouveau
                    </Text>
                  </View>
                )}
              </View>
              <Text className="font-inter text-[13px] leading-5 text-muted">
                {child.lastMessage.preview}
              </Text>
            </View>
          </View>

          {/* Accès rapides */}
          <View className="flex-row gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                className="flex-1 items-center gap-2.5 rounded-2xl bg-white px-2 py-4 shadow-sm active:opacity-80"
              >
                <Ionicons name={a.icon} size={22} color="#2B5EA8" />
                <Text className="text-center font-inter-semibold text-xs text-ink">
                  {a.label}
                </Text>
              </Pressable>
            ))}
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

function IconBox({ name }: { name: IconName }) {
  return (
    <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
      <Ionicons name={name} size={20} color="#2B5EA8" />
    </View>
  );
}

function StatCard({
  value,
  icon,
  label,
  sub,
  subClass,
}: {
  value: string;
  icon: IconName;
  label: string;
  sub: string;
  subClass: string;
}) {
  return (
    <View className="flex-1 rounded-3xl bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between">
        <Text className="font-inter-bold text-[32px] leading-9 text-primary">
          {value}
        </Text>
        <Ionicons name={icon} size={20} color="#6B7A90" />
      </View>
      <Text className="mt-3 font-inter-semibold text-[14px] text-ink">
        {label}
      </Text>
      <Text className={`mt-0.5 font-inter text-xs ${subClass}`}>{sub}</Text>
    </View>
  );
}
