import React, { useState } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";

export default function QuizPlayScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addAttempt } = useApp();
  
  // Mock quiz data for now
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correct: 2,
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correct: 1,
    },
  ];

  const handleAnswer = (index: number) => {
    if (index === questions[currentStep].correct) {
      setScore(score + 1);
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
      addAttempt({
        quizId: id as string,
        score: score + (index === questions[currentStep].correct ? 1 : 0),
        total: questions.length,
      });
    }
  };

  if (isFinished) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.resultsContent}>
          <Feather name="award" size={80} color={colors.primary} />
          <Text style={[styles.resultsTitle, { color: colors.foreground }]}>Quiz Completed!</Text>
          <Text style={[styles.scoreText, { color: colors.primary }]}>
            {score} / {questions.length}
          </Text>
          <Text style={[styles.percentText, { color: colors.mutedForeground }]}>
            {Math.round((score / questions.length) * 100)}% Correct
          </Text>
          <Button 
            title="Back to Dashboard" 
            onPress={() => router.replace("/")} 
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary, 
                width: `${((currentStep + 1) / questions.length) * 100}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
          Question {currentStep + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        <Text style={[styles.question, { color: colors.foreground }]}>
          {currentQuestion.question}
        </Text>

        <View style={styles.options}>
          {currentQuestion.options.map((option, index) => (
            <Pressable 
              key={index}
              onPress={() => handleAnswer(index)}
              style={({ pressed }) => [
                styles.optionCard,
                { 
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderColor: colors.border
                }
              ]}
            >
              <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

import { Pressable } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    padding: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  quizContent: {
    padding: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  optionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  resultsContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: 24,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: "800",
    marginTop: 8,
  },
  percentText: {
    fontSize: 18,
    marginBottom: 40,
  },
  backButton: {
    width: "100%",
  },
});
