import Button from "@/components/ui/Button";
import CheckboxRow from "@/components/ui/CheckboxRow";
import DateField from "@/components/ui/DateField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { showFormError, ToastHost } from "@/components/ui/Toast";
import { useAcademic } from "@/context/AcademicContext";
import { SCHOOL_NAMES } from "@/data/academic";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { BLOOD_GROUPS, SEX_OPTIONS, Student, fullName } from "@/data/students";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    ScrollViewInstance,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  student?: Student | null; // si fourni : mode modification
  existing: Student[];
  onClose: () => void;
  onSave: (student: Omit<Student, "id">) => void;
};

export default function AddStudentModal({
  visible,
  student,
  existing,
  onClose,
  onSave,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {/* Monté seulement quand le modal est visible : formulaire réinitialisé à chaque ouverture */}
      {visible && (
        <StudentForm
          key={student?.id ?? "new"}
          student={student ?? null}
          existing={existing}
          onClose={onClose}
          onSave={onSave}
        />
      )}
      <ToastHost />
    </Modal>
  );
}

type Errors = Partial<
  Record<
    | "school"
    | "matricule"
    | "lastName"
    | "firstNames"
    | "sex"
    | "birthDate"
    | "phone",
    string
  >
>;

type FormProps = {
  student: Student | null;
  existing: Student[];
  onClose: () => void;
  onSave: (student: Omit<Student, "id">) => void;
};

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-2 font-inter-bold text-[12px] uppercase tracking-wider text-primary">
      {children}
    </Text>
  );
}

