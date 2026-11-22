import {
  affectationLabel,
  getInscription,
  humanize,
  InscriptionDetail as Detail,
  regimeLabel,
  TYPES_PAIEMENT,
  typeLabel,
} from "@/api/inscriptions";
import FixedHeader from "@/components/ui/FixedHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { fromISO } from "@/organisation/helpers";
import { Badge } from "@/organisation/ui";
import { formatDate, formatDateTime } from "@/utils/dates";
import { fmt } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

/** Ce que la liste transmet : affiché tout de suite, en attendant le détail */
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
  | "est_redoublant",
  string
>;

const money = (n: number) => `${fmt(n)} F CFA`;

/** « 2016-01-01 » → « 1 janv. 2016 · 10 ans » */
function birth(raw: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  const d = fromISO(raw.slice(0, 10));
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--;
  return `${formatDate(d)}${age >= 0 ? ` · ${age} an${age > 1 ? "s" : ""}` : ""}`;
}

/** « 2026-11-22 15:19:30 » → date et heure lisibles ; vide → "" */
const when = (raw: string) => (raw ? formatDateTime(raw) || raw : "");

/** Détail d'une inscription : la liste l'affiche tout de suite, GET /inscriptions/{inscription} le complète */
export default function InscriptionDetail() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const [full, setFull] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "refreshing" | "idle" | "failed">(
    params.public_key ? "loading" : "failed",
  );

  const load = useCallback(
    async (next: "loading" | "refreshing") => {
      if (!params.public_key) return;
      setStatus(next);
      try {
        setFull(await getInscription(params.public_key));
        setStatus("idle");
      } catch {
        setStatus("failed"); // on garde les données de la liste
      }
    },
    [params.public_key],
  );

  useEffect(() => {
    load("loading");
  }, [load]);

  const loading = status === "loading";
  // Une valeur du serveur remplace celle de la liste seulement si elle est renseignée
  const pick = (k: keyof Params & keyof Detail) => {
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
    redoublant: full ? full.est_redoublant : params.est_redoublant === "1",
  };
  // Valeur absente pendant le chargement : un squelette au lieu de « — »
  const show = (v: string | undefined) => (loading && !full && !v ? null : v || "—");

  const sexe = full?.eleve_sexe === "F" ? "Féminin" : full?.eleve_sexe === "M" ? "Masculin" : "";
  const paiement = full?.type_paiement
    ? (TYPES_PAIEMENT.find((t) => t.value === full.type_paiement.toLowerCase())?.label ?? humanize(full.type_paiement))
    : "";
  const creances = full?.creances ?? [];
  const totalReste = creances.reduce((n, c) => n + c.reste, 0);
  const sortie = !!(full?.sortie_le || full?.motif_sortie);

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
          <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">Détail de l&apos;inscription</Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          params.public_key ? (
            <RefreshControl
              refreshing={status === "refreshing"}
              onRefresh={() => load("refreshing")}
              tintColor="#2B5EA8"
              colors={["#2B5EA8"]}
            />
          ) : undefined
        }
      >
        {!params.public_key ? (
          <View className="w-full max-w-[640px] self-center px-5">
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="document-text-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">Inscription introuvable</Text>
            </View>
          </View>
        ) : (
          <View className="w-full max-w-[640px] gap-4 self-center px-5">
            {/* Carte principale : élève, classe, type et statut */}
            <View className="rounded-3xl bg-primary p-5">
              <View className="flex-row items-center gap-3.5">
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ionicons name={full?.eleve_sexe === "F" ? "woman-outline" : "person-outline"} size={24} color="#FFE600" />
                </View>
                <View className="flex-1">
                  <Text numberOfLines={2} className="font-inter-bold text-[20px] leading-7 text-white">
                    {i.eleve_name || "Élève non renseigné"}
                  </Text>
                  <Text className="font-inter text-[13px] text-white/70">
                    {[i.matricule, i.annee_name].filter(Boolean).join(" · ") || " "}
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row flex-wrap gap-2">
                {!!i.type && (
                  <Badge label={typeLabel(i.type)} tone={i.type === "REINSCRIPTION" ? "purple" : "blue"} />
                )}
                {!!i.statut && <Badge label={humanize(i.statut)} tone="slate" />}
                {i.redoublant && <Badge label="Redoublant" tone="amber" />}
              </View>
            </View>

            {/* Le détail n'a pas pu être chargé : on le dit, les données de la liste restent affichées */}
            {status === "failed" && (
              <Pressable
                onPress={() => load("loading")}
                className="flex-row items-center gap-3 rounded-2xl bg-[#FFF1A8] px-4 py-3 active:opacity-80"
              >
                <Ionicons name="cloud-offline-outline" size={18} color="#7A5F00" />
                <Text className="flex-1 font-inter text-[13px] text-[#7A5F00]">
                  Détail complet indisponible. Touchez pour réessayer.
                </Text>
              </Pressable>
            )}

            <Section title="Élève">
              <InfoRow icon="person-outline" label="Nom complet" value={i.eleve_name || "—"} />
              <InfoRow icon="barcode-outline" label="Matricule" value={show(i.matricule)} bordered />
              <InfoRow icon="male-female-outline" label="Sexe" value={show(sexe)} bordered />
              <InfoRow
                icon="gift-outline"
                label="Date de naissance"
                value={show(full?.eleve_birth_day ? birth(full.eleve_birth_day) : "")}
                bordered
              />
              <InfoRow icon="location-outline" label="Lieu de naissance" value={show(full?.eleve_birth_of)} bordered />
              <InfoRow icon="call-outline" label="Téléphone" value={show(full?.eleve_phone)} bordered />
            </Section>

            <Section title="Scolarité">
              <InfoRow icon="calendar-outline" label="Année scolaire" value={show(i.annee_name)} />
              <InfoRow icon="arrow-undo-outline" label="Niveau précédent" value={show(full?.niveau_precedent)} bordered />
              <InfoRow icon="layers-outline" label="Niveau actuel" value={show(i.niveau_name)} bordered />
              <InfoRow
                icon="school-outline"
                label="Classe"
                value={loading && !full ? null : i.classe_name || "Non attribuée"}
                bordered
              />
              <InfoRow icon="repeat-outline" label="Redoublant" value={i.redoublant ? "Oui" : "Non"} bordered />
              <InfoRow
                icon="ribbon-outline"
                label="Décision fin d'année"
                value={show(full?.decision_fin_annee)}
                bordered
              />
            </Section>

            <Section title="Inscription">
              <InfoRow icon="swap-horizontal-outline" label="Type" value={i.type ? typeLabel(i.type) : "—"} />
              <InfoRow icon="flag-outline" label="Statut" value={show(i.statut ? humanize(i.statut) : "")} bordered />
              <InfoRow
                icon="checkmark-done-outline"
                label="Inscrit le"
                value={loading && !full ? null : when(full?.date ?? params.date ?? "") || "—"}
                bordered
              />
              <InfoRow icon="add-circle-outline" label="Créée le" value={show(when(full?.cree_le ?? ""))} bordered />
              {!!full?.modifie_le && full.modifie_le !== full.cree_le && (
                <InfoRow icon="create-outline" label="Modifiée le" value={when(full.modifie_le)} bordered />
              )}
            </Section>

            <Section title="Statut et paiement">
              <InfoRow
                icon="bookmark-outline"
                label="Affectation"
                value={show(full?.affectation ? affectationLabel(full.affectation) : "")}
              />
              <InfoRow
                icon="wallet-outline"
                label="Régime"
                value={show(full?.regime ? regimeLabel(full.regime) : "")}
                bordered
              />
              <InfoRow icon="card-outline" label="Mode de paiement" value={show(paiement)} bordered />
            </Section>

            {sortie && (
              <Section title="Sortie">
                <InfoRow icon="exit-outline" label="Sorti le" value={when(full?.sortie_le ?? "") || "—"} />
                <InfoRow icon="chatbox-ellipses-outline" label="Motif" value={full?.motif_sortie || "—"} bordered />
              </Section>
            )}

            {/* Créances : les frais dus par l'élève pour cette inscription */}
            <Section title={creances.length ? `Créances · reste ${money(totalReste)}` : "Créances"}>
              {loading && !full ? (
                <View className="py-4">
                  <Skeleton width="100%" height={16} />
                </View>
              ) : creances.length === 0 ? (
                <View className="flex-row items-center gap-3 py-4">
                  <Ionicons name="checkmark-circle-outline" size={20} color="#16A34A" />
                  <Text className="flex-1 font-inter text-[14px] text-muted">Aucune créance pour cette inscription.</Text>
                </View>
              ) : (
                creances.map((c, n) => (
                  <View key={c.key} className={`gap-1 py-3.5 ${n > 0 ? "border-t border-line" : ""}`}>
                    <View className="flex-row items-center gap-2">
                      <Text numberOfLines={1} className="flex-1 font-inter-semibold text-[15px] text-ink">
                        {c.name}
                      </Text>
                      <Text
                        className={`font-inter-bold text-[14px] ${c.reste > 0 ? "text-red-600" : "text-green-700"}`}
                      >
                        {c.reste > 0 ? `Reste ${money(c.reste)}` : "Soldé"}
                      </Text>
                    </View>
                    <Text className="font-inter text-xs text-muted">
                      {[
                        `Montant ${money(c.montant)}`,
                        c.paye > 0 ? `payé ${money(c.paye)}` : "",
                        c.echeance ? `échéance ${when(c.echeance)}` : "",
                        c.statut ? humanize(c.statut) : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                ))
              )}
            </Section>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 font-inter-bold text-[12px] uppercase tracking-wider text-primary">{title}</Text>
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
  /** null : valeur encore en chargement, un squelette prend sa place */
  value: string | null;
  bordered?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-3 py-3.5 ${bordered ? "border-t border-line" : ""}`}>
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <Text className="flex-1 font-inter text-[13px] text-muted">{label}</Text>
      {value === null ? (
        <Skeleton width={110} height={14} />
      ) : (
        <Text
          numberOfLines={2}
          className={`max-w-[60%] text-right font-inter-semibold text-[15px] ${value === "—" ? "text-muted" : "text-ink"}`}
        >
          {value}
        </Text>
      )}
    </View>
  );
}
