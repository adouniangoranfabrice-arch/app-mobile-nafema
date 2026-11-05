import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  error?: string;
};

const Input = forwardRef<TextInput, Props>(function Input(
  { label, icon, isPassword, error, multiline, ...props },
  ref,
) {
  const [show, setShow] = useState(false);

  return (
    <View className="mb-5">
      <Text className="mb-2 font-inter-semibold text-[15px] text-ink">
        {label}
      </Text>

      <View
        className={`flex-row gap-2.5 rounded-2xl border bg-field px-3.5 ${
          multiline
            ? "min-h-[96px] items-start pt-3.5"
            : "h-[54px] items-center"
        } ${error ? "border-red-500" : "border-line"}`}
      >
        <Ionicons name={icon} size={20} color="#6B7A90" />

        <TextInput
          className={`flex-1 font-inter text-[15px] text-ink ${multiline ? "min-h-[64px]" : "h-full"}`}
          placeholderTextColor="#9AA7B8"
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          secureTextEntry={isPassword && !show}
          {...props}
        />

        {isPassword && (
          <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}>
            <Ionicons
              name={show ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#6B7A90"
            />
          </Pressable>
        )}
      </View>

      {error ? (
        <Text className="mt-1.5 font-inter text-[13px] text-red-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export default Input;
