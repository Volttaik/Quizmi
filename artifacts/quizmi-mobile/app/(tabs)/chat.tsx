import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { ChatSessionItem, ChatSession } from "@/components/ChatSessionItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChatSessionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem("quizmi_chat_sessions");
      if (stored) setSessions(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatSessionItem 
            session={item} 
            onPress={() => router.push(`/chat/${item.id}`)} 
          />
        )}
        contentContainerStyle={[
          { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }
        ]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="message-circle"
              title="AI Tutor"
              description="Start a conversation with your AI tutor to clarify any topic."
            />
          ) : null
        }
        onRefresh={loadSessions}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
