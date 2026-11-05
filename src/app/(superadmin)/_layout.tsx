import { AcademicProvider } from "@/context/AcademicContext";
import { DrenasProvider } from "@/context/DrenasContext";
import { PedagogyProviders } from "@/context/PedagogyProviders";
import { StudentsProvider } from "@/context/StudentsContext";
import { OrganisationProvider } from "@/organisation/OrganisationContext";
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

export default function PlatformLayout() {
  return (
    <AcademicProvider>
      <StudentsProvider>
        <DrenasProvider>
          <OrganisationProvider>
            <PedagogyProviders>
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#2B5EA8",
                tabBarInactiveTintColor: "#6B7A90",
                tabBarActiveBackgroundColor: "#E8F0FB",
                tabBarLabelStyle: {
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 10,
                },
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
                name="ecoles"
                options={{
                  title: "Écoles",
                  tabBarIcon: icon("business-outline", "business"),
                }}
              />
              <Tabs.Screen
                name="eleves"
                options={{
                  title: "Élèves",
                  tabBarIcon: icon("school-outline", "school"),
                }}
              />
              {/* <Tabs.Screen
                name="utilisateurs"
                options={{
                  title: "Utilisateurs",
                  tabBarIcon: icon("people-outline", "people"),
                }}
              /> */}
              <Tabs.Screen
                name="gestion"
                options={{
                  title: "Gestion",
                  tabBarIcon: icon("menu-outline", "menu"),
                }}
              />
            </Tabs>
            </PedagogyProviders>
          </OrganisationProvider>
        </DrenasProvider>
      </StudentsProvider>
    </AcademicProvider>
  );
}
