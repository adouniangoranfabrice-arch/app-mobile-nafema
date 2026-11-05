import PagedHint from "@/components/ui/PagedHint";
import SearchFilterBar from "@/components/ui/SearchFilterBar";
import Segmented from "@/components/ui/Segmented";
import Select from "@/components/ui/Select";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { usePaged } from "@/hooks/use-paged";
import EntityFormModal from "@/organisation/EntityFormModal";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { ENTITIES } from "@/organisation/entities";
import {
  confirmDeleteRecord,
  newWord,
  notFound,
  shown,
} from "@/organisation/helpers";
import { EntityConfig, EntityKey, OrgRecord } from "@/organisation/types";
import { Badge, IconButton, MONO } from "@/organisation/ui";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function OrganisationScreen() {
  const { entity } = useLocalSearchParams<{ entity: string }>();
  const { canUse } = useGestion();
  const config = canUse(entity as EntityKey)
    ? ENTITIES[entity as EntityKey]
    : undefined;
  const router = useRouter();

  if (!config) {
    return (
      <View className="flex-1 items-center justify-center bg-page px-5">
        <Text className="font-inter-semibold text-[15px] text-ink">
          Rubrique introuvable
        </Text>
        <Pressable onPress={() => router.back()} className="mt-3">
          <Text className="font-inter-semibold text-[14px] text-primary">
            Retour
          </Text>
        </Pressable>
      </View>
    );
  }

  return <EntityList key={config.key} config={config} />;
}

