import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
}

export function FlipCard({ front, back }: FlipCardProps) {
  const colors = useColors();
  const rotate = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotate.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      zIndex: rotate.value > 0.5 ? 0 : 1,
      opacity: rotate.value > 0.5 ? 0 : 1,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotate.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      zIndex: rotate.value > 0.5 ? 1 : 0,
      opacity: rotate.value > 0.5 ? 1 : 0,
    };
  });

  const flip = () => {
    rotate.value = withTiming(rotate.value === 0 ? 1 : 0, { duration: 400 });
  };

  return (
    <Pressable onPress={flip} style={styles.container}>
      <Animated.View 
        style={[
          styles.card, 
          frontStyle, 
          { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }
        ]}
      >
        {front}
      </Animated.View>
      <Animated.View 
        style={[
          styles.card, 
          styles.cardBack, 
          backStyle, 
          { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }
        ]}
      >
        {back}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 400,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBack: {
    transform: [{ rotateY: "180deg" }],
  },
});
