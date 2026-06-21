import React, { useState, useRef } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  Pressable 
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  createdAt: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello! I'm your AI tutor. How can I help you today?", sender: "ai", createdAt: new Date().toISOString() }
  ]);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      createdAt: new Date().toISOString(),
    };

    setMessages([userMsg, ...messages]);
    setInputText("");
    
    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "That's an interesting question. Let me explain that for you...",
        sender: "ai",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [aiMsg, ...prev]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={[
            styles.messageWrapper,
            item.sender === "user" ? styles.userWrapper : styles.aiWrapper
          ]}>
            <View style={[
              styles.messageBubble,
              { 
                backgroundColor: item.sender === "user" ? colors.primary : colors.card,
                borderBottomRightRadius: item.sender === "user" ? 4 : 20,
                borderBottomLeftRadius: item.sender === "ai" ? 4 : 20,
              }
            ]}>
              <Text style={[
                styles.messageText,
                { color: item.sender === "user" ? "#ffffff" : colors.foreground }
              ]}>
                {item.text}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.inputContainer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
          placeholder="Ask anything..."
          placeholderTextColor={colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <Pressable 
          onPress={handleSend}
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
        >
          <Feather name="send" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
  },
  userWrapper: {
    justifyContent: "flex-end",
  },
  aiWrapper: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
