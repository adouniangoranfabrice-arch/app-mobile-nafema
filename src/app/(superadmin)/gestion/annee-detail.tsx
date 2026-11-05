import {
  Annee,
  ANNEE_STATUS,
  anneeStatus,
  deleteAnnee,
  updateAnnee,
} from "@/api/annees";
import { apiErrorMessage } from "@/api/client";
import AddYearModal from "@/components/gestion/AddYearModal";
import ActionButton from "@/components/ui/ActionButton";
import { markAnneesStale } from "@/hooks/use-annees";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDeleteYear } from "@/utils/confirm";
import { formatDate } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function AnneeDetail() {
  // L'année est transmise par la liste : l'API de lecture d'une seule année n'est pas encore utilisée
  const year = useLocalSearchParams<{
    public_key: string;
    name: string;
    debut: string;
    fin: string;
    is_active: string;
    is_closed: string;
    etab_public_key: string;
    etab_name: string;
    cree_le: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canEdit } = useGestion();
  const [editing, setEditing] = useState(false);

  const header = (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
      >
        <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
      </Pressable>
      <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
        Détail de l'année
      </Text>
    </View>
  );

  // Année introuvable (écran ouvert sans passer par la liste)
  if (!year.public_key || !year.name || !year.debut || !year.fin) {
    return (
      <View
        className="flex-1 bg-page px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StatusBar style="dark" />
        {header}
        <View className="mt-10 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name="calendar-outline" size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            Année introuvable
          </Text>
        </View>
      </View>
    );
  }

  const start = fromISO(year.debut);
  const end = fromISO(year.fin);
  const weeks = Math.round((end.getTime() - start.getTime()) / WEEK_MS);
  const annee: Annee = {
    ...year,
    is_active: Number(year.is_active),
    is_closed: Number(year.is_closed),
  };
  const key = anneeStatus(annee);
  const st = ANNEE_STATUS[key];

  const remove = () =>
    confirmDeleteYear(annee, async () => {
      try {
        await deleteAnnee(annee.public_key);
        markAnneesStale();
        router.back();
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
    });

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
          {header}

          {/* Carte principale */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="calendar-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-[26px] leading-8 text-white">
                  {year.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-inter text-[13px] text-white/70"
                >
                  {year.etab_name}
                </Text>
              </View>
              <View
                className={`rounded-full px-3 py-1 ${key === "active" ? "bg-green-100" : "bg-white/20"}`}
              >
                <Text
                  className={`font-inter-semibold text-xs ${key === "active" ? "text-green-700" : "text-white"}`}
                >
                  {st.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Informations */}
          <View className="rounded-3xl bg-white px-4 shadow-sm">
            <InfoRow
              icon="business-outline"
              label="Établissement"
              value={year.etab_name}
            />
            <InfoRow
              icon="calendar-outline"
              label="Date de début"
              value={formatDate(start)}
              bordered
            />
            <InfoRow
              icon="calendar-outline"
              label="Date de fin"
              value={formatDate(end)}
              bordered
            />
            <InfoRow
              icon="time-outline"
              label="Durée"
              value={`${weeks} semaine${weeks > 1 ? "s" : ""}`}
              bordered
            />
            <InfoRow
              icon="shield-checkmark-outline"
              label="Statut"
              bordered
              value={
                <Text className={`font-inter-semibold text-[15px] ${st.text}`}>
                  {st.label}
                </Text>
              }
            />
            {!!year.cree_le && (
              <InfoRow
                icon="create-outline"
                label="Créée le"
                // "2026-11-05 00:48:33" : seule la date est affichée
                value={formatDate(fromISO(year.cree_le.split(" ")[0]))}
                bordered
              />
            )}
          </View>

          {/* Actions */}
          {canEdit && (
            <View className="gap-3">
              <ActionButton
                icon="create-outline"
                label="Modifier cette année"
                variant="primary"
                className="w-full"
                onPress={() => setEditing(true)}
              />
              <ActionButton
                icon="trash-outline"
                label="Supprimer cette année"
                variant="danger"
                className="w-full"
                onPress={remove}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <AddYearModal
        visible={editing}
        year={annee}
        existing={[annee]}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          await updateAnnee(annee.public_key, data);
          setEditing(false);
          markAnneesStale();
          router.back(); // retour à la liste, rechargée avec la modification
        }}
      />
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
  value: ReactNode;
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
      {typeof value === "string" ? (
        <Text
          numberOfLines={2}
          className="max-w-[55%] text-right font-inter-semibold text-[15px] text-ink"
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}
