import { getMe, User } from "@/api/auth";
import { useLogout } from "@/hooks/use-logout";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { initials } from "@/utils/text";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Données de démonstration (à remplacer par ton API) ---------- */

// L'activité fictive de chaque classe (les classes elles-mêmes viennent de useTeacherClasses)
type Activity = {
  attendance: { done: boolean; time: string; present: number; note: string };
  task: { title: string; submitted: number; due: string };
};

const NO_ACTIVITY: Activity = {
  attendance: {
    done: false,
    time: "—",
    present: 0,
    note: "L'appel n'a pas encore été fait pour ce cours.",
  },
  task: { title: "Aucun devoir", submitted: 0, due: "—" },
};

const ACTIVITY: Record<string, Activity> = {
  cl3: {
    attendance: {
      done: true,
      time: "08:00",
      present: 2,
      note: "1 absent signalé à la vie scolaire. Les parents ont été informés.",
    },
    task: { title: "Contrôle de géométrie", submitted: 2, due: "9 novembre" },
  },
  cl1: {
    attendance: {
      done: false,
      time: "10:00",
      present: 0,
      note: "L'appel n'a pas encore été fait pour ce cours.",
    },
    task: { title: "Devoir d'équations", submitted: 1, due: "12 novembre" },
  },
  cl2: {
    attendance: {
      done: false,
      time: "13:00",
      present: 0,
      note: "L'appel n'a pas encore été fait pour ce cours.",
    },
    task: {
      title: "Exercices sur les fonctions",
      submitted: 0,
      due: "14 novembre",
    },
  },
};

type CourseStatus = "done" | "next" | "todo";

const SCHEDULE: {
  id: string;
  start: string;
  end: string;
  classId: string;
  topic: string;
  status: CourseStatus;
}[] = [
  {
    id: "s1",
    start: "08:00",
    end: "09:00",
    classId: "cl3",
    topic: "Théorème de Thalès",
    status: "done",
  },
  {
    id: "s2",
    start: "10:00",
    end: "11:00",
    classId: "cl1",
    topic: "Équations",
    status: "next",
  },
  {
    id: "s3",
    start: "13:00",
    end: "14:00",
    classId: "cl2",
    topic: "Fonctions affines",
    status: "todo",
  },
];

const STATUS = {
  done: {
    label: "Terminé",
    icon: "checkmark-done-outline",
    badge: "bg-green-100",
    text: "text-green-700",
  },
  next: {
    label: "Prochain",
    icon: "time-outline",
    badge: "bg-soft",
    text: "text-primary",
  },
  todo: {
    label: "À venir",
    icon: "time-outline",
    badge: "bg-slate-100",
    text: "text-muted",
  },
} as const;

const QUICK_ACTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "q1", label: "Créer un devoir", icon: "add" },
  { id: "q2", label: "Publier un cours", icon: "cloud-upload-outline" },
  { id: "q3", label: "Contacter", icon: "paper-plane-outline" },
];

/* ---------- Écran ---------- */

