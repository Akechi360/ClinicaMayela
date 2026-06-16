import React, { createContext, useContext, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';

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

const ToastMixin = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeToasts = useRef<Record<string, any>>({});

  const success = useCallback((message: string, duration = 3000) => {
    ToastMixin.fire({
      icon: 'success',
      title: message,
      timer: duration,
      customClass: {
        popup: 'swal2-toast swal2-icon-success'
      }
    });
  }, []);

  const error = useCallback((message: string, duration = 4000) => {
    ToastMixin.fire({
      icon: 'error',
      title: message,
      timer: duration,
      customClass: {
        popup: 'swal2-toast swal2-icon-error'
      }
    });
  }, []);

  const warning = useCallback((message: string, duration = 4000) => {
    ToastMixin.fire({
      icon: 'warning',
      title: message,
      timer: duration,
      customClass: {
        popup: 'swal2-toast swal2-icon-warning'
      }
    });
  }, []);

  const loading = useCallback((message: string): string => {
    const id = `toast-${Date.now()}`;
    const instance = Swal.fire({
      toast: true,
      position: 'bottom-end',
      title: message,
      showConfirmButton: false,
      timer: undefined,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: 'swal2-toast swal2-icon-info'
      }
    });
    activeToasts.current[id] = instance;
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    if (activeToasts.current[id]) {
      Swal.close();
      delete activeToasts.current[id];
    }
  }, []);

  const value = { success, error, warning, loading, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
