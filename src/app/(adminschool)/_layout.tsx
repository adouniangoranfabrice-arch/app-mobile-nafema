import { GestionProviders } from "@/context/GestionProviders";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ColorValue } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

const icon =
  (outline: IconName, filled: IconName) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons
      name={focused ? filled : outline}
      size={22}
      color={color as string}
    />
  );

export default function AdminLayout() {
  return (
    <GestionProviders>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2B5EA8",
          tabBarInactiveTintColor: "#6B7A90",
          tabBarActiveBackgroundColor: "#E8F0FB",
          tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
          tabBarItemStyle: {
            borderRadius: 16,
            marginHorizontal: 4,
            marginVertical: 6,
            bottom: 5,
          },
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#E5EAF0",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Accueil",
            tabBarIcon: icon("home-outline", "home"),
          }}
        />
        <Tabs.Screen
          name="effectifs"
          options={{
            title: "Effectifs",
            tabBarIcon: icon("people-outline", "people"),
          }}
        />
        <Tabs.Screen
          name="classes"
          options={{
            title: "Classes",
            tabBarIcon: icon("business-outline", "business"),
          }}
        />
        <Tabs.Screen
          name="gestion"
          options={{
            title: "Gestion",
            tabBarIcon: icon("settings-outline", "settings"),
          }}
        />
      </Tabs>
    </GestionProviders>
  );
}
