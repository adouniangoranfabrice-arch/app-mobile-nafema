import AddPeriodModal from "@/components/gestion/AddPeriodModal";
import ActionButton from "@/components/ui/ActionButton";
import PagedHint from "@/components/ui/PagedHint";
import SearchBar from "@/components/ui/SearchBar";
import { useAcademic } from "@/context/AcademicContext";
import { PERIOD_STATUS, Period, periodStatus } from "@/data/academic";
import { useGestion } from "@/hooks/use-gestion";
import { usePaged } from "@/hooks/use-paged";
import { confirmDeletePeriod } from "@/utils/confirm";
import { formatDate, yearLabel } from "@/utils/dates";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Periodes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { years, periods, addPeriod, updatePeriod, deletePeriod } =
    useAcademic();
  const { canEdit, href } = useGestion();

  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);

  const yearOf = (p: Period) => years.find((y) => y.id === p.yearId);
  const lockedCount = periods.filter((p) => p.locked).length;

  // Recherche par libellé, année, établissement, cycle, type ou « verrouillée »
  const visible = useMemo(() => {
    const q = normalize(query);
    const startOf = (p: Period) =>
      years.find((y) => y.id === p.yearId)?.start.getTime() ?? 0;

    return [...periods]
      .sort(
        (a, b) =>
          startOf(b) - startOf(a) ||
          a.cycle.localeCompare(b.cycle) ||
          a.number - b.number,
      )
      .filter((p) => {
        if (!q) return true;
        const y = years.find((x) => x.id === p.yearId);
        const haystack = normalize(
          `${p.label} ${y ? yearLabel(y.start, y.end) : ""} ${y?.school ?? ""} ${p.cycle} ${p.type} ${
            p.locked ? "verrouillee" : ""
          }`,
        );
        return haystack.includes(q);
      });
  }, [periods, years, query]);

  const { shown, scrollProps } = usePaged(visible, query);

  const plural = (n: number) => (n > 1 ? "s" : "");

  const openDetail = (id: string) =>
    router.push(href("periode-detail", { id }));

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* En-tête avec retour */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
            >
              <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
            </Pressable>
            <View className="flex-1">
              <Text className="font-inter-bold text-[24px] leading-8 text-ink">
                Périodes
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                {periods.length} enregistrée{plural(periods.length)} ·{" "}
                {lockedCount} verrouillée
                {plural(lockedCount)}
              </Text>
            </View>
          </View>

          {/* Recherche */}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher une période, une année, un cycle"
          />

          {/* Bouton d'ajout */}
          {canEdit && (
            <Pressable
              onPress={() => setAdding(true)}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
              <Text className="font-inter-semibold text-base text-white">
                Ajouter une période
              </Text>
            </Pressable>
          )}

          <Text className="font-inter text-xs text-muted">
            {visible.length} résultat{plural(visible.length)}
          </Text>

          {/* Liste */}
          {visible.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="layers-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Aucune période trouvée
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                Essaie une autre recherche.
              </Text>
            </View>
          ) : (
            shown.map((p) => {
              const y = yearOf(p);
              const st = PERIOD_STATUS[periodStatus(p)];
              return (
                <View
                  key={p.id}
                  className="gap-3 rounded-3xl bg-white p-4 shadow-sm"
                >
                  {/* Un clic sur la partie haute ouvre le détail */}
                  <Pressable
                    onPress={() => openDetail(p.id)}
                    className="flex-row items-center gap-3 active:opacity-80"
                  >
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-soft">
                      <Ionicons
                        name="layers-outline"
                        size={20}
                        color="#2B5EA8"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-inter-bold text-[16px] text-ink">
                        {p.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="font-inter-semibold text-xs text-primary"
                      >
                        {y
                          ? `${yearLabel(y.start, y.end)} · ${y.school}`
                          : "Année introuvable"}
                      </Text>
                      <Text className="font-inter text-xs text-muted">
                        {p.cycle} · {p.type} n°{p.number}
                      </Text>
                      <Text className="font-inter text-xs text-muted">
                        {formatDate(p.start)} – {formatDate(p.end)}
                      </Text>
                    </View>
                    <View className="items-end gap-1.5">
                      <View className={`rounded-full px-3 py-1 ${st.badge}`}>
                        <Text
                          className={`font-inter-semibold text-xs ${st.text}`}
                        >
                          {st.label}
                        </Text>
                      </View>
                      {p.locked && (
                        <View className="flex-row items-center gap-1 rounded-full bg-[#FFF1A8] px-2.5 py-1">
                          <Ionicons
                            name="lock-closed"
                            size={11}
                            color="#7A5F00"
                          />
                          <Text className="font-inter-semibold text-[11px] text-[#7A5F00]">
                            Verrouillée
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  <View className="h-px bg-line" />

                  {/* Voir / Modifier / Supprimer */}
                  <View className="flex-row gap-2">
                    <ActionButton
                      icon="eye-outline"
                      label="Voir"
                      onPress={() => openDetail(p.id)}
                    />
                    {canEdit && (
                      <>
                        <ActionButton
                          icon="create-outline"
                          label="Modifier"
                          onPress={() => setEditing(p)}
                        />
                        <ActionButton
                          icon="trash-outline"
                          label="Supprimer"
                          variant="danger"
                          onPress={() =>
                            confirmDeletePeriod(p, () => deletePeriod(p.id))
                          }
                        />
                      </>
                    )}
                  </View>
                </View>
              );
            })
          )}

          <PagedHint shown={shown.length} total={visible.length} />
        </View>
      </ScrollView>

      {/* Formulaire : ajout ou modification */}
      <AddPeriodModal
        visible={adding || editing !== null}
        period={editing}
        years={years}
        existing={periods}
        onClose={closeForm}
        onSave={(data) => {
          if (editing) updatePeriod(editing.id, data);
          else addPeriod(data);
          closeForm();
        }}
      />
    </View>
  );
}
