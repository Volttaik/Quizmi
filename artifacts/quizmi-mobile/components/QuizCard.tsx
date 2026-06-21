import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { useColors } from "@/hooks/useColors";

export interface Quiz {
  id: string;
  title: string;
  type: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionCount: number;
}

interface QuizCardProps {
  quiz: Quiz;
  onPress: () => void;
}

export function QuizCard({ quiz, onPress }: QuizCardProps) {
  const colors = useColors();
  
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "success";
      case "Medium": return "warning";
      case "Hard": return "error";
      default: return "default";
    }
  };

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {quiz.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {quiz.type} • {quiz.questionCount} questions
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </View>
        <Badge 
          label={quiz.difficulty} 
          variant={getDifficultyVariant(quiz.difficulty) as any} 
        />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
});
