import { useApp } from "@/context/AppContext";

export function useAppData() {
  const { profile, attempts, isLoading } = useApp();
  
  return {
    profile,
    recentActivity: attempts.slice(0, 5),
    isLoading,
  };
}
