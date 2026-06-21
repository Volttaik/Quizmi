import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={colors.mutedForeground} />
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
