import { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Le haut d'un écran, qui reste en place : le contenu défile en dessous */
export default function FixedHeader({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-line"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="w-full max-w-[640px] gap-4 self-center px-5 pb-3">
        {children}
      </View>
    </View>
  );
}
