import {
  CATEGORIES_ETABLISSEMENT,
  CIVILITES,
  EtablissementDetail as Detail,
  GENRES,
  getEtablissement,
  labelOf,
  markEtablissementsStale,
  TYPES_ETABLISSEMENT,
  updateEtablissement,
} from "@/api/etablissements";
import AddEtablissementModal from "@/components/gestion/AddEtablissementModal";
import ActionButton from "@/components/ui/ActionButton";
import { showToast } from "@/components/ui/Toast";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton, SkeletonInfo } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

/** Détail d'un établissement : GET /etablissements/{etablissement} */
export default function EtablissementDetail() {
  const { public_key, name } = useLocalSearchParams<{ public_key: string; name?: string }>();
  const router = useRouter();
  const [etab, setEtab] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "failed">("loading");
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    if (!public_key) return setStatus("failed");
    setStatus("loading");
    getEtablissement(public_key)
      .then((e) => {
        setEtab(e);
        setStatus("idle");
      })
      .catch((error) => {
        if (__DEV__) console.log("Détail de l'établissement indisponible :", String(error));
        setStatus("failed");
      });
  }, [public_key]);

  useEffect(load, [load]);

  const civility = etab ? labelOf(CIVILITES, etab.dir_civility) : "";

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
            Détail de l&apos;établissement
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {status === "loading" ? (
            <>
              <Skeleton width="100%" height={110} radius={24} />
              <SkeletonInfo rows={6} />
            </>
          ) : status === "failed" || !etab ? (
            <View className="items-center gap-3 rounded-3xl bg-white py-12">
              <Ionicons name="business-outline" size={28} color="#9AA7B8" />
              <Text className="px-6 text-center font-inter-semibold text-[15px] text-ink">
                Détail indisponible{name ? ` pour « ${name} »` : ""}
              </Text>
              <Pressable onPress={load} className="active:opacity-70">
                <Text className="font-inter-semibold text-[14px] text-primary">Réessayer</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* En-tête */}
              <View className="rounded-3xl bg-primary p-5">
                <View className="flex-row items-center gap-3.5">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                    <Ionicons name="business" size={24} color="#FFE600" />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={2} className="font-inter-bold text-[20px] leading-7 text-white">
                      {etab.name}
                    </Text>
                    <Text className="font-inter text-[13px] text-white/70">
                      {[
                        etab.type && labelOf(TYPES_ETABLISSEMENT, etab.type),
                        etab.catego && labelOf(CATEGORIES_ETABLISSEMENT, etab.catego),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </View>
                <View
                  className={`mt-4 self-start rounded-full px-3 py-1 ${etab.active ? "bg-green-100" : "bg-red-100"}`}
                >
                  <Text
                    className={`font-inter-semibold text-xs ${etab.active ? "text-green-700" : "text-red-700"}`}
                  >
                    {etab.active ? "Actif" : "Inactif"}
                  </Text>
                </View>
              </View>

              <Section title="Identité">
                <Row icon="barcode-outline" label="Code" value={etab.numero} />
                <Row icon="business-outline" label="Nom" value={etab.name} bordered />
                <Row icon="link-outline" label="Slug" value={etab.abbrev} bordered />
                <Row
                  icon="ribbon-outline"
                  label="Type"
                  value={etab.type && labelOf(TYPES_ETABLISSEMENT, etab.type)}
                  bordered
                />
                <Row
                  icon="layers-outline"
                  label="Catégorie"
                  value={etab.catego && labelOf(CATEGORIES_ETABLISSEMENT, etab.catego)}
                  bordered
                />
              </Section>

              <Section title="Rattachement administratif">
                <Row icon="map-outline" label="DRENA" value={etab.drena_name} />
                <Row icon="git-branch-outline" label="IEPP" value={etab.iepp_name} bordered />
                {!!etab.district && (
                  <Row icon="globe-outline" label="District" value={etab.district} bordered />
                )}
              </Section>

              <Section title="Localisation">
                <Row icon="location-outline" label="Adresse" value={etab.localisation} />
                <Row icon="business-outline" label="Ville" value={etab.city} bordered />
                {!!etab.commune && (
                  <Row icon="navigate-outline" label="Commune" value={etab.commune} bordered />
                )}
              </Section>

              <Section title="Contact">
                <Row icon="call-outline" label="Téléphone" value={etab.phone} />
                <Row icon="mail-outline" label="E-mail" value={etab.email_ecole} bordered />
                <Row
                  icon="document-text-outline"
                  label="N° d'autorisation"
                  value={etab.autorisation}
                  bordered
                />
              </Section>

              <Section title="Dirigeant (administrateur)">
                <Row
                  icon="person-outline"
                  label="Nom complet"
                  value={[civility, etab.dir_full_name].filter(Boolean).join(" ")}
                />
                <Row
                  icon="male-female-outline"
                  label="Genre"
                  value={etab.dir_sexe && labelOf(GENRES, etab.dir_sexe)}
                  bordered
                />
                <Row icon="call-outline" label="Téléphone" value={etab.dir_phone} bordered />
                <Row icon="mail-outline" label="E-mail de connexion" value={etab.dir_mail} bordered />
              </Section>

              <Section title="Historique">
                <Row
                  icon="add-circle-outline"
                  label="Créé le"
                  value={formatDateTime(etab.created_at)}
                />
                {!!etab.updated_at && etab.updated_at !== etab.created_at && (
                  <Row
                    icon="time-outline"
                    label="Modifié le"
                    value={formatDateTime(etab.updated_at)}
                    bordered
                  />
                )}
              </Section>

              {/* Actions, en bas comme sur les autres détails */}
              <View className="gap-3">
                <ActionButton
                  icon="create-outline"
                  label="Modifier cet établissement"
                  variant="primary"
                  className="w-full"
                  onPress={() => setEditing(true)}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modification : mêmes étapes que la création, sans le mot de passe */}
      <AddEtablissementModal
        visible={editing}
        etablissement={etab}
        onClose={() => setEditing(false)}
        onSave={async (input) => {
          if (!etab) return;
          const message = await updateEtablissement(etab.public_key, input);
          setEditing(false);
          markEtablissementsStale();
          showToast(message);
          load(); // le détail affiche la modification
        }}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 font-inter-bold text-[12px] uppercase tracking-wider text-primary">
        {title}
      </Text>
      <View className="rounded-3xl bg-white px-4 shadow-sm">{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  bordered,
}: {
  icon: IconName;
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
      <Text
        numberOfLines={2}
        className={`max-w-[60%] text-right font-inter-semibold text-[15px] ${value ? "text-ink" : "text-muted"}`}
      >
        {value || "—"}
      </Text>
    </View>
  );
}
