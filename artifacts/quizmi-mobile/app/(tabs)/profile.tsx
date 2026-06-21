import React from "react";
import { ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAppData } from "@/hooks/useAppData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/StatsCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAppData();

  const handleClearData = async () => {
    await AsyncStorage.clear();
    // In a real app we'd reload or reset state
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {profile.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>Student Plan</Text>
      </View>

      <View style={styles.statsRow}>
        <StatsCard label="Streak" value={profile.streak} icon="zap" />
        <StatsCard label="Quizzes" value={profile.totalQuizzes} icon="check-circle" />
        <StatsCard label="Credits" value={profile.credits} icon="award" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rewards</Text>
        <Card style={styles.menuItem}>
          <Pressable 
            style={styles.menuItemContent}
            onPress={() => router.push("/leaderboard")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#fef3c7" }]}>
              <Feather name="bar-chart-2" size={20} color="#d97706" />
            </View>
            <Text style={[styles.menuText, { color: colors.foreground }]}>Leaderboard</Text>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        </Card>
        <Card style={styles.menuItem}>
          <Pressable 
            style={styles.menuItemContent}
            onPress={() => router.push("/achievements")}
          >
            <View style={[styles.menuIcon, { backgroundColor: "#dcfce7" }]}>
              <Feather name="award" size={20} color="#16a34a" />
            </View>
            <Text style={[styles.menuText, { color: colors.foreground }]}>Achievements</Text>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>
        <Card style={styles.menuItem}>
          <View style={styles.menuItemContent}>
            <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
              <Feather name="user" size={20} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.menuText, { color: colors.foreground }]}>Edit Profile</Text>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </View>
        </Card>
        <Button 
          variant="ghost" 
          onPress={handleClearData}
          title="Clear All Data"
          style={styles.clearButton}
          textStyle={{ color: colors.destructive }}
        />
      </View>
    </ScrollView>
  );
}

import { Pressable } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#ffffff",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  menuItem: {
    padding: 0,
    marginBottom: 12,
    overflow: "hidden",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  clearButton: {
    marginTop: 8,
  },
});
