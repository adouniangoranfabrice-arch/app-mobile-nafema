import FixedHeader from "@/components/ui/FixedHeader";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export default function SalleDetail() {
  // La salle est transmise par la liste : pas de route connue pour en lire une seule
  const salle = useLocalSearchParams<{
    code: string;
    name: string;
    capacite: string;
    etab_name: string;
  }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
          </Pressable>
          <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
            Détail de la salle
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Salle introuvable : écran ouvert sans passer par la liste */}
        {!salle.name ? (
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="cube-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Salle introuvable
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {/* Carte principale */}
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons name="cube-outline" size={24} color="#FFE600" />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-inter-bold text-[22px] leading-7 text-white"
                  >
                    {salle.name}
                  </Text>
                  <Text
                    style={{ fontFamily: MONO }}
                    className="text-[13px] text-white/70"
                  >
                    {salle.code}
                  </Text>
                </View>
              </View>
            </View>

            {/* Informations */}
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              <InfoRow icon="text-outline" label="Nom" value={salle.name} />
              <InfoRow
                icon="barcode-outline"
                label="Code"
                value={salle.code}
                bordered
                mono
              />
              <InfoRow
                icon="people-outline"
                label="Capacité"
                value={salle.capacite ? `${salle.capacite} places` : "—"}
                bordered
              />
              <InfoRow
                icon="business-outline"
                label="Établissement"
                value={salle.etab_name || "—"}
                bordered
              />
            </View>
          </View>
        )}
      </ScrollView>
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
