import React, { useEffect } from "react";
import { StyleSheet, View, Animated } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SkeletonLoaderProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = "100%", height, borderRadius, style }: SkeletonLoaderProps) {
  const colors = useColors();
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.muted,
          borderRadius: borderRadius ?? colors.radius,
          opacity,
        },
        style,
      ]}
    />
  );
}
