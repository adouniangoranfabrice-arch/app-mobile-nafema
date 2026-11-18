import { Card, Fill, Meter, Split, Tile } from "@/components/PlatformStats";
import { Skeleton } from "@/components/ui/Skeleton";
import { fcfa } from "@/data/finances";
import { useGo } from "@/hooks/use-go";
import { useLogout } from "@/hooks/use-logout";
import { useReveal } from "@/hooks/use-reveal";
import { FICTIF, useSchoolDashboard } from "@/hooks/use-school-dashboard";
import { fromISO } from "@/organisation/helpers";
import { formatDate } from "@/utils/dates";
import { initials } from "@/utils/text";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const SCHOOL_TYPES: Record<string, string> = {
  PRIVE: "Établissement privé",
  PUBLIC: "Établissement public",
};

const plural = (n: number) => (n > 1 ? "s" : "");
const percent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;
/** « 2026-09-01 » → « 1 sept. 2026 » */
const shortDate = (raw: string) =>
  /^\d{4}-\d{2}-\d{2}/.test(raw ?? "") ? formatDate(fromISO(raw.slice(0, 10))) : "";

const gestion = (screen: string) => `/(adminschool)/gestion/${screen}` as Href;

/* ---------- Écran ---------- */

/**
 * Accueil de l'admin école. Vraies données : établissement, année et période en cours, classes,
 * salles, niveaux, séries, élèves, frais. Encore fictives (marquées « Fictif ») : enseignants,
 * présence, invitations, justificatifs, recouvrement ; inscriptions tant que leur mode fictif est actif.
 */
