import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";

/**
 * Shared layout for the primary screens (home, course discovery, course
 * details, dashboard, history, profile and settings). The header and the
 * mobile bottom navigation live here so they stay mounted across route
 * changes instead of being re-declared by each page.
 *
 * The focused examination runner intentionally lives outside this shell and
 * keeps its own dedicated layout.
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
