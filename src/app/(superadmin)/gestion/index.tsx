import { Stagger } from "@/components/ui/MotionView";
import { useAcademic } from "@/context/AcademicContext";
import { useDrenas } from "@/context/DrenasContext";
import { useStudents } from "@/context/StudentsContext";
import { useGestion } from "@/hooks/use-gestion";
import { useLogout } from "@/hooks/use-logout";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { ENTITIES, ENTITY_KEYS } from "@/organisation/entities";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const plural = (n: number) => (n > 1 ? "s" : "");

/* ---------- Écran ---------- */

export default function gestion() {
  const signOut = useLogout();
  const insets = useSafeAreaInsets();
  const { canOpen, canUse } = useGestion();

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
          <View>
            <Text className="font-inter-bold text-[28px] leading-9 text-ink">
              gestion
            </Text>
            <Text className="mt-1 font-inter text-[13px] text-muted">
              Pilotage et paramètres de la plateforme
            </Text>
          </View>

          <Stagger>
            <PersonalInformation />
            {canOpen("drenas") && <DrenasManagement />}
            <AcademicManagement />
            <SchoolingManagement />
            <OrganisationManagement />
            {canUse("utilisateurs") && <AdministrationManagement />}

            <Pressable
              onPress={signOut}
              className="rounded-3xl bg-red-200 p-8 shadow-sm mt-2 flex-row items-center justify-center gap-2 py-6 active:opacity-70 border-red-600"
            >
              {/* <Ionicons name="log-out-outline" size={18} color="#ef4444" /> */}
              <Text className="font-inter-semibold text-[14px] text-red-500">
                Se déconnecter
              </Text>
            </Pressable>
          </Stagger>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Cadre « Informations personnelles » ---------- */

function PersonalInformation() {
  const router = useRouter();
  const { href } = useGestion();

  return (
    <Pressable
      onPress={() => router.push(href("informations"))}
      accessibilityRole="button"
      className="flex-row items-center gap-3.5 rounded-3xl bg-white p-4 shadow-sm active:opacity-80"
    >
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <Ionicons name="person-outline" size={24} color="#FFE600" />
      </View>
      <View className="flex-1">
        <Text className="font-inter-bold text-[17px] text-ink">
          Informations personnelles
        </Text>
        <Text numberOfLines={1} className="font-inter text-xs text-muted">
          Consulter mon profil
        </Text>
      </View>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-soft">
        <Ionicons name="chevron-forward" size={18} color="#2B5EA8" />
      </View>
    </Pressable>
  );
}

/* ---------- Cadre « gestion académique » ---------- */

function AcademicManagement() {
  const router = useRouter();
  const { periods } = useAcademic();
  const { canOpen, href } = useGestion();

  return (
    <AccordionCard
      icon="library-outline"
      title="gestion académique"
      subtitle={`Années scolaires · ${periods.length} période${plural(periods.length)}`}
    >
      {canOpen("annees") && (
        <LinkRow
          icon="calendar-outline"
          title="Années scolaires"
          summary="Liste des années par établissement"
          onPress={() => router.push(href("annees"))}
        />
      )}
      <LinkRow
        icon="layers-outline"
        title="Périodes"
        summary={`${periods.length} période${plural(periods.length)} enregistrée${plural(periods.length)}`}
        onPress={() => router.push(href("periodes"))}
      />
    </AccordionCard>
  );
}

/* ---------- Cadre « gestion de la scolarité » ---------- */

function SchoolingManagement() {
  const router = useRouter();
  const { students } = useStudents();
  const { canOpen, href } = useGestion();
  const activeCount = students.filter((s) => s.active).length;

  return (
    <AccordionCard
      icon="school-outline"
      title="gestion de la scolarité"
      subtitle={`${students.length} élève${plural(students.length)} · ${activeCount} actif${plural(activeCount)}`}
    >
      {canOpen("inscriptions") && (
        <LinkRow
          icon="create-outline"
          title="Inscriptions"
          summary="Bientôt disponible"
          onPress={() => router.push(href("inscriptions"))}
        />
      )}
      <LinkRow
        icon="people-outline"
        title="Élèves"
        summary={`${students.length} élève${plural(students.length)} enregistré${plural(students.length)}`}
        onPress={() => router.push(href("eleves"))}
      />
    </AccordionCard>
  );
}

/* ---------- Cadre « gestion DREN & IEPP » ---------- */

function DrenasManagement() {
  const router = useRouter();
  const { iepps } = useDrenas();

  return (
    <AccordionCard
      icon="map-outline"
      title="gestion DREN & IEPP"
      subtitle={`DRENA · ${iepps.length} IEPP`}
    >
      <LinkRow
        icon="map-outline"
        title="DRENs"
        summary="Liste des DRENA"
        onPress={() => router.push("/(superadmin)/gestion/drenas")}
      />
      <LinkRow
        icon="business-outline"
        title="IEPPs"
        summary={`${iepps.length} IEPP enregistrée${plural(iepps.length)}`}
        onPress={() => router.push("/(superadmin)/gestion/iepps")}
      />
    </AccordionCard>
  );
}

/* ---------- Cadre « Organisation scolaire » ---------- */

function OrganisationManagement() {
  const router = useRouter();
  const { records } = useOrganisation();
  const { canUse, href } = useGestion();
  const keys = ENTITY_KEYS.filter(canUse);

  return (
    <AccordionCard
      icon="git-network-outline"
      title="Organisation scolaire"
      subtitle={`${keys.length} rubriques`}
    >
      {keys.map((key) => {
        const config = ENTITIES[key];
        // Ces rubriques viennent de l'API : elles ont leur propre écran
        if (key === "cycles" || key === "niveaux") {
          return (
            <LinkRow
              key={key}
              icon={config.icon}
              title={config.title}
              summary={`Liste des ${key}`}
              onPress={() => router.push(href(key))}
            />
          );
        }
        return (
          <LinkRow
            key={key}
            icon={config.icon}
            title={config.title}
            summary={`${records(key).length} ${config.countLabel}`}
            onPress={() => router.push(href("organisation", { entity: key }))}
          />
        );
      })}
    </AccordionCard>
  );
}

/* ---------- Cadre « Administration » ---------- */

function AdministrationManagement() {
  const router = useRouter();
  const { records } = useOrganisation();
  const { canOpen, canUse, href } = useGestion();

  const open = (entity: string) =>
    router.push(href("organisation", { entity }));

  const users = records("utilisateurs").length;
  const staff = records("personnels").length;
  const roles = records("roles").filter((r) => r.guard === "web").length;
  const permissions = records("permissions").filter(
    (p) => p.guard === "web",
  ).length;

  return (
    <AccordionCard
      icon="shield-checkmark-outline"
      title="Administration"
      subtitle={`${users} utilisateur${plural(users)} · ${staff} personnel${plural(staff)}`}
    >
      <LinkRow
        icon="people-outline"
        title="Utilisateurs"
        summary={`${users} utilisateur(s)`}
        onPress={() => open("utilisateurs")}
      />
      <LinkRow
        icon="briefcase-outline"
        title="Personnels"
        summary={`${staff} personnel(s)`}
        onPress={() => open("personnels")}
      />

      {/* Rôles & permissions : se déroule en trois accès */}
      {canUse("roles") && (
        <ExpandRow
          icon="key-outline"
          title="Rôles & permissions"
          summary={`${roles} rôle(s) · ${permissions} permission(s)`}
        >
          <SubLink title="Rôles" onPress={() => open("roles")} />
          <SubLink title="Permissions" onPress={() => open("permissions")} />
          <SubLink
            title="Attribution des permissions par rôle"
            onPress={() => router.push(href("attribution"))}
          />
        </ExpandRow>
      )}

      {canOpen("suivi-modules") && (
        <LinkRow
          icon="pulse-outline"
          title="Suivi des modules"
          summary="Bientôt disponible"
          onPress={() => router.push(href("suivi-modules"))}
        />
      )}
    </AccordionCard>
  );
}

function ExpandRow({
  icon,
  title,
  summary,
  children,
}: {
  icon: IconName;
  title: string;
  summary: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View className="rounded-2xl bg-page">
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3 px-3 py-3 active:opacity-80"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
          <Ionicons name={icon} size={18} color="#2B5EA8" />
        </View>
        <View className="flex-1">
          <Text className="font-inter-semibold text-[15px] text-ink">
            {title}
          </Text>
          <Text numberOfLines={1} className="font-inter text-xs text-muted">
            {summary}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#6B7A90"
        />
      </Pressable>

      {open && <View className="gap-2 px-3 pb-3">{children}</View>}
    </View>
  );
}

function SubLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center justify-between rounded-xl bg-white px-3.5 py-3 active:opacity-80"
    >
      <Text className="font-inter-semibold text-[14px] text-ink">{title}</Text>
      <Ionicons name="chevron-forward" size={16} color="#6B7A90" />
    </Pressable>
  );
}

/* ---------- Composants ---------- */

function AccordionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View className="rounded-3xl bg-white p-4 shadow-sm">
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3.5 active:opacity-80"
      >
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Ionicons name={icon} size={24} color="#FFE600" />
        </View>
        <View className="flex-1">
          <Text className="font-inter-bold text-[17px] text-ink">{title}</Text>
          <Text numberOfLines={1} className="font-inter text-xs text-muted">
            {subtitle}
          </Text>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-soft">
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color="#2B5EA8"
          />
        </View>
      </Pressable>

      {open && (
        <View className="mt-4 gap-3">
          <View className="h-px bg-line" />
          {children}
        </View>
      )}
    </View>
  );
}

function LinkRow({
  icon,
  title,
  summary,
  onPress,
}: {
  icon: IconName;
  title: string;
  summary: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl bg-page px-3 py-3 active:opacity-80"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-[15px] text-ink">
          {title}
        </Text>
        <Text numberOfLines={1} className="font-inter text-xs text-muted">
          {summary}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6B7A90" />
    </Pressable>
  );
}
