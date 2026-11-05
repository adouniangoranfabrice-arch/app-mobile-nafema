import { useAcademic } from "@/context/AcademicContext";
import { useDrenas } from "@/context/DrenasContext";
import { useStudents } from "@/context/StudentsContext";
import { AcademicYear } from "@/data/academic";
import { teacherLabel, TEACHERS } from "@/data/teachers";
import { ALL_KEYS, ENTITIES } from "@/organisation/entities";
import {
    Ctx,
    EntityKey,
    Option,
    OrgRecord,
    RefSource,
    Value,
} from "@/organisation/types";
import { yearLabel } from "@/utils/dates";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

type Store = Record<EntityKey, OrgRecord[]>;
type Values = Record<string, Value>;

type OrganisationContextValue = Ctx & {
  records: (entity: EntityKey) => OrgRecord[];
  add: (entity: EntityKey, values: Values) => void;
  /** Fusionne les valeurs avec celles de l'élément existant */
  update: (entity: EntityKey, id: string, values: Values) => void;
  remove: (entity: EntityKey, id: string) => void;
  options: (source: RefSource) => Option[];
  /** Rubriques qui utilisent encore cet élément (pour bloquer la suppression) */
  usage: (entity: EntityKey, id: string) => { title: string; count: number }[];
};

const OrganisationContext = createContext<OrganisationContextValue | null>(
  null,
);

const initialStore = (): Store =>
  Object.fromEntries(ALL_KEYS.map((k) => [k, ENTITIES[k].seed])) as Store;

const byLabel = (a: Option, b: Option) =>
  a.label.localeCompare(b.label, "fr", { numeric: true });

const yearOptionLabel = (y: AcademicYear) =>
  `${yearLabel(y.start, y.end)} · ${y.school}`;

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const { drenas, iepps } = useDrenas();
  const { years } = useAcademic();
  const { students } = useStudents();
  const [store, setStore] = useState<Store>(initialStore);

  const value = useMemo<OrganisationContextValue>(() => {
    /** Nom affiché d'un élément lié */
    function refLabel(source: RefSource, id: string): string {
      if (!id) return "—";
      if (source === "drenas")
        return drenas.find((d) => d.public_key === id)?.name ?? "—";
      if (source === "iepps")
        return iepps.find((i) => i.public_key === id)?.name ?? "—";
      if (source === "annees") {
        const y = years.find((x) => x.id === id);
        return y ? yearOptionLabel(y) : "—";
      }
      if (source === "enseignants") {
        const t = TEACHERS.find((x) => x.id === id);
        return t ? teacherLabel(t) : "—";
      }
      const record = store[source].find((r) => r.id === id);
      if (!record) return "—";
      const config = ENTITIES[source];
      return config.optionLabel
        ? config.optionLabel(record, { refLabel })
        : config.label(record);
    }

    /** Choix proposés dans une liste déroulante */
    function options(source: RefSource): Option[] {
      if (source === "drenas")
        return drenas
          .map((d) => ({ value: d.public_key, label: d.name }))
          .sort(byLabel);
      if (source === "iepps")
        return iepps
          .map((i) => ({ value: i.public_key, label: i.name }))
          .sort(byLabel);
      if (source === "annees") {
        return [...years]
          .sort((a, b) => b.start.getTime() - a.start.getTime())
          .map((y) => ({ value: y.id, label: yearOptionLabel(y) }));
      }
      if (source === "enseignants")
        return TEACHERS.map((t) => ({
          value: t.id,
          label: teacherLabel(t),
        })).sort(byLabel);

      const config = ENTITIES[source];
      return store[source]
        .map((r) => ({
          value: r.id,
          label: config.optionLabel
            ? config.optionLabel(r, { refLabel })
            : config.label(r),
        }))
        .sort(byLabel);
    }

    function usage(entity: EntityKey, id: string) {
      const found: { title: string; count: number }[] = [];
      for (const key of ALL_KEYS) {
        const refFields = ENTITIES[key].fields.filter(
          (f) => f.type === "ref" && f.ref === entity,
        );
        if (refFields.length === 0) continue;
        const count = store[key].filter((r) =>
          refFields.some((f) => r[f.key] === id),
        ).length;
        if (count > 0) found.push({ title: ENTITIES[key].title, count });
      }
      // Les élèves ne font pas partie de ces rubriques, mais une classe peut en contenir
      if (entity === "classes") {
        const count = students.filter((s) => s.classe_id === id).length;
        if (count > 0) found.push({ title: "Élèves", count });
      }
      return found;
    }

    return {
      records: (entity) => store[entity],
      add: (entity, values) => {
        const id = `${entity}-${Date.now()}`;
        const record = {
          ...ENTITIES[entity].defaults,
          ...values,
          id,
          // L'API nomme cette clé pubkey ou public_key selon la rubrique
          pubkey: id,
          public_key: id,
        } as OrgRecord;
        setStore((prev) => ({ ...prev, [entity]: [record, ...prev[entity]] }));
      },
      update: (entity, id, values) => {
        setStore((prev) => ({
          ...prev,
          [entity]: prev[entity].map((r) =>
            r.id === id ? ({ ...r, ...values, id } as OrgRecord) : r,
          ),
        }));
      },
      remove: (entity, id) => {
        setStore((prev) => {
          const next: Store = {
            ...prev,
            [entity]: prev[entity].filter((r) => r.id !== id),
          };
          // Supprimer une permission la retire aussi des rôles
          if (entity === "permissions") {
            next.roles = prev.roles.map((r) => ({
              ...r,
              permissionIds: String(r.permissionIds ?? "")
                .split(",")
                .filter((p) => p && p !== id)
                .join(","),
            }));
          }
          return next;
        });
      },
      refLabel,
      options,
      usage,
    };
  }, [store, drenas, iepps, years, students]);

  return (
    <OrganisationContext.Provider value={value}>
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation() {
  const ctx = useContext(OrganisationContext);
  if (!ctx)
    throw new Error(
      "useOrganisation doit être utilisé dans un OrganisationProvider",
    );
  return ctx;
}
