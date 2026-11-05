import { createIepp } from "@/api/iepps";
import AddIeppModal from "@/components/gestion/AddIeppModal";
import SearchFilterBar from "@/components/ui/SearchFilterBar";
import Segmented from "@/components/ui/Segmented";
import PagedHint from "@/components/ui/PagedHint";
import Select from "@/components/ui/Select";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { useDrenas } from "@/context/DrenasContext";
import { Iepp, toIeppDren } from "@/data/drenas";
import { useAllDrenas } from "@/hooks/use-all-drenas";
import { usePaged } from "@/hooks/use-paged";
import { confirmDeleteIepp } from "@/utils/confirm";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export default function Iepps() {
  const router = useRouter();
  const { drenas, iepps, addIepp, updateIepp, deleteIepp } = useDrenas();

  const [query, setQuery] = useState("");
  const [drenaFilter, setDrenaFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Iepp | null>(null);
  const realDrenas = useAllDrenas(adding); // la création passe par l'API : il lui faut de vraies DRENA

  const activeFilters =
    (drenaFilter !== "all" ? 1 : 0) +
    (sortBy !== "name" ? 1 : 0) +
    (order !== "asc" ? 1 : 0);
  const resetFilters = () => {
    setDrenaFilter("all");
    setSortBy("name");
    setOrder("asc");
  };

  // Recherche par nom, code ou DRENA (sans tenir compte des accents)
  const visible = useMemo(() => {
    const q = normalize(query);
    const dir = order === "asc" ? 1 : -1;

    return iepps
      .filter((i) => {
        if (drenaFilter !== "all" && i.dren.public_key !== drenaFilter)
          return false;
        if (!q) return true;
        return normalize(`${i.code} ${i.name} ${i.dren.name}`).includes(q);
      })
      .sort((a, b) => {
        const x = sortBy === "code" ? a.code : a.name;
        const y = sortBy === "code" ? b.code : b.name;
        return dir * x.localeCompare(y, "fr", { numeric: true });
      });
  }, [iepps, query, drenaFilter, sortBy, order]);

  const { shown, scrollProps } = usePaged(
    visible,
    `${query}|${drenaFilter}|${sortBy}|${order}`,
  );

  const openDetail = (id: string) =>
    router.push({
      pathname: "/(superadmin)/gestion/iepp-detail",
      params: { id },
    });

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
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
            <Text className="font-inter-bold text-[20px] leading-8 text-ink">
              IEPPs
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {visible.length} IEPP(s) affichée(s)
            </Text>
          </View>
        </View>

        {/* Recherche + Filtrer */}
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          placeholder="Rechercher par nom…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          <Select
            label="DRENA"
            icon="map-outline"
            value={drenaFilter}
            onChange={setDrenaFilter}
            options={[
              { value: "all", label: "Toutes les DRENA" },
              ...[...drenas]
                .sort((a, b) =>
                  a.name.localeCompare(b.name, "fr", { numeric: true }),
                )
                .map((d) => ({ value: d.public_key, label: d.name })),
            ]}
          />
          <Segmented
            label="Trier par"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: "name", label: "Nom" },
              { value: "code", label: "Code" },
            ]}
          />
          <Segmented
            label="Ordre"
            value={order}
            onChange={setOrder}
            options={[
              { value: "asc", label: "A → Z" },
              { value: "desc", label: "Z → A" },
            ]}
          />
        </SearchFilterBar>

        {/* Bouton d'ajout */}
        <Pressable
          onPress={() => setAdding(true)}
          className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text className="font-inter-semibold text-base text-white">
            Nouvelle IEPP
          </Text>
        </Pressable>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* Liste : Code, Nom, DRENA, Actions */}
          {visible.length === 0 ? (
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                Aucune IEPP trouvée.
              </Text>
            </View>
          ) : (
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              {shown.map((i, idx) => (
                <View
                  key={i.public_key}
                  className={`flex-row items-center gap-3 py-3.5 ${idx > 0 ? "border-t border-line" : ""}`}
                >
                  <Pressable
                    onPress={() => openDetail(i.public_key)}
                    className="flex-1 active:opacity-70"
                  >
                    <Text
                      numberOfLines={2}
                      className="font-inter-semibold text-[15px] text-ink"
                    >
                      {i.name}
                    </Text>
                    <Text
                      style={{ fontFamily: MONO }}
                      className="mt-0.5 text-xs text-muted"
                    >
                      {i.code || "—"}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-0.5 font-inter-semibold text-xs text-primary"
                    >
                      {i.dren.name}
                    </Text>
                  </Pressable>

                  {/* Actions : voir, modifier, supprimer */}
                  <View className="flex-row items-center gap-1.5">
                    <IconButton
                      icon="eye-outline"
                      color="#1B2A41"
                      label="Voir"
                      onPress={() => openDetail(i.public_key)}
                    />
                    <IconButton
                      icon="create-outline"
                      color="#2B5EA8"
                      label="Modifier"
                      onPress={() => setEditing(i)}
                    />
                    <IconButton
                      icon="trash-outline"
                      color="#DC2626"
                      label="Supprimer"
                      onPress={() =>
                        confirmDeleteIepp(i, () => deleteIepp(i.public_key))
                      }
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <PagedHint shown={shown.length} total={visible.length} />
        </View>
      </ScrollView>

      {/* Formulaire : ajout ou modification */}
      <AddIeppModal
        visible={adding || editing !== null}
        iepp={editing}
        drenas={editing ? drenas : realDrenas.drenas}
        drenasStatus={editing ? undefined : realDrenas.status}
        existing={editing ? iepps : []} // pour une création, c'est le serveur qui refuse un doublon
        onClose={closeForm}
        onSave={async (data) => {
          if (editing) {
            updateIepp(editing.public_key, data);
            closeForm();
            showToast("IEPP modifiée avec succès.");
            return;
          }
          const drena = realDrenas.drenas.find(
            (d) => d.public_key === data.drena_id,
          );
          if (!drena) return;
          const { message, iepp } = await createIepp({
            ...data,
            drena_id: drena.id ?? drena.public_key,
          });
          addIepp({ ...iepp, dren: iepp.dren ?? toIeppDren(drena) });
          closeForm();
          showToast(message);
        }}
      />
    </View>
  );
}

function IconButton({
  icon,
  color,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      className="h-10 w-10 items-center justify-center rounded-xl bg-page active:opacity-70"
    >
      <Ionicons name={icon} size={19} color={color} />
    </Pressable>
  );
}
