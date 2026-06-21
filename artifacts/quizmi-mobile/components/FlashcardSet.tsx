import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { useColors } from "@/hooks/useColors";

export interface FlashcardSet {
  id: string;
  title: string;
  cardCount: number;
  lastStudied?: string;
}

interface FlashcardSetProps {
  set: FlashcardSet;
  onPress: () => void;
}

export function FlashcardSetCard({ set, onPress }: FlashcardSetProps) {
  const colors = useColors();

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
          <Feather name="layers" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {set.title}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {set.cardCount} cards
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    marginBottom: 16,
  },
  card: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
  },
});
