import { Stack } from "expo-router";

// La liste reste toujours sous le détail
export const unstable_settings = { initialRouteName: "index" };

export default function EcolesLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
