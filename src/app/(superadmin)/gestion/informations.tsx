import { getMe, User } from "@/api/auth";
import { Stagger } from "@/components/ui/MotionView";
import { fromISO } from "@/organisation/helpers";
import { formatDate } from "@/utils/dates";
import { initials } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const SEXES: Record<string, string> = { M: "Masculin", F: "Féminin" };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  enseignant: "Enseignant",
};

export default function Informations() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = () => {
    setFailed(false);
    setAttempt((n) => n + 1);
  };

  const roles = user?.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ");

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* En-tête avec retour */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
            >
              <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
            </Pressable>
            <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
              Informations personnelles
            </Text>
          </View>

          {user ? (
            <Stagger>
              {/* Carte principale */}
              <View className="rounded-3xl bg-primary p-5">
                <View className="flex-row items-center gap-3.5">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-white/15">
                    <Text className="font-inter-bold text-[18px] text-accent">
                      {initials(user.full_name)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={2}
                      className="font-inter-bold text-[20px] leading-6 text-white"
                    >
                      {user.full_name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-inter text-[13px] text-white/70"
                    >
                      {roles || "Aucun rôle"}
                    </Text>
                  </View>
                </View>
              </View>

              <Group title="Identité">
                <InfoRow icon="person-outline" label="Nom" value={user.name} />
                <InfoRow
                  icon="person-outline"
                  label="Prénoms"
                  value={user.firstname}
                  bordered
                />
                <InfoRow
                  icon="ribbon-outline"
                  label="Civilité"
                  value={user.civility}
                  bordered
                />
                <InfoRow
                  icon="male-female-outline"
                  label="Sexe"
                  value={SEXES[user.sexe] ?? user.sexe}
                  bordered
                />
                <InfoRow
                  icon="calendar-outline"
                  label="Date de naissance"
                  value={user.birth_day && formatDate(fromISO(user.birth_day))}
                  bordered
                />
                <InfoRow
                  icon="location-outline"
                  label="Lieu de naissance"
                  value={user.birth_of}
                  bordered
                />
                <InfoRow
                  icon="water-outline"
                  label="Groupe sanguin"
                  value={user.sang}
                  bordered
                />
              </Group>

              <Group title="Contact">
                <InfoRow
                  icon="call-outline"
                  label="Téléphone"
                  value={user.phone}
                />
                <InfoRow
                  icon="mail-outline"
                  label="E-mail"
                  value={user.adresse_email}
                  bordered
                />
                <InfoRow
                  icon="home-outline"
                  label="Résidence"
                  value={user.residence}
                  bordered
                />
              </Group>

              <Group title="Compte">
                <InfoRow
                  icon="shield-checkmark-outline"
                  label="Rôle"
                  value={roles}
                />
                <InfoRow
                  icon="business-outline"
                  label="Établissement"
                  value={user.etablissement?.name}
                  bordered
                />
                <InfoRow
                  icon="pulse-outline"
                  label="Statut"
                  value={user.active ? "Actif" : "Inactif"}
                  bordered
                />
                <InfoRow
                  icon="time-outline"
                  label="Dernière connexion"
                  value={user.connected_at}
                  bordered
                />
              </Group>
            </Stagger>
          ) : failed ? (
            <View className="items-center gap-3 rounded-3xl bg-white py-12">
              <Ionicons
                name="cloud-offline-outline"
                size={28}
                color="#9AA7B8"
              />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Impossible de charger vos informations
              </Text>
              <Pressable onPress={retry} className="active:opacity-70">
                <Text className="font-inter-semibold text-[14px] text-primary">
                  Réessayer
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="items-center rounded-3xl bg-white py-12">
              <ActivityIndicator color="#2B5EA8" />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-inter-bold text-[12px] uppercase tracking-wider text-primary">
        {title}
      </Text>
      <View className="rounded-3xl bg-white px-4 shadow-sm">{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  bordered,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
  bordered?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${bordered ? "border-t border-line" : ""}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <Text className="flex-1 font-inter text-[13px] text-muted">{label}</Text>
      <Text
        numberOfLines={2}
        className="max-w-[55%] text-right font-inter-semibold text-[15px] text-ink"
      >
        {value || "—"}
      </Text>
    </View>
  );
}
