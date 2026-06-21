import { 
  Pressable, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle 
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface ButtonProps {
  onPress: () => void;
  title?: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export function Button({ 
  onPress, 
  title, 
  variant = "primary", 
  loading, 
  disabled, 
  style, 
  textStyle,
  children 
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return { 
          bg: colors.secondary, 
          text: colors.secondaryForeground 
        };
      case "ghost":
        return { 
          bg: "transparent", 
          text: colors.primary 
        };
      case "destructive":
        return { 
          bg: colors.destructive, 
          text: colors.destructiveForeground 
        };
      default:
        return { 
          bg: colors.primary, 
          text: colors.primaryForeground 
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { 
          backgroundColor: variantStyles.bg, 
          opacity: (pressed || disabled) ? 0.7 : 1,
          borderRadius: colors.radius
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text} />
      ) : (
        children || (
          <Text style={[styles.text, { color: variantStyles.text }, textStyle]}>
            {title}
          </Text>
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
