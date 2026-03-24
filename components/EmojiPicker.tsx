'use client';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="💰"
        maxLength={4}
        style={{
          width: '60px',
          padding: '10px',
          textAlign: 'center',
          fontSize: '1.25rem',
          borderRadius: '4px',
          border: '3px solid var(--border)',
          boxShadow: 'var(--brutal-shadow)',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
      />
    </div>
  );
}