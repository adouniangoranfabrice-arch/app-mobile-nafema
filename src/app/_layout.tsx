// import {
//   Inter_400Regular,
//   Inter_600SemiBold,
//   Inter_700Bold,
//   useFonts,
// } from "@expo-google-fonts/inter";
import AnimatedSplash from "@/components/AnimatedSplash";
import { ToastHost } from "@/components/ui/Toast";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useState } from "react";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);

  const hideNativeSplash = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  if (!loaded) return null;

  // Les écrans ne sont montés qu'après le logo, sinon leur animation se jouerait derrière lui
  if (!splashDone)
    return <AnimatedSplash onReady={hideNativeSplash} onDone={finishSplash} />;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#E5EAEB" },
        }}
      />
      <ToastHost />
    </>
  );
}
