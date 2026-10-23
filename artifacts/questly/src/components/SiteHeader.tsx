"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookOpen,
  Clock,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";

import Avatar from "@/components/Avatar";
import Logo from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/my-courses", label: "My courses", icon: Bookmark, authOnly: true },
  { href: "/history", label: "History", icon: Clock, authOnly: true },
];

export default function SiteHeader() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const links = NAV.filter((link) => !link.authOnly || isSignedIn);
  const displayName = user?.fullName ?? user?.firstName ?? user?.username ?? "Your account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/history" && pathname.startsWith("/results"));

  const handleSignOut = async () => {
    if (signingOut) return;
    setOpen(false);
    setSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={isSignedIn ? "/dashboard" : "/"} aria-label="Quizmi home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isLoaded ? (
            <span className="h-[38px] w-[38px] rounded-full bg-muted" aria-hidden />
          ) : isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full transition-opacity hover:opacity-90 focus-visible:opacity-90"
                  aria-label="Open profile menu"
                >
                  <Avatar
                    name={displayName}
                    src={user?.imageUrl}
                    size={38}
                    className="ring-1 ring-border"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex items-center gap-3 py-2">
                  <Avatar name={displayName} src={user?.imageUrl} size={36} />
                  <span className="min-w-0">
                    <p className="truncate font-semibold">{displayName}</p>
                    <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/my-courses")}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  My courses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <UserRound className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "x" : "m"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/60 md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-[15px] font-medium transition-colors ${
                    isActive(link.href) ? "bg-secondary" : "hover:bg-muted"
                  }`}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="my-3 h-px bg-border" />
              {isSignedIn ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-full px-4 py-3 font-medium hover:bg-muted"
                  >
                    <Avatar name={displayName} src={user?.imageUrl} size={28} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-3 rounded-full px-4 py-3 font-medium hover:bg-muted"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" asChild className="h-12">
                    <Link href="/sign-in" onClick={() => setOpen(false)}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild className="h-12">
                    <Link href="/sign-up" onClick={() => setOpen(false)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Get started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
