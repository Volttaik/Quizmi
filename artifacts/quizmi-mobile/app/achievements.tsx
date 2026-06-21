import React from "react";
import { StyleSheet, View, FlatList, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { AchievementBadge } from "@/components/AchievementBadge";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const achievements = [
    { id: "1", title: "First Quiz", description: "Complete your first quiz", icon: "check-circle" as const, isUnlocked: true },
    { id: "2", title: "7 Day Streak", description: "Study for 7 days in a row", icon: "zap" as const, isUnlocked: false },
    { id: "3", title: "Knowledge Seeker", description: "Take 10 quizzes", icon: "book" as const, isUnlocked: true },
    { id: "4", title: "Top 10", description: "Reach top 10 in leaderboard", icon: "award" as const, isUnlocked: false },
    { id: "5", title: "Perfect Score", description: "Get 100% on a quiz", icon: "star" as const, isUnlocked: true },
    { id: "6", title: "Flashcard Pro", description: "Study 100 flashcards", icon: "layers" as const, isUnlocked: false },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={achievements}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingTop: insets.top + 20 }}
        renderItem={({ item }) => (
          <AchievementBadge achievement={item} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
