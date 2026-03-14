'use client';

import { useState } from 'react';
import { NotificationSettings } from '@/lib/types';
import {
  getSettings,
  saveSettings,
  requestPermission,
  getPermissionStatus,
  startReminderCheck,
  stopReminderCheck,
  DEFAULT_SETTINGS,
} from '@/lib/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploymentIdSave?: () => void;
}

export function SettingsModal({ isOpen, onClose, onDeploymentIdSave }: SettingsModalProps) {
  const [deploymentId, setDeploymentId] = useState(() => {
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

  const handleToggle = async () => {
    if (!settings.enabled) {
      const permission = await requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        saveSettings(newSettings);
        startReminderCheck();
      }
    } else {
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      saveSettings(newSettings);
      stopReminderCheck();
    }
  };

  const handleTimeChange = (time: string) => {
    const newSettings = { ...settings, reminderTime: time };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSave = () => {
    if (deploymentId.trim()) {
      localStorage.setItem('APPS_SCRIPT_DEPLOYMENT_ID', deploymentId.trim());
      onDeploymentIdSave?.();
    }
    saveSettings(settings);
    if (settings.enabled && permissionStatus === 'granted') {
      startReminderCheck();
    }
    onClose();
  };

  if (!isOpen) return null;

  const isBlocked = permissionStatus === 'denied';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '32px',
          borderRadius: '4px',
          width: '90%',
          maxWidth: '400px',
          border: '3px solid var(--border)',
          boxShadow: 'var(--brutal-shadow)',
        }}
      >
        <h2
          style={{
            marginBottom: '24px',
            fontSize: 'var(--font-title)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ⚙️ Settings
        </h2>

        <div
          style={{
            padding: '16px',
            border: '3px solid var(--border)',
            borderRadius: '4px',
            marginBottom: '16px',
            background: 'var(--bg)',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 'var(--font-xxs)',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Deployment ID
          </label>
          <input
            type="text"
            value={deploymentId}
            onChange={(e) => setDeploymentId(e.target.value)}
            placeholder="AKfycbx..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '3px solid var(--border)',
              boxShadow: 'var(--brutal-shadow)',
              background: 'var(--bg)',
              color: 'var(--text-primary)',
              fontFamily: "'DM Mono', monospace",
            }}
          />
        </div>

        <div
          style={{
            padding: '16px',
            border: '3px solid var(--border)',
            borderRadius: '4px',
            marginBottom: '20px',
            background: 'var(--bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                Daily Reminder
              </div>
              <div
                style={{
                  fontSize: 'var(--font-small)',
                  color: 'var(--text-secondary)',
                }}
              >
                Get notified to track expenses
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={isBlocked}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: settings.enabled ? 'none' : '3px solid var(--border)',
                background: settings.enabled ? '#22c55e' : 'var(--bg)',
                cursor: isBlocked ? 'not-allowed' : 'pointer',
                position: 'relative',
                transition: 'all 0.2s',
                opacity: isBlocked ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid var(--border)',
                  position: 'absolute',
                  top: '2px',
                  left: settings.enabled ? '28px' : '2px',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>

          {isBlocked && (
            <div
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--danger)',
                marginTop: '8px',
                padding: '8px',
                background: 'var(--danger-dim)',
                borderRadius: '4px',
              }}
            >
              Notifications are blocked. Please enable them in your browser settings.
            </div>
          )}

          {settings.enabled && !isBlocked && (
            <div style={{ marginTop: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-xxs)',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                Reminder Time
              </label>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  border: '3px solid var(--border)',
                  boxShadow: 'var(--brutal-shadow)',
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  fontFamily: "'DM Mono', monospace",
                }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '3px solid var(--border)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}