import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  isUnlocked: boolean;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.badge, 
          { 
            backgroundColor: achievement.isUnlocked ? colors.secondary : colors.muted,
            borderColor: achievement.isUnlocked ? colors.primary : colors.border,
          }
        ]}
      >
        <Feather 
          name={achievement.isUnlocked ? achievement.icon : "lock"} 
          size={32} 
          color={achievement.isUnlocked ? colors.primary : colors.mutedForeground} 
        />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
        {achievement.title}
      </Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
        {achievement.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "33.33%",
    padding: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    textAlign: "center",
  },
});
