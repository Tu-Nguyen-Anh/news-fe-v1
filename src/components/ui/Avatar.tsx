import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/utils/cn";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <SafeImage
        src={src}
        alt={alt ?? name ?? ""}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700",
        sizeClasses[size],
        className,
      )}
      aria-label={name}
    >
      {name ? getInitials(name) : "?"}
    </div>
  );
}
