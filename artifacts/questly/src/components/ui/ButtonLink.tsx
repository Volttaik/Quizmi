import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonVariants, type ButtonVariants } from "@heroui/react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  fullWidth?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

/**
 * Navigation styled with HeroUI's own button classes. Links stay real anchors
 * (history, middle-click and prefetch all keep working) while matching the
 * HeroUI buttons used for in-page actions.
 */
export default function ButtonLink({
  href,
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
