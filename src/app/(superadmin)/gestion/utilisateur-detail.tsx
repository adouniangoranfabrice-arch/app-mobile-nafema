import { openedUtilisateur, utilisateurRoles } from "@/api/utilisateurs";
import FixedHeader from "@/components/ui/FixedHeader";
import { fromISO } from "@/organisation/helpers";
import { formatDate } from "@/utils/dates";
import { initials } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const SEXES: Record<string, string> = { M: "Masculin", F: "Féminin" };

export default function UtilisateurDetail() {
  const router = useRouter();
  const user = openedUtilisateur();
  const roles = user ? utilisateurRoles(user).join(", ") : "";

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
          </Pressable>
          <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
            Détail de l'utilisateur
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {user ? (
            <>
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
                      {user.etablissement?.name ?? "Aucun établissement"}
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
              </Group>

              <Group title="Contact">
                <InfoRow
                  icon="call-outline"
                  label="Téléphone"
                  value={user.phone}
                />
              </Group>

              <Group title="Compte">
                <InfoRow
                  icon="shield-checkmark-outline"
                  label="Rôles"
                  value={roles}
                />
                <InfoRow
                  icon="business-outline"
                  label="Établissement"
                  value={user.etablissement?.name}
                  bordered
                />
                <InfoRow
                  icon="pricetag-outline"
                  label="Type d'établissement"
                  value={user.etablissement?.type}
                  bordered
                />
              </Group>
            </>
          ) : (
            // Utilisateur introuvable : écran ouvert sans passer par la liste
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="people-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Utilisateur introuvable
              </Text>
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
  icon: keyof typeof Ionicons.glyphMap;
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
