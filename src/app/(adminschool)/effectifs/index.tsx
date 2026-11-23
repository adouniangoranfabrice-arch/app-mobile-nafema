import { Effectifs as Stats, loadEffectifs, SANS_CLASSE, salleLabel } from "@/api/effectifs";
import { Card, Fill, Split, Tile } from "@/components/PlatformStats";
import FixedHeader from "@/components/ui/FixedHeader";
import { Stagger } from "@/components/ui/MotionView";
import { Skeleton } from "@/components/ui/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import { Href, useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

const plural = (n: number) => (n > 1 ? "s" : "");
const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export default function Effectifs() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle" | "failed">("loading");
  const lastRequest = useRef(0);

  const load = useCallback(async (next: "loading" | "refreshing" | "silent") => {
    const request = ++lastRequest.current;
    if (next !== "silent") setStatus(next);
    try {
      const s = await loadEffectifs();
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

  // La liste des élèves d'une classe (ou des élèves sans classe)
  const openClass = (key: string, name: string) =>
    router.push({ pathname: "/(adminschool)/effectifs/classe", params: { key, name } } as unknown as Href);

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
                <Tile start value={stats.unassigned.length} label="Sans classe" icon="pause-circle-outline" />
              </View>

              <Card title="Répartition des élèves">
                <Split start a={{ label: "Filles", value: stats.girls }} b={{ label: "Garçons", value: stats.boys }} />
              </Card>

              {/* Par classe, de la 6e à la Tle : touchez une classe pour voir ses élèves */}
              <View className="gap-3">
                <View>
                  <Text className="font-inter-bold text-lg text-ink">Par classe</Text>
                  <Text className="font-inter text-xs text-muted">Touchez une classe pour voir la liste de ses élèves</Text>
                </View>

                {stats.classes.length === 0 ? (
                  <View className="items-center rounded-3xl bg-white py-12">
                    <Text className="font-inter text-[14px] text-muted">Aucune classe pour cette année.</Text>
                  </View>
                ) : (
                  stats.classes.map((c, i) => (
                    <ClassCard
                      key={c.classe.public_key}
                      name={c.classe.name}
                      detail={[c.classe.niveau_name, salleLabel(c.classe)].filter(Boolean).join(" · ")}
                      capacity={c.capacity}
                      count={c.count}
                      delay={i * 80}
                      onPress={() => openClass(c.classe.public_key, c.classe.name)}
                    />
                  ))
                )}

                {stats.unassigned.length > 0 && (
                  <ClassCard
                    name="Sans classe"
                    detail="Élèves à affecter à une classe"
                    capacity={0}
                    count={stats.unassigned.length}
                    delay={0}
                    onPress={() => openClass(SANS_CLASSE, "Sans classe")}
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

/** Une classe : effectif et remplissage ; la toucher ouvre la liste de ses élèves */
function ClassCard({
  name,
  detail,
  capacity,
  count,
  delay,
  onPress,
}: {
  name: string;
  detail: string;
  capacity: number;
  count: number;
  delay: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${count} élève${plural(count)}, voir la liste`}
      className="gap-3 rounded-3xl bg-white p-4 shadow-sm active:opacity-80"
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
        <Ionicons name="chevron-forward" size={18} color="#6B7A90" />
      </View>

      {capacity > 0 && (
        <View className="h-2.5 overflow-hidden rounded bg-soft">
          <Fill start delay={delay} width={Math.min(100, percent(count, capacity))} color="#2B5EA8" />
        </View>
      )}
    </Pressable>
  );
}
