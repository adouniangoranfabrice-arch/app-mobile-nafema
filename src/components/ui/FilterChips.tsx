import { Pressable, ScrollView, Text } from "react-native";

export type Chip = { key: string; label: string; count?: number };

type Props = {
  chips: Chip[];
  selected: string;
  onSelect: (key: string) => void;
};

// Le « -mx-5 » compense le « px-5 » du conteneur parent : les puces défilent jusqu'au bord de l'écran.
export default function FilterChips({ chips, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-5"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {chips.map((c) => {
        const active = c.key === selected;
        return (
          <Pressable
            key={c.key}
            onPress={() => onSelect(c.key)}
            className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 active:opacity-90 ${
              active ? "bg-primary" : "bg-white"
            }`}
          >
            <Text
              className={`font-inter-semibold text-[13px] ${active ? "text-white" : "text-ink"}`}
            >
              {c.label}
            </Text>
            {c.count !== undefined && (
              <Text
                className={`font-inter text-xs ${active ? "text-white/70" : "text-muted"}`}
              >
                {c.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
