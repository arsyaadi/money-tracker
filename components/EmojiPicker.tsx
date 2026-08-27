'use client';

import { Sparkles } from 'lucide-react';

interface EmojiPickerProps {
  value?: string;
  onChange?: (emoji: string) => void;
  selectedEmoji?: string;
  onSelectEmoji?: (emoji: string) => void;
}

export function EmojiPicker({
  value,
  onChange,
  selectedEmoji,
  onSelectEmoji,
}: EmojiPickerProps) {
  const currentEmoji = selectedEmoji !== undefined ? selectedEmoji : value || '';
  const handleEmojiChange = (emoji: string) => {
    onChange?.(emoji);
    onSelectEmoji?.(emoji);
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-600 shrink-0">
        <Sparkles className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={currentEmoji}
        onChange={(e) => handleEmojiChange(e.target.value)}
        placeholder="Tag"
        maxLength={4}
        className="w-14 h-10 px-2 text-center text-xs font-mono rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
      />
    </div>
  );
}