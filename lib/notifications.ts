import { NotificationSettings } from './types';

const NOTIFICATION_SETTINGS_KEY = 'NOTIFICATION_SETTINGS';
const NOTIFICATION_TAG = 'expense-reminder';

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: '20:00',
};

export function getSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: NotificationSettings): void {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export function getPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function showReminder(): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const settings = getSettings();
  if (!settings.enabled) return;

  new Notification('💰 Time to Track Your Expenses!', {
    body: "Don't forget to log your expenses for today!",
    icon: '/icons/icon-192x192.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: true,
  });
}

let checkInterval: ReturnType<typeof setInterval> | null = null;
let lastNotifiedDate: string | null = null;

export function startReminderCheck(): void {
  if (typeof window === 'undefined') return;
  
  stopReminderCheck();
  
  lastNotifiedDate = localStorage.getItem('lastNotifiedDate');
  
  checkInterval = setInterval(() => {
    const settings = getSettings();
    if (!settings.enabled) return;
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toDateString();
    
    if (currentTime === settings.reminderTime && lastNotifiedDate !== today) {
      showReminder();
      lastNotifiedDate = today;
      localStorage.setItem('lastNotifiedDate', today);
    }
  }, 60000);
}

export function stopReminderCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

export function initNotifications(): void {
  const settings = getSettings();
  if (settings.enabled && getPermissionStatus() === 'granted') {
    startReminderCheck();
  }
}