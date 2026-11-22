import type { PhotoFile } from "@/api/inscriptions";
import { showToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Platform, Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  value: PhotoFile | null;
  onChange: (photo: PhotoFile | null) => void;
};

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true, // recadrage carré, comme une photo d'identité
  aspect: [1, 1],
  quality: 0.7, // photo plus légère à envoyer
};

/** Photo facultative : choisie dans la galerie ou prise avec l'appareil photo */
export default function PhotoPicker({ label, value, onChange }: Props) {
  const pick = async (source: "gallery" | "camera") => {
    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          showToast("Autorisez l'accès à l'appareil photo dans les réglages du téléphone.", "error");
          return;
        }
      } else if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showToast("Autorisez l'accès aux photos dans les réglages du téléphone.", "error");
          return;
        }
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(OPTIONS)
          : await ImagePicker.launchImageLibraryAsync(OPTIONS);
      if (result.canceled || !result.assets?.[0]) return;
      const a = result.assets[0];
      const type = a.mimeType ?? "image/jpeg";
      const ext = type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      onChange({ uri: a.uri, name: a.fileName || `photo-eleve-${Date.now()}.${ext}`, type });
    } catch {
      showToast("Impossible d'ouvrir la photo.", "error");
    }
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 font-inter-semibold text-[15px] text-ink">{label}</Text>
      <View className="flex-row items-center gap-4">
        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-soft">
          {value ? (
            <Image source={{ uri: value.uri }} style={{ width: 80, height: 80 }} contentFit="cover" />
          ) : (
            <Ionicons name="person" size={34} color="#9AA7B8" />
          )}
        </View>
        <View className="flex-1 gap-2">
          <View className="flex-row gap-2">
            <SmallButton icon="images-outline" label="Galerie" onPress={() => pick("gallery")} />
            {Platform.OS !== "web" && (
              <SmallButton icon="camera-outline" label="Photo" onPress={() => pick("camera")} />
            )}
          </View>
          {value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={6} className="self-start active:opacity-70">
              <Text className="font-inter-semibold text-[13px] text-red-600">Retirer la photo</Text>
            </Pressable>
          ) : (
            <Text className="font-inter text-xs text-muted">Facultative</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function SmallButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-line bg-white active:opacity-80"
    >
      <Ionicons name={icon} size={17} color="#2B5EA8" />
      <Text className="font-inter-semibold text-[13px] text-primary">{label}</Text>
    </Pressable>
  );
}
