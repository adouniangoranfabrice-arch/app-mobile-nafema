import { Children, ReactNode, useEffect } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const STEP_MS = 60;

/** Apparaît en glissant vers le haut. `index` décale le départ, pour enchaîner plusieurs éléments */
export function MotionView({
  index = 0,
  style,
  children,
}: {
  index?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * STEP_MS)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/** Comme MotionView, mais attend `start` : pour ce qui n'arrive à l'écran qu'au défilement */
export function Reveal({
  start,
  delay = 0,
  style,
  onLayout,
  children,
}: {
  start: boolean;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  onLayout?: (e: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (start) {
      progress.value = withDelay(delay, withTiming(1, { duration: 350 }));
    }
  }, [start, delay, progress]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return (
    <Animated.View onLayout={onLayout} style={[style, revealStyle]}>
      {children}
    </Animated.View>
  );
}

/** Un Pressable qui se réduit légèrement sous le doigt */
export function PressScale({
  style,
  ...props
}: Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressTo = (value: number) => {
    scale.value = withTiming(value, { duration: 100 });
  };

  return (
    <Animated.View style={[style, pressStyle]}>
      <Pressable
        {...props}
        onPressIn={() => pressTo(0.96)}
        onPressOut={() => pressTo(1)}
      />
    </Animated.View>
  );
}

/** Fait apparaître ses enfants l'un après l'autre (les enfants masqués sont ignorés) */
export function Stagger({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.toArray(children).map((child, i) => (
        <MotionView key={i} index={i}>
          {child}
        </MotionView>
      ))}
    </>
  );
}
