import { useEffect } from "react";
import { DimensionValue, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/** Bloc gris qui pulse : réserve la place d'une donnée en cours de chargement */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  color = "#E4EAF1",
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  /** Teinte du bloc : à éclaircir sur un fond foncé */
  color?: string;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: color },
        style,
      ]}
    />
  );
}

/** Cartes fantômes reprenant la forme d'une ligne de liste (pastille, titre, sous-titre, actions) */
export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View
      accessible
      accessibilityLabel="Chargement en cours"
      accessibilityRole="progressbar"
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className="w-full max-w-[640px] self-center px-5 pb-3">
          <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <Skeleton width={44} height={44} radius={12} />
            <View className="flex-1 gap-2">
              <Skeleton width={i % 2 ? "55%" : "70%"} height={14} />
              <Skeleton width="35%" height={10} />
            </View>
            <Skeleton width={34} height={34} radius={17} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Lignes fantômes « libellé / valeur » pour une fiche d'informations */
export function SkeletonInfo({ rows = 5 }: { rows?: number }) {
  return (
    <View
      accessible
      accessibilityLabel="Chargement en cours"
      accessibilityRole="progressbar"
      className="gap-4 rounded-3xl bg-white p-5 shadow-sm"
    >
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="gap-2">
          <Skeleton width="30%" height={10} />
          <Skeleton width={i % 2 ? "50%" : "75%"} height={14} />
        </View>
      ))}
    </View>
  );
}