export default function TeacherHome() {
  const signOut = useLogout();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const teacherClasses = useTeacherClasses();
  const [selectedId, setSelectedId] = useState("");
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

  const userDetail = [user?.personnel?.profession, user?.etablissement?.name]
    .filter(Boolean)
    .join(" · ");

  // Les vraies classes, avec leur activité fictive
  const classes = teacherClasses.map((c) => ({
    ...c,
    ...(ACTIVITY[c.id] ?? NO_ACTIVITY),
  }));
  const selected = classes.find((c) => c.id === selectedId) ?? classes[0];

  const schedule = SCHEDULE.flatMap((s) => {
    const classe = classes.find((c) => c.id === s.classId);
    return classe ? [{ ...s, classe }] : [];
  });
  const nextCourse = schedule.find((s) => s.status === "next");

  const pendingCopies = classes.reduce((sum, c) => sum + c.task.submitted, 0);
  const pendingTasks = classes.filter((c) => c.task.submitted > 0).length;

  const plural = (n: number) => (n > 1 ? "s" : "");

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
                Espace Enseignant
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
        <View className="w-full max-w-[640px] gap-5 self-center px-5">
          {/* Bonjour + avatar (touche l'avatar pour revenir au login) */}
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-semibold text-xs tracking-wide text-muted">
                {today}
              </Text>
              <Text className="mt-1 font-inter-bold text-[26px] leading-8 text-ink">
                Bonjour{user ? `, ${user.full_name}` : ""}
              </Text>
              {!!userDetail && (
                <Text className="mt-1 font-inter text-[13px] text-muted">
                  {userDetail}
                </Text>
              )}
            </View>
            <Pressable
              onPress={signOut}
              className="h-14 w-14 items-center justify-center rounded-full bg-soft active:opacity-80"
            >
              {user ? (
                <Text className="font-inter-bold text-base text-primary">
                  {initials(user.full_name)}
                </Text>
              ) : (
                <Ionicons name="person-outline" size={22} color="#2B5EA8" />
              )}
            </Pressable>
          </View>

          {/* Prochain cours */}
          {/* {nextCourse && (
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-start justify-between">
                <Text className="font-inter-bold text-xs tracking-wider text-accent">
                  PROCHAIN COURS · {nextCourse.start}
                </Text>
                <Ionicons name="easel-outline" size={22} color="#FFFFFF" />
              </View>

              <Text className="mt-3 font-inter-bold text-[28px] leading-9 text-white">
                {nextCourse.classe.name} · {nextCourse.topic}
              </Text>
              <Text className="mt-1 font-inter text-[13px] text-white/70">
                {nextCourse.classe.students} élève
                {plural(nextCourse.classe.students)} · {nextCourse.classe.room}{" "}
                · {nextCourse.start} – {nextCourse.end}
              </Text>

              <Pressable className="mt-4 h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-white active:opacity-90">
                <MaterialCommunityIcons
                  name="account-check-outline"
                  size={20}
                  color="#2B5EA8"
                />
              </Pressable>
            </View>
          )} */}

          {/* Statistiques */}
          <View className="flex-row gap-3">
            <StatCard
              value={String(schedule.length)}
              icon={
                <Ionicons name="calendar-outline" size={20} color="#6B7A90" />
              }
              label="Cours aujourd'hui"
              sub={
                schedule.length > 0
                  ? `De ${schedule[0].start} à ${schedule[schedule.length - 1].end}`
                  : "Aucun cours prévu"
              }
            />
            <StatCard
              value={String(pendingCopies)}
              icon={
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={20}
                  color="#6B7A90"
                />
              }
              label="Copies à corriger"
              sub={`${pendingTasks} devoir${plural(pendingTasks)} en attente`}
            />
          </View>

          {/* Mes classes */}
          <View className="gap-3">
            <SectionHeader
              title="Mes classes"
              action={`${classes.length} classe${plural(classes.length)}`}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {classes.map((c) => {
                const active = c.id === selected?.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedId(c.id)}
                    className={`min-w-[104px] rounded-2xl border-[1.5px] px-4 py-3 active:opacity-90 ${
                      active
                        ? "border-primary bg-soft"
                        : "border-transparent bg-white"
                    }`}
                  >
                    <Text
                      className={`font-inter-bold text-base ${active ? "text-primary" : "text-ink"}`}
                    >
                      {c.name}
                    </Text>
                    <Text className="font-inter text-xs text-muted">
                      {c.students} élève{plural(c.students)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Ouvre la liste des élèves de la classe choisie */}
            {selected && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(teacher)/classes/eleves",
                    params: { classe: selected.id },
                  } as Href)
                }
                accessibilityRole="button"
                className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-soft active:opacity-80"
              >
                <Ionicons name="people-outline" size={18} color="#2B5EA8" />
                <Text className="font-inter-semibold text-[14px] text-primary">
                  Voir les élèves de {selected.name}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Programme du jour */}
          <View className="gap-3">
            <SectionHeader title="Programme du jour" action="Planning" />
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              {schedule.map((s, i) => {
                const st = STATUS[s.status];
                return (
                  <View
                    key={s.id}
                    className={`flex-row items-center gap-3 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <IconBox name={st.icon} />
                    <View className="flex-1">
                      <Text className="font-inter-semibold text-[15px] text-ink">
                        {s.start} · {s.classe.name}
                      </Text>
                      <Text className="font-inter text-xs text-muted">
                        {s.topic} · {s.classe.room}
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
                );
              })}
            </View>
          </View>

          {selected && (
            <>
              <WorkToCorrect
                name={selected.name}
                task={selected.task}
                total={selected.students}
              />
              <Attendance
                name={selected.name}
                attendance={selected.attendance}
                total={selected.students}
              />
            </>
          )}

          {/* Actions rapides */}
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

function WorkToCorrect({
  name,
  task,
  total,
}: {
  name: string;
  task: Activity["task"];
  total: number;
}) {
  const submitted = Math.min(task.submitted, total);
  const progress = total ? Math.round((submitted / total) * 100) : 0;
  const s = submitted > 1 ? "s" : "";

  return (
    <View className="gap-3">
      <SectionHeader title="Travaux à corriger" action="Tout voir" />
      <View className="gap-3 rounded-3xl bg-[#FFF6BF] p-5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter-semibold text-[15px] text-ink">
            {name} · {task.title}
          </Text>
          <Text className="font-inter-semibold text-[13px] text-[#7A5F00]">
            {submitted} copie{s}
          </Text>
        </View>

        <Text className="font-inter text-[13px] text-[#7A5F00]">
          {submitted} remise{s} sur {total} · Échéance le {task.due}
        </Text>

        <View className="h-2 overflow-hidden rounded-full bg-[#D9E0EE]">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </View>

        <Pressable className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80">
          <Text className="font-inter-semibold text-[15px] text-white">
            Commencer la correction
          </Text>
          <Ionicons name="create-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function Attendance({
  name,
  attendance,
  total,
}: {
  name: string;
  attendance: Activity["attendance"];
  total: number;
}) {
  return (
    <View className="gap-3">
      <SectionHeader title={`Présence · ${name}`} action="Détails" />
      <View className="gap-2 rounded-3xl bg-white p-4 shadow-sm">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 font-inter-semibold text-[15px] text-ink">
            Appel de {attendance.time}{" "}
            {attendance.done ? "effectué" : "à faire"}
          </Text>
          <View
            className={`rounded-full px-3 py-1 ${attendance.done ? "bg-green-100" : "bg-soft"}`}
          >
            <Text
              className={`font-inter-semibold text-xs ${attendance.done ? "text-green-700" : "text-primary"}`}
            >
              {attendance.done
                ? `${Math.min(attendance.present, total)}/${total}`
                : "À faire"}
            </Text>
          </View>
        </View>
        <Text className="font-inter text-[13px] leading-5 text-muted">
          {attendance.note}
        </Text>
      </View>
    </View>
  );
}

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
