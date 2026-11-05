import { Ionicons } from "@expo/vector-icons";
import { useSyncExternalStore } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error";
type ToastData = { id: number; message: string; type: ToastType };

const DURATION_MS: Record<ToastType, number> = { success: 3000, error: 4000 };

const STYLES = {
  success: { box: "bg-green-700", icon: "checkmark-circle" },
  error: { box: "bg-red-700", icon: "alert-circle" },
} as const;

// L'alerte vit hors des écrans : elle reste visible après un retour en arrière
let current: ToastData | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let nextId = 0;
const listeners = new Set<() => void>();

const setCurrent = (toast: ToastData | null) => {
  current = toast;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Affiche une alerte flottante, verte ou rouge, qui disparaît toute seule */
export function showToast(message: string, type: ToastType = "success") {
  if (timer) clearTimeout(timer);
  setCurrent({ id: ++nextId, message, type });
  timer = setTimeout(() => setCurrent(null), DURATION_MS[type]);
}

/** L'alerte rouge d'un formulaire refusé avant l'envoi */
export const showFormError = () =>
  showToast("Vérifie les champs en rouge.", "error");

/** L'endroit où l'alerte s'affiche : à la racine, et dans chaque Modal car il passe au-dessus de la racine */
export function ToastHost() {
  const toast = useSyncExternalStore(
    subscribe,
    () => current,
    () => null, // rendu côté serveur sur le web : pas d'alerte
  );
  const insets = useSafeAreaInsets();

  if (!toast) return null;
  const style = STYLES[toast.type];

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInUp.duration(250)}
      exiting={FadeOutUp.duration(250)}
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top + 12,
        left: 20,
        right: 20,
        zIndex: 10,
        elevation: 10,
      }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className={`w-full max-w-[600px] flex-row items-center gap-2.5 self-center rounded-2xl px-4 py-3.5 shadow-sm ${style.box}`}
      >
        <Ionicons name={style.icon} size={22} color="#FFFFFF" />
        <Text className="flex-1 font-inter-semibold text-[14px] text-white">
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
}
