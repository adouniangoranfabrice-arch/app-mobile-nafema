/** @type {import('tailwindcss').Config} */
module.exports = {
  // Sur le web, NativeWind plante au chargement en développement avec le mode "media" par défaut
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2B5EA8",
        accent: "#FFE600",
        ink: "#1B2A41",
        muted: "#6B7A90",
        canvas: "#E5EAEB",
        field: "#F6F8FA",
        line: "#DDE3EA",
        page: "#F0F4FA",
        soft: "#E8F0FB",
      },
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