function EntityList({ config }: { config: EntityConfig }) {
  const router = useRouter();
  const org = useOrganisation();
  const { records, add, update, remove, options, usage } = org;
  const { canEdit, href } = useGestion();

  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState(config.segment?.defaultValue ?? "");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [order, setOrder] = useState("asc");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<OrgRecord | null>(null);

  const all = records(config.key);
  const filterOf = (field: string) => filters[field] ?? "all";
  const activeFilters =
    (config.filters ?? []).filter((f) => filterOf(f.field) !== "all").length +
    (order !== "asc" ? 1 : 0);
  const resetFilters = () => {
    setFilters({});
    setOrder("asc");
  };

  const visible = useMemo(() => {
    const q = normalize(query);
    const dir = order === "asc" ? 1 : -1;
    const sortOf = (r: OrgRecord) =>
      config.sortValue ? config.sortValue(r, org) : config.list.title(r, org);

    return all
      .filter(
        (r) => !config.segment || String(r[config.segment.field]) === segment,
      )
      .filter((r) =>
        (config.filters ?? []).every(
          (f) =>
            (filters[f.field] ?? "all") === "all" ||
            String(r[f.field]) === filters[f.field],
        ),
      )
      .filter((r) => {
        if (!q) return true;
        const text = [
          config.list.title(r, org),
          config.list.code?.(r) ?? "",
          config.list.subtitle?.(r, org) ?? "",
          config.list.details?.(r, org) ?? "",
          config.searchText?.(r, org) ?? "",
        ].join(" ");
        return normalize(text).includes(q);
      })
      .sort((a, b) => {
        const x = sortOf(a);
        const y = sortOf(b);
        const cmp =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y), "fr", { numeric: true });
        return dir * cmp;
      });
  }, [all, query, segment, filters, order, config, org]);

  const { shown: page, scrollProps } = usePaged(
    visible,
    `${query}|${segment}|${order}|${JSON.stringify(filters)}`,
  );

  const openDetail = (id: string) =>
    router.push(href("organisation-detail", { entity: config.key, id }));

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  const askDelete = (r: OrgRecord) =>
    confirmDeleteRecord(
      config,
      config.list.title(r, org),
      usage(config.key, r.id),
      () => remove(config.key, r.id),
    );

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
              {config.title}
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              {visible.length} {config.countLabel} {shown(config)}
            </Text>
          </View>
        </View>

        {/* Bascule (ex. Guard : web / sanctum) */}
        {config.segment && (
          <Segmented
            label={config.segment.label}
            value={segment}
            onChange={setSegment}
            options={config.segment.options}
          />
        )}

        {/* Recherche + Filtrer */}
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          placeholder={config.searchPlaceholder}
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          {(config.filters ?? []).map((f) => {
            const field = config.fields.find((x) => x.key === f.field);
            if (!field) return null;
            const opts =
              field.type === "ref" && field.ref
                ? options(field.ref)
                : (field.options ?? []);
            return (
              <Select
                key={f.field}
                label={field.label}
                icon={field.icon ?? "list-outline"}
                value={filterOf(f.field)}
                onChange={(v) =>
                  setFilters((prev) => ({ ...prev, [f.field]: v }))
                }
                options={[{ value: "all", label: f.allLabel }, ...opts]}
              />
            );
          })}
          <Segmented
            label="Ordre"
            value={order}
            onChange={setOrder}
            options={[
              { value: "asc", label: "Croissant" },
              { value: "desc", label: "Décroissant" },
            ]}
          />
        </SearchFilterBar>

        {/* Bouton d'ajout */}
        {canEdit && (
          <Pressable
            onPress={() => setAdding(true)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="font-inter-semibold text-base text-white">
              {newWord(config)} {config.singular}
            </Text>
          </Pressable>
        )}
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
          {/* Liste */}
          {visible.length === 0 ? (
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                {notFound(config)}
              </Text>
            </View>
          ) : (
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              {page.map((r, i) => {
                const avatar = config.list.avatar?.(r);
                const code = config.list.code?.(r);
                const subtitle = config.list.subtitle?.(r, org);
                const details = config.list.details?.(r, org);
                const badges = config.list.badges?.(r) ?? [];
                return (
                  <View
                    key={r.id}
                    className={`flex-row items-center gap-3 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    {avatar ? (
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-soft">
                        <Text className="font-inter-bold text-[14px] text-primary">
                          {avatar}
                        </Text>
                      </View>
                    ) : null}

                    <Pressable
                      onPress={() => openDetail(r.id)}
                      className="flex-1 active:opacity-70"
                    >
                      <Text
                        numberOfLines={2}
                        className="font-inter-semibold text-[15px] text-ink"
                      >
                        {config.list.title(r, org)}
                      </Text>
                      {code !== undefined && (
                        <Text
                          style={{ fontFamily: MONO }}
                          className="mt-0.5 text-xs text-muted"
                        >
                          {code || "—"}
                        </Text>
                      )}
                      {subtitle ? (
                        <Text
                          numberOfLines={2}
                          className="mt-0.5 font-inter-semibold text-xs text-primary"
                        >
                          {subtitle}
                        </Text>
                      ) : null}
                      {details ? (
                        <Text
                          numberOfLines={2}
                          className="mt-0.5 font-inter text-xs text-muted"
                        >
                          {details}
                        </Text>
                      ) : null}
                      {badges.length > 0 && (
                        <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                          {badges.map((b) => (
                            <Badge
                              key={b.label}
                              label={b.label}
                              tone={b.tone}
                            />
                          ))}
                        </View>
                      )}
                    </Pressable>

                    {/* Actions : voir, modifier, supprimer */}
                    <View className="flex-row items-center gap-1.5">
                      <IconButton
                        icon="eye-outline"
                        color="#1B2A41"
                        label="Voir"
                        onPress={() => openDetail(r.id)}
                      />
                      {canEdit && (
                        <>
                          <IconButton
                            icon="create-outline"
                            color="#2B5EA8"
                            label="Modifier"
                            onPress={() => setEditing(r)}
                          />
                          <IconButton
                            icon="trash-outline"
                            color="#DC2626"
                            label="Supprimer"
                            onPress={() => askDelete(r)}
                          />
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <PagedHint shown={page.length} total={visible.length} />
        </View>
      </ScrollView>

      {/* Formulaire : ajout ou modification */}
      <EntityFormModal
        visible={adding || editing !== null}
        config={config}
        record={editing}
        presets={
          config.segment ? { [config.segment.field]: segment } : undefined
        }
        onClose={closeForm}
        onSave={(values) => {
          if (editing) update(config.key, editing.id, values);
          else add(config.key, values);
          // Affiche le guard choisi dans le formulaire, sinon l'élément semble avoir disparu
          if (config.segment) setSegment(String(values[config.segment.field]));
          closeForm();
          showToast(editing ? "Modifications enregistrées." : "Ajout enregistré.");
        }}
      />
    </View>
  );
}
