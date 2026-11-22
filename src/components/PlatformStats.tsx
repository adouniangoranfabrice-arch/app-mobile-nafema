import { useDrenas } from "@/context/DrenasContext";
import { useStudents } from "@/context/StudentsContext";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { computeStats } from "@/organisation/stats";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const DURATION_MS = 700;

// Palette vérifiée (daltonisme et contraste) sur fond blanc
const SERIES_A = "#2B5EA8";
const SERIES_B = "#C2610C";
const SERIES_C = "#2E9E6B";

const percent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

/** Les statistiques du super admin. `start` lance les animations quand la section est visible */
export default function PlatformStats({ start }: { start: boolean }) {
  const { students } = useStudents();
  const { drenas, iepps } = useDrenas();
  const { records } = useOrganisation();

  const stats = computeStats({
    students,
    drenas: drenas.length,
    iepps: iepps.length,
    etablissements: records("etablissements"),
    classes: records("classes"),
    niveaux: records("niveaux"),
    cycles: records("cycles"),
    salles: records("salles"),
    matieres: records("matieres").length,
    personnels: records("personnels"),
  });
  const maxByCycle = Math.max(1, ...stats.classesByCycle.map((c) => c.count));

  return (
    <View className="gap-3">
      <View>
        <Text className="font-inter-bold text-lg text-ink">
          Statistiques de gestion
        </Text>
        <Text className="font-inter text-xs text-muted">
          Calculées à partir des données fictives de l'application
        </Text>
      </View>

      {/* Chiffres clés */}
      <View className="gap-3">
        <View className="flex-row gap-3">
          <Tile
            start={start}
            value={stats.totals.drenas}
            label="DRENA"
            icon="map-outline"
          />
          <Tile
            start={start}
            value={stats.totals.iepps}
            label="IEPP"
            icon="git-branch-outline"
          />
          <Tile
            start={start}
            value={stats.totals.etablissements}
            label="Établissements"
            icon="business-outline"
          />
        </View>
        <View className="flex-row gap-3">
          <Tile
            start={start}
            value={stats.totals.classes}
            label="Classes"
            icon="school-outline"
          />
          <Tile
            start={start}
            value={stats.totals.salles}
            label="Salles"
            icon="easel-outline"
          />
          <Tile
            start={start}
            value={stats.totals.matieres}
            label="Matières"
            icon="book-outline"
          />
        </View>
      </View>

      <Card title="Taux d'activité">
        <Meter
          start={start}
          label="Élèves actifs"
          part={stats.students.active}
          total={stats.students.total}
        />
        <Meter
          start={start}
          delay={120}
          label="Personnels actifs"
          part={stats.personnels.active}
          total={stats.personnels.total}
        />
      </Card>

      <Card title="Répartition des élèves">
        <Split
          start={start}
          a={{ label: "Filles", value: stats.students.girls }}
          b={{ label: "Garçons", value: stats.students.boys }}
        />
      </Card>

      <Card title="Types d'établissements">
        <Split
          start={start}
          a={{ label: "Publics", value: stats.schoolTypes.public }}
          b={{ label: "Privés", value: stats.schoolTypes.private }}
        />
      </Card>

      <Card title="Classes par cycle">
        {stats.classesByCycle.map((c, i) => (
          <View key={c.id} className="gap-1.5">
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
                start={start}
                delay={i * 80}
                width={(c.count / maxByCycle) * 100}
                color={SERIES_A}
              />
            </View>
          </View>
        ))}
      </Card>

      <View className="flex-row gap-3">
        <Tile
          start={start}
          value={stats.places.classes}
          label="Places en classe"
          icon="people-outline"
        />
        <Tile
          start={start}
          value={stats.places.salles}
          label="Places en salle"
          icon="grid-outline"
        />
      </View>
    </View>
  );
}

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3.5 rounded-3xl bg-white p-4 shadow-sm">
      <Text className="font-inter-semibold text-[14px] text-ink">{title}</Text>
      {children}
    </View>
  );
}

/** Couleurs des cadres de chiffres : fond pastel, chiffre et icône foncés (contraste lisible) */
export const TONES = {
  blue: { fg: "#2B5EA8", bg: "#EAF1FB", chip: "#D6E4F7" },
  violet: { fg: "#6D28D9", bg: "#F3EEFD", chip: "#E4D9FB" },
  green: { fg: "#15803D", bg: "#EAF7EF", chip: "#D1EEDC" },
  orange: { fg: "#B45309", bg: "#FFF4E6", chip: "#FDE4C4" },
  teal: { fg: "#0F766E", bg: "#E7F6F4", chip: "#CBEDE8" },
  indigo: { fg: "#4338CA", bg: "#EEF0FE", chip: "#DDE1FD" },
  amber: { fg: "#A16207", bg: "#FEF8E4", chip: "#FCEDBF" },
  pink: { fg: "#BE185D", bg: "#FDEEF5", chip: "#F9D9E8" },
  red: { fg: "#B91C1C", bg: "#FDEDED", chip: "#F9D5D5" },
} as const;
export type Tone = keyof typeof TONES;

