import {
  hasRole,
  login,
  loginErrorMessage,
  showLoginError,
  UserRole,
} from "@/api/auth";
import { clearToken } from "@/api/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { MotionView } from "@/components/ui/MotionView";
import { showToast } from "@/components/ui/Toast";
import { getDeviceInfo } from "@/utils/device";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// L'espace ouvert selon les rôles renvoyés par l'API : le premier rôle actif de la liste l'emporte
const HOME_BY_ROLE: [UserRole, Href][] = [
  ["super_admin", "/(superadmin)/home"],
  ["admin", "/(adminschool)/home"],
  ["enseignant", "/(teacher)/home"],
];

export default function Login() {
  const [identifiant, setIdentifiant] = useState("");
  const [mot_de_passe, setMot_de_passe] = useState("");
  const router = useRouter();

  const [errors, setErrors] = useState<{
    identifiant?: string;
    mot_de_passe?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: { identifiant?: string; mot_de_passe?: string } = {};
    const mail = identifiant.trim();

    if (!mail) {
      next.identifiant = "Veuillez saisir votre adresse e-mail";
    } else if (!/^\S+@\S+\.\S+$/.test(mail)) {
      next.identifiant = "Adresse e-mail invalide";
    }

    if (!mot_de_passe) {
      next.mot_de_passe = "Veuillez saisir votre mot de passe";
    } else if (mot_de_passe.length < 6) {
      next.mot_de_passe = "6 caractères minimum";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!validate()) {
      showToast("Veuillez corriger les champs en rouge.", "error");
      return;
    }
    try {
      setLoading(true);

      const user = await login(
        identifiant.trim(),
        mot_de_passe,
        getDeviceInfo(),
      );

      const home = HOME_BY_ROLE.find(([role]) => hasRole(user, role))?.[1];
      if (home) {
        router.replace(home);
      } else {
        await clearToken(); // pas de session ouverte sans espace à afficher
        showToast("Aucun espace n'est disponible pour ce compte.", "error");
      }
    } catch (error) {
      showLoginError(error);
      showToast(loginErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* En-tête avec logo */}
        <View className="h-[220px] items-center justify-end pb-6">
          <MotionView>
            <Image
              source={require("@/assets/images/logo_nefama.png")}
              className="h-[130px] w-[110px]"
              resizeMode="contain"
            />
          </MotionView>
        </View>

        {/* Carte blanche */}
        <MotionView index={1} style={{ flex: 1 }}>
          <View className="flex-1 rounded-t-[40px] bg-white p-7">
            <View className="mb-3.5 h-1 w-8 bg-accent" />
            <Text className="font-inter-bold text-[24px] text-ink">
              Heureux de vous revoir
            </Text>
            <Text className="mb-6 mt-2 font-inter text-muted">
              Connectez-vous pour retrouver votre espace NAFEMA.
            </Text>

            <Input
              label="Adresse e-mail"
              icon="mail-outline"
              placeholder="vous@exemple.fr"
              value={identifiant}
              onChangeText={(text) => {
                setIdentifiant(text);
                if (errors.identifiant)
                  setErrors((e) => ({ ...e, identifiant: undefined }));
              }}
              error={errors.identifiant}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Mot de passe"
              icon="lock-closed-outline"
              placeholder="••••••••"
              value={mot_de_passe}
              onChangeText={(text) => {
                setMot_de_passe(text);
                if (errors.mot_de_passe)
                  setErrors((e) => ({ ...e, mot_de_passe: undefined }));
              }}
              error={errors.mot_de_passe}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable className="mb-5 self-end">
              <Text className="font-inter-semibold text-[13px] text-primary">
                Mot de passe oublié ?
              </Text>
            </Pressable>

            {/* <Button
              onPress={() => router.replace("/(app)/home")}
              title="Se connecter"
            /> */}

            <Button
              title={loading ? "Connexion…" : "Se connecter"}
              onPress={handleLogin}
            />

            {/* <Text className="mb-1.5 mt-7 text-center font-inter text-muted">
              Vous n'avez pas encore de compte ?
            </Text>

            <Text className="text-center font-inter-semibold text-[13px] text-primary">
              Créer un compte
            </Text> */}
          </View>
        </MotionView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
