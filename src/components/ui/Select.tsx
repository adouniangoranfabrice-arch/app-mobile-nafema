import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export type Option = { value: string; label: string };

type Props = {
  label?: string;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  error?: string;
  containerClassName?: string;
  searchable?: boolean; // affiche une zone de recherche dans la liste
};

export default function Select({
  label,
  placeholder = "Sélectionner",
  icon = "business-outline",
  value,
  options,
  onChange,
  error,
  containerClassName = "mb-4",
  searchable,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.value === value);

  const q = normalize(query);
  const shown =
    searchable && q
      ? options.filter((o) => normalize(o.label).includes(q))
      : options;

  const animate = () =>
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

  const toggle = () => {
    animate();
    setOpen((v) => !v);
    setQuery("");
  };

  const pick = (v: string) => {
    animate();
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <View className={containerClassName}>
      {label && (
        <Text className="mb-2 font-inter-semibold text-[15px] text-ink">
          {label}
        </Text>
      )}

      <Pressable
        onPress={toggle}
        className={`h-[54px] flex-row items-center gap-2.5 rounded-2xl border bg-field px-3.5 ${
          error ? "border-red-500" : "border-line"
        }`}
      >
        <Ionicons
          name={searchable ? "search-outline" : icon}
          size={20}
          color="#6B7A90"
        />
        <Text
          numberOfLines={1}
          className={`flex-1 font-inter text-[15px] ${selected ? "text-ink" : "text-[#9AA7B8]"}`}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7A90"
        />
      </Pressable>

      {open && (
        <View className="mt-2 overflow-hidden rounded-2xl border border-line bg-white">
          {searchable && (
            <View className="flex-row items-center gap-2 border-b border-line px-3.5">
              <Ionicons name="search-outline" size={17} color="#9AA7B8" />
              <TextInput
                className="h-11 flex-1 font-inter text-[14px] text-ink"
                placeholder="Rechercher…"
                placeholderTextColor="#9AA7B8"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <ScrollView
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {shown.length === 0 ? (
              <Text className="px-3.5 py-4 text-center font-inter text-[13px] text-muted">
                Aucun résultat
              </Text>
            ) : (
              shown.map((o, i) => {
                const active = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => pick(o.value)}
                    className={`flex-row items-center gap-2 px-3.5 py-3 active:opacity-80 ${
                      active ? "bg-soft" : ""
                    } ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <Text
                      numberOfLines={1}
                      className={`flex-1 text-[14px] ${
                        active
                          ? "font-inter-semibold text-primary"
                          : "font-inter text-ink"
                      }`}
                    >
                      {o.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={18} color="#2B5EA8" />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
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
