import { apiErrorMessage } from "@/api/client";
import {
  deletePeriode,
  markPeriodesStale,
  updatePeriode,
} from "@/api/periodes";
import AddPeriodModal from "@/components/gestion/AddPeriodModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { PERIOD_STATUS, periodStatus } from "@/data/academic";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDeletePeriode } from "@/utils/confirm";
import { formatDate } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function PeriodeDetail() {
  // La période est transmise par la liste : pas de route connue pour en lire une seule
  const period = useLocalSearchParams<{
    public_key: string;
    ordre: string;
    name: string;
    type: string;
    debut: string;
    fin: string;
    is_locked: string;
    annee_public_key: string;
    annee_name: string;
    cycle_public_key: string;
    cycle_slug: string;
    cycle_name: string;
    cree_le: string;
  }>();
  const router = useRouter();
  const { canEdit, canOpen } = useGestion();
  const [editing, setEditing] = useState(false);

  const found = !!period.public_key && !!period.debut && !!period.fin;

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
            Détail de la période
          </Text>
        </View>
      </FixedHeader>

      {found ? (
        <PeriodeContent
          period={period}
          canEdit={canEdit}
          canDelete={canOpen("suppression-periodes")}
          editing={editing}
          setEditing={setEditing}
          onSaved={() => {
            markPeriodesStale();
            router.back(); // retour à la liste, rechargée avec la modification
          }}
        />
      ) : (
        // Période introuvable : écran ouvert sans passer par la liste
        <View className="mx-5 mt-5 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name="layers-outline" size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            Période introuvable
          </Text>
        </View>
      )}
    </View>
  );
}

function PeriodeContent({
  period,
  canEdit,
  canDelete,
  editing,
  setEditing,
  onSaved,
}: {
  period: {
    public_key: string;
    ordre: string;
    name: string;
    type: string;
    debut: string;
    fin: string;
    is_locked: string;
    annee_public_key: string;
    annee_name: string;
    cycle_public_key: string;
    cycle_slug: string;
    cycle_name: string;
    cree_le: string;
  };
  canEdit: boolean;
  canDelete: boolean;
  editing: boolean;
  setEditing: (value: boolean) => void;
  onSaved: () => void;
}) {
  const start = fromISO(period.debut);
  const end = fromISO(period.fin);
  const locked = period.is_locked === "1";
  const st = PERIOD_STATUS[periodStatus({ start, end })];
  const weeks = Math.round((end.getTime() - start.getTime()) / WEEK_MS);

  const remove = () =>
    confirmDeletePeriode({ ...period, is_locked: locked }, async () => {
      try {
        await deletePeriode(period.public_key);
        onSaved(); // même retour qu'après une modification : la liste se recharge
      } catch (error) {
        Alert.alert("Suppression impossible", apiErrorMessage(error));
      }
    });

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* Carte principale */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="layers-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-[20px] leading-8 text-white">
                  {period.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-inter text-[13px] text-white/70"
                >
                  {period.annee_name} · {period.cycle_name}
                </Text>
              </View>
              {locked && (
                <Ionicons name="lock-closed" size={20} color="#FFE600" />
              )}
            </View>
          </View>

          {/* Informations */}
          <View className="rounded-3xl bg-white px-4 shadow-sm">
            <InfoRow
              icon="calendar-outline"
              label="Année scolaire"
              value={period.annee_name || "—"}
            />
            <InfoRow
              icon="school-outline"
              label="Cycle"
              value={period.cycle_name || "—"}
              bordered
            />
            <InfoRow
              icon="layers-outline"
              label="Type"
              value={period.type || "—"}
              bordered
            />
            <InfoRow
              icon="keypad-outline"
              label="Numéro"
              value={period.ordre}
              bordered
            />
            <InfoRow
              icon="calendar-outline"
              label="Date début"
              value={formatDate(start)}
              bordered
            />
            <InfoRow
              icon="calendar-outline"
              label="Date fin"
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
              icon="pulse-outline"
              label="Statut"
              bordered
              value={
                <View className={`rounded-full px-3 py-1 ${st.badge}`}>
                  <Text className={`font-inter-semibold text-xs ${st.text}`}>
                    {st.label}
                  </Text>
                </View>
              }
            />
            <InfoRow
              icon={locked ? "lock-closed-outline" : "lock-open-outline"}
              label="Verrouillée"
              value={locked ? "Oui" : "Non"}
              bordered
            />
          </View>

          {/* Actions */}
          {canEdit && (
            <ActionButton
              icon="create-outline"
              label="Modifier cette période"
              variant="primary"
              className="w-full"
              onPress={() => setEditing(true)}
            />
          )}
          {canDelete && (
            <ActionButton
              icon="trash-outline"
              label="Supprimer cette période"
              variant="danger"
              className="w-full"
              onPress={remove}
            />
          )}
        </View>
      </ScrollView>

      <AddPeriodModal
        visible={editing}
        period={{
          ...period,
          ordre: Number(period.ordre),
          is_locked: locked,
        }}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          await updatePeriode(period.public_key, data);
          setEditing(false);
          showToast("Période modifiée avec succès.");
          onSaved();
        }}
      />
    </>
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
          numberOfLines={1}
          className="max-w-[55%] font-inter-semibold text-[15px] text-ink"
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}
