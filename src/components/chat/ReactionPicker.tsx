import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface ReactionPickerProps {
  isMine: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function ReactionPicker({ isMine, onSelect, onClose }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // Use timeout so the click that opened the picker doesn't immediately close it
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full mb-1.5 z-30 flex items-center gap-0.5 bg-white rounded-full shadow-xl border border-gray-100 px-2 py-1.5",
        isMine ? "right-0" : "left-0",
      )}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(emoji);
          }}
          className="text-xl leading-none p-1 rounded-full hover:bg-gray-100 transition-all hover:scale-125 transform active:scale-110"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
