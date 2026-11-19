import {
  classeStatus,
  langueV2Label,
  Classe,
  deleteClasse,
  getClasse,
  markClassesStale,
  updateClasse,
} from "@/api/classes";
import { apiErrorMessage } from "@/api/client";
import AddClasseModal from "@/components/gestion/AddClasseModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { showToast } from "@/components/ui/Toast";
import { useGestion } from "@/hooks/use-gestion";
import { confirmDelete } from "@/utils/confirm";
import { formatDateTime } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ClasseDetail() {
  // La liste transmet la classe (affichage immédiat), puis GET /classes/{classe} la complète
  const params = useLocalSearchParams<{
    public_key: string;
    name: string;
    max_effectif: string;
    min_effectif: string;
    total_effectif: string;
    effectif_actuel: string;
    status: string;
    lang_v2: string;
    annee_name: string;
    niveau_name: string;
    serie_name: string;
    salle_name: string;
    annee_key: string;
    niveau_key: string;
    serie_key: string;
    salle_key: string;
    etab_name: string;
    created_at: string;
    updated_at: string;
  }>();
  const router = useRouter();
  const { canEdit } = useGestion();
  const [editing, setEditing] = useState(false);
  const [full, setFull] = useState<Classe | null>(null);
  const [loadingFull, setLoadingFull] = useState(!!params.public_key);

  useEffect(() => {
    if (!params.public_key) return;
    let active = true;
    getClasse(params.public_key)
      .then((c) => {
        if (active) setFull(c);
      })
      .catch((error) => {
        // Route absente ou erreur : on garde les données de la liste (sans salle ni dates)
        if (__DEV__)
          console.log(
            "Détail de la classe indisponible :",
            error?.response?.status,
            error?.response?.data ?? String(error),
          );
      })
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
  const classe = {
    public_key: params.public_key ?? "",
    name: pick(full?.name, params.name),
    max_effectif: pick(
      full?.max_effectif != null ? String(full.max_effectif) : "",
      params.max_effectif,
    ),
    min_effectif: pick(
      full?.min_effectif != null ? String(full.min_effectif) : "",
      params.min_effectif,
    ),
    total_effectif: pick(
      full?.total_effectif != null ? String(full.total_effectif) : "",
      params.total_effectif,
    ),
    effectif_actuel: pick(
      full?.effectif_actuel != null ? String(full.effectif_actuel) : "",
      params.effectif_actuel,
    ),
    status: pick(full?.status, params.status),
    lang_v2: pick(full?.lang_v2, params.lang_v2),
    annee_name: pick(full?.annee_name, params.annee_name),
    niveau_name: pick(full?.niveau_name, params.niveau_name),
    serie_name: pick(full?.serie_name, params.serie_name),
    salle_name: pick(full?.salle_name, params.salle_name),
    niveau_slug: full?.niveau_slug ?? "",
    salle_slug: full?.salle_slug ?? "",
    annee_key: pick(full?.annee_key, params.annee_key),
    niveau_key: pick(full?.niveau_key, params.niveau_key),
    serie_key: pick(full?.serie_key, params.serie_key),
    salle_key: pick(full?.salle_key, params.salle_key),
    created_at: pick(full?.created_at, params.created_at),
    updated_at: pick(full?.updated_at, params.updated_at),
  };
  // « B2 (SALLE-B2) » comme sur le site ; le nom seul si le code manque
  const withCode = (name: string, code: string) =>
    !name ? "—" : code ? `${name} (${code})` : name;
  // Valeur absente pendant le chargement : un squelette au lieu de « — »
  const waiting = (value: string) => loadingFull && !value;

  // La classe telle que le formulaire l'attend (les paramètres arrivent en texte)
  const current = {
    public_key: classe.public_key ?? "",
    name: classe.name ?? "",
    max_effectif: classe.max_effectif ? Number(classe.max_effectif) : null,
    min_effectif: classe.min_effectif !== "" ? Number(classe.min_effectif) : null,
    lang_v2: classe.lang_v2 ?? "",
    annee_key: classe.annee_key ?? "",
    niveau_key: classe.niveau_key ?? "",
    serie_key: classe.serie_key ?? "",
    salle_key: classe.salle_key ?? "",
    annee_name: classe.annee_name ?? "",
    niveau_name: classe.niveau_name ?? "",
    serie_name: classe.serie_name ?? "",
    salle_name: classe.salle_name ?? "",
  };

  const remove = () =>
    confirmDelete("Supprimer cette classe ?", current.name, async () => {
      try {
        const message = await deleteClasse(current.public_key);
        markClassesStale();
        showToast(message);
        router.back(); // retour à la liste, rechargée sans cette classe
      } catch (error) {
        showToast(apiErrorMessage(error), "error");
      }
    });

  const status = classeStatus(classe.status);

  const subtitle = [classe.niveau_name, classe.serie_name]
    .filter(Boolean)
    .join(" · ");

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
            Détail de la classe
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Classe introuvable : écran ouvert sans passer par la liste */}
        {!classe.name ? (
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="school-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Classe introuvable
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {/* Carte principale */}
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons name="school-outline" size={24} color="#FFE600" />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-inter-bold text-[22px] leading-7 text-white"
                  >
                    {classe.name}
                  </Text>
                  {!!subtitle && (
                    <Text className="font-inter text-[13px] text-white/70">
                      {subtitle}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Informations */}
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              {/* Même ordre que le détail du site web ; la clé publique n'est pas affichée */}
              <InfoRow icon="text-outline" label="Libellé" value={classe.name} />
              <InfoRow
                icon="calendar-outline"
                label="Année scolaire"
                value={classe.annee_name || "—"}
                bordered
              />
              <InfoRow
                icon="people-outline"
                label="Effectif minimal"
                value={classe.min_effectif || "—"}
                loading={waiting(classe.min_effectif)}
                bordered
              />
              <InfoRow
                icon="people-outline"
                label="Effectif maximal"
                value={classe.max_effectif || "—"}
                bordered
              />
              <InfoRow
                icon="people-circle-outline"
                label="Effectif total"
                value={classe.total_effectif || "—"}
                loading={waiting(classe.total_effectif)}
                bordered
              />
              <InfoRow
                icon="person-outline"
                label="Effectif actuel"
                value={classe.effectif_actuel || "—"}
                loading={waiting(classe.effectif_actuel)}
                bordered
              />
              <InfoRow
                icon="flag-outline"
                label="Statut"
                value={status?.label ?? "—"}
                tone={status?.open === false ? "closed" : status?.open ? "open" : undefined}
                loading={waiting(classe.status)}
                bordered
              />
              <InfoRow
                icon="layers-outline"
                label="Niveau"
                value={withCode(classe.niveau_name, classe.niveau_slug)}
                bordered
              />
              {/* LV2 et série : seulement si la classe en a (à partir de la 4e, et au lycée) */}
              {!!classe.lang_v2 && (
                <InfoRow
                  icon="language-outline"
                  label="Langue vivante 2"
                  value={langueV2Label(classe.lang_v2)}
                  bordered
                />
              )}
              {!!classe.serie_name && (
                <InfoRow
                  icon="git-branch-outline"
                  label="Série"
                  value={classe.serie_name}
                  bordered
                />
              )}
              <InfoRow
                icon="cube-outline"
                label="Salle"
                value={withCode(classe.salle_name, classe.salle_slug)}
                loading={waiting(classe.salle_name)}
                bordered
              />
              <InfoRow
                icon="add-circle-outline"
                label="Créée le"
                value={formatDateTime(classe.created_at) || "—"}
                loading={waiting(classe.created_at)}
                bordered
              />
              <InfoRow
                icon="time-outline"
                label="Modifiée le"
                value={formatDateTime(classe.updated_at) || "—"}
                loading={waiting(classe.updated_at)}
                bordered
              />
            </View>

            {/* Actions (selon les droits de l'espace) */}
            {canEdit && !!current.public_key && (
              <View className="gap-3">
                <ActionButton
                  icon="create-outline"
                  label="Modifier cette classe"
                  variant="primary"
                  className="w-full"
                  onPress={() => setEditing(true)}
                />
                <ActionButton
                  icon="trash-outline"
                  label="Supprimer cette classe"
                  variant="danger"
                  className="w-full"
                  onPress={remove}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <AddClasseModal
        visible={editing}
        classe={current}
        onClose={() => setEditing(false)}
        onSave={async (data) => {
          const message = await updateClasse(current.public_key, data);
          setEditing(false);
          markClassesStale();
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
  loading,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  bordered?: boolean;
  /** Valeur encore en chargement : un squelette prend sa place */
  loading?: boolean;
  /** Valeur affichée en pastille : rouge (fermée) ou verte (ouverte) */
  tone?: "open" | "closed";
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
        <Skeleton width={110} height={14} />
      ) : tone ? (
        <View
          className={`rounded-full px-3 py-1 ${tone === "closed" ? "bg-red-600" : "bg-green-100"}`}
        >
          <Text
            className={`font-inter-semibold text-[13px] ${tone === "closed" ? "text-white" : "text-green-700"}`}
          >
            {value}
          </Text>
        </View>
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
