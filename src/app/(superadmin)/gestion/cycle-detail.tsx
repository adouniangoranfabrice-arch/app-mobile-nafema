import { apiErrorMessage } from "@/api/client";
import { deleteCycle, markCyclesStale, updateCycle } from "@/api/cycles";
import AddCycleModal from "@/components/gestion/AddCycleModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { confirmDeleteCycle } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export default function CycleDetail() {
  // Le cycle est transmis par la liste : pas de route connue pour en lire un seul
  const cycle = useLocalSearchParams<{
    public_key: string;
    abbreviation: string;
    name: string;
    order: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canEdit } = useGestion();
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
        Détail du cycle
      </Text>
    </View>
  );

  // Cycle introuvable (écran ouvert sans passer par la liste)
  if (!cycle.public_key || !cycle.name) {
    return (
      <View
        className="flex-1 bg-page px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StatusBar style="dark" />
        {header}
        <View className="mt-10 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name="sync-outline" size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            Cycle introuvable
          </Text>
        </View>
      </View>
    );
  }

  const current = { ...cycle, order: Number(cycle.order) };

  const remove = () =>
    confirmDeleteCycle(current, async () => {
      try {
        await deleteCycle(cycle.public_key);
        markCyclesStale();
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
                <Ionicons name="sync-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[22px] leading-7 text-white"
                >
                  {cycle.name}
                </Text>
                <Text
                  style={{ fontFamily: MONO }}
                  className="text-[13px] text-white/70"
                >
                  {cycle.abbreviation}
                </Text>
              </View>
            </View>
          </View>

          {/* Informations */}
          <View className="rounded-3xl bg-white px-4 shadow-sm">
            <InfoRow icon="text-outline" label="Nom" value={cycle.name} />
            <InfoRow
              icon="barcode-outline"
              label="Abréviation"
              value={cycle.abbreviation}
              bordered
              mono
            />
            <InfoRow
              icon="swap-vertical-outline"
              label="Ordre"
              value={cycle.order}
              bordered
            />
          </View>

          {/* Actions */}
          {canEdit && (
            <View className="gap-3">
              <ActionButton
                icon="create-outline"
                label="Modifier ce cycle"
                variant="primary"
                className="w-full"
                onPress={() => setEditing(true)}
              />
              <ActionButton
                icon="trash-outline"
                label="Supprimer ce cycle"
                variant="danger"
                className="w-full"
                onPress={remove}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <AddCycleModal
        visible={editing}
        cycle={current}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          await updateCycle(cycle.public_key, data);
          setEditing(false);
          markCyclesStale();
          showToast("Cycle modifié avec succès.");
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
  value: string;
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
