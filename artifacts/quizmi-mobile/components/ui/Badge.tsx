import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "outline";
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  const colors = useColors();

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return { bg: "#dcfce7", text: "#166534" };
      case "warning":
        return { bg: "#fef9c3", text: "#854d0e" };
      case "error":
        return { bg: "#fee2e2", text: "#991b1b" };
      case "outline":
        return { bg: "transparent", text: colors.mutedForeground, border: colors.border };
      default:
        return { bg: colors.secondary, text: colors.secondaryForeground };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.badge, 
      { backgroundColor: variantStyles.bg, borderColor: variantStyles.border || "transparent" },
      variantStyles.border ? { borderWidth: 1 } : {}
    ]}>
      <Text style={[styles.text, { color: variantStyles.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
