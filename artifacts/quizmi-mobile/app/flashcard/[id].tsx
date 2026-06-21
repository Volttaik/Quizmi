import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { FlipCard } from "@/components/FlipCard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

export default function FlashcardStudyScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const cards = [
    { front: "What is React Native?", back: "A framework for building native apps using React." },
    { front: "What is Expo?", back: "A set of tools and services built around React Native." },
  ];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.progress, { color: colors.mutedForeground }]}>
          Card {currentIndex + 1} of {cards.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <FlipCard 
          key={currentIndex}
          front={<Text style={[styles.cardText, { color: colors.foreground }]}>{cards[currentIndex].front}</Text>}
          back={<Text style={[styles.cardText, { color: colors.foreground }]}>{cards[currentIndex].back}</Text>}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.ratingButtons}>
          <Button 
            variant="secondary" 
            onPress={handleNext} 
            style={styles.rateButton}
          >
            <Text style={{ color: colors.destructive }}>Hard</Text>
          </Button>
          <Button 
            variant="secondary" 
            onPress={handleNext} 
            style={styles.rateButton}
          >
            <Text style={{ color: colors.primary }}>Easy</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: "center",
  },
  progress: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  cardText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 32,
  },
  footer: {
    padding: 20,
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 16,
  },
  rateButton: {
    flex: 1,
  },
});