export function Tile({
  start,
  value,
  label,
  icon,
  tone,
}: {
  start: boolean;
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Couleur du cadre ; sans elle, cadre blanc */
  tone?: Tone;
}) {
  const t = tone ? TONES[tone] : null;
  return (
    <View
      className="flex-1 gap-2 rounded-2xl bg-white p-3.5 shadow-sm"
      style={t ? { backgroundColor: t.bg } : undefined}
    >
      {t ? (
        <View
          className="h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: t.chip }}
        >
          <Ionicons name={icon} size={17} color={t.fg} />
        </View>
      ) : (
        <Ionicons name={icon} size={18} color="#6B7A90" />
      )}
      <Text
        className="font-inter-bold text-[24px] leading-7 text-primary"
        style={t ? { color: t.fg } : undefined}
      >
        <CountUp start={start} value={value} />
      </Text>
      <Text numberOfLines={1} className="font-inter text-xs text-muted">
        {label}
      </Text>
    </View>
  );
}

/** Une barre qui grandit depuis la gauche jusqu'à `width` % */
export function Fill({
  start,
  width,
  color,
  delay = 0,
}: {
  start: boolean;
  width: number;
  color: string;
  delay?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (start) {
      progress.value = withDelay(
        delay,
        withTiming(width, { duration: DURATION_MS }),
      );
    }
  }, [start, width, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <Animated.View
      style={[
        {
          height: "100%",
          backgroundColor: color,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
        },
        fillStyle,
      ]}
    />
  );
}

export function Meter({
  start,
  label,
  part,
  total,
  delay,
}: {
  start: boolean;
  label: string;
  part: number;
  total: number;
  delay?: number;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 font-inter text-[13px] text-muted">
          {label}
        </Text>
        <Text className="font-inter-semibold text-[13px] text-ink">
          {part} sur {total} · {percent(part, total)} %
        </Text>
      </View>
      <View className="h-3 overflow-hidden rounded bg-soft">
        <Fill
          start={start}
          delay={delay}
          width={percent(part, total)}
          color={SERIES_A}
        />
      </View>
    </View>
  );
}

/** Une répartition en deux parts (ou trois avec `c`), avec sa légende */
export function Split({
  start,
  a,
  b,
  c,
}: {
  start: boolean;
  a: { label: string; value: number };
  b: { label: string; value: number };
  c?: { label: string; value: number };
}) {
  const parts = [
    { ...a, color: SERIES_A },
    { ...b, color: SERIES_B },
    ...(c ? [{ ...c, color: SERIES_C }] : []),
  ];
  const total = parts.reduce((n, p) => n + p.value, 0);
  const shown = parts.filter((p) => p.value > 0);
  const reveal = useSharedValue(0);

  useEffect(() => {
    if (start) reveal.value = withTiming(100, { duration: DURATION_MS });
  }, [start, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    width: `${reveal.value}%`,
  }));

  if (total === 0)
    return (
      <Text className="font-inter text-[13px] text-muted">
        Aucune donnée pour le moment.
      </Text>
    );

  return (
    <View className="gap-3">
      <View className="h-3 overflow-hidden">
        <Animated.View
          style={[{ height: "100%", overflow: "hidden" }, revealStyle]}
        >
          <View className="h-full flex-row gap-0.5">
            {shown.map((p, i) => (
              <View
                key={p.label}
                className={`${i === 0 ? "rounded-l" : ""} ${i === shown.length - 1 ? "rounded-r" : ""}`}
                style={{ flex: p.value, backgroundColor: p.color }}
              />
            ))}
          </View>
        </Animated.View>
      </View>
      <View className="flex-row flex-wrap gap-x-5 gap-y-1">
        {parts.map((p) => (
          <Legend key={p.label} color={p.color} label={p.label} value={p.value} total={total} />
        ))}
      </View>
    </View>
  );
}

function Legend({
  color,
  label,
  value,
  total,
}: {
  color: string;
  label: string;
  value: number;
  total: number;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <Text className="font-inter text-[13px] text-muted">
        {label} :{" "}
        <Text className="font-inter-semibold text-ink">
          {value} ({percent(value, total)} %)
        </Text>
      </Text>
    </View>
  );
}

/** Un nombre qui compte de 0 jusqu'à sa valeur */
function CountUp({ start, value }: { start: boolean; value: number }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setShown(value);
      return;
    }
    const begin = Date.now();
    let frame = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - begin) / DURATION_MS);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, value, reduced]);

  return shown;
}
