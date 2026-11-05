import { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScreenPlaceholder({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 items-center justify-center bg-page px-5"
      style={{ paddingTop: insets.top }}
    >
      <Text className="font-inter-bold text-2xl text-ink">{title}</Text>
      <Text className="mt-2 font-inter text-muted">Écran à venir</Text>
      {children}
    </View>
  );
}
