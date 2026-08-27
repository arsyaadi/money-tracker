'use client';

const PIN_STORAGE_KEY = 'MONEY_TRACKER_PIN_HASH';
const PIN_ENABLED_KEY = 'MONEY_TRACKER_PIN_ENABLED';

async function sha256(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Basic fallback hash for unsupported environments
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      hash = (hash << 5) - hash + message.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }

  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isPinEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const isEnabled = localStorage.getItem(PIN_ENABLED_KEY);
  const hasHash = !!localStorage.getItem(PIN_STORAGE_KEY);
  return isEnabled === 'true' && hasHash;
}

export function isPinConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(PIN_STORAGE_KEY);
}

export async function setSecurityPin(pin: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const hash = await sha256(pin);
  localStorage.setItem(PIN_STORAGE_KEY, hash);
  localStorage.setItem(PIN_ENABLED_KEY, 'true');
}

export function setPinEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function verifySecurityPin(pin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
  if (!storedHash) return true; // If no PIN set, allow

  const inputHash = await sha256(pin);
  return storedHash === inputHash;
}

export function removeSecurityPin(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.setItem(PIN_ENABLED_KEY, 'false');
}
