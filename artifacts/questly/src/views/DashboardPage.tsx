"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CreditCard from "@/components/dashboard/CreditCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActionCards from "@/components/dashboard/ActionCards";
import PromoBanner from "@/components/dashboard/PromoBanner";
import BottomNav from "@/components/dashboard/BottomNav";
import StudySlideshow from "@/components/dashboard/StudySlideshow";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface UserData {
  credits: number;
  name: string;
  plan: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  createdAt: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => setUserData(d))
      .catch(() => {});
    fetch("/api/credits/transactions")
      .then((r) => r.json())
      .then((d) => setTransactions(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <div className="absolute top-0 left-0 right-0 h-[320px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,28%)] to-[hsl(275,60%,22%)]" />
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/35 rounded-full blur-[90px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[hsl(280,72%,50%)]/30 rounded-full blur-[80px] translate-x-1/4 -translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-[hsl(200,90%,50%)]/12 rounded-full blur-[70px] -translate-x-1/2 -translate-y-1/2" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dash-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dash-dots)" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <motion.div
        className="relative max-w-lg mx-auto px-4 pt-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}><DashboardHeader name={userData?.name} /></motion.div>
        <motion.div variants={item}><CreditCard credits={userData?.credits ?? 0} plan={userData?.plan ?? "free"} /></motion.div>
        <motion.div variants={item}><StudySlideshow /></motion.div>
        <motion.div variants={item} className="mb-3 px-0.5">
          <h3 className="text-sm font-extrabold text-foreground">Quick Actions</h3>
        </motion.div>
        <motion.div variants={item}><ActionCards /></motion.div>
        <motion.div variants={item}><RecentTransactions transactions={transactions} /></motion.div>
        <motion.div variants={item}><PromoBanner /></motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
