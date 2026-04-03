import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, fullWidth = false, id, className, ...rest }, ref) => {
    const hasLabel = Boolean(label);
    const hasError = Boolean(error);

    return (
      <div className={cn(fullWidth && "w-full")}>
        {hasLabel && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
          </label>
        )}
        <div className="relative mt-1">
          <select
            ref={ref}
            id={id}
            className={cn(
              "w-full appearance-none rounded-xl border bg-white px-3 py-2.5 pr-10 text-sm transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
              "hover:border-gray-400",
              hasError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron icon (native select arrow hidden by appearance-none) */}
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {hasError && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={`${id}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
