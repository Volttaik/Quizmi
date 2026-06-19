import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CreditCard from "@/components/dashboard/CreditCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActionCards from "@/components/dashboard/ActionCards";
import PromoBanner from "@/components/dashboard/PromoBanner";
import BottomNav from "@/components/dashboard/BottomNav";

const demoTransactions = [
  { id: 1, description: "Starter Pack Purchase", amount: 500, type: "purchase", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 2, description: "Generated Quiz · Biology", amount: -50, type: "debit", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 3, description: "Flashcard Set Created", amount: -30, type: "debit", createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  { id: 4, description: "AI Summary Generated", amount: -20, type: "debit", createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString() },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <div className="absolute top-0 left-0 right-0 h-[300px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,30%)] to-[hsl(275,60%,24%)]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/30 rounded-full blur-[80px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(280,72%,50%)]/25 rounded-full blur-[70px] translate-x-1/4 -translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-[hsl(200,90%,50%)]/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="demo-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#demo-dots)" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-6">
        <DashboardHeader name="Alex" isDemo demoAvatar="AJ" />
        <CreditCard credits={2450} plan="pro" />
        <div className="mb-3 px-0.5">
          <h3 className="text-sm font-extrabold text-foreground">Quick Actions</h3>
        </div>
        <ActionCards />
        <RecentTransactions transactions={demoTransactions} />
        <PromoBanner />
      </div>

      <BottomNav />
    </div>
  );
}
