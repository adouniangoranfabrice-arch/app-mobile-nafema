import AddIeppModal from "@/components/gestion/AddIeppModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { useDrenas } from "@/context/DrenasContext";
import { confirmDeleteIepp } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export default function IeppDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { drenas, iepps, updateIepp, deleteIepp } = useDrenas();
  const [editing, setEditing] = useState(false);

  const iepp = iepps.find((i) => i.public_key === id);

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
        Détail de l'IEPP
      </Text>
    </View>
  );

  // IEPP introuvable (par exemple déjà supprimée)
  if (!iepp) {
    return (
      <View
        className="flex-1 bg-page px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StatusBar style="dark" />
        {header}
        <View className="mt-10 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name="business-outline" size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            IEPP introuvable
          </Text>
        </View>
      </View>
    );
  }

  const remove = () =>
    confirmDeleteIepp(iepp, () => {
      router.back();
      deleteIepp(iepp.public_key);
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
                <Ionicons name="business-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[22px] leading-7 text-white"
                >
                  {iepp.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-inter text-[13px] text-white/70"
                >
                  {iepp.dren.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Informations : Code, Nom, DRENA */}
          <View className="rounded-3xl bg-white px-4 shadow-sm">
            <InfoRow
              icon="barcode-outline"
              label="Code"
              value={iepp.code || "—"}
              mono
            />
            <InfoRow
              icon="business-outline"
              label="Nom"
              value={iepp.name}
              bordered
            />
            <InfoRow
              icon="map-outline"
              label="DRENA"
              value={iepp.dren.name}
              bordered
            />
            <InfoRow
              icon="barcode-outline"
              label="Code DRENA"
              value={iepp.dren.code}
              bordered
              mono
            />
          </View>

          {/* Raccourci vers la DRENA */}
          <ActionButton
            icon="map-outline"
            label="Voir la DRENA"
            className="w-full"
            onPress={() =>
              router.push({
                pathname: "/(superadmin)/gestion/drena-detail",
                params: {
                  public_key: iepp.dren.public_key,
                  slug: iepp.dren.code,
                  name: iepp.dren.name,
                  readonly: "1", // DRENA fictive : le serveur ne la connaît pas
                },
              })
            }
          />

          {/* Actions */}
          <View className="gap-3">
            <ActionButton
              icon="create-outline"
              label="Modifier cette IEPP"
              variant="primary"
              className="w-full"
              onPress={() => setEditing(true)}
            />
            <ActionButton
              icon="trash-outline"
              label="Supprimer cette IEPP"
              variant="danger"
              className="w-full"
              onPress={remove}
            />
          </View>
        </View>
      </ScrollView>

      <AddIeppModal
        visible={editing}
        iepp={iepp}
        drenas={drenas}
        existing={iepps}
        onClose={() => setEditing(false)}
        onSave={(data) => {
          updateIepp(iepp.public_key, data);
          setEditing(false);
          showToast("IEPP modifiée avec succès.");
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
  icon: keyof typeof Ionicons.glyphMap;
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
        numberOfLines={2}
        style={mono ? { fontFamily: MONO } : undefined}
        className={`max-w-[60%] text-right text-[15px] text-ink ${mono ? "" : "font-inter-semibold"}`}
      >
        {value}
      </Text>
    </View>
  );
}
