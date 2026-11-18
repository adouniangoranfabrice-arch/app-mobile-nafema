import { Stack } from "expo-router";

// La liste reste toujours sous le détail
export const unstable_settings = { initialRouteName: "index" };

export default function ClassesLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
