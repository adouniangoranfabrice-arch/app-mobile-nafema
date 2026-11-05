import { Stagger } from "@/components/ui/MotionView";
import { useTeacherClasses } from "@/hooks/use-teacher-classes";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const plural = (n: number) => (n > 1 ? "s" : "");

export default function Classes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const classes = useTeacherClasses();

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
              Mes classes
            </Text>
            <Text className="mt-1 font-inter text-[13px] text-muted">
              {classes.length} classe{plural(classes.length)} · touche une
              classe pour voir ses élèves
            </Text>
          </View>

          {classes.length === 0 ? (
            <View className="items-center gap-2 rounded-3xl bg-white py-12">
              <Ionicons name="people-outline" size={28} color="#9AA7B8" />
              <Text className="font-inter-semibold text-[15px] text-ink">
                Aucune classe pour le moment
              </Text>
            </View>
          ) : (
            <Stagger>
              {classes.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(teacher)/classes/eleves",
                      params: { classe: c.id },
                    } as Href)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${c.name}, ${c.students} élève${plural(c.students)}`}
                  className="flex-row items-center gap-3.5 rounded-3xl bg-white p-4 shadow-sm active:opacity-80"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <Ionicons name="people-outline" size={24} color="#FFE600" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-inter-bold text-[17px] text-ink">
                      {c.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-inter-semibold text-xs text-primary"
                    >
                      {c.students} élève{plural(c.students)} · {c.level}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="font-inter text-xs text-muted"
                    >
                      {c.year}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6B7A90" />
                </Pressable>
              ))}
            </Stagger>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
