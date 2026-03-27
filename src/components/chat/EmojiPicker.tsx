import { useEffect, useRef } from "react";

const EMOJI_ROWS = [
  ["😀", "😂", "🥹", "😍", "🥰", "😎", "🤔", "😢", "😡", "🥳"],
  ["😴", "🤩", "😏", "🙄", "🤗", "😇", "🤯", "🥺", "😤", "😭"],
  ["👍", "👎", "❤️", "🔥", "✅", "❌", "🎉", "💯", "⭐", "🙏"],
  ["👋", "🤝", "💪", "👏", "🫶", "✌️", "🤞", "🫡", "👀", "💀"],
  ["🎊", "🌹", "🌈", "☀️", "🎵", "🍕", "⚽", "🚀", "💎", "🍀"],
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 w-[268px]"
    >
      {EMOJI_ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1 mb-1 last:mb-0">
          {row.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(emoji); }}
              className="w-10 h-10 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
