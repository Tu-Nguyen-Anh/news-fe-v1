import type { SVGAttributes } from "react";
import { cn } from "@/utils/cn";

type IconSize = "sm" | "md" | "lg" | "xl";

interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: IconSize;
  children: React.ReactNode;
}

const sizeClasses: Record<IconSize, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

export function Icon({ size = "md", children, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(sizeClasses[size], className)}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}
