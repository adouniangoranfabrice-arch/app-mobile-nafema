import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type Props = {
  checked: boolean;
  onToggle: () => void;
  title: string;
  description?: string;
};

export default function CheckboxRow({
  checked,
  onToggle,
  title,
  description,
}: Props) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-3 rounded-2xl border border-line bg-field p-3.5 active:opacity-90"
    >
      <View
        className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
          checked ? "border-primary bg-primary" : "border-[#9AA7B8] bg-white"
        }`}
      >
        {checked && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-[15px] text-ink">
          {title}
        </Text>
        {description ? (
          <Text className="font-inter text-xs text-muted">{description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
