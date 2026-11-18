import {
  affectationLabel,
  getInscription,
  humanize,
  Inscription,
  regimeLabel,
  typeLabel,
} from "@/api/inscriptions";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/organisation/ui";
import { formatDateTime } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Params = Record<
  | "public_key"
  | "eleve_name"
  | "matricule"
  | "classe_name"
  | "niveau_name"
  | "annee_name"
  | "type"
  | "statut"
  | "date"
  | "est_redoublant"
  | "affectation"
  | "regime"
  | "decision_fin_annee",
  string
>;

/** Détail d'une inscription : la liste l'affiche tout de suite, GET /inscriptions/{inscription} le complète */
export default function InscriptionDetail() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const [full, setFull] = useState<Inscription | null>(null);
  const [loadingFull, setLoadingFull] = useState(!!params.public_key);

  useEffect(() => {
    if (!params.public_key) return;
    let active = true;
    getInscription(params.public_key)
      .then((i) => {
        if (active) setFull(i);
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
  const pick = (k: keyof Params & keyof Inscription) => {
    const v = full?.[k];
    return typeof v === "string" && v ? v : (params[k] ?? "");
  };
  const i = {
    eleve_name: pick("eleve_name"),
    matricule: pick("matricule"),
    classe_name: pick("classe_name"),
    niveau_name: pick("niveau_name"),
    annee_name: pick("annee_name"),
    type: pick("type"),
    statut: pick("statut"),
    date: pick("date"),
    affectation: pick("affectation"),
    regime: pick("regime"),
    decision: pick("decision_fin_annee"),
    redoublant: full ? full.est_redoublant : params.est_redoublant === "1",
    modifie_le: full?.modifie_le ?? "",
  };
  // Valeur absente pendant le chargement : un squelette au lieu de « — »
  const show = (v: string) => (loadingFull && !v ? null : v || "—");

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
            Détail de l&apos;inscription
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {!params.public_key ? (
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="document-text-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Inscription introuvable
              </Text>
            </View>
          </View>
        ) : (
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {/* Carte principale : élève, classe, type et statut */}
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons name="person-outline" size={24} color="#FFE600" />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={2}
                    className="font-inter-bold text-[20px] leading-7 text-white"
                  >
                    {i.eleve_name || "Élève non renseigné"}
                  </Text>
                  <Text className="font-inter text-[13px] text-white/70">
                    {[i.classe_name, i.annee_name].filter(Boolean).join(" · ") || " "}
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {!!i.type && (
                  <Badge
                    label={typeLabel(i.type)}
                    tone={i.type === "REINSCRIPTION" ? "purple" : "blue"}
                  />
                )}
                {!!i.statut && <Badge label={humanize(i.statut)} tone="slate" />}
                {i.redoublant && <Badge label="Redoublant" tone="amber" />}
              </View>
            </View>

            {/* Élève et scolarité */}
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              <InfoRow icon="person-outline" label="Élève" value={i.eleve_name || "—"} />
              <InfoRow icon="barcode-outline" label="Matricule" value={show(i.matricule)} bordered />
              <InfoRow icon="calendar-outline" label="Année scolaire" value={show(i.annee_name)} bordered />
              <InfoRow icon="layers-outline" label="Niveau" value={show(i.niveau_name)} bordered />
              <InfoRow icon="school-outline" label="Classe" value={show(i.classe_name)} bordered />
              <InfoRow
                icon="swap-horizontal-outline"
                label="Type"
                value={i.type ? typeLabel(i.type) : "—"}
                bordered
              />
              <InfoRow
                icon="flag-outline"
                label="Statut"
                value={show(i.statut ? humanize(i.statut) : "")}
                bordered
              />
              <InfoRow
                icon="time-outline"
                label="Date"
                value={show(formatDateTime(i.date) || i.date)}
                bordered
              />
            </View>

            {/* Statut de l'élève */}
            <View className="rounded-3xl bg-white px-4 shadow-sm">
              <InfoRow
                icon="bookmark-outline"
                label="Affectation"
                value={show(i.affectation ? affectationLabel(i.affectation) : "")}
              />
              <InfoRow
                icon="wallet-outline"
                label="Régime"
                value={show(i.regime ? regimeLabel(i.regime) : "")}
                bordered
              />
              <InfoRow
                icon="repeat-outline"
                label="Redoublant"
                value={i.redoublant ? "Oui" : "Non"}
                bordered
              />
              <InfoRow
                icon="ribbon-outline"
                label="Décision fin d'année"
                value={show(i.decision)}
                bordered
              />
              {!!i.modifie_le && (
                <InfoRow
                  icon="create-outline"
                  label="Modifiée le"
                  value={formatDateTime(i.modifie_le) || i.modifie_le}
                  bordered
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
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
