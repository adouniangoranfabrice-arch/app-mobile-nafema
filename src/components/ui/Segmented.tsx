import { Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export default function Segmented({ label, value, options, onChange }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-inter-semibold text-[15px] text-ink">
        {label}
      </Text>
      <View className="flex-row rounded-2xl bg-page p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              // shadow-none : NativeWind remonterait le bouton si l'ombre n'apparaissait qu'au clic
              className={`flex-1 items-center rounded-xl py-2.5 ${active ? "bg-white shadow-sm" : "shadow-none"}`}
            >
              <Text
                className={`font-inter-semibold text-[13px] ${active ? "text-primary" : "text-muted"}`}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
