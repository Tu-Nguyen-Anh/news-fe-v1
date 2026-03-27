import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  ghost: "bg-transparent text-primary-600 hover:bg-primary-50 disabled:text-primary-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
