import { Card, Fill, Split, Tile } from "@/components/PlatformStats";
import FixedHeader from "@/components/ui/FixedHeader";
import { Stagger } from "@/components/ui/MotionView";
import { useAcademic } from "@/context/AcademicContext";
import { useStudents } from "@/context/StudentsContext";
import { fullName, Student } from "@/data/students";
import { useGestion } from "@/hooks/use-gestion";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { computeEffectifs } from "@/organisation/stats";
import { initials } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, Text, View } from "react-native";

// Les élèves et les classes sont encore fictifs : à remplacer par l'école du compte quand leur API sera branchée
const SCHOOL = "Collège des Almadies";

const plural = (n: number) => (n > 1 ? "s" : "");
const percent = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

export default function Effectifs() {
  const router = useRouter();
  const { href } = useGestion();
  const { students } = useStudents();
  const { years } = useAcademic();
  const { records, refLabel } = useOrganisation();
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = computeEffectifs({
    school: SCHOOL,
    students,
    years,
    classes: records("classes"),
  });

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((current) => (current === id ? null : id));
  };

  const openStudent = (s: Student) =>
    router.push(href("eleves-detail", { id: s.id }));

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        <View>
          <Text className="font-inter-bold text-[28px] leading-9 text-ink">
            Effectifs
          </Text>
          <Text
            numberOfLines={1}
            className="mt-1 font-inter text-[13px] text-muted"
          >
            {SCHOOL} · données fictives
          </Text>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          <Stagger>
            {/* Carte résumé : le chiffre principal et le remplissage */}
            <View className="rounded-3xl bg-primary p-5">
              <Text className="font-inter text-[13px] text-white/70">
                Élèves inscrits
              </Text>
              <Text className="mt-1 font-inter-bold text-[44px] leading-[52px] text-white">
                {stats.total}
              </Text>

              <View className="mt-3 h-3 overflow-hidden rounded bg-white/20">
                <Fill
                  start
                  width={Math.min(100, percent(stats.placed, stats.seats))}
                  color="#FFE600"
                />
              </View>
              <Text className="mt-2 font-inter text-[13px] text-white">
                {stats.placed} élève{plural(stats.placed)} en classe sur{" "}
                {stats.seats} place{plural(stats.seats)} ·{" "}
                {percent(stats.placed, stats.seats)} % de remplissage
              </Text>
            </View>

            {/* Chiffres clés */}
            <View className="flex-row gap-3">
              <Tile
                start
                value={stats.classes.length}
                label="Classes"
                icon="people-outline"
              />
              <Tile
                start
                value={stats.active}
                label={`Actif${plural(stats.active)}`}
                icon="checkmark-circle-outline"
              />
              <Tile
                start
                value={stats.total - stats.active}
                label={`Inactif${plural(stats.total - stats.active)}`}
                icon="pause-circle-outline"
              />
            </View>

            <Card title="Répartition des élèves">
              <Split
                start
                a={{ label: "Filles", value: stats.girls }}
                b={{ label: "Garçons", value: stats.boys }}
              />
            </Card>

            {/* Par classe : touche une classe pour voir ses élèves */}
            <View className="gap-3">
              <Text className="font-inter-bold text-lg text-ink">
                Par classe
              </Text>

              {stats.classes.length === 0 ? (
                <View className="items-center rounded-3xl bg-white py-12">
                  <Text className="font-inter text-[14px] text-muted">
                    Aucune classe pour cette année.
                  </Text>
                </View>
              ) : (
                stats.classes.map((c, i) => (
                  <ClassCard
                    key={c.record.id}
                    name={String(c.record.libelle)}
                    detail={[
                      refLabel("niveaux", String(c.record.niveau)),
                      c.record.salle
                        ? refLabel("salles", String(c.record.salle))
                        : "Sans salle",
                    ].join(" · ")}
                    capacity={c.capacity}
                    students={c.students}
                    delay={i * 80}
                    open={openId === c.record.id}
                    onToggle={() => toggle(c.record.id)}
                    onOpenStudent={openStudent}
                  />
                ))
              )}

              {stats.unassigned.length > 0 && (
                <ClassCard
                  name="Sans classe"
                  detail="Élèves à affecter à une classe"
                  capacity={0}
                  students={stats.unassigned}
                  delay={0}
                  open={openId === "unassigned"}
                  onToggle={() => toggle("unassigned")}
                  onOpenStudent={openStudent}
                />
              )}
            </View>
          </Stagger>
        </View>
      </ScrollView>
    </View>
  );
}

function ClassCard({
  name,
  detail,
  capacity,
  students,
  delay,
  open,
  onToggle,
  onOpenStudent,
}: {
  name: string;
  detail: string;
  capacity: number;
  students: Student[];
  delay: number;
  open: boolean;
  onToggle: () => void;
  onOpenStudent: (s: Student) => void;
}) {
  const count = students.length;

  return (
    <View className="rounded-3xl bg-white p-4 shadow-sm">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${name}, ${count} élève${plural(count)}`}
        className="gap-3 active:opacity-80"
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="font-inter-bold text-[16px] text-ink"
            >
              {name}
            </Text>
            <Text numberOfLines={1} className="font-inter text-xs text-muted">
              {detail}
            </Text>
          </View>
          <Text className="font-inter-semibold text-[13px] text-ink">
            {capacity > 0
              ? `${count} / ${capacity}`
              : `${count} élève${plural(count)}`}
          </Text>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color="#6B7A90"
          />
        </View>

        {capacity > 0 && (
          <View className="h-2.5 overflow-hidden rounded bg-soft">
            <Fill
              start
              delay={delay}
              width={Math.min(100, percent(count, capacity))}
              color="#2B5EA8"
            />
          </View>
        )}
      </Pressable>

      {open &&
        (count === 0 ? (
          <Text className="mt-3 border-t border-line pt-3 font-inter text-[13px] text-muted">
            Aucun élève dans cette classe.
          </Text>
        ) : (
          <View className="mt-3 border-t border-line">
            {[...students]
              .sort((a, b) => fullName(a).localeCompare(fullName(b), "fr"))
              .map((s, i) => (
                <Pressable
                  key={s.id}
                  onPress={() => onOpenStudent(s)}
                  accessibilityRole="button"
                  accessibilityLabel={fullName(s)}
                  className={`flex-row items-center gap-3 py-2.5 active:opacity-70 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-soft">
                    <Text className="font-inter-bold text-xs text-primary">
                      {initials(`${s.firstNames} ${s.lastName}`)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-inter-semibold text-[14px] text-ink"
                    >
                      {fullName(s)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-inter text-xs text-muted"
                    >
                      {s.matricule || "Sans matricule"} · {s.sex}
                    </Text>
                  </View>
                  {!s.active && (
                    <View className="rounded-full bg-slate-100 px-2.5 py-0.5">
                      <Text className="font-inter-semibold text-[11px] text-muted">
                        Inactif
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#9AA7B8" />
                </Pressable>
              ))}
          </View>
        ))}
    </View>
  );
}
