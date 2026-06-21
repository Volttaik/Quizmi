import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { useColors } from "@/hooks/useColors";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
}

export function StatsCard({ label, value, icon, color }: StatsCardProps) {
  const colors = useColors();
  const iconColor = color || colors.primary;

  return (
    <Card style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 12,
  },
});
