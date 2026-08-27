'use client';

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
  const currentEmoji = selectedEmoji !== undefined ? selectedEmoji : value || '💰';
  const handleEmojiChange = (emoji: string) => {
    onChange?.(emoji);
    onSelectEmoji?.(emoji);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={currentEmoji}
        onChange={(e) => handleEmojiChange(e.target.value)}
        placeholder="💰"
        maxLength={4}
        className="w-11 h-10 text-center text-base rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
      />
    </div>
  );
}