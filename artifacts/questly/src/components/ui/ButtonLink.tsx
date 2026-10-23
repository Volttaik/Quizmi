import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  fullWidth?: boolean;
} & Omit<ComponentProps<typeof Link>, "href" | "className" | "children">;

/**
 * Navigation styled with the same button system as in-page actions. Links stay
 * real anchors (history, middle-click and prefetch all keep working).
 */
export default function ButtonLink({
  href,
  children,
  className,
  variant = "default",
  size = "default",
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
