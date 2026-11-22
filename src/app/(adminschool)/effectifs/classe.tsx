import { Effectifs, eleveName, lastEffectifs, loadEffectifs, SANS_CLASSE } from "@/api/effectifs";
import FixedHeader from "@/components/ui/FixedHeader";
import SearchBar from "@/components/ui/SearchBar";
import { SkeletonList } from "@/components/ui/Skeleton";
import { initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";

const plural = (n: number) => (n > 1 ? "s" : "");

/** Les élèves d'une classe (ou des élèves sans classe), ouverts depuis Effectifs */
export default function EffectifsClasse() {
  const router = useRouter();
  const { key, name } = useLocalSearchParams<{ key: string; name?: string }>();

  // Les données déjà chargées par Effectifs ; sinon (ouverture directe) on recharge
  const [data, setData] = useState<Effectifs | null>(lastEffectifs);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle" | "failed">(
    lastEffectifs() ? "idle" : "loading",
  );
  const [query, setQuery] = useState("");

  const load = useCallback(async (next: "loading" | "refreshing") => {
    setStatus(next);
    try {
      setData(await loadEffectifs());
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    if (!lastEffectifs()) load("loading");
  }, [load]);

  const unassigned = key === SANS_CLASSE;
  const stat = unassigned ? null : data?.classes.find((c) => c.classe.public_key === key);
  const students = unassigned ? (data?.unassigned ?? []) : (stat?.students ?? []);
  const count = unassigned ? students.length : (stat?.count ?? 0);
  const capacity = stat?.capacity ?? 0;
  const hidden = count - students.length; // comptés sur la classe sans être dans la liste des élèves

  const girls = students.filter((s) => s.gender === "F").length;
  const boys = students.filter((s) => s.gender === "M").length;

  // Recherche par nom ou matricule
  const q = normalize(query);
  const visible = q ? students.filter((s) => normalize(`${eleveName(s)} ${s.matricule}`).includes(q)) : students;

  const title = stat?.classe.name ?? name ?? "Classe";
  const detail = unassigned
    ? "Élèves à affecter à une classe"
    : [stat?.classe.niveau_name, stat?.classe.salle_name || "Sans salle"].filter(Boolean).join(" · ");

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
          </Pressable>
          <View className="flex-1">
            <Text numberOfLines={1} className="font-inter-bold text-[20px] leading-8 text-ink">
              {title}
            </Text>
            <Text numberOfLines={1} className="font-inter text-[13px] text-muted">
              {status === "loading" ? "Chargement…" : detail || " "}
            </Text>
          </View>
        </View>

        {/* Résumé de la classe */}
        {status !== "loading" && (unassigned || stat) && (
          <View className="flex-row gap-2">
            <Pill icon="people-outline" label={capacity > 0 ? `${count} / ${capacity}` : `${count} élève${plural(count)}`} />
            <Pill icon="female-outline" label={`${girls} fille${plural(girls)}`} />
            <Pill icon="male-outline" label={`${boys} garçon${plural(boys)}`} />
          </View>
        )}

        {students.length > 0 && (
          <SearchBar value={query} onChangeText={setQuery} placeholder="Rechercher un élève ou un matricule" />
        )}
      </FixedHeader>

      <FlatList
        data={status === "loading" ? [] : visible}
        keyExtractor={(s, i) => s.public_key || `${eleveName(s)}-${i}`}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
        renderItem={({ item, index }) => (
          <View className="w-full max-w-[640px] self-center px-5 pb-2">
            <View className="flex-row items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm">
              <Text className="w-6 text-center font-inter-semibold text-xs text-muted">{index + 1}</Text>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-soft">
                <Text className="font-inter-bold text-xs text-primary">{initials(`${item.prenoms} ${item.nom}`)}</Text>
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-inter-semibold text-[15px] text-ink">
                  {eleveName(item)}
                </Text>
                <Text numberOfLines={1} className="font-inter text-xs text-muted">
                  {[
                    item.matricule || "Sans matricule",
                    item.gender === "F" ? "Fille" : item.gender === "M" ? "Garçon" : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          status === "loading" ? (
            <SkeletonList />
          ) : status === "failed" || (!unassigned && !stat) ? (
            <Message
              icon="cloud-offline-outline"
              text="Impossible de charger cette classe"
              action={{ label: "Réessayer", onPress: () => load("loading") }}
            />
          ) : (
            <Message
              icon="people-outline"
              text={
                q
                  ? "Aucun élève ne correspond à la recherche."
                  : hidden > 0
                    ? `${hidden} élève${plural(hidden)} compté${plural(hidden)} sur la classe, liste détaillée indisponible.`
                    : "Aucun élève dans cette classe."
              }
            />
          )
        }
        ListFooterComponent={
          status !== "loading" && students.length > 0 && hidden > 0 && !q ? (
            <Text className="px-6 pt-2 text-center font-inter text-xs text-muted">
              + {hidden} élève{plural(hidden)} compté{plural(hidden)} sur la classe, sans détail.
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}

function Pill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm">
      <Ionicons name={icon} size={14} color="#2B5EA8" />
      <Text className="font-inter-semibold text-[12px] text-ink">{label}</Text>
    </View>
  );
}

function Message({
  icon,
  text,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View className="w-full max-w-[640px] self-center px-5">
      <View className="items-center gap-3 rounded-3xl bg-white px-6 py-12">
        <Ionicons name={icon} size={28} color="#9AA7B8" />
        <Text className="text-center font-inter-semibold text-[14px] text-ink">{text}</Text>
        {action && (
          <Pressable onPress={action.onPress} className="active:opacity-70">
            <Text className="font-inter-semibold text-[14px] text-primary">{action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
