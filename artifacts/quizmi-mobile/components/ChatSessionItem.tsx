import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

interface ChatSessionItemProps {
  session: ChatSession;
  onPress: () => void;
}

export function ChatSessionItem({ session, onPress }: ChatSessionItemProps) {
  const colors = useColors();

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: pressed ? colors.muted : colors.card,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        }
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Feather name="message-circle" size={20} color={colors.primaryForeground} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {session.title}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            {new Date(session.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={2}>
          {session.lastMessage}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
  },
});
