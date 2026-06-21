import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  name: string;
  credits: number;
  streak: number;
  totalQuizzes: number;
  avatar?: string;
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface AppContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  attempts: QuizAttempt[];
  addAttempt: (attempt: Omit<QuizAttempt, "completedAt">) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: "quizmi_user_profile",
  ATTEMPTS: "quizmi_quiz_attempts",
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    name: "User",
    credits: 10,
    streak: 0,
    totalQuizzes: 0,
  });
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [storedProfile, storedAttempts] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
          AsyncStorage.getItem(STORAGE_KEYS.ATTEMPTS),
        ]);

        if (storedProfile) setProfile(JSON.parse(storedProfile));
        if (storedAttempts) setAttempts(JSON.parse(storedAttempts));
      } catch (e) {
        console.error("Failed to load app data", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
  };

  const addAttempt = async (attempt: Omit<QuizAttempt, "completedAt">) => {
    const newAttempt = { ...attempt, completedAt: new Date().toISOString() };
    const newAttempts = [newAttempt, ...attempts].slice(0, 50); // Keep last 50
    setAttempts(newAttempts);
    await AsyncStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(newAttempts));
    
    // Update total quizzes count
    await updateProfile({ totalQuizzes: profile.totalQuizzes + 1 });
  };

  return (
    <AppContext.Provider value={{ profile, updateProfile, attempts, addAttempt, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