function StudentForm({ student, existing, onClose, onSave }: FormProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const isEdit = !!student;
  const { years } = useAcademic();
  const { records } = useOrganisation();

  const [school, setSchool] = useState(student?.school ?? "");
  const [classeId, setClasseId] = useState(student?.classe_id ?? "");
  const [matricule, setMatricule] = useState(student?.matricule ?? "");
  const [lastName, setLastName] = useState(student?.lastName ?? "");
  const [firstNames, setFirstNames] = useState(student?.firstNames ?? "");
  const [sex, setSex] = useState(student?.sex ?? "Masculin");
  const [birthDate, setBirthDate] = useState<Date | null>(
    student?.birthDate ?? null,
  );
  const [birthPlace, setBirthPlace] = useState(student?.birthPlace ?? "");
  const [nationality, setNationality] = useState(student?.nationality ?? "");
  const [nationalId, setNationalId] = useState(student?.nationalId ?? "");
  const [extractNumber, setExtractNumber] = useState(
    student?.extractNumber ?? "",
  );
  const [address, setAddress] = useState(student?.address ?? "");
  const [district, setDistrict] = useState(student?.district ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [bloodGroup, setBloodGroup] = useState(student?.bloodGroup ?? "");
  const [medicalNotes, setMedicalNotes] = useState(student?.medicalNotes ?? "");
  const [previousSchool, setPreviousSchool] = useState(
    student?.previousSchool ?? "",
  );
  const [photo, setPhoto] = useState(student?.photo ?? "");
  const [active, setActive] = useState(student ? student.active : true);
  const [errors, setErrors] = useState<Errors>({});

  const others = existing.filter((s) => s.id !== student?.id);
  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));
  const hasErrors = Object.values(errors).some(Boolean);

  // Seules les classes de l'école choisie sont proposées (école → année → classe)
  const schoolYears = years.filter((y) => y.school === school).map((y) => y.id);
  const classOptions = records("classes")
    .filter((c) => schoolYears.includes(String(c.annee)))
    .map((c) => ({ value: c.id, label: String(c.libelle) }));

  const submit = () => {
    const next: Errors = {};

    if (!school) next.school = "Choisis un établissement";
    if (!lastName.trim()) next.lastName = "Le nom est obligatoire";
    if (!firstNames.trim()) next.firstNames = "Les prénoms sont obligatoires";
    if (!sex) next.sex = "Choisis le sexe";

    const mat = matricule.trim().toLowerCase();
    if (mat && others.some((s) => s.matricule.trim().toLowerCase() === mat)) {
      next.matricule = "Ce matricule existe déjà";
    }

    if (birthDate && birthDate > new Date()) {
      next.birthDate = "La date de naissance ne peut pas être dans le futur";
    }

    if (phone.trim() && !/^[+0-9\s().-]{8,20}$/.test(phone.trim())) {
      next.phone = "Numéro de téléphone invalide";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      showFormError();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    onSave({
      school,
      classe_id: classeId,
      matricule: matricule.trim(),
      lastName: lastName.trim(),
      firstNames: firstNames.trim(),
      sex,
      birthDate,
      birthPlace: birthPlace.trim(),
      nationality: nationality.trim(),
      nationalId: nationalId.trim(),
      extractNumber: extractNumber.trim(),
      address: address.trim(),
      district: district.trim(),
      phone: phone.trim(),
      bloodGroup,
      medicalNotes: medicalNotes.trim(),
      previousSchool: previousSchool.trim(),
      photo: photo.trim(),
      active,
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* En-tête */}
      <View
        className="flex-row items-center justify-between gap-3 px-5 pb-3"
        style={{ paddingTop: Platform.OS === "android" ? insets.top + 12 : 20 }}
      >
        <View className="flex-1">
          <Text className="font-inter-bold text-xl text-ink">
            {isEdit ? "Modifier l'élève" : "Nouvel élève"}
          </Text>
          <Text numberOfLines={1} className="font-inter text-xs text-muted">
            {isEdit && student ? fullName(student) : "Crée un nouvel élève"}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-soft active:opacity-80"
        >
          <Ionicons name="close" size={20} color="#2B5EA8" />
        </Pressable>
      </View>

      {/* Champs */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {hasErrors && (
          <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-red-50 p-3">
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text className="flex-1 font-inter-semibold text-[13px] text-red-600">
              Corrige les champs en rouge avant d'enregistrer.
            </Text>
          </View>
        )}

        <SectionTitle>Identité</SectionTitle>

        <Select
          label="Établissement *"
          icon="business-outline"
          placeholder="Sélectionner un établissement"
          value={school}
          options={SCHOOL_NAMES.map((n: string) => ({ value: n, label: n }))}
          onChange={(v) => {
            if (v !== school) setClasseId(""); // une autre école n'a pas les mêmes classes
            setSchool(v);
            clear("school");
          }}
          error={errors.school}
        />

        <Select
          label="Classe"
          icon="people-outline"
          value={classeId}
          options={[{ value: "", label: "Aucune classe" }, ...classOptions]}
          onChange={setClasseId}
        />

        <Input
          label="Matricule"
          icon="id-card-outline"
          placeholder="Ex. ALM-2026-001"
          value={matricule}
          onChangeText={(t) => {
            setMatricule(t);
            clear("matricule");
          }}
          autoCapitalize="characters"
          error={errors.matricule}
        />

        <Input
          label="Nom *"
          icon="person-outline"
          placeholder="Nom de famille"
          value={lastName}
          onChangeText={(t) => {
            setLastName(t);
            clear("lastName");
          }}
          autoCapitalize="words"
          error={errors.lastName}
        />

        <Input
          label="Prénoms *"
          icon="person-outline"
          placeholder="Prénoms"
          value={firstNames}
          onChangeText={(t) => {
            setFirstNames(t);
            clear("firstNames");
          }}
          autoCapitalize="words"
          error={errors.firstNames}
        />

        <Select
          label="Sexe *"
          icon="male-female-outline"
          value={sex}
          options={SEX_OPTIONS.map((s) => ({ value: s, label: s }))}
          onChange={(v) => {
            setSex(v);
            clear("sex");
          }}
          error={errors.sex}
        />

        <SectionTitle>Naissance et origine</SectionTitle>

        <DateField
          label="Date de naissance"
          value={birthDate}
          defaultValue={new Date(new Date().getFullYear() - 12, 0, 1)}
          maximumDate={new Date()}
          onChange={(d) => {
            setBirthDate(d);
            clear("birthDate");
          }}
          error={errors.birthDate}
        />

        <Input
          label="Lieu de naissance"
          icon="location-outline"
          value={birthPlace}
          onChangeText={setBirthPlace}
          autoCapitalize="words"
        />

        <Input
          label="Nationalité"
          icon="flag-outline"
          value={nationality}
          onChangeText={setNationality}
          autoCapitalize="words"
        />

        <Input
          label="Matricule national"
          icon="finger-print-outline"
          value={nationalId}
          onChangeText={setNationalId}
          autoCapitalize="characters"
        />

        <Input
          label="Numéro extrait"
          icon="document-text-outline"
          value={extractNumber}
          onChangeText={setExtractNumber}
          autoCapitalize="characters"
        />

        <SectionTitle>Contact</SectionTitle>

        <Input
          label="Adresse"
          icon="home-outline"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label="Quartier"
          icon="map-outline"
          value={district}
          onChangeText={setDistrict}
          autoCapitalize="words"
        />

        <Input
          label="Téléphone"
          icon="call-outline"
          placeholder="+221 77 000 00 00"
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            clear("phone");
          }}
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <SectionTitle>Santé</SectionTitle>

        <Select
          label="Groupe sanguin"
          icon="water-outline"
          value={bloodGroup}
          options={[
            { value: "", label: "Non renseigné" },
            ...BLOOD_GROUPS.map((g) => ({ value: g, label: g })),
          ]}
          onChange={setBloodGroup}
        />

        <Input
          label="Observations médicales"
          icon="medkit-outline"
          placeholder="Allergies, traitements, remarques..."
          value={medicalNotes}
          onChangeText={setMedicalNotes}
          multiline
        />

        <SectionTitle>Autres informations</SectionTitle>

        <Input
          label="Établissement précédent"
          icon="school-outline"
          value={previousSchool}
          onChangeText={setPreviousSchool}
          autoCapitalize="words"
        />

        <Input
          label="Photo (chemin)"
          icon="image-outline"
          placeholder="Ex. photos/amadou.jpg"
          value={photo}
          onChangeText={setPhoto}
          autoCapitalize="none"
        />

        <CheckboxRow
          checked={active}
          onToggle={() => setActive((v) => !v)}
          title="Actif"
          description="Décoché : l'élève est inactif"
        />
      </ScrollView>

      {/* Annuler / Créer */}
      <View
        className="flex-row gap-3 border-t border-line px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          onPress={onClose}
          className="h-[54px] flex-1 items-center justify-center rounded-2xl border border-line bg-white active:opacity-80"
        >
          <Text className="font-inter-semibold text-base text-ink">
            Annuler
          </Text>
        </Pressable>
        <View className="flex-1">
          <Button title={isEdit ? "Enregistrer" : "Créer"} onPress={submit} />
        </View>
      </View>
    </View>
  );
}
