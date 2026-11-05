import {
  getUtilisateurs,
  openUtilisateur,
  Utilisateur,
  utilisateurKey,
  utilisateurRoles,
} from "@/api/utilisateurs";
import FixedHeader from "@/components/ui/FixedHeader";
import PageBar from "@/components/ui/PageBar";
import SearchBar from "@/components/ui/SearchBar";
import { useGestion } from "@/hooks/use-gestion";
import { Badge, IconButton } from "@/organisation/ui";
import { initials, normalize } from "@/utils/text";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

const PAGE_SIZE = 20;

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Utilisateurs() {
  const router = useRouter();
  const { href } = useGestion();
  const listRef = useRef<FlatList<Utilisateur>>(null);
  const lastRequest = useRef(0);

  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [status, setStatus] = useState<
    "loading" | "refreshing" | "idle" | "failed"
  >("loading");
  const [query, setQuery] = useState("");
  const [requestedPage, setRequestedPage] = useState(1);

  const load = useCallback(async (next: "loading" | "refreshing") => {
    const request = ++lastRequest.current;
    setStatus(next);
    try {
      const all = await getUtilisateurs();
      if (request !== lastRequest.current) return; // une requête plus récente a pris le relais
      setUsers(all);
      setStatus("idle");
    } catch {
      if (request === lastRequest.current) setStatus("failed");
    }
  }, []);

  useEffect(() => {
    load("loading");
    return () => {
      lastRequest.current++; // écran quitté : la réponse en cours est ignorée
    };
  }, [load]);

  const openDetail = (u: Utilisateur) => {
    openUtilisateur(u);
    router.push(href("utilisateur-detail"));
  };

  // Recherche par nom, téléphone ou établissement (sans tenir compte des accents)
  const q = normalize(query);
  const visible = users.filter(
    (u) =>
      !q ||
      normalize(
        `${u.full_name} ${u.phone ?? ""} ${u.etablissement?.name ?? ""}`,
      ).includes(q),
  );

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount); // la liste a pu raccourcir
  const shown = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Chaque page s'ouvre en haut de la liste
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [page]);

  const loading = status === "loading";
  const failed = status === "failed";

  const summary = loading
    ? "Chargement…"
    : `${visible.length} utilisateur${plural(visible.length)}`;

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="dark" />

      <FixedHeader>
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
              Utilisateurs
            </Text>
            <Text className="font-inter text-[13px] text-muted">{summary}</Text>
          </View>
        </View>

        <SearchBar
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setRequestedPage(1);
          }}
          placeholder="Rechercher un nom, un téléphone, une école"
        />
      </FixedHeader>

      <FlatList
        ref={listRef}
        className="flex-1"
        data={shown}
        keyExtractor={utilisateurKey}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshing={status === "refreshing"}
        onRefresh={() => load("refreshing")}
        renderItem={({ item }) => {
          const roles = utilisateurRoles(item);
          return (
            <View className="w-full max-w-[640px] self-center px-5 pb-3">
              <View className="flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-soft">
                  <Text className="font-inter-bold text-[14px] text-primary">
                    {initials(item.full_name)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => openDetail(item)}
                  accessibilityRole="button"
                  accessibilityLabel={item.full_name}
                  className="flex-1 active:opacity-70"
                >
                  <Text
                    numberOfLines={2}
                    className="font-inter-semibold text-[15px] text-ink"
                  >
                    {item.full_name}
                  </Text>
                  <Text className="mt-0.5 font-inter text-xs text-muted">
                    {item.phone ?? "Sans téléphone"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 font-inter-semibold text-xs text-primary"
                  >
                    {item.etablissement?.name ?? "Aucun établissement"}
                  </Text>
                  {roles.length > 0 && (
                    <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                      {roles.map((role) => (
                        <Badge key={role} label={role} tone="blue" />
                      ))}
                    </View>
                  )}
                </Pressable>

                <IconButton
                  icon="eye-outline"
                  color="#1B2A41"
                  label="Voir"
                  onPress={() => openDetail(item)}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading || failed ? undefined : (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center rounded-3xl bg-white py-12">
                <Text className="font-inter text-[14px] text-muted">
                  Aucun utilisateur trouvé.
                </Text>
              </View>
            </View>
          )
        }
        ListFooterComponent={
          failed ? (
            <View className="w-full max-w-[640px] self-center px-5">
              <View className="items-center gap-3 rounded-3xl bg-white py-8">
                <Ionicons
                  name="cloud-offline-outline"
                  size={28}
                  color="#9AA7B8"
                />
                <Text className="text-center font-inter-semibold text-[15px] text-ink">
                  Impossible de charger les utilisateurs
                </Text>
                <Pressable
                  onPress={() => load("loading")}
                  className="active:opacity-70"
                >
                  <Text className="font-inter-semibold text-[14px] text-primary">
                    Réessayer
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : loading ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#2B5EA8" />
            </View>
          ) : undefined
        }
      />

      <PageBar
        page={page}
        pageCount={pageCount}
        hasPrevious={page > 1}
        hasNext={page < pageCount}
        onPrevious={() => setRequestedPage(page - 1)}
        onNext={() => setRequestedPage(page + 1)}
      />
    </View>
  );
}
