import { Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Props = { title: string; onPress?: () => void };

export default function Button({ title, onPress }: Props) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressTo = (value: number) => {
    scale.value = withTiming(value, { duration: 100 });
  };

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => pressTo(0.97)}
        onPressOut={() => pressTo(1)}
        className="h-[54px] items-center justify-center rounded-2xl bg-primary active:opacity-80"
      >
        <Text className="font-inter-semibold text-base text-white">
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
