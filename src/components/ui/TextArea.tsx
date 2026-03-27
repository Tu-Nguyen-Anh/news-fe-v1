import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, fullWidth = false, id, className, ...rest }, ref) => {
    return (
      <div className={cn(fullWidth && "w-full")}>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "mt-1 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-1",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-primary-500 focus:ring-primary-500",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...rest}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${id}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
