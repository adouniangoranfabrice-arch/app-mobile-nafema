import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import EntityFormModal from "@/organisation/EntityFormModal";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { ENTITIES } from "@/organisation/entities";
import {
  confirmDeleteRecord,
  definite,
  fromISO,
  ofThe,
} from "@/organisation/helpers";
import {
  EntityConfig,
  EntityKey,
  Field,
  IconName,
  OrgRecord,
} from "@/organisation/types";
import { MONO } from "@/organisation/ui";
import { formatDate } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OrganisationDetailScreen() {
  const { entity, id } = useLocalSearchParams<{ entity: string; id: string }>();
  const { canUse } = useGestion();
  const config = canUse(entity as EntityKey)
    ? ENTITIES[entity as EntityKey]
    : undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!config) {
    return (
      <View
        className="flex-1 items-center justify-center bg-page px-5"
        style={{ paddingTop: insets.top }}
      >
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

  return <EntityDetail key={`${config.key}-${id}`} config={config} id={id} />;
}

function EntityDetail({ config, id }: { config: EntityConfig; id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const org = useOrganisation();
  const { records, update, remove, usage } = org;
  const { canEdit } = useGestion();
  const [editing, setEditing] = useState(false);

  const record = records(config.key).find((r) => r.id === id);

  const header = (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
      >
        <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
      </Pressable>
      <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
        Détail {ofThe(config)}
        {config.singular}
      </Text>
    </View>
  );

  // Élément introuvable (par exemple déjà supprimé)
  if (!record) {
    return (
      <View
        className="flex-1 bg-page px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StatusBar style="dark" />
        {header}
        <View className="mt-10 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name={config.icon} size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            {definite(config).trim() === "l'"
              ? "L'"
              : config.feminine
                ? "La "
                : "Le "}
            {config.singular} introuvable
          </Text>
        </View>
      </View>
    );
  }

  const title = config.list.title(record, org);
  const code = config.list.code?.(record);
  const subtitle = config.list.subtitle?.(record, org);
  const avatar = config.list.avatar?.(record);

  // Regroupe les champs par section
  const sections: { title: string; fields: Field[] }[] = [];
  for (const f of config.fields) {
    if (f.transient) continue;
    const name = f.section ?? "Informations";
    const last = sections[sections.length - 1];
    if (last && last.title === name) last.fields.push(f);
    else sections.push({ title: name, fields: [f] });
  }

  const display = (f: Field, r: OrgRecord): string => {
    const v = r[f.key];
    if (f.type === "checkbox")
      return f.key === "active" || f.key === "actif"
        ? v
          ? "Actif"
          : "Inactif"
        : v
          ? "Oui"
          : "Non";
    if (v === undefined || v === "") return "—";
    if (f.type === "date") return formatDate(fromISO(String(v)));
    if (f.type === "ref" && f.ref) return org.refLabel(f.ref, String(v));
    if (f.type === "select")
      return f.options?.find((o) => o.value === String(v))?.label ?? String(v);
    return String(v);
  };

  const askDelete = () =>
    confirmDeleteRecord(config, title, usage(config.key, record.id), () => {
      router.back();
      remove(config.key, record.id);
    });

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        {header}
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* Carte principale */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                {avatar ? (
                  <Text className="font-inter-bold text-[16px] text-accent">
                    {avatar}
                  </Text>
                ) : (
                  <Ionicons name={config.icon} size={24} color="#FFE600" />
                )}
              </View>

              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[22px] leading-7 text-white"
                >
                  {title}
                </Text>
                {code ? (
                  <Text
                    style={{ fontFamily: MONO }}
                    className="text-[13px] text-white/70"
                  >
                    {code}
                  </Text>
                ) : subtitle ? (
                  <Text
                    numberOfLines={2}
                    className="font-inter text-[13px] text-white/70"
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Informations, par section */}
          {sections.map((section) => (
            <View key={section.title} className="gap-2">
              <Text className="font-inter-bold text-[12px] uppercase tracking-wider text-primary">
                {section.title}
              </Text>
              <View className="rounded-3xl bg-white px-4 shadow-sm">
                {section.fields.map((f, i) => (
                  <InfoRow
                    key={f.key}
                    icon={f.icon ?? "ellipse-outline"}
                    label={f.label.replace(" (optionnel)", "")}
                    value={display(f, record)}
                    mono={f.type === "code" || f.type === "slug"}
                    bordered={i > 0}
                  />
                ))}
              </View>
            </View>
          ))}

          {/* Actions */}
          {canEdit && (
            <View className="gap-3">
              <ActionButton
                icon="create-outline"
                label="Modifier"
                variant="primary"
                className="w-full"
                onPress={() => setEditing(true)}
              />
              <ActionButton
                icon="trash-outline"
                label="Supprimer"
                variant="danger"
                className="w-full"
                onPress={askDelete}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <EntityFormModal
        visible={editing}
        config={config}
        record={record}
        onClose={() => setEditing(false)}
        onSave={(values) => {
          update(config.key, record.id, values);
          setEditing(false);
          showToast("Modifications enregistrées.");
        }}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  bordered,
  mono,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  bordered?: boolean;
  mono?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${bordered ? "border-t border-line" : ""}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <Text className="flex-1 font-inter text-[13px] text-muted">{label}</Text>
      <Text
        numberOfLines={3}
        style={mono ? { fontFamily: MONO } : undefined}
        className={`max-w-[60%] text-right text-[15px] text-ink ${mono ? "" : "font-inter-semibold"}`}
      >
        {value}
      </Text>
    </View>
  );
}
