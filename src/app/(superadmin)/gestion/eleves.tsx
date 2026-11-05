import AddStudentModal from "@/components/gestion/AddStudentModal";
import ActionButton from "@/components/ui/ActionButton";
import FilterChips from "@/components/ui/FilterChips";
import PagedHint from "@/components/ui/PagedHint";
import SearchBar from "@/components/ui/SearchBar";
import { useStudents } from "@/context/StudentsContext";
import { Student, fullName } from "@/data/students";
import { useGestion } from "@/hooks/use-gestion";
import { usePaged } from "@/hooks/use-paged";
import { confirmDeleteStudent } from "@/utils/confirm";
import { ageOf } from "@/utils/dates";
import { initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Eleves() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { students, addStudent, updateStudent, deleteStudent } = useStudents();
  const { canEdit, href } = useGestion();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  const activeCount = students.filter((s) => s.active).length;

  // Recherche par nom, matricule, établissement, matricule national ou téléphone
  const visible = useMemo(() => {
    const q = normalize(query);
    return [...students]
      .sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstNames.localeCompare(b.firstNames),
      )
      .filter((s) => {
        if (filter === "active" && !s.active) return false;
        if (filter === "inactive" && s.active) return false;
        if (!q) return true;
        const haystack = normalize(
          `${s.lastName} ${s.firstNames} ${s.matricule} ${s.school} ${s.nationalId} ${s.phone}`,
        );
        return haystack.includes(q);
      });
  }, [students, query, filter]);

  const { shown, scrollProps } = usePaged(visible, `${query}|${filter}`);

  const plural = (n: number) => (n > 1 ? "s" : "");

  const openDetail = (id: string) => router.push(href("eleves-detail", { id }));

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
  };

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* En-tête avec retour */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm active:opacity-80"
            >
              <Ionicons name="chevron-back" size={22} color="#2B5EA8" />
            </Pressable>
            <View className="flex-1">
              <Text className="font-inter-bold text-[20px] leading-8 text-ink">
                Élèves
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                {students.length} enregistré{plural(students.length)} ·{" "}
                {activeCount} actif
                {plural(activeCount)}
              </Text>
            </View>
          </View>

          {/* Recherche + filtres */}
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un élève, un matricule, une école"
          />
          <FilterChips
            selected={filter}
            onSelect={setFilter}
            chips={[
              { key: "all", label: "Tous", count: students.length },
              { key: "active", label: "Actifs", count: activeCount },
              {
                key: "inactive",
                label: "Inactifs",
                count: students.length - activeCount,
              },
            ]}
          />

          {/* Bouton d'ajout */}
          {canEdit && (
            <Pressable
              onPress={() => setAdding(true)}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
            >
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              <Text className="font-inter-semibold text-base text-white">
                Nouvel élève
              </Text>
            </Pressable>
          )}

          <Text className="font-inter text-xs text-muted">
            {visible.length} résultat{plural(visible.length)}
          </Text>

          {/* Liste */}
          {visible.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="people-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Aucun élève trouvé
              </Text>
              <Text className="font-inter text-[13px] text-muted">
                Essaie une autre recherche.
              </Text>
            </View>
          ) : (
            shown.map((s) => (
              <View
                key={s.id}
                className="gap-3 rounded-3xl bg-white p-4 shadow-sm"
              >
                {/* Un clic sur la partie haute ouvre le détail */}
                <Pressable
                  onPress={() => openDetail(s.id)}
                  className="flex-row items-center gap-3 active:opacity-80"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-soft">
                    <Text className="font-inter-bold text-[15px] text-primary">
                      {initials(`${s.firstNames} ${s.lastName}`)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-inter-bold text-[16px] text-ink"
                    >
                      {fullName(s)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-inter-semibold text-xs text-primary"
                    >
                      {s.matricule || "Sans matricule"} · {s.school}
                    </Text>
                    <Text className="font-inter text-xs text-muted">
                      {s.sex}
                      {s.birthDate ? ` · ${ageOf(s.birthDate)} ans` : ""}
                    </Text>
                  </View>
                  <View
                    className={`rounded-full px-3 py-1 ${s.active ? "bg-green-100" : "bg-slate-100"}`}
                  >
                    <Text
                      className={`font-inter-semibold text-xs ${s.active ? "text-green-700" : "text-muted"}`}
                    >
                      {s.active ? "Actif" : "Inactif"}
                    </Text>
                  </View>
                </Pressable>

                <View className="h-px bg-line" />

                {/* Voir / Modifier / Supprimer */}
                <View className="flex-row gap-2">
                  <ActionButton
                    icon="eye-outline"
                    label="Voir"
                    onPress={() => openDetail(s.id)}
                  />
                  {canEdit && (
                    <>
                      <ActionButton
                        icon="create-outline"
                        label="Modifier"
                        onPress={() => setEditing(s)}
                      />
                      <ActionButton
                        icon="trash-outline"
                        label="Supprimer"
                        variant="danger"
                        onPress={() =>
                          confirmDeleteStudent(s, () => deleteStudent(s.id))
                        }
                      />
                    </>
                  )}
                </View>
              </View>
            ))
          )}

          <PagedHint shown={shown.length} total={visible.length} />
        </View>
      </ScrollView>

      {/* Formulaire : ajout ou modification */}
      <AddStudentModal
        visible={adding || editing !== null}
        student={editing}
        existing={students}
        onClose={closeForm}
        onSave={(data) => {
          if (editing) updateStudent(editing.id, data);
          else addStudent(data);
          closeForm();
        }}
      />
    </View>
  );
}
