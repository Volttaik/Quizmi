import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { FlashcardSetCard, FlashcardSet } from "@/components/FlashcardSet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

export default function FlashcardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSets = async () => {
    try {
      const stored = await AsyncStorage.getItem("quizmi_flashcard_sets");
      if (stored) setSets(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSets();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sets}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <FlashcardSetCard 
            set={item} 
            onPress={() => router.push(`/flashcard/${item.id}`)} 
          />
        )}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="layers"
              title="No Flashcards"
              description="Create flashcard sets manually or use AI to generate them."
            />
          ) : null
        }
        onRefresh={loadSets}
        refreshing={loading}
      />
      
      <Button
        onPress={() => {}} // Open create set modal
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
  columnWrapper: {
    justifyContent: "space-between",
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
