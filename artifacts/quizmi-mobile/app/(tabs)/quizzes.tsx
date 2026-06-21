import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";
import { QuizCard, Quiz } from "@/components/QuizCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

export default function QuizzesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuizzes = async () => {
    try {
      const stored = await AsyncStorage.getItem("quizmi_quizzes");
      if (stored) setQuizzes(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <QuizCard 
            quiz={item} 
            onPress={() => router.push(`/quiz/${item.id}`)} 
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="book-open"
              title="No Quizzes Yet"
              description="Generate your first AI quiz to start learning!"
            />
          ) : null
        }
        onRefresh={loadQuizzes}
        refreshing={loading}
      />
      
      <Button
        onPress={() => {}} // Open create quiz modal
        style={[styles.fab, { bottom: insets.bottom + 80, backgroundColor: colors.primary }]}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
