import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export default function SearchBar({ value, onChangeText, placeholder }: Props) {
  return (
    <View className="h-[50px] flex-row items-center gap-2.5 rounded-2xl border border-line bg-white px-3.5">
      <Ionicons name="search-outline" size={20} color="#6B7A90" />
      <TextInput
        className="h-full flex-1 font-inter text-[15px] text-ink"
        placeholder={placeholder}
        placeholderTextColor="#9AA7B8"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color="#9AA7B8" />
        </Pressable>
      )}
    </View>
  );
}
