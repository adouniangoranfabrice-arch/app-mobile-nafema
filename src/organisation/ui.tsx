import { IconName, Tone } from "@/organisation/types";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";

export const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

const TONES: Record<Tone, { box: string; text: string }> = {
  green: { box: "bg-green-100", text: "text-green-700" },
  blue: { box: "bg-soft", text: "text-primary" },
  purple: { box: "bg-purple-100", text: "text-purple-700" },
  slate: { box: "bg-slate-100", text: "text-muted" },
  dark: { box: "bg-ink", text: "text-white" },
  amber: { box: "bg-[#FFF1A8]", text: "text-[#7A5F00]" },
};

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  const t = TONES[tone];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${t.box}`}>
      <Text className={`font-inter-semibold text-[11px] ${t.text}`}>
        {label}
      </Text>
    </View>
  );
}

export function IconButton({
  icon,
  color,
  label,
  onPress,
}: {
  icon: IconName;
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
