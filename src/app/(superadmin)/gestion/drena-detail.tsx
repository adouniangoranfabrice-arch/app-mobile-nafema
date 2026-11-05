import { apiErrorMessage } from "@/api/client";
import { deleteDren, updateDren } from "@/api/drens";
import AddDrenaModal from "@/components/gestion/AddDrenaModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { markDrenasStale } from "@/hooks/use-drena-list";
import { confirmDeleteDrena } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export default function DrenaDetail() {
  // La DRENA est transmise par l'écran précédent : pas encore de route pour en lire une seule
  const { readonly, ...drena } = useLocalSearchParams<{
    public_key: string;
    slug: string;
    name: string;
    readonly?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);

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
        Détail de la DRENA
      </Text>
    </View>
  );

  // DRENA introuvable (écran ouvert sans passer par la liste)
  if (!drena.name) {
    return (
      <View
        className="flex-1 bg-page px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StatusBar style="dark" />
        {header}
        <View className="mt-10 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name="map-outline" size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            DRENA introuvable
          </Text>
        </View>
      </View>
    );
  }

  const remove = () =>
    confirmDeleteDrena(drena, async () => {
      try {
        await deleteDren(drena.public_key);
        markDrenasStale();
        router.back();
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
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
                <Ionicons name="map-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[22px] leading-7 text-white"
                >
                  {drena.name}
                </Text>
                <Text
                  style={{ fontFamily: MONO }}
                  className="text-[13px] text-white/70"
                >
                  {drena.slug}
                </Text>
              </View>
            </View>
          </View>

          {/* Informations */}
          <View className="rounded-3xl bg-white px-4 shadow-sm">
            <InfoRow
              icon="business-outline"
              label="Nom"
              value={drena.name}
            />
            <InfoRow
              icon="barcode-outline"
              label="Code"
              value={drena.slug || "—"}
              bordered
              mono
            />
          </View>

          {/* Actions */}
          {!readonly && (
            <View className="gap-3">
              <ActionButton
                icon="create-outline"
                label="Modifier cette DRENA"
                variant="primary"
                className="w-full"
                onPress={() => setEditing(true)}
              />
              <ActionButton
                icon="trash-outline"
                label="Supprimer cette DRENA"
                variant="danger"
                className="w-full"
                onPress={remove}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <AddDrenaModal
        visible={editing}
        drena={drena}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          await updateDren(drena.public_key, data);
          setEditing(false);
          markDrenasStale();
          showToast("DRENA modifiée avec succès.");
          router.back(); // retour à la liste, rechargée avec la modification
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
