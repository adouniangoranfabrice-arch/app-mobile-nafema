import { Text } from "react-native";

/** Sous une liste paginée : rappelle qu'il en reste à voir */
export default function PagedHint({
  shown,
  total,
}: {
  shown: number;
  total: number;
}) {
  if (shown >= total) return null;
  return (
    <Text className="text-center font-inter text-xs text-muted">
      {shown} sur {total} · fais défiler pour voir la suite
    </Text>
  );
}
