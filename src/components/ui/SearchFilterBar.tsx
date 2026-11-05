import SearchBar from "@/components/ui/SearchBar";
import { ReactNode, useState } from "react";
import { LayoutAnimation, View } from "react-native";

type Props = {
  query: string;
  onQueryChange: (text: string) => void;
  placeholder: string;
  activeCount: number; // nombre de filtres actifs (affiché sur le bouton)
  onReset: () => void;
  children: ReactNode; // les contrôles de filtre
};

export default function SearchFilterBar({
  query,
  onQueryChange,
  placeholder,
  activeCount,
  onReset,
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  const highlighted = open || activeCount > 0;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2.5">
        <View className="flex-1">
          <SearchBar
            value={query}
            onChangeText={onQueryChange}
            placeholder={placeholder}
          />
        </View>
      </View>
    </View>
  );
}
