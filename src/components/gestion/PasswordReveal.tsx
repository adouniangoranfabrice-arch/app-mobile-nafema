import { showToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

/** Durée d'affichage du mot de passe : 3 minutes */
export const REVEAL_SECONDS = 180;

type Props = {
  /** Nom de l'établissement créé */
  school: string;
  email: string;
  password: string;
  /** Appelé à la fin des 3 minutes ou à la fermeture : le mot de passe n'est plus gardé */
  onDone: () => void;
};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Identifiants du gérant, affichés une seule fois après la création, pendant 3 minutes.
 * Passé ce délai, l'encart disparaît et le mot de passe n'est plus conservé dans l'application.
 */
export default function PasswordReveal({ school, email, password, onDone }: Props) {
  // Heure de fin fixe : le décompte reste juste même si l'application passe en arrière-plan
  const [endsAt] = useState(() => Date.now() + REVEAL_SECONDS * 1000);
  const [left, setLeft] = useState(REVEAL_SECONDS);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      const s = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(timer);
        onDone();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAt, onDone]);

  const progress = left / REVEAL_SECONDS;

  // « Copié » reste affiché 2 secondes après la copie
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      // Contenu sensible : Android masque l'aperçu du presse-papiers
      await Clipboard.setStringAsync(password, { android: { isSensitive: true } });
      setCopied(true);
      showToast("Mot de passe copié dans le presse-papiers.");
    } catch {
      showToast("Impossible de copier le mot de passe.", "error");
    }
  };

  return (
    <View className="gap-3 rounded-3xl border border-[#F5D000] bg-[#FFF9D6] p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#FFE600]">
          <Ionicons name="key-outline" size={20} color="#1B2A41" />
        </View>
        <View className="flex-1">
          <Text className="font-inter-bold text-[15px] text-ink">Accès du gérant</Text>
          <Text numberOfLines={1} className="font-inter text-xs text-[#7A5F00]">
            {school}
          </Text>
        </View>
        <Pressable
          onPress={onDone}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Masquer le mot de passe"
          className="h-8 w-8 items-center justify-center rounded-full bg-white/70 active:opacity-70"
        >
          <Ionicons name="close" size={18} color="#7A5F00" />
        </Pressable>
      </View>

      <View className="gap-2 rounded-2xl bg-white p-3.5">
        <View className="flex-row items-center gap-2">
          <Text className="w-[92px] font-inter text-[12px] text-muted">E-mail</Text>
          <Text selectable numberOfLines={1} className="flex-1 font-inter-semibold text-[14px] text-ink">
            {email}
          </Text>
        </View>
        <View className="h-px bg-line" />
        <View className="flex-row items-center gap-2">
          <Text className="w-[92px] font-inter text-[12px] text-muted">Mot de passe</Text>
          <Text
            selectable
            numberOfLines={1}
            className="flex-1 font-inter-bold text-[16px] tracking-wide text-ink"
          >
            {visible ? password : "•".repeat(Math.min(password.length, 16))}
          </Text>
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            className="active:opacity-70"
          >
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color="#2B5EA8" />
          </Pressable>
        </View>
      </View>

      {/* Copier le mot de passe */}
      <Pressable
        onPress={copy}
        accessibilityRole="button"
        accessibilityLabel="Copier le mot de passe"
        className={`h-11 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80 ${copied ? "bg-green-600" : "bg-primary"}`}
      >
        <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color="#FFFFFF" />
        <Text className="font-inter-semibold text-[14px] text-white">
          {copied ? "Mot de passe copié" : "Copier le mot de passe"}
        </Text>
      </Pressable>

      {/* Temps restant */}
      <View className="gap-1.5">
        <View className="h-1.5 overflow-hidden rounded-full bg-white">
          <View className="h-full rounded-full bg-[#7A5F00]" style={{ width: `${progress * 100}%` }} />
        </View>
        <Text className="font-inter text-xs text-[#7A5F00]">
          Notez-le et transmettez-le au gérant : il disparaît dans {mmss(left)} et ne sera plus affiché.
        </Text>
      </View>
    </View>
  );
}
