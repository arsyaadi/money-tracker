import { NotificationSettings } from './types';
import { isTauri } from './apiClient';
import {
  isPermissionGranted as tauriIsPermissionGranted,
  requestPermission as tauriRequestPermission,
  sendNotification,
  cancel,
  createChannel,
  Importance,
  Schedule,
} from '@tauri-apps/plugin-notification';

const NOTIFICATION_SETTINGS_KEY = 'NOTIFICATION_SETTINGS';
const NOTIFICATION_TAG = 'expense-reminder';
export const REMINDER_NOTIFICATION_ID = 1001;
export const REMINDER_CHANNEL_ID = 'daily-expense-reminders';

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
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

let channelInitialized = false;
async function ensureNotificationChannel(): Promise<void> {
  if (!isTauri() || channelInitialized) return;
  try {
    await createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Daily Expense Reminders',
      description: 'Daily reminder to record financial transactions and expenses',
      importance: Importance.High,
      lights: true,
      vibration: true,
      sound: 'default',
    });
    channelInitialized = true;
  } catch (err) {
    console.warn('Failed to create notification channel:', err);
  }
}

export async function isNotificationPermissionGranted(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isTauri()) {
    try {
      return await tauriIsPermissionGranted();
    } catch {
      return false;
    }
  }
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied';

  if (isTauri()) {
    try {
      const alreadyGranted = await tauriIsPermissionGranted();
      if (alreadyGranted) {
        await ensureNotificationChannel();
        return 'granted';
      }
      const res = await tauriRequestPermission();
      if (res === 'granted') {
        await ensureNotificationChannel();
        return 'granted';
      }
      return res === 'denied' ? 'denied' : 'default';
    } catch (err) {
      console.warn('Tauri permission request failed:', err);
      return 'denied';
    }
  }

  // Web Browser fallback
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
  if (typeof window === 'undefined') return 'default';
  if (!('Notification' in window) && !isTauri()) {
    return 'denied';
  }
  if (!isTauri()) {
    return Notification.permission;
  }
  return 'default';
}

export async function sendTestNotification(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const granted = await isNotificationPermissionGranted();
  if (!granted) {
    const res = await requestPermission();
    if (res !== 'granted') return false;
  }

  if (isTauri()) {
    try {
      await ensureNotificationChannel();
      sendNotification({
        id: 9999,
        channelId: REMINDER_CHANNEL_ID,
        title: '💰 Expense Reminder Test',
        body: 'Local notifications are active and working on this device!',
        autoCancel: true,
      });
      return true;
    } catch (err) {
      console.error('Failed to send Tauri test notification:', err);
      return false;
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('💰 Expense Reminder Test', {
      body: 'Web notifications are active and working on this browser!',
      icon: '/icons/icon-192x192.png',
      tag: 'test-reminder',
    });
    return true;
  }

  return false;
}

export async function scheduleDailyReminder(reminderTime: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const targetDate = new Date();
  targetDate.setHours(hours, minutes, 0, 0);

  // If time today has passed, schedule starting from tomorrow
  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  if (isTauri()) {
    try {
      await ensureNotificationChannel();
      // Cancel previous scheduled notification if any
      await cancel([REMINDER_NOTIFICATION_ID]).catch(() => {});

      sendNotification({
        id: REMINDER_NOTIFICATION_ID,
        channelId: REMINDER_CHANNEL_ID,
        title: '💰 Time to Track Your Expenses!',
        body: "Don't forget to log your expenses for today!",
        schedule: Schedule.at(targetDate, true, true), // repeating = true, allowWhileIdle = true
        autoCancel: true,
      });
    } catch (err) {
      console.error('Failed to schedule native reminder:', err);
    }
  }

  // Also start web interval check as fallback
  startWebReminderCheck(reminderTime);
}

export async function cancelDailyReminder(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isTauri()) {
    try {
      await cancel([REMINDER_NOTIFICATION_ID]).catch(() => {});
    } catch (err) {
      console.warn('Failed to cancel native reminder:', err);
    }
  }

  stopWebReminderCheck();
}

// ===== Web Fallback Interval Check =====
let checkInterval: ReturnType<typeof setInterval> | null = null;
let lastNotifiedDate: string | null = null;

function startWebReminderCheck(targetTime: string): void {
  if (typeof window === 'undefined') return;

  stopWebReminderCheck();
  lastNotifiedDate = localStorage.getItem('lastNotifiedDate');

  checkInterval = setInterval(() => {
    const settings = getSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toDateString();

    if (currentTime === targetTime && lastNotifiedDate !== today) {
      showWebReminder();
      lastNotifiedDate = today;
      localStorage.setItem('lastNotifiedDate', today);
    }
  }, 60000);
}

function stopWebReminderCheck(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function showWebReminder(): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification('💰 Time to Track Your Expenses!', {
    body: "Don't forget to log your expenses for today!",
    icon: '/icons/icon-192x192.png',
    tag: NOTIFICATION_TAG,
    requireInteraction: true,
  });
}

// Backward compatibility helper
export function startReminderCheck(): void {
  const settings = getSettings();
  if (settings.enabled) {
    scheduleDailyReminder(settings.reminderTime);
  }
}

// Backward compatibility helper
export function stopReminderCheck(): void {
  cancelDailyReminder();
}

// Backward compatibility helper
export function showReminder(): void {
  sendTestNotification();
}

export async function initNotifications(): Promise<void> {
  if (typeof window === 'undefined') return;
  const settings = getSettings();
  if (!settings.enabled) return;

  const granted = await isNotificationPermissionGranted();
  if (granted) {
    await scheduleDailyReminder(settings.reminderTime);
  }
}