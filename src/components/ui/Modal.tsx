import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className={cn(
        open
          ? "fixed inset-0 z-[100] m-0 flex h-[100dvh] w-full max-w-none items-end justify-center border-0 bg-transparent p-0 sm:items-center sm:p-4 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
          : "hidden",
      )}
    >
      <div
        className={cn(
          "w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          "max-h-[92dvh] sm:max-h-[min(90dvh,56rem)]",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </dialog>
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  icon,
  accent = "indigo",
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  icon?: ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "violet";
}) {
  const accents = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
    violet: "bg-violet-100 text-violet-600",
  };
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
      {icon && (
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", accents[accent])}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Đóng"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ModalBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4 rounded-b-2xl", className)}>
      {children}
    </div>
  );
}

// Legacy ModalTitle — kept for backward compat
export function ModalTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-4 text-lg font-semibold text-gray-900", className)}>{children}</h2>;
}
