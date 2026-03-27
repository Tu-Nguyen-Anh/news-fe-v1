import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    return (
      <div>
        <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              "h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500",
              error && "border-red-500",
              className,
            )}
            aria-invalid={!!error}
            {...rest}
          />
          <span className="text-sm text-gray-700">{label}</span>
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
