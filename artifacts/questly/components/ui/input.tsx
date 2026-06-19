import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[hsl(220,20%,90%)] bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[hsl(220,13%,46%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(262,72%,55%)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[hsl(222,30%,15%)] dark:bg-[hsl(222,40%,9%)] dark:text-[hsl(220,20%,95%)] dark:placeholder:text-[hsl(220,13%,55%)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
