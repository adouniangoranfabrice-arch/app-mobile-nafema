import { formatDate } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  defaultValue?: Date; // date proposée à l'ouverture si rien n'est choisi
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
};

export default function DateField({
  label,
  value,
  onChange,
  defaultValue,
  minimumDate,
  maximumDate,
  error,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const fallback = defaultValue ?? new Date();

  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: value ?? fallback,
        mode: "date",
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === "set" && date) onChange(date);
        },
      });
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!value) onChange(fallback);
    setShowPicker((v) => !v);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 font-inter-semibold text-[15px] text-ink">
        {label}
      </Text>

      <Pressable
        onPress={open}
        className={`h-[54px] flex-row items-center gap-2.5 rounded-2xl border bg-field px-3.5 ${
          error ? "border-red-500" : "border-line"
        }`}
      >
        <Ionicons name="calendar-outline" size={20} color="#6B7A90" />
        <Text
          className={`flex-1 font-inter text-[15px] ${value ? "text-ink" : "text-[#9AA7B8]"}`}
        >
          {value ? formatDate(value) : "Choisir une date"}
        </Text>
        <Ionicons
          name={
            Platform.OS === "ios" && showPicker ? "chevron-up" : "chevron-down"
          }
          size={18}
          color="#6B7A90"
        />
      </Pressable>

      {Platform.OS === "ios" && showPicker && (
        <View className="mt-2 rounded-2xl bg-field px-2">
          <DateTimePicker
            value={value ?? fallback}
            mode="date"
            display="inline"
            locale="fr-FR"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor="#2B5EA8"
            themeVariant="light"
            onChange={(_event, date) => {
              if (date) onChange(date);
            }}
          />
        </View>
      )}

      {error ? (
        <Text className="mt-1.5 font-inter text-[13px] text-red-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
