import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

type Variant = "soft" | "primary" | "danger";

const STYLES: Record<Variant, { box: string; text: string; icon: string }> = {
  soft: { box: "bg-soft", text: "text-primary", icon: "#2B5EA8" },
  primary: { box: "bg-primary", text: "text-white", icon: "#FFFFFF" },
  danger: { box: "bg-red-50", text: "text-red-600", icon: "#DC2626" },
};

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: Variant;
  className?: string; // remplace la largeur par défaut (flex-1)
};

export default function ActionButton({
  icon,
  label,
  onPress,
  variant = "soft",
  className = "flex-1",
}: Props) {
  const s = STYLES[variant];
  return (
    <Pressable
      onPress={onPress}
      className={`h-11 flex-row items-center justify-center gap-1.5 rounded-xl active:opacity-80 ${s.box} ${className}`}
    >
      <Ionicons name={icon} size={17} color={s.icon} />
      <Text className={`font-inter-semibold text-[13px] ${s.text}`}>
        {label}
      </Text>
    </Pressable>
  );
}
