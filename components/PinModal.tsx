'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, X, Delete, AlertCircle } from 'lucide-react';
import { verifySecurityPin } from '@/lib/security';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function PinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Enter Security PIN',
  description = 'Enter your PIN code to reveal financial balances.',
}: PinModalProps) {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleClose = useCallback(() => {
    setPin('');
    setError('');
    setIsShaking(false);
    onClose();
  }, [onClose]);

  const handleVerify = useCallback(async (currentPin: string) => {
    if (!currentPin) return;

    const isValid = await verifySecurityPin(currentPin);
    if (isValid) {
      setPin('');
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('Incorrect PIN. Please try again.');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    }
  }, [onSuccess, onClose]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  }, [pin, handleVerify]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  // Keyboard listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleDelete, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 pt-[max(env(safe-area-inset-top,0px),1rem)] pb-[max(env(safe-area-inset-bottom,0px),1rem)] animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-xl border border-zinc-200 p-6 sm:p-7 max-w-xs w-full shadow-lg flex flex-col items-center gap-5 transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
            <Lock className="w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center flex flex-col gap-1">
          <h3 className="text-base font-bold text-zinc-900">{title}</h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>

        {/* PIN Dot Indicators */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                  filled
                    ? 'bg-zinc-900 border-zinc-900 scale-110'
                    : 'bg-zinc-100 border-zinc-300'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="py-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-sm font-mono font-bold text-zinc-900 btn-press transition-colors"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-sm font-mono font-bold text-zinc-900 btn-press transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 btn-press transition-colors"
            title="Delete"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
