import { Annee } from "@/api/annees";
import { Cycle } from "@/api/cycles";
import { Periode } from "@/api/periodes";
import { Drena, Iepp } from "@/data/drenas";
import { Student, fullName } from "@/data/students";
import { Alert } from "react-native";

export function confirmDeleteYear(annee: Annee, onConfirm: () => void) {
  Alert.alert(
    "Supprimer cette année scolaire ?",
    `${annee.name} · ${annee.etab_name}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}

export function confirmDeleteStudent(student: Student, onConfirm: () => void) {
  Alert.alert(
    "Supprimer cet élève ?",
    `${fullName(student)} · ${student.school}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}

export function confirmDeletePeriode(
  periode: Pick<Periode, "name" | "cycle_name" | "is_locked">,
  onConfirm: () => void,
) {
  // Une période verrouillée ne peut pas être supprimée
  if (periode.is_locked) {
    Alert.alert(
      "Période verrouillée",
      "Déverrouille cette période (en la modifiant) avant de pouvoir la supprimer.",
    );
    return;
  }

  Alert.alert(
    "Supprimer cette période ?",
    `${periode.name} · ${periode.cycle_name}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}

export function confirmDeleteCycle(cycle: Cycle, onConfirm: () => void) {
  Alert.alert(
    "Supprimer ce cycle ?",
    `${cycle.abbreviation} · ${cycle.name}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}

export function confirmDeleteDrena(drena: Drena, onConfirm: () => void) {
  Alert.alert(
    "Supprimer cette DRENA ?",
    `${drena.slug} · ${drena.name}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}

export function confirmDeleteIepp(iepp: Iepp, onConfirm: () => void) {
  Alert.alert(
    "Supprimer cette IEPP ?",
    `${iepp.code ? `${iepp.code} · ` : ""}${iepp.name}\n\nCette action est irréversible.`,
    [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ],
  );
}
