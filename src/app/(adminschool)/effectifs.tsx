import { Annee, getAllAnnees } from "@/api/annees";
import { getMe } from "@/api/auth";
import { Classe, getClasses } from "@/api/classes";
import { Eleve, getAllEleves } from "@/api/eleves";
import { Card, Fill, Split, Tile } from "@/components/PlatformStats";
import FixedHeader from "@/components/ui/FixedHeader";
import { Stagger } from "@/components/ui/MotionView";
import { Skeleton } from "@/components/ui/Skeleton";
import { currentYear, ofYear } from "@/hooks/use-school-dashboard";
import { ofSchool } from "@/utils/school";
import { initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutAnimation, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

const plural = (n: number) => (n > 1 ? "s" : "");
const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

const fullName = (e: Eleve) => `${e.nom} ${e.prenoms}`.trim() || "Élève sans nom";

/** Une classe de l'année avec ses élèves */
type ClassStat = { classe: Classe; students: Eleve[]; count: number; capacity: number };

type Stats = {
  school: string;
  year: string;
  total: number;
  placed: number;
  seats: number;
  girls: number;
  boys: number;
  classes: ClassStat[];
  unassigned: Eleve[];
};

/** Élèves, classes et années de la base, ramenés à l'école du compte et à l'année en cours */
async function loadStats(): Promise<Stats> {
  const [me, annees, classes, eleves] = await Promise.allSettled([
    getMe(),
    getAllAnnees(),
    getClasses(),
    getAllEleves(),
  ]);
  // Sans classes ni élèves, il n'y a rien à afficher : c'est un échec
  if (classes.status === "rejected" && eleves.status === "rejected") throw classes.reason;

  const school = me.status === "fulfilled" ? (me.value.etablissement ?? null) : null;
  const year = currentYear(ofSchool(annees.status === "fulfilled" ? annees.value : ([] as Annee[]), school));
  const myClasses = ofYear(ofSchool(classes.status === "fulfilled" ? classes.value : [], school), year);
  const myEleves = ofSchool(eleves.status === "fulfilled" ? eleves.value : [], school);

  // Chaque élève va dans la classe qui porte son nom de classe (et son niveau, si deux classes ont le même nom)
  const stats = myClasses
    .map((classe) => ({ classe, students: [] as Eleve[] }))
    .sort((a, b) =>
      `${a.classe.niveau_name} ${a.classe.name}`.localeCompare(`${b.classe.niveau_name} ${b.classe.name}`, "fr", {
        numeric: true,
      }),
    );
  const unassigned: Eleve[] = [];
  for (const e of myEleves) {
    const name = normalize(e.classe_name);
    const candidates = name ? stats.filter((s) => normalize(s.classe.name) === name) : [];
    const target =
      candidates.length > 1 && e.niveau_name
        ? (candidates.find((s) => normalize(s.classe.niveau_name) === normalize(e.niveau_name)) ?? candidates[0])
        : candidates[0];
    if (target) target.students.push(e);
    else unassigned.push(e);
  }

  const classStats: ClassStat[] = stats.map(({ classe, students }) => ({
    classe,
    students,
    // L'effectif enregistré sur la classe compte aussi les élèves que la liste ne relie pas encore
    count: Math.max(students.length, classe.effectif_actuel ?? classe.total_effectif ?? 0),
    capacity: classe.max_effectif ?? 0,
  }));
  const placed = classStats.reduce((n, c) => n + c.count, 0);

  return {
    school: school?.name ?? "",
    year: year?.name ?? "",
    total: Math.max(myEleves.length, placed),
    placed,
    seats: classStats.reduce((n, c) => n + c.capacity, 0),
    girls: myEleves.filter((e) => e.gender === "F").length,
    boys: myEleves.filter((e) => e.gender === "M").length,
    classes: classStats,
    unassigned,
  };
}

export default function Effectifs() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle" | "failed">("loading");
  const [openId, setOpenId] = useState<string | null>(null);
  const lastRequest = useRef(0);

  const load = useCallback(async (next: "loading" | "refreshing" | "silent") => {
    const request = ++lastRequest.current;
    if (next !== "silent") setStatus(next);
    try {
      const s = await loadStats();
      if (request !== lastRequest.current) return;
      setStats(s);
      setStatus("idle");
    } catch {
      if (request === lastRequest.current) setStatus((st) => (next === "silent" ? st : "failed"));
    }
  }, []);

  useEffect(() => {
    load("loading");
  }, [load]);

  // Retour sur l'onglet : mise à jour discrète (une inscription a pu être ajoutée)
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) firstFocus.current = false;
      else load("silent");
    }, [load]),
  );

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((current) => (current === id ? null : id));
  };

  const subtitle = stats
    ? [stats.school, stats.year].filter(Boolean).join(" · ") || "Votre établissement"
    : status === "failed"
      ? "Données indisponibles"
      : "Chargement…";

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View>
          <Text className="font-inter-bold text-[28px] leading-9 text-ink">Effectifs</Text>
          <Text numberOfLines={1} className="mt-1 font-inter text-[13px] text-muted">
            {subtitle}
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={status === "refreshing"}
            onRefresh={() => load("refreshing")}
            tintColor="#2B5EA8"
            colors={["#2B5EA8"]}
          />
        }
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {status === "loading" && !stats ? (
            <>
              <Skeleton width="100%" height={170} radius={24} />
              <Skeleton width="100%" height={90} radius={24} />
              <Skeleton width="100%" height={110} radius={24} />
              <Skeleton width="100%" height={80} radius={24} />
            </>
          ) : !stats ? (
            <View className="items-center gap-3 rounded-3xl bg-white py-12">
              <Ionicons name="cloud-offline-outline" size={28} color="#9AA7B8" />
              <Text className="text-center font-inter-semibold text-[15px] text-ink">
                Impossible de charger les effectifs
              </Text>
              <Pressable onPress={() => load("loading")} className="active:opacity-70">
                <Text className="font-inter-semibold text-[14px] text-primary">Réessayer</Text>
              </Pressable>
            </View>
          ) : (
            <Stagger>
              {/* Carte résumé : le chiffre principal et le remplissage */}
              <View className="rounded-3xl bg-primary p-5">
                <Text className="font-inter text-[13px] text-white/70">Élèves inscrits</Text>
                <Text className="mt-1 font-inter-bold text-[44px] leading-[52px] text-white">{stats.total}</Text>

                <View className="mt-3 h-3 overflow-hidden rounded bg-white/20">
                  <Fill start width={Math.min(100, percent(stats.placed, stats.seats))} color="#FFE600" />
                </View>
                <Text className="mt-2 font-inter text-[13px] text-white">
                  {stats.placed} élève{plural(stats.placed)} en classe sur {stats.seats} place{plural(stats.seats)} ·{" "}
                  {percent(stats.placed, stats.seats)} % de remplissage
                </Text>
              </View>

              {/* Chiffres clés */}
              <View className="flex-row gap-3">
                <Tile start value={stats.classes.length} label="Classes" icon="people-outline" />
                <Tile start value={stats.placed} label="En classe" icon="checkmark-circle-outline" />
                <Tile
                  start
                  value={stats.unassigned.length}
                  label="Sans classe"
                  icon="pause-circle-outline"
                />
              </View>

              <Card title="Répartition des élèves">
                <Split
                  start
                  a={{ label: "Filles", value: stats.girls }}
                  b={{ label: "Garçons", value: stats.boys }}
                />
              </Card>

              {/* Par classe : touchez une classe pour voir ses élèves */}
              <View className="gap-3">
                <Text className="font-inter-bold text-lg text-ink">Par classe</Text>

                {stats.classes.length === 0 ? (
                  <View className="items-center rounded-3xl bg-white py-12">
                    <Text className="font-inter text-[14px] text-muted">Aucune classe pour cette année.</Text>
                  </View>
                ) : (
                  stats.classes.map((c, i) => (
                    <ClassCard
                      key={c.classe.public_key}
                      name={c.classe.name}
                      detail={[c.classe.niveau_name, c.classe.salle_name || "Sans salle"]
                        .filter(Boolean)
                        .join(" · ")}
                      capacity={c.capacity}
                      count={c.count}
                      students={c.students}
                      delay={i * 80}
                      open={openId === c.classe.public_key}
                      onToggle={() => toggle(c.classe.public_key)}
                    />
                  ))
                )}

                {stats.unassigned.length > 0 && (
                  <ClassCard
                    name="Sans classe"
                    detail="Élèves à affecter à une classe"
                    capacity={0}
                    count={stats.unassigned.length}
                    students={stats.unassigned}
                    delay={0}
                    open={openId === "unassigned"}
                    onToggle={() => toggle("unassigned")}
                  />
                )}
              </View>
            </Stagger>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ClassCard({
  name,
  detail,
  capacity,
  count,
  students,
  delay,
  open,
  onToggle,
}: {
  name: string;
  detail: string;
  capacity: number;
  count: number;
  students: Eleve[];
  delay: number;
  open: boolean;
  onToggle: () => void;
}) {
  // Élèves comptés sur la classe mais pas encore reliés à elle dans la liste des élèves
  const hidden = count - students.length;

  return (
    <View className="rounded-3xl bg-white p-4 shadow-sm">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${name}, ${count} élève${plural(count)}`}
        className="gap-3 active:opacity-80"
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text numberOfLines={1} className="font-inter-bold text-[16px] text-ink">
              {name}
            </Text>
            <Text numberOfLines={1} className="font-inter text-xs text-muted">
              {detail}
            </Text>
          </View>
          <Text className="font-inter-semibold text-[13px] text-ink">
            {capacity > 0 ? `${count} / ${capacity}` : `${count} élève${plural(count)}`}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#6B7A90" />
        </View>

        {capacity > 0 && (
          <View className="h-2.5 overflow-hidden rounded bg-soft">
            <Fill start delay={delay} width={Math.min(100, percent(count, capacity))} color="#2B5EA8" />
          </View>
        )}
      </Pressable>

      {open &&
        (students.length === 0 ? (
          <Text className="mt-3 border-t border-line pt-3 font-inter text-[13px] text-muted">
            {hidden > 0
              ? `${hidden} élève${plural(hidden)} compté${plural(hidden)}, liste détaillée indisponible.`
              : "Aucun élève dans cette classe."}
          </Text>
        ) : (
          <View className="mt-3 border-t border-line">
            {[...students]
              .sort((a, b) => fullName(a).localeCompare(fullName(b), "fr"))
              .map((s, i) => (
                <View
                  key={s.public_key || `${fullName(s)}-${i}`}
                  className={`flex-row items-center gap-3 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-soft">
                    <Text className="font-inter-bold text-xs text-primary">
                      {initials(`${s.prenoms} ${s.nom}`)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-inter-semibold text-[14px] text-ink">
                      {fullName(s)}
                    </Text>
                    <Text numberOfLines={1} className="font-inter text-xs text-muted">
                      {[s.matricule || "Sans matricule", s.gender === "F" ? "Fille" : s.gender === "M" ? "Garçon" : ""]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </View>
              ))}
            {hidden > 0 && (
              <Text className="border-t border-line pt-2.5 font-inter text-xs text-muted">
                + {hidden} élève{plural(hidden)} compté{plural(hidden)} sur la classe, sans détail.
              </Text>
            )}
          </View>
        ))}
    </View>
  );
}
