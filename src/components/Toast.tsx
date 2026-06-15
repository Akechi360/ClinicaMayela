import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  loading: (message: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={15} className="shrink-0 text-muted-olive" />,
  error:   <XCircle size={15} className="shrink-0 text-red-500" />,
  warning: <AlertCircle size={15} className="shrink-0 text-amber-500" />,
  loading: <Loader2 size={15} className="shrink-0 text-satin-copper animate-spin" />,
};

const BORDERS: Record<ToastType, string> = {
  success: 'border-l-4 border-muted-olive',
  error:   'border-l-4 border-red-500',
  warning: 'border-l-4 border-amber-500',
  loading: 'border-l-4 border-satin-copper',
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => (
  <div
    className={`
      flex items-center gap-3 px-4 py-3 rounded-xl shadow-luxury
      glass-panel border border-pure-white/50 ${BORDERS[toast.type]}
      animate-slideInRight min-w-[260px] max-w-[360px] w-full
    `}
    role="alert"
  >
    {ICONS[toast.type]}
    <p className="flex-1 text-[11px] font-semibold text-slate-dark font-sans leading-snug">{toast.message}</p>
    {toast.type !== 'loading' && (
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-light hover:text-slate-dark transition-colors shrink-0 cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X size={13} />
      </button>
    )}
  </div>
);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const add = useCallback((type: ToastType, message: string, duration = 4000): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    if (type !== 'loading' && duration > 0) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const value: ToastContextValue = {
    success: (msg, dur) => { add('success', msg, dur); },
    error:   (msg, dur) => { add('error', msg, dur); },
    warning: (msg, dur) => { add('warning', msg, dur); },
    loading: (msg)      => add('loading', msg, 0),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — bottom-right */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
