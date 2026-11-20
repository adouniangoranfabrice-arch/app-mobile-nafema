import { apiErrorMessage } from "@/api/client";
import {
  deleteEcheance,
  Echeance,
  getEcheance,
  isActive,
  markEcheancesStale,
  updateEcheance,
} from "@/api/echeances";
import AddEcheanceModal from "@/components/gestion/AddEcheanceModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton, SkeletonInfo } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDelete } from "@/utils/confirm";
import { formatDate, formatDateTime } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Détail d'une échéance, avec modifier et supprimer */
export default function EcheanceDetail() {
  const { public_key } = useLocalSearchParams<{ public_key: string }>();
  const router = useRouter();
  const { canEdit, canOpen } = useGestion();
  // Supprimer : super admin seulement
  const canDelete = canOpen("suppression-echeances");
  const [echeance, setEcheance] = useState<Echeance | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "failed">("loading");
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    if (!public_key) return setStatus("failed");
    setStatus("loading");
    getEcheance(public_key)
      .then((e) => {
        setEcheance(e);
        setStatus("idle");
      })
      .catch(() => setStatus("failed"));
  }, [public_key]);

  useEffect(load, [load]);

  const remove = () =>
    echeance &&
    confirmDelete("Supprimer cette échéance ?", echeance.name, async () => {
      try {
        const message = await deleteEcheance(echeance.public_key);
        markEcheancesStale();
        showToast(message);
        router.back();
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      }
    });

  const active = echeance ? isActive(echeance) : false;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
          >
            <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
          </Pressable>
          <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
            Détail de l&apos;échéance
          </Text>
        </View>
      </FixedHeader>

      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {status === "loading" ? (
            <>
              <Skeleton width="100%" height={96} radius={24} />
              <SkeletonInfo rows={6} />
            </>
          ) : status === "failed" || !echeance ? (
            <View className="items-center gap-3 rounded-3xl bg-white py-12">
              <Ionicons name="alarm-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">Échéance introuvable</Text>
              <Pressable onPress={load} className="active:opacity-70">
                <Text className="font-inter-semibold text-[14px] text-primary">Réessayer</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="rounded-3xl bg-primary p-5">
                <View className="flex-row items-center gap-3.5">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                    <Ionicons name="hourglass-outline" size={24} color="#FFE600" />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={2} className="font-inter-bold text-[22px] leading-7 text-white">
                      {echeance.name}
                    </Text>
                    <Text className="font-inter text-[13px] text-white/70">
                      {echeance.pourcentage} % des frais · ordre {echeance.ordre}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="rounded-3xl bg-white px-4 shadow-sm">
                <Row icon="text-outline" label="Libellé" value={echeance.name} />
                {!!echeance.frais_name && (
                  <Row icon="cash-outline" label="Frais" value={echeance.frais_name} bordered />
                )}
                <Row icon="calendar-outline" label="Année scolaire" value={echeance.annee_name || "—"} bordered />
                <Row
                  icon="alarm-outline"
                  label="Date d'échéance"
                  value={echeance.date_echeance ? formatDate(fromISO(echeance.date_echeance)) : "—"}
                  bordered
                />
                <Row icon="list-outline" label="Ordre" value={String(echeance.ordre)} bordered />
                <Row icon="pie-chart-outline" label="Pourcentage" value={`${echeance.pourcentage} %`} bordered />
                <View className="flex-row items-center gap-3 border-t border-line py-3.5">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
                    <Ionicons name="flag-outline" size={18} color="#2B5EA8" />
                  </View>
                  <Text className="flex-1 font-inter text-[13px] text-muted">Statut</Text>
                  <View className={`rounded-full px-3 py-1 ${active ? "bg-green-100" : "bg-slate-100"}`}>
                    <Text className={`font-inter-semibold text-[13px] ${active ? "text-green-700" : "text-muted"}`}>
                      {active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
                <Row
                  icon="person-circle-outline"
                  label="Créée par"
                  value={echeance.cree_par || "—"}
                  bordered
                />
                <Row icon="add-circle-outline" label="Créée le" value={formatDateTime(echeance.created_at) || "—"} bordered />
                {/* « Modifiée le » seulement si l'échéance a été modifiée après sa création */}
                {!!echeance.updated_at && echeance.updated_at !== echeance.created_at && (
                  <Row icon="time-outline" label="Modifiée le" value={formatDateTime(echeance.updated_at)} bordered />
                )}
              </View>

              {canEdit && (
                <View className="gap-3">
                  <ActionButton
                    icon="create-outline"
                    label="Modifier cette échéance"
                    variant="primary"
                    className="w-full"
                    onPress={() => setEditing(true)}
                  />
                  {canDelete && (
                    <ActionButton
                      icon="trash-outline"
                      label="Supprimer cette échéance"
                      variant="danger"
                      className="w-full"
                      onPress={remove}
                    />
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <AddEcheanceModal
        visible={editing}
        echeance={echeance}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          if (!echeance) return;
          const message = await updateEcheance(echeance.public_key, data);
          setEditing(false);
          markEcheancesStale();
          showToast(message);
          load(); // le détail affiche la modification
        }}
      />
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  bordered?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-3 py-3.5 ${bordered ? "border-t border-line" : ""}`}>
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <Text className="flex-1 font-inter text-[13px] text-muted">{label}</Text>
      <Text numberOfLines={2} className="max-w-[60%] text-right font-inter-semibold text-[15px] text-ink">
        {value}
      </Text>
    </View>
  );
}
