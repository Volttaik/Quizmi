import React from "react";
import { StyleSheet, View, Text, FlatList } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const data = [
    { id: "1", name: "Alice", score: 1250 },
    { id: "2", name: "Bob", score: 1100 },
    { id: "3", name: "Charlie", score: 950 },
    { id: "4", name: "You", score: 800, isMe: true },
    { id: "5", name: "Dave", score: 700 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20 }}
        renderItem={({ item, index }) => (
          <Card style={[
            styles.item, 
            item.isMe ? { borderColor: colors.primary, borderWidth: 2 } : {}
          ]}>
            <Text style={[styles.rank, { color: colors.mutedForeground }]}>#{index + 1}</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.score, { color: colors.primary }]}>{item.score} pts</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  rank: {
    fontSize: 18,
    fontWeight: "700",
    width: 40,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
  },
});
