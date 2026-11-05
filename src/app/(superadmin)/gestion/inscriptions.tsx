import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Inscriptions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-page px-5"
      style={{ paddingTop: insets.top + 12 }}
    >
      <StatusBar style="dark" />

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
        >
          <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
        </Pressable>
        <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
          Inscriptions
        </Text>
      </View>

      <View className="mt-10 items-center gap-2 rounded-3xl bg-white px-6 py-12">
        <Ionicons name="create-outline" size={28} color="#9AA7B8" />
        <Text className="font-inter-semibold text-[15px] text-ink">
          Bientôt disponible
        </Text>
        <Text className="text-center font-inter text-[13px] text-muted">
          La gestion des inscriptions sera disponible prochainement.
        </Text>
      </View>
    </View>
  );
}
