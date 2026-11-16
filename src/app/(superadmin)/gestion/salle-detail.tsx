import { formatDateTime } from "@/utils/dates";
import { getSalle, markSallesStale, Salle, updateSalle } from "@/api/salles";
import AddSalleModal from "@/components/gestion/AddSalleModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

export default function SalleDetail() {
  // La liste transmet la salle (affichage immédiat), puis GET /salles/{salle} la complète (dates)
  const params = useLocalSearchParams<{
    public_key: string;
    code: string;
    name: string;
    capacite: string;
    type_salle: string;
    etab_name: string;
    created_at: string;
    updated_at: string;
  }>();
  const router = useRouter();
  const { canEdit } = useGestion();
  const [editing, setEditing] = useState(false);
  const [full, setFull] = useState<Salle | null>(null);
  const [loadingFull, setLoadingFull] = useState(!!params.public_key);

  useEffect(() => {
    if (!params.public_key) return;
    let active = true;
    getSalle(params.public_key)
      .then((s) => {
        if (active) setFull(s);
      })
      .catch(() => {}) // route absente ou erreur : on garde les données de la liste
      .finally(() => {
        if (active) setLoadingFull(false);
      });
    return () => {
      active = false;
    };
  }, [params.public_key]);

  // Une valeur du serveur remplace celle de la liste seulement si elle est renseignée
  const pick = (fromServer: string | null | undefined, fromList?: string) =>
    fromServer ? fromServer : (fromList ?? "");
  const salle = {
    public_key: params.public_key ?? "",
    code: pick(full?.code, params.code),
    name: pick(full?.name, params.name),
    capacite: pick(full?.capacite != null ? String(full.capacite) : "", params.capacite),
    type_salle: pick(full?.type_salle, params.type_salle),
    etab_name: pick(full?.etab_name, params.etab_name),
    created_at: pick(full?.created_at, params.created_at),
    updated_at: pick(full?.updated_at, params.updated_at),
  };

  // La salle telle que le formulaire l'attend (la capacité arrive en texte)
  const current = {
    public_key: salle.public_key ?? "",
    code: salle.code ?? "",
    name: salle.name ?? "",
    capacite: salle.capacite ? Number(salle.capacite) : null,
    type_salle: salle.type_salle ?? "",
  };

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
            Détail de la salle
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Salle introuvable : écran ouvert sans passer par la liste */}
        {!salle.name ? (
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="cube-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Salle introuvable
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {/* Carte principale */}
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons name="cube-outline" size={24} color="#FFE600" />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-inter-bold text-[22px] leading-7 text-white"
                  >
                    {salle.name}
                  </Text>
                  <Text
                    style={{ fontFamily: MONO }}
                    className="text-[13px] text-white/70"
                  >
                    {salle.code}
                  </Text>
                </View>
              </View>
            </View>

            {/* Informations */}
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              <InfoRow icon="text-outline" label="Nom" value={salle.name} />
              <InfoRow
                icon="barcode-outline"
                label="Code"
                value={salle.code}
                bordered
                mono
              />
              <InfoRow
                icon="people-outline"
                label="Capacité"
                value={salle.capacite ? `${salle.capacite} places` : "—"}
                bordered
              />
              <InfoRow
                icon="pricetag-outline"
                label="Type de salle"
                value={salle.type_salle || "—"}
                bordered
              />
              <InfoRow
                icon="business-outline"
                label="Établissement"
                value={salle.etab_name || "—"}
                bordered
              />
              <InfoRow
                icon="calendar-outline"
                label="Créée le"
                value={formatDateTime(salle.created_at) || "—"}
                loading={loadingFull && !salle.created_at}
                bordered
              />
              <InfoRow
                icon="time-outline"
                label="Modifiée le"
                value={formatDateTime(salle.updated_at) || "—"}
                loading={loadingFull && !salle.updated_at}
                bordered
              />
            </View>

            {/* Action : modifier (selon les droits de l'espace) */}
            {canEdit && !!salle.public_key && (
              <ActionButton
                icon="create-outline"
                label="Modifier cette salle"
                variant="primary"
                className="w-full"
                onPress={() => setEditing(true)}
              />
            )}
          </View>
        )}
      </ScrollView>

      <AddSalleModal
        visible={editing}
        salle={current}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          const message = await updateSalle(current.public_key, data);
          setEditing(false);
          markSallesStale();
          showToast(message);
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
  mono,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  bordered?: boolean;
  mono?: boolean;
  /** Valeur encore en chargement : un squelette prend sa place */
  loading?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${bordered ? "border-t border-line" : ""}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <Text className="flex-1 font-inter text-[13px] text-muted">{label}</Text>
      {loading ? (
        <Skeleton width={120} height={14} />
      ) : (
        <Text
          numberOfLines={2}
          style={mono ? { fontFamily: MONO } : undefined}
          className={`max-w-[60%] text-right text-[15px] text-ink ${mono ? "" : "font-inter-semibold"}`}
        >
          {value}
        </Text>
      )}
    </View>
  );
}
