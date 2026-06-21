import React, { useEffect, useState } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  RefreshControl, 
  Image,
  Pressable 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppData } from "@/hooks/useAppData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/StatsCard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { profile, recentActivity } = useAppData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={[colors.primary, "#6d28d9"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, {profile.name}!</Text>
            <Text style={styles.subtitle}>Ready to study today?</Text>
          </View>
          <View style={styles.creditsChip}>
            <Feather name="zap" size={14} color="#fbbf24" />
            <Text style={styles.creditsText}>{profile.credits} Credits</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.streakContainer}>
          <Card style={styles.streakCard}>
            <View style={styles.streakIcon}>
              <Feather name="zap" size={24} color="#f97316" />
            </View>
            <View>
              <Text style={[styles.streakValue, { color: colors.foreground }]}>{profile.streak} Day Streak</Text>
              <Text style={[styles.streakLabel, { color: colors.mutedForeground }]}>Keep it up!</Text>
            </View>
          </Card>
        </View>

        <View style={styles.actions}>
          <Pressable 
            style={[styles.actionCard, { backgroundColor: colors.secondary }]}
            onPress={() => router.push("/quizzes")}
          >
            <Feather name="book-open" size={24} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.secondaryForeground }]}>Generate Quiz</Text>
          </Pressable>
          <Pressable 
            style={[styles.actionCard, { backgroundColor: colors.secondary }]}
            onPress={() => router.push("/flashcards")}
          >
            <Feather name="layers" size={24} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.secondaryForeground }]}>Flashcards</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stats</Text>
          <View style={styles.statsGrid}>
            <StatsCard label="Quizzes" value={profile.totalQuizzes} icon="check-circle" />
            <StatsCard label="Credits" value={profile.credits} icon="zap" color="#fbbf24" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
          </View>
          {recentActivity.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={{ color: colors.mutedForeground, textAlign: "center" }}>
                No recent activity. Start your first quiz!
              </Text>
            </Card>
          ) : (
            recentActivity.map((attempt, index) => (
              <Card key={index} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Feather name="award" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityTitle, { color: colors.foreground }]}>
                    Quiz Completed
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.activityScore, { color: colors.primary }]}>
                  {attempt.score}/{attempt.total}
                </Text>
              </Card>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  creditsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  creditsText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  streakContainer: {
    marginBottom: 24,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  streakValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  streakLabel: {
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  emptyCard: {
    padding: 32,
    alignItems: "center",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  activityDate: {
    fontSize: 12,
  },
  activityScore: {
    fontSize: 16,
    fontWeight: "700",
  },
});
