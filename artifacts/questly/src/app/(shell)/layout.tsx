import SiteHeader from "@/components/SiteHeader";
import BottomNav from "@/components/BottomNav";
import { RouteTransition } from "@/components/Motion";

/**
 * Shared layout for the primary screens (home, course discovery, course
 * details, dashboard, history, profile and settings). The header and the
 * mobile bottom navigation live here so they stay mounted across route
 * changes instead of being re-declared by each page.
 *
 * The bottom bar reserves exactly its own height (`--bottom-nav-h` plus the
 * device safe area) so the last row of any screen clears it.
 */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    // 100dvh (not 100vh): mobile browsers resize the viewport when the URL
    // bar hides/shows as the page bottom is reached, and a 100vh reserve
    // creates the over-scroll that made the bottom bar appear to drift.
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <div className="flex-1 pb-[calc(var(--bottom-nav-h)+var(--safe-bottom)+0.5rem)] md:pb-0">
        <RouteTransition>{children}</RouteTransition>
      </div>
      <BottomNav />
    </div>
  );
}
