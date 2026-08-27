'use client';

import { useState, useCallback, useEffect } from 'react';
import { Lock, Key, X, Delete, AlertCircle } from 'lucide-react';
import { verifySecurityPin, setSecurityPin } from '@/lib/security';

interface SetPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isChanging?: boolean;
}

type SetupStep = 'verify-current' | 'enter-new' | 'confirm-new';

export function SetPinModal({
  isOpen,
  onClose,
  onSuccess,
  isChanging = false,
}: SetPinModalProps) {
  const [step, setStep] = useState<SetupStep>(isChanging ? 'verify-current' : 'enter-new');
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const resetAll = useCallback(() => {
    setStep(isChanging ? 'verify-current' : 'enter-new');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setError('');
    setIsShaking(false);
  }, [isChanging]);

  const handleClose = useCallback(() => {
    resetAll();
    onClose();
  }, [resetAll, onClose]);

  const activeValue =
    step === 'verify-current'
      ? currentPinInput
      : step === 'enter-new'
      ? newPinInput
      : confirmPinInput;

  const triggerShake = (errMessage: string, clearAction: () => void) => {
    setError(errMessage);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      clearAction();
    }, 450);
  };

  const handleStepComplete = useCallback(
    async (completedValue: string) => {
      if (step === 'verify-current') {
        const isValid = await verifySecurityPin(completedValue);
        if (isValid) {
          setError('');
          setStep('enter-new');
        } else {
          triggerShake('Incorrect current PIN.', () => setCurrentPinInput(''));
        }
      } else if (step === 'enter-new') {
        setError('');
        setStep('confirm-new');
      } else if (step === 'confirm-new') {
        if (completedValue === newPinInput) {
          await setSecurityPin(completedValue);
          resetAll();
          onSuccess();
          onClose();
        } else {
          triggerShake('PIN confirmation does not match.', () => {
            setConfirmPinInput('');
            setStep('enter-new');
            setNewPinInput('');
          });
        }
      }
    },
    [step, newPinInput, resetAll, onSuccess, onClose]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (activeValue.length < 4) {
        const nextVal = activeValue + digit;
        if (step === 'verify-current') setCurrentPinInput(nextVal);
        else if (step === 'enter-new') setNewPinInput(nextVal);
        else setConfirmPinInput(nextVal);

        setError('');

        if (nextVal.length === 4) {
          handleStepComplete(nextVal);
        }
      }
    },
    [activeValue, step, handleStepComplete]
  );

  const handleDelete = useCallback(() => {
    if (step === 'verify-current') setCurrentPinInput((p) => p.slice(0, -1));
    else if (step === 'enter-new') setNewPinInput((p) => p.slice(0, -1));
    else setConfirmPinInput((p) => p.slice(0, -1));
    setError('');
  }, [step]);

  // Physical keyboard listener
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

  const stepTitles: Record<SetupStep, { title: string; desc: string }> = {
    'verify-current': {
      title: 'Current PIN',
      desc: 'Enter your existing 4-digit PIN to proceed.',
    },
    'enter-new': {
      title: isChanging ? 'New 4-Digit PIN' : 'Set 4-Digit PIN',
      desc: 'Create a 4-digit code to protect balance figures.',
    },
    'confirm-new': {
      title: 'Confirm PIN',
      desc: 'Re-enter your 4-digit PIN to confirm.',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-xl border border-zinc-200 p-6 sm:p-7 max-w-xs w-full shadow-lg flex flex-col items-center gap-5 transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
            {step === 'verify-current' ? <Key className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
          <h3 className="text-base font-bold text-zinc-900">{stepTitles[step].title}</h3>
          <p className="text-xs text-zinc-500">{stepTitles[step].desc}</p>
        </div>

        {/* 4-Dot Indicators */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const filled = activeValue.length > idx;
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
          <div className="text-[11px] text-rose-600 flex items-center gap-1 font-medium text-center">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
