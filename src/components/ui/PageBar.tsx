import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Barre de pagination fixée en bas de l'écran. Masquée s'il n'y a qu'une seule page */
export default function PageBar({
  page,
  pageCount,
  hasPrevious,
  hasNext,
  busy,
  onPrevious,
  onNext,
}: {
  page: number;
  pageCount?: number | null;
  hasPrevious: boolean;
  hasNext: boolean;
  busy?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const insets = useSafeAreaInsets();

  if (!hasPrevious && !hasNext) return null;

  return (
    <View
      className="border-t border-line bg-white"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="w-full max-w-[640px] flex-row items-center justify-between gap-2 self-center px-5 pt-3">
        <PageButton
          icon="chevron-back"
          label="Précédent"
          disabled={!hasPrevious || !!busy}
          onPress={onPrevious}
        />
        {busy ? (
          <ActivityIndicator color="#2B5EA8" />
        ) : (
          <Text className="font-inter-semibold text-[13px] text-ink">
            Page {page}
            {pageCount ? ` sur ${pageCount}` : ""}
          </Text>
        )}
        <PageButton
          icon="chevron-forward"
          label="Suivant"
          iconAfter
          disabled={!hasNext || !!busy}
          onPress={onNext}
        />
      </View>
    </View>
  );
}

function PageButton({
  icon,
  label,
  iconAfter,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconAfter?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const color = disabled ? "#9AA7B8" : "#2B5EA8";
  const glyph = <Ionicons name={icon} size={18} color={color} />;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`h-11 flex-row items-center gap-1 rounded-xl px-3 ${
        disabled ? "bg-page" : "bg-soft active:opacity-80"
      }`}
    >
      {!iconAfter && glyph}
      <Text
        className={`font-inter-semibold text-[13px] ${
          disabled ? "text-muted" : "text-primary"
        }`}
      >
        {label}
      </Text>
      {iconAfter && glyph}
    </Pressable>
  );
}
