import { apiErrorMessage } from "@/api/client";
import {
  deleteFrais,
  FraisDetail,
  getFraisDetail,
  markFraisStale,
  typeFraisLabel,
  updateFrais,
} from "@/api/frais";
import AddFraisModal from "@/components/gestion/AddFraisModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { fcfa } from "@/data/finances";
import { useGestion } from "@/hooks/use-gestion";
import { fromISO } from "@/organisation/helpers";
import { confirmDelete } from "@/utils/confirm";
import { formatDate, formatDateTime } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

/** Détail d'un frais : la liste l'affiche tout de suite, GET /frais/{frai} le complète */
export default function FraisDetailScreen() {
  const params = useLocalSearchParams<{
    public_key: string;
    name: string;
    annee_name: string;
    niveau_name: string;
    type_frais: string;
    montant_frais: string;
  }>();
  const router = useRouter();
  const { canEdit, canOpen } = useGestion();
  const canDelete = canOpen("suppression-frais"); // super admin uniquement
  const [editing, setEditing] = useState(false);
  const [full, setFull] = useState<FraisDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "failed">(
    params.public_key ? "loading" : "idle",
  );

  const load = useCallback(() => {
    if (!params.public_key) return () => {};
    let active = true;
    setStatus("loading");
    getFraisDetail(params.public_key)
      .then((f) => {
        if (!active) return;
        setFull(f);
        setStatus("idle");
      })
      .catch(() => {
        if (active) setStatus("failed");
      });
    return () => {
      active = false;
    };
  }, [params.public_key]);

  useEffect(() => load(), [load]);

  const remove = () =>
    confirmDelete(
      "Supprimer ce frais ?",
      full?.name || params.name || "Ce frais",
      async () => {
        try {
          const message = await deleteFrais(params.public_key);
          markFraisStale();
          showToast(message);
          router.back(); // retour à la liste, rechargée sans ce frais
        } catch (error) {
          showToast(apiErrorMessage(error), "error");
        }
      },
    );

  const loading = status === "loading";
  const name = full?.name || params.name || "";
  const montant = full ? full.montant_frais : Number(params.montant_frais);
  const type = full?.type_frais || params.type_frais || "";
  // Champs que seule la réponse détaillée donne : squelette pendant le chargement
  const later = (value: string) => (loading && !full ? null : value || "—");

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
            Détail du frais
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Frais introuvable : écran ouvert sans passer par la liste */}
        {!params.public_key ? (
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="cash-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Frais introuvable
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {/* Carte principale : libellé et montant */}
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons name="cash-outline" size={24} color="#FFE600" />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-inter-bold text-[20px] leading-7 text-white"
                  >
                    {name}
                  </Text>
                  <Text className="mt-0.5 font-inter-bold text-[18px] text-accent">
                    {Number.isFinite(montant) ? fcfa(montant) : "—"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Échec du chargement détaillé : on garde ce que la liste a donné */}
            {status === "failed" && (
              <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <Ionicons name="cloud-offline-outline" size={20} color="#9AA7B8" />
                <Text className="flex-1 font-inter text-[13px] text-muted">
                  Impossible de charger tous les détails.
                </Text>
                <Pressable onPress={load} className="active:opacity-70">
                  <Text className="font-inter-semibold text-[14px] text-primary">
                    Réessayer
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Informations */}
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              <InfoRow icon="text-outline" label="Libellé" value={name || "—"} />
              <InfoRow
                icon="cash-outline"
                label="Montant"
                value={Number.isFinite(montant) ? fcfa(montant) : "—"}
                bordered
              />
              <InfoRow
                icon="pricetag-outline"
                label="Type"
                value={type ? typeFraisLabel(type) : "—"}
                bordered
              />
              <InfoRow
                icon="calendar-outline"
                label="Année scolaire"
                value={full?.annee_name || params.annee_name || "—"}
                bordered
              />
              <InfoRow
                icon="layers-outline"
                label="Niveau"
                value={full?.niveau_name || params.niveau_name || "Tous les niveaux"}
                bordered
              />
              <InfoRow
                icon="checkmark-circle-outline"
                label="Obligatoire"
                value={later(full ? (full.is_required ? "Oui" : "Non") : "")}
                bordered
              />
              <InfoRow
                icon="git-compare-outline"
                label="Fractionnable"
                value={later(full ? (full.tranchable ? "Oui, en tranches" : "Non") : "")}
                bordered
              />
              <InfoRow
                icon="alarm-outline"
                label="Date d'échéance"
                value={later(full?.validite ? formatDate(fromISO(full.validite)) : "")}
                bordered
              />
              <InfoRow
                icon="bookmark-outline"
                label="Statut d'affectation"
                value={later(full?.affectation ?? "")}
                bordered
              />
              <InfoRow
                icon="add-circle-outline"
                label="Créé le"
                value={later(formatDateTime(full?.cree_le))}
                bordered
              />
              <InfoRow
                icon="time-outline"
                label="Modifié le"
                value={later(formatDateTime(full?.modifie_le))}
                bordered
              />
            </View>

            {/* Modifier (il faut le détail complet pour pré-remplir), supprimer (super admin) */}
            {(canEdit || canDelete) && (
              <View className="gap-3">
                {canEdit && (
                  <ActionButton
                    icon="create-outline"
                    label={full ? "Modifier ce frais" : "Chargement…"}
                    variant="primary"
                    className="w-full"
                    onPress={() => {
                      if (full) setEditing(true);
                    }}
                  />
                )}
                {canDelete && (
                  <ActionButton
                    icon="trash-outline"
                    label="Supprimer ce frais"
                    variant="danger"
                    className="w-full"
                    onPress={remove}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <AddFraisModal
        visible={editing && !!full}
        frais={full}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          const message = await updateFrais(params.public_key, data);
          setEditing(false);
          markFraisStale();
          showToast(message);
          load(); // le détail se recharge avec la modification
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
  /** null : valeur encore en chargement, un squelette prend sa place */
  value: string | null;
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
      {value === null ? (
        <Skeleton width={110} height={14} />
      ) : (
        <Text
          numberOfLines={2}
          className="max-w-[60%] text-right font-inter-semibold text-[15px] text-ink"
        >
          {value}
        </Text>
      )}
    </View>
  );
}
