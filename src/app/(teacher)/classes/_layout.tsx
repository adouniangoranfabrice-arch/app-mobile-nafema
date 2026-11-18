import { Stack } from "expo-router";

// La liste des classes reste toujours sous les écrans ouverts depuis un autre onglet
export const unstable_settings = { initialRouteName: "index" };

export default function ClassesLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
