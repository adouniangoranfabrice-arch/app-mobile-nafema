import AddStudentModal from "@/components/gestion/AddStudentModal";
import ActionButton from "@/components/ui/ActionButton";
import FixedHeader from "@/components/ui/FixedHeader";
import { showToast } from "@/components/ui/Toast";
import { useStudents } from "@/context/StudentsContext";
import { fullName } from "@/data/students";
import { useGestion } from "@/hooks/use-gestion";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { confirmDeleteStudent } from "@/utils/confirm";
import { ageOf, formatDate } from "@/utils/dates";
import { initials } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IconName = keyof typeof Ionicons.glyphMap;

const val = (v?: string) => (v && v.trim() ? v : "—");

export default function EleveDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, updateStudent, deleteStudent } = useStudents();
  const { canEdit } = useGestion();
  const { refLabel } = useOrganisation();
  const [editing, setEditing] = useState(false);

  const student = students.find((s) => s.id === id);

  const header = (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
      >
        <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
      </Pressable>
      <Text className="flex-1 font-inter-bold text-[20px] leading-8 text-ink">
        Fiche élève
      </Text>
    </View>
  );

  // Élève introuvable (par exemple déjà supprimé)
  if (!student) {
    return (
      <View
        className="flex-1 bg-page px-5"
        style={{ paddingTop: insets.top + 12 }}
      >
        <StatusBar style="dark" />
        {header}
        <View className="mt-10 items-center gap-2 rounded-3xl bg-white py-12">
          <Ionicons name="people-outline" size={28} color="#9AA7B8" />
          <Text className="font-inter-semibold text-[15px] text-ink">
            Élève introuvable
          </Text>
        </View>
      </View>
    );
  }

  const remove = () =>
    confirmDeleteStudent(student, () => {
      router.back();
      deleteStudent(student.id);
    });

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
        {header}
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* Carte principale */}
          <View className="rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-3.5">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white/15">
                <Text className="font-inter-bold text-[18px] text-accent">
                  {initials(`${student.firstNames} ${student.lastName}`)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  numberOfLines={2}
                  className="font-inter-bold text-[20px] leading-6 text-white"
                >
                  {fullName(student)}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-inter text-[13px] text-white/70"
                >
                  {student.matricule || "Sans matricule"} · {student.school}
                </Text>
              </View>
              <View
                className={`rounded-full px-3 py-1 ${student.active ? "bg-green-100" : "bg-white/20"}`}
              >
                <Text
                  className={`font-inter-semibold text-xs ${student.active ? "text-green-700" : "text-white"}`}
                >
                  {student.active ? "Actif" : "Inactif"}
                </Text>
              </View>
            </View>
          </View>

          <Group title="Identité">
            <InfoRow
              icon="business-outline"
              label="Établissement"
              value={student.school}
            />
            <InfoRow
              icon="people-outline"
              label="Classe"
              value={refLabel("classes", student.classe_id)}
              bordered
            />
            <InfoRow
              icon="id-card-outline"
              label="Matricule"
              value={val(student.matricule)}
              bordered
            />
            <InfoRow
              icon="person-outline"
              label="Nom"
              value={student.lastName}
              bordered
            />
            <InfoRow
              icon="person-outline"
              label="Prénoms"
              value={student.firstNames}
              bordered
            />
            <InfoRow
              icon="male-female-outline"
              label="Sexe"
              value={student.sex}
              bordered
            />
          </Group>

          <Group title="Naissance et origine">
            <InfoRow
              icon="calendar-outline"
              label="Date de naissance"
              value={
                student.birthDate
                  ? `${formatDate(student.birthDate)} (${ageOf(student.birthDate)} ans)`
                  : "—"
              }
            />
            <InfoRow
              icon="location-outline"
              label="Lieu de naissance"
              value={val(student.birthPlace)}
              bordered
            />
            <InfoRow
              icon="flag-outline"
              label="Nationalité"
              value={val(student.nationality)}
              bordered
            />
            <InfoRow
              icon="finger-print-outline"
              label="Matricule national"
              value={val(student.nationalId)}
              bordered
            />
            <InfoRow
              icon="document-text-outline"
              label="Numéro extrait"
              value={val(student.extractNumber)}
              bordered
            />
          </Group>

          <Group title="Contact">
            <InfoRow
              icon="home-outline"
              label="Adresse"
              value={val(student.address)}
              multiline
            />
            <InfoRow
              icon="map-outline"
              label="Quartier"
              value={val(student.district)}
              bordered
            />
            <InfoRow
              icon="call-outline"
              label="Téléphone"
              value={val(student.phone)}
              bordered
            />
          </Group>

          <Group title="Santé">
            <InfoRow
              icon="water-outline"
              label="Groupe sanguin"
              value={val(student.bloodGroup)}
            />
            <InfoRow
              icon="medkit-outline"
              label="Observations médicales"
              value={val(student.medicalNotes)}
              bordered
              multiline
            />
          </Group>

          <Group title="Autres informations">
            <InfoRow
              icon="school-outline"
              label="Établissement précédent"
              value={val(student.previousSchool)}
            />
            <InfoRow
              icon="image-outline"
              label="Photo (chemin)"
              value={val(student.photo)}
              bordered
            />
            <InfoRow
              icon="pulse-outline"
              label="Statut"
              bordered
              value={
                <View
                  className={`rounded-full px-3 py-1 ${student.active ? "bg-green-100" : "bg-slate-100"}`}
                >
                  <Text
                    className={`font-inter-semibold text-xs ${student.active ? "text-green-700" : "text-muted"}`}
                  >
                    {student.active ? "Actif" : "Inactif"}
                  </Text>
                </View>
              }
            />
          </Group>

          {/* Actions */}
          {canEdit && (
            <View className="gap-3">
              <ActionButton
                icon="create-outline"
                label="Modifier cet élève"
                variant="primary"
                className="w-full"
                onPress={() => setEditing(true)}
              />
              <ActionButton
                icon="trash-outline"
                label="Supprimer cet élève"
                variant="danger"
                className="w-full"
                onPress={remove}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <AddStudentModal
        visible={editing}
        student={student}
        existing={students}
        onClose={() => setEditing(false)}
        onSave={(data) => {
          updateStudent(student.id, data);
          setEditing(false);
          showToast("Élève modifié avec succès.");
        }}
      />
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-inter-bold text-[12px] uppercase tracking-wider text-primary">
        {title}
      </Text>
      <View className="rounded-3xl bg-white px-4 shadow-sm">{children}</View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  bordered,
  multiline,
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  bordered?: boolean;
  multiline?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 py-3.5 ${bordered ? "border-t border-line" : ""}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-soft">
        <Ionicons name={icon} size={18} color="#2B5EA8" />
      </View>
      <Text className="flex-1 font-inter text-[13px] text-muted">{label}</Text>
      {typeof value === "string" ? (
        <Text
          numberOfLines={multiline ? undefined : 1}
          className="max-w-[55%] text-right font-inter-semibold text-[15px] text-ink"
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}
