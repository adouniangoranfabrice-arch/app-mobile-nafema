import { useEffect } from "react";
import { Image, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const PULSE_MS = 350;
const EXIT_MS = 300;

type Props = {
  /** Appelé quand le logo est affiché : l'écran natif peut alors disparaître sans saut */
  onReady: () => void;
  onDone: () => void;
};

/** Prend le relais de l'écran de démarrage natif : même fond et même taille de logo (app.json) */
export default function AnimatedSplash({ onReady, onDone }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.12, { duration: PULSE_MS }),
      withTiming(1, { duration: PULSE_MS }),
      withTiming(1.3, { duration: EXIT_MS }),
    );
    opacity.value = withDelay(
      PULSE_MS * 2,
      withTiming(0, { duration: EXIT_MS }),
    );

    // Un minuteur plutôt que la fin de l'animation : l'application démarre même si elle ne se joue pas
    const timer = setTimeout(onDone, PULSE_MS * 2 + EXIT_MS);
    return () => clearTimeout(timer);
  }, [scale, opacity, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <Animated.View style={logoStyle} onLayout={onReady}>
        <Image
          source={require("@/assets/images/logo_nefama.png")}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
