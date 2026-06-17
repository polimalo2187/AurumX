import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/classNames";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-aurum-gold text-black hover:bg-aurum-amber shadow-aurum",
  secondary: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
  ghost: "bg-transparent text-aurum-gold hover:bg-aurum-gold/10"
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
