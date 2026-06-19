"use client";

import { Bell } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Props {
  name?: string;
}

export default function DashboardHeader({ name }: Props) {
  const { user } = useUser();
  const displayName = name ?? user?.firstName ?? user?.username ?? "Learner";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-lg font-extrabold text-primary">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-white">
            Hi, {displayName}
          </h1>
          <p className="text-xs text-white/70 font-medium">
            Keep learning, keep growing!
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
