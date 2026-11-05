import SearchBar from "@/components/ui/SearchBar";
import Segmented from "@/components/ui/Segmented";
import Select from "@/components/ui/Select";
import FixedHeader from "@/components/ui/FixedHeader";
import { useOrganisation } from "@/organisation/OrganisationContext";
import { MONO } from "@/organisation/ui";
import { normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function Attribution() {
  const router = useRouter();
  const { records, update } = useOrganisation();

  const [guard, setGuard] = useState("sanctum");
  const [roleId, setRoleId] = useState("");
  const [query, setQuery] = useState("");

  const roles = records("roles")
    .filter((r) => r.guard === guard)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const role = roles.find((r) => r.id === roleId) ?? roles[0];

  const permissions = useMemo(
    () =>
      records("permissions")
        .filter((p) => p.guard === guard)
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [records, guard],
  );

  const selected = useMemo(
    () =>
      new Set(
        String(role?.permissionIds ?? "")
          .split(",")
          .filter(Boolean),
      ),
    [role],
  );

  const q = normalize(query);
  const visible = permissions.filter(
    (p) => !q || normalize(String(p.name)).includes(q),
  );

  const save = (ids: Set<string>) => {
    if (role)
      update("roles", role.id, { permissionIds: Array.from(ids).join(",") });
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    save(next);
  };

  const checkVisible = () =>
    save(new Set([...Array.from(selected), ...visible.map((p) => p.id)]));
  const uncheckVisible = () => {
    const next = new Set(selected);
    visible.forEach((p) => next.delete(p.id));
    save(next);
  };

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
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
            <Text className="font-inter-bold text-[22px] leading-7 text-ink">
              Permissions par rôle
            </Text>
            <Text className="font-inter text-[13px] text-muted">
              Gestion des permissions par rôle
            </Text>
          </View>
        </View>
      </FixedHeader>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[640px] gap-4 self-center px-5">
          {/* Guard + rôle */}
          <View>
            <Segmented
              label="Guard"
              value={guard}
              onChange={setGuard}
              options={[
                { value: "sanctum", label: "sanctum" },
                { value: "web", label: "web" },
              ]}
            />
            <Select
              label="Rôle"
              icon="shield-checkmark-outline"
              placeholder="Aucun rôle pour ce guard"
              value={role?.id ?? ""}
              options={roles.map((r) => ({
                value: r.id,
                label: String(r.name),
              }))}
              onChange={setRoleId}
              containerClassName="mb-0"
            />
          </View>

          {role ? (
            <>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une permission…"
              />

              {/* Compteur + actions groupées */}
              <View className="flex-row items-center justify-between gap-3">
                <Text className="font-inter-semibold text-[13px] text-ink">
                  {selected.size} / {permissions.length} permissions
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={checkVisible}
                    className="rounded-xl bg-soft px-3 py-2 active:opacity-80"
                  >
                    <Text className="font-inter-semibold text-xs text-primary">
                      Tout cocher
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={uncheckVisible}
                    className="rounded-xl bg-soft px-3 py-2 active:opacity-80"
                  >
                    <Text className="font-inter-semibold text-xs text-primary">
                      Tout décocher
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Les permissions */}
              <View className="gap-2">
                {visible.map((p) => {
                  const on = selected.has(p.id);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => toggle(p.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      className="flex-row items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 active:opacity-80"
                    >
                      <View
                        className={`h-5 w-5 items-center justify-center rounded border-2 ${
                          on
                            ? "border-primary bg-primary"
                            : "border-[#9AA7B8] bg-white"
                        }`}
                      >
                        {on && (
                          <Ionicons
                            name="checkmark"
                            size={13}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <Text
                        style={{ fontFamily: MONO }}
                        className="flex-1 text-[13px] text-ink"
                      >
                        {String(p.name)}
                      </Text>
                    </Pressable>
                  );
                })}

                {visible.length === 0 && (
                  <View className="items-center rounded-3xl bg-white py-10">
                    <Text className="font-inter text-[14px] text-muted">
                      Aucune permission trouvée.
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View className="items-center rounded-3xl bg-white py-12">
              <Text className="font-inter text-[14px] text-muted">
                Aucun rôle pour ce guard.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
