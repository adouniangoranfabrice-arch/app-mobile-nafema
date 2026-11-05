import Button from "@/components/ui/Button";
import ScreenPlaceholder from "@/components/ui/ScreenPlaceholder";
import { useLogout } from "@/hooks/use-logout";
import { View } from "react-native";

export default function Profil() {
  const signOut = useLogout();
  return (
    <ScreenPlaceholder title="Profil">
      <View className="mt-8 w-full max-w-[320px] ">
        <Button title="Se déconnecter" onPress={signOut} />
      </View>
    </ScreenPlaceholder>
  );
}
