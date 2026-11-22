import { Stack } from "expo-router";

// Les effectifs restent toujours sous la liste des élèves d'une classe
export const unstable_settings = { initialRouteName: "index" };

export default function EffectifsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
