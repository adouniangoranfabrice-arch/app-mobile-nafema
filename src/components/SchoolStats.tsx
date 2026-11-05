import { Card, Fill, Meter, Split, Tile } from "@/components/PlatformStats";
import { useAcademic } from "@/context/AcademicContext";
import { useStudents } from "@/context/StudentsContext";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { computeSchoolStats } from "@/organisation/stats";
import { Text, View } from "react-native";

/** Les statistiques d'une école. `start` lance les animations quand la section est visible */
export default function SchoolStats({
  school,
  start,
}: {
  school: string;
  start: boolean;
}) {
  const { students } = useStudents();
  const { years, periods } = useAcademic();
  const { records } = useOrganisation();

  const stats = computeSchoolStats({
    school,
    students,
    years,
    periods,
    classes: records("classes"),
    niveaux: records("niveaux"),
    salles: records("salles"),
  });
  const maxByNiveau = Math.max(1, ...stats.classesByNiveau.map((n) => n.count));

  return (
    <View className="gap-3">
      <View>
        <Text className="font-inter-bold text-lg text-ink">
          Statistiques de l'école
        </Text>
        <Text className="font-inter text-xs text-muted">
          {school} · données fictives de l'application
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Tile
          start={start}
          value={stats.totals.students}
          label="Élèves"
          icon="school-outline"
        />
        <Tile
          start={start}
          value={stats.totals.classes}
          label="Classes"
          icon="people-outline"
        />
        <Tile
          start={start}
          value={stats.totals.salles}
          label="Salles"
          icon="easel-outline"
        />
      </View>

      {stats.hasYear && (
        <Card title="Année scolaire">
          <Meter
            start={start}
            label="Jours écoulés"
            part={stats.year.daysElapsed}
            total={stats.year.daysTotal}
          />
          <Meter
            start={start}
            delay={120}
            label={
              stats.periods.current
                ? `Périodes terminées (en cours : ${stats.periods.current})`
                : "Périodes terminées"
            }
            part={stats.periods.done}
            total={stats.periods.total}
          />
        </Card>
      )}

      <Card title="Effectifs">
        <Meter
          start={start}
          label="Élèves actifs"
          part={stats.students.active}
          total={stats.totals.students}
        />
        <Meter
          start={start}
          delay={120}
          label="Places occupées"
          part={stats.totals.students}
          total={stats.seats}
        />
      </Card>

      <Card title="Répartition des élèves">
        <Split
          start={start}
          a={{ label: "Filles", value: stats.students.girls }}
          b={{ label: "Garçons", value: stats.students.boys }}
        />
      </Card>

      <Card title="Classes par niveau">
        {stats.classesByNiveau.length === 0 ? (
          <Text className="font-inter text-[13px] text-muted">
            Aucune classe pour cette année.
          </Text>
        ) : (
          stats.classesByNiveau.map((n, i) => (
            <View key={n.id} className="gap-1.5">
              <View className="flex-row items-center justify-between gap-3">
                <Text
                  numberOfLines={1}
                  className="flex-1 font-inter text-[13px] text-muted"
                >
                  {n.name}
                </Text>
                <Text className="font-inter-semibold text-[13px] text-ink">
                  {n.count}
                </Text>
              </View>
              <View className="h-3">
                <Fill
                  start={start}
                  delay={i * 80}
                  width={(n.count / maxByNiveau) * 100}
                  color="#2B5EA8"
                />
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}
