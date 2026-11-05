import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode, useRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Feuille qui monte du bas. Le contenu n'est monté que lorsqu'elle est visible : le formulaire se réinitialise à chaque ouverture. */
export function SheetModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {visible ? children : null}
    </Modal>
  );
}

type FormSheetProps = {
  title: string;
  subtitle?: string;
  submitLabel: string;
  showError?: boolean;
  onClose: () => void;
  /** Renvoie false si le formulaire est invalide (la feuille remonte alors en haut) */
  onSubmit: () => boolean | void;
  children: ReactNode;
};

export function FormSheet({
  title,
  subtitle,
  submitLabel,
  showError,
  onClose,
  onSubmit,
  children,
}: FormSheetProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);

  const submit = () => {
    if (onSubmit() === false)
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    // push("/(superadmin)/gestion/iepps");
  };

  return (
    <View className="flex-1 bg-white">
      <View
        className="flex-row items-center justify-between gap-3 px-5 pb-3"
        style={{ paddingTop: Platform.OS === "android" ? insets.top + 12 : 20 }}
      >
        <View className="flex-1">
          <Text className="font-inter-bold text-xl text-ink">{title}</Text>
          {subtitle ? (
            <Text numberOfLines={1} className="font-inter text-xs text-muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-soft active:opacity-80"
        >
          <Ionicons name="close" size={20} color="#2B5EA8" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View
        className="flex-row gap-3 border-t border-line px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={onClose}
          className="h-[54px] flex-1 items-center justify-center rounded-2xl border border-line bg-white active:opacity-80"
        >
          <Text className="font-inter-semibold text-base text-ink">
            Annuler
          </Text>
        </Pressable>
        <View className="flex-1">
          <Button title={submitLabel} onPress={submit} />
        </View>
      </View>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-2 font-inter-bold text-[12px] uppercase tracking-wider text-primary">
      {children}
    </Text>
  );
}
