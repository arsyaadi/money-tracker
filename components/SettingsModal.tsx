'use client';

import { useState, useEffect } from 'react';
import { Sliders, X, RefreshCw, Cloud, Bell, Lock, Key, ShieldCheck, Trash2, Plus, Loader2 } from 'lucide-react';
import { NotificationSettings } from '@/lib/types';
import {
  getSettings,
  saveSettings,
  requestPermission,
  getPermissionStatus,
  isNotificationPermissionGranted,
  scheduleDailyReminder,
  cancelDailyReminder,
  sendTestNotification,
  DEFAULT_SETTINGS,
} from '@/lib/notifications';
import {
  isPinConfigured,
  isPinEnabled,
  setPinEnabled,
  removeSecurityPin,
} from '@/lib/security';
import { SetPinModal } from './SetPinModal';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploymentIdSave?: () => void;
  onRefresh?: () => void;
  onPinConfigChange?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onDeploymentIdSave,
  onRefresh,
  onPinConfigChange,
}: SettingsModalProps) {
  const [deploymentId, setDeploymentId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID') || '';
  });
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    return getSettings();
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined') return 'default';
    return getPermissionStatus();
  });
  const [testStatus, setTestStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      isNotificationPermissionGranted().then((granted) => {
        if (granted) {
          setPermissionStatus('granted');
        }
      });
    }
  }, [isOpen]);

  // PIN settings state
  const [pinEnabled, setPinEnabledState] = useState<boolean>(() => isPinEnabled());
  const [hasConfiguredPin, setHasConfiguredPin] = useState<boolean>(() => isPinConfigured());
  const [showSetPinModal, setShowSetPinModal] = useState<boolean>(false);
  const [showRemovePinConfirm, setShowRemovePinConfirm] = useState<boolean>(false);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [pinSuccess, setPinSuccess] = useState<string>('');

  const handleToggleReminder = async () => {
    if (!settings.enabled) {
      const permission = await requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        saveSettings(newSettings);
        await scheduleDailyReminder(newSettings.reminderTime);
      }
    } else {
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      saveSettings(newSettings);
      await cancelDailyReminder();
    }
  };

  const handleTimeChange = (time: string) => {
    const newSettings = { ...settings, reminderTime: time };
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.enabled) {
      scheduleDailyReminder(time);
    }
  };

  const handleSendTest = async () => {
    setTestStatus('Sending test notification...');
    const success = await sendTestNotification();
    if (success) {
      setTestStatus('Test notification triggered!');
    } else {
      setTestStatus('Failed. Please check notification permission.');
    }
    setTimeout(() => setTestStatus(''), 3500);
  };

  const handleTogglePinProtection = () => {
    if (!hasConfiguredPin) {
      setIsChangingPin(false);
      setShowSetPinModal(true);
      return;
    }
    const nextState = !pinEnabled;
    setPinEnabledState(nextState);
    setPinEnabled(nextState);
    onPinConfigChange?.();
  };

  const handlePinSetSuccess = () => {
    setHasConfiguredPin(true);
    setPinEnabledState(true);
    setPinSuccess(isChangingPin ? 'PIN changed successfully!' : 'PIN configured and enabled!');
    onPinConfigChange?.();
    setTimeout(() => setPinSuccess(''), 3000);
  };

  const handleConfirmRemovePin = () => {
    removeSecurityPin();
    setHasConfiguredPin(false);
    setPinEnabledState(false);
    setShowRemovePinConfirm(false);
    onPinConfigChange?.();
  };

  const handleRemovePin = () => {
    setShowRemovePinConfirm(true);
  };

  const handleSave = () => {
    if (deploymentId.trim()) {
      localStorage.setItem('APPS_SCRIPT_DEPLOYMENT_ID', deploymentId.trim());
      onDeploymentIdSave?.();
    }
    saveSettings(settings);
    if (settings.enabled && permissionStatus === 'granted') {
      scheduleDailyReminder(settings.reminderTime);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isBlocked = permissionStatus === 'denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),1rem)] animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 sm:p-7 max-w-md w-full shadow-lg flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-zinc-900" />
            <h2 className="text-base font-bold text-zinc-900">Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync & Refresh Action Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={() => {
              onRefresh();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-800 flex items-center justify-center gap-2 btn-press transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-zinc-600" />
            <span>Sync Cloud Database</span>
          </button>
        )}

        {/* Google Apps Script Deployment Section */}
        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col gap-2">
          <label
            htmlFor="deployment-id"
            className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5"
          >
            <Cloud className="w-3.5 h-3.5 text-zinc-600" />
            <span>Google Apps Script Deployment ID</span>
          </label>
          <input
            id="deployment-id"
            type="text"
            value={deploymentId}
            onChange={(e) => setDeploymentId(e.target.value)}
            placeholder="AKfycbx..."
            className="w-full bg-white border border-zinc-200 px-3 py-2 text-xs font-mono rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-400"
          />
          <p className="text-[11px] text-zinc-500 font-sans">
            Connects your ledger directly to your private Google Sheet.
          </p>
        </div>

        {/* Security & PIN Privacy Section */}
        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-600" />
                <span>Stealth PIN Protection</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Require 4-digit PIN to reveal total balance figures
              </p>
            </div>

            <button
              type="button"
              onClick={handleTogglePinProtection}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                pinEnabled ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-all absolute top-0.5 ${
                  pinEnabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {pinSuccess && (
            <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{pinSuccess}</span>
            </div>
          )}

          {/* Change or Set PIN Button */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
            {hasConfiguredPin ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPin(true);
                    setShowSetPinModal(true);
                  }}
                  className="text-xs font-medium text-zinc-700 hover:text-zinc-900 flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Change PIN</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemovePin}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove PIN</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setShowSetPinModal(true);
                }}
                className="text-xs font-medium text-zinc-900 hover:text-zinc-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Configure 4-Digit PIN</span>
              </button>
            )}
          </div>
        </div>

        {/* Notification Reminder Section */}
        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-zinc-600" />
                <span>Daily Reminder</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Push notification to log daily transactions
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleReminder}
              disabled={isBlocked}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                settings.enabled ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-all absolute top-0.5 ${
                  settings.enabled ? 'left-5.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {isBlocked && (
            <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] rounded-lg">
              Notifications are blocked in your browser settings.
            </div>
          )}

          {settings.enabled && !isBlocked && (
            <>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                <label
                  htmlFor="reminder-time"
                  className="text-xs font-medium text-zinc-600"
                >
                  Reminder Time
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="bg-white border border-zinc-200 px-2.5 py-1 text-xs font-mono rounded-md text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={testStatus === 'Sending test notification...'}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 btn-press transition-colors disabled:opacity-50"
                >
                  {testStatus === 'Sending test notification...' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  <span>Send Test Notification</span>
                </button>
                {testStatus && (
                  <p className="text-[11px] text-center text-zinc-600 font-medium">
                    {testStatus}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 btn-press"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs uppercase tracking-wider btn-press"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Set / Change PIN Keypad Modal */}
      <SetPinModal
        isOpen={showSetPinModal}
        onClose={() => setShowSetPinModal(false)}
        onSuccess={handlePinSetSuccess}
        isChanging={isChangingPin}
      />

      {/* Remove PIN Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemovePinConfirm}
        onClose={() => setShowRemovePinConfirm(false)}
        onConfirm={handleConfirmRemovePin}
        title="Remove Security PIN?"
        description="Are you sure you want to remove your 4-digit Security PIN? Financial figures will no longer be protected behind a PIN code."
        confirmLabel="Remove PIN"
        cancelLabel="Keep PIN"
        variant="danger"
      />
    </div>
  );
}