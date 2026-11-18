import { Stack } from "expo-router";

// Le menu Gestion reste toujours sous un écran ouvert depuis un autre onglet : le retour y revient
export const unstable_settings = { initialRouteName: "index" };

export default function gestionLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