export default function AdminHome() {
  const signOut = useLogout();
  const go = useGo(); // ouvre aussi les écrans d'un autre onglet, avec sa page principale dessous
  const insets = useSafeAreaInsets();
  const { revealed, scrollProps, track } = useReveal();
  const { data, status, meFailed, reload } = useSchoolDashboard();

  const loading = status === "loading";
  const user = data?.user ?? null;
  const school = user?.etablissement;
  const schoolName = user
    ? (school?.name ?? "Aucun établissement")
    : meFailed
      ? "Établissement indisponible"
      : "Chargement…";

  // Élèves : la vraie liste si GET /eleves répond, sinon le chiffre fictif
  const eleves = data?.eleves ?? null;
  const studentsReal = eleves !== null;
  const totalStudents = eleves?.length ?? FICTIF.students;
  const girls = eleves?.filter((e) => e.gender === "F").length ?? 0;
  const boys = eleves?.filter((e) => e.gender === "M").length ?? 0;
  const presence = percent(totalStudents - FICTIF.absencesToday, totalStudents);

  const classes = data?.classes ?? [];
  const groups = data?.groups ?? [];
  // « 2 classes en 2026-2027 · 4 au total » ; le grand chiffre compte toutes les années
  const thisYear = data?.classesThisYear ?? 0;
  const classesSub =
    classes.length === 0
      ? "Aucune classe"
      : data?.year
        ? `${thisYear} classe${plural(thisYear)} en ${data.year.name} · ${classes.length} au total`
        : `${classes.length} au total, toutes années`;

  const periode = data?.periode ?? null;
  const term = periode
    ? [periode.name, shortDate(periode.debut) && `du ${shortDate(periode.debut)} au ${shortDate(periode.fin)}`]
        .filter(Boolean)
        .join(" · ")
    : data?.year
      ? "Aucune période pour cette année"
      : "Aucune année scolaire active";
  const yearOpen = !!data?.year && !(data.year.is_closed === 1);

  const requests: { id: string; count: number; label: string; detail: string; icon: IconName; fictif: boolean; to: Href }[] = [
    {
      id: "inscriptions",
      count: data?.inscriptionsEnAttente ?? 0,
      label: `inscription${plural(data?.inscriptionsEnAttente ?? 0)} en attente`,
      detail: "À valider par l'administration",
      icon: "person-add-outline",
      fictif: data?.inscriptionsFictives ?? true,
      to: gestion("inscriptions"),
    },
    {
      id: "invitations",
      count: FICTIF.pendingInvites,
      label: `invitation${plural(FICTIF.pendingInvites)} d'enseignant${plural(FICTIF.pendingInvites)}`,
      detail: "En attente d'acceptation",
      icon: "mail-outline",
      fictif: true,
      to: gestion("index"),
    },
    {
      id: "justificatifs",
      count: FICTIF.justificatifs,
      label: `justificatif${plural(FICTIF.justificatifs)} d'absence`,
      detail: "Transmis par les parents",
      icon: "document-text-outline",
      fictif: true,
      to: gestion("index"),
    },
  ];
  const totalRequests = requests.reduce((s, r) => s + r.count, 0);

  const rec = data?.recouvrement ?? { attendu: 0, paye: 0, enRetard: 0 };

  const today = new Date()
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

  // Valeur en chargement : un squelette à la place du chiffre
  const v = (value: string) => (loading ? null : value);

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      {/* En-tête */}
      <View className=" items-center bg-white py-8">
        <View className="flex-row gap-40 top-5 px-5 py-2">
          <View className="flex-row  gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-canvas">
              <Image
                source={require("@/assets/images/logo_nefama.png")}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="font-inter-bold text-base text-primary">NAFEMA</Text>
              <Text className="font-inter text-xs text-muted">Espace admin école</Text>
            </View>
          </View>

          <View>
            <Pressable className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80">
              <Ionicons name="notifications-outline" size={20} color="#2B5EA8" />
              {totalRequests > 0 && (
                <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top - 30, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={status === "refreshing"} onRefresh={reload} tintColor="#2B5EA8" />
        }
        {...scrollProps}
      >
        <View className="w-full max-w-[640px] gap-5 self-center px-5">
          {/* Titre + avatar (touche l'avatar pour se déconnecter) */}
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-semibold text-xs tracking-wide text-muted">{today}</Text>
              <Text className="mt-1 font-inter-bold text-[28px] leading-9 text-ink">
                Mon établissement
              </Text>
              <Text numberOfLines={1} className="mt-1 font-inter text-[13px] text-muted">
                Bonjour{user ? `, ${user.full_name}` : ""}
                {data?.year ? ` · Année ${data.year.name}` : ""}
              </Text>
            </View>
            <Pressable
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Se déconnecter"
              className="h-14 w-14 items-center justify-center rounded-full bg-soft active:opacity-80"
            >
              {user ? (
                <Text className="font-inter-bold text-base text-primary">{initials(user.full_name)}</Text>
              ) : loading ? (
                <Skeleton width={56} height={56} radius={28} />
              ) : (
                <Ionicons name="person-outline" size={22} color="#2B5EA8" />
              )}
            </Pressable>
          </View>

          {/* Carte établissement : nom, type, période en cours */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <Ionicons name="business-outline" size={24} color="#FFE600" />
              </View>
              <View className="flex-1">
                {loading ? (
                  <View className="gap-2 py-1">
                    <Skeleton width="70%" height={20} color="rgba(255,255,255,0.25)" />
                    <Skeleton width="40%" height={12} color="rgba(255,255,255,0.18)" />
                  </View>
                ) : (
                  <>
                    <Text className="font-inter-bold text-[22px] text-white">{schoolName}</Text>
                    {!!school && (
                      <Text className="font-inter text-[13px] text-white/70">
                        {[SCHOOL_TYPES[school.type] ?? school.type, school.abbrev].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>

            <View className="my-4 h-px bg-white/20" />

            <View className="flex-row items-center justify-between gap-3">
              {loading ? (
                <Skeleton width="60%" height={13} color="rgba(255,255,255,0.18)" />
              ) : (
                <Text className="flex-1 font-inter text-[13px] text-white">{term}</Text>
              )}
              {!loading && (
                <View className={`rounded-full px-3 py-1 ${yearOpen ? "bg-green-100" : "bg-white/20"}`}>
                  <Text className={`font-inter-semibold text-xs ${yearOpen ? "text-green-700" : "text-white"}`}>
                    {yearOpen ? "Année ouverte" : data?.year ? "Année clôturée" : "Pas d'année"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Chiffres clés 2 x 2 */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard
                value={v(String(totalStudents))}
                icon={<Ionicons name="school-outline" size={20} color="#6B7A90" />}
                label="Élèves"
                sub={
                  studentsReal
                    ? girls + boys > 0
                      ? `${girls} fille${plural(girls)} · ${boys} garçon${plural(boys)}`
                      : `${data?.capacity ?? 0} places en classe`
                    : "Liste des élèves indisponible"
                }
                fictif={!loading && !studentsReal}
              />
              <StatCard
                value={v(String(FICTIF.teachers))}
                icon={<Ionicons name="easel-outline" size={20} color="#6B7A90" />}
                label="Enseignants"
                sub={`${FICTIF.pendingInvites} invitations en attente`}
                fictif
              />
            </View>
            <View className="flex-row gap-3">
              <StatCard
                value={v(String(classes.length))}
                icon={<Ionicons name="business-outline" size={20} color="#6B7A90" />}
                label="Classes"
                sub={classesSub}
                onPress={() => go("/(adminschool)/classes" as Href)}
              />
              <StatCard
                value={v(`${presence} %`)}
                icon={<MaterialCommunityIcons name="account-check-outline" size={20} color="#6B7A90" />}
                label="Présence du jour"
                sub={`${FICTIF.absencesToday} absences signalées`}
                fictif
              />
            </View>
          </View>

          {/* Actions rapides */}
          <View className="flex-row gap-3">
            <QuickAction label="Inscrire un élève" icon="person-add-outline" onPress={() => go(gestion("nouvelle-inscription"))} />
            <QuickAction label="Créer une classe" icon="add" onPress={() => go("/(adminschool)/classes" as Href)} />
            <QuickAction label="Frais" icon="cash-outline" onPress={() => go(gestion("frais"))} />
          </View>

          {/* À traiter */}
          <View className="gap-3">
            <SectionHeader
              title="À traiter"
              action={`${totalRequests} demande${plural(totalRequests)}`}
              onPress={() => go(gestion("inscriptions"))}
            />
            <View className="gap-4 rounded-3xl bg-[#FFF6BF] p-5">
              {requests.map((r, i) => (
                <Pressable key={r.id} onPress={() => go(r.to)} className="active:opacity-70">
                  {i > 0 && <View className="mb-4 h-px bg-[#E6DC8F]" />}
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
                      <Ionicons name={r.icon} size={20} color="#2B5EA8" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-inter-semibold text-[15px] text-ink">
                        {loading && r.id === "inscriptions" ? "…" : r.count} {r.label}
                      </Text>
                      <Text className="font-inter text-xs text-[#7A5F00]">
                        {r.detail}
                        {r.fictif ? " · fictif" : ""}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              <Pressable
                onPress={() => go(gestion("inscriptions"))}
                className="h-[50px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
              >
                <Text className="font-inter-semibold text-[15px] text-white">Examiner les inscriptions</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Organisation de l'année : vraies données */}
          <View className="gap-3" {...track("org")}>
            <SectionHeader title="Organisation de l'année" action="Gestion" onPress={() => go(gestion("index"))} />
            <View className="flex-row gap-3">
              <Tile start={revealed("org") && !loading} value={data?.salles.length ?? 0} label="Salles" icon="easel-outline" />
              <Tile start={revealed("org") && !loading} value={data?.niveaux ?? 0} label="Niveaux" icon="layers-outline" />
              <Tile start={revealed("org") && !loading} value={data?.periodeCount ?? 0} label="Périodes" icon="calendar-outline" />
            </View>
            <Card title="Capacité d'accueil">
              <Meter
                start={revealed("org") && !loading}
                label={studentsReal ? "Places occupées dans les classes" : "Places occupées (élèves fictifs)"}
                part={totalStudents}
                total={Math.max(data?.capacity ?? 0, 1)}
              />
              <Text className="font-inter text-xs text-muted">
                {data?.capacity ?? 0} place{plural(data?.capacity ?? 0)} en classe · {data?.sallesCapacity ?? 0} place
                {plural(data?.sallesCapacity ?? 0)} dans les salles
                {data?.series !== null && data?.series !== undefined ? ` · ${data.series} série${plural(data.series)}` : ""}
              </Text>
            </Card>
            {studentsReal && girls + boys > 0 && (
              <Card title="Répartition des élèves">
                <Split
                  start={revealed("org") && !loading}
                  a={{ label: "Filles", value: girls }}
                  b={{ label: "Garçons", value: boys }}
                />
              </Card>
            )}
          </View>

          {/* Finances : frais réels, recouvrement fictif */}
          <View className="gap-3" {...track("fin")}>
            <SectionHeader title="Finances" action="Voir les frais" onPress={() => go(gestion("frais"))} />
            <View className="flex-row gap-3">
              <StatCard
                value={v(String(data?.frais.length ?? 0))}
                icon={<Ionicons name="pricetags-outline" size={20} color="#6B7A90" />}
                label="Frais configurés"
                sub={data?.year ? `Année ${data.year.name}` : "Toutes années"}
                onPress={() => go(gestion("frais"))}
              />
              <StatCard
                value={v(`${percent(rec.paye, rec.attendu)} %`)}
                icon={<Ionicons name="trending-up-outline" size={20} color="#6B7A90" />}
                label="Recouvrement"
                sub={`${rec.enRetard} créance${plural(rec.enRetard)} en retard`}
                fictif
                onPress={() => go(gestion("creances"))}
              />
            </View>
            <Card title="Montant des frais de l'année">
              {loading ? (
                <Skeleton width={160} height={22} />
              ) : (
                <Text className="font-inter-bold text-[22px] text-primary">{fcfa(data?.fraisTotal ?? 0)}</Text>
              )}
              <Meter
                start={revealed("fin") && !loading}
                delay={120}
                label="Encaissé sur les créances (fictif)"
                part={rec.paye}
                total={Math.max(rec.attendu, 1)}
              />
            </Card>
          </View>

          {/* Répartition des classes par niveau : vraies données */}
          <View className="gap-3" {...track("groups")}>
            <SectionHeader title="Répartition des classes" action="Gérer" onPress={() => go("/(adminschool)/classes" as Href)} />
            <View className="gap-4 rounded-3xl bg-white p-4 shadow-sm">
              {loading ? (
                <View className="gap-3">
                  <Skeleton width="80%" height={14} />
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="70%" height={14} />
                </View>
              ) : groups.length === 0 ? (
                <Text className="font-inter text-[13px] text-muted">Aucune classe pour cet établissement.</Text>
              ) : (
                groups.map((g, i) => {
                  // Avec les élèves : taux de remplissage ; sans : part des classes de l'école
                  const fill =
                    g.students !== null && g.capacity > 0
                      ? Math.min(100, percent(g.students, g.capacity))
                      : percent(g.classes, classes.length);
                  return (
                    <View key={g.name} className="gap-2">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text numberOfLines={1} className="flex-1 font-inter-semibold text-[14px] text-ink">
                          {g.name} · {g.classes} classe{plural(g.classes)}
                        </Text>
                        <Text className="font-inter text-[13px] text-muted">
                          {g.students !== null
                            ? `${g.students} / ${g.capacity} élèves`
                            : `${g.capacity} places`}
                        </Text>
                      </View>
                      <View className="h-1.5 overflow-hidden rounded-full bg-soft">
                        <Fill start={revealed("groups")} delay={i * 80} width={fill} color="#2B5EA8" />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          <Text className="text-center font-inter text-[11px] text-muted">
            « Fictif » : chiffre de démonstration, en attendant l'API correspondante.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Petits composants ---------- */

function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-inter-bold text-lg text-ink">{title}</Text>
      <Pressable hitSlop={8} onPress={onPress} accessibilityRole="button">
        <Text className="font-inter-semibold text-[13px] text-primary">{action}</Text>
      </Pressable>
    </View>
  );
}

function StatCard({
  value,
  icon,
  label,
  sub,
  fictif,
  onPress,
}: {
  /** null : en chargement */
  value: string | null;
  icon: ReactNode;
  label: string;
  sub: string;
  fictif?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-1 rounded-3xl bg-white p-4 shadow-sm active:opacity-80"
    >
      <View className="flex-row items-start justify-between">
        {value === null ? (
          <Skeleton width={64} height={32} />
        ) : (
          <Text className="font-inter-bold text-[32px] leading-9 text-primary">{value}</Text>
        )}
        {icon}
      </View>
      <View className="mt-3 flex-row items-center gap-1.5">
        <Text className="font-inter-semibold text-[14px] text-ink">{label}</Text>
        {fictif && (
          <View className="rounded-full bg-soft px-1.5 py-0.5">
            <Text className="font-inter-semibold text-[10px] text-muted">Fictif</Text>
          </View>
        )}
      </View>
      <Text numberOfLines={2} className="mt-0.5 font-inter text-xs text-muted">
        {value === null ? " " : sub}
      </Text>
    </Pressable>
  );
}

function QuickAction({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-1 items-center gap-2.5 rounded-2xl bg-white px-2 py-4 shadow-sm active:opacity-80"
    >
      <Ionicons name={icon} size={22} color="#2B5EA8" />
      <Text className="text-center font-inter-semibold text-[13px] text-ink">{label}</Text>
    </Pressable>
  );
}
