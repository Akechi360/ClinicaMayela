import React, { createContext, useContext, useCallback } from 'react';
import Swal from 'sweetalert2';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'info' | 'warning' | 'danger';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const useConfirm = (): ConfirmContextValue['confirm'] => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    const iconMap = {
      danger: 'error' as const,
      warning: 'warning' as const,
      info: 'info' as const,
    };

    const icon = opts.severity ? iconMap[opts.severity] : 'info';

    // Set custom button classes depending on severity to align with tailwind overrides
    let confirmButtonClass = 'swal2-confirm';
    if (opts.severity === 'danger') {
      confirmButtonClass = 'swal2-confirm swal2-confirm-danger';
    } else if (opts.severity === 'warning') {
      confirmButtonClass = 'swal2-confirm swal2-confirm-warning';
    }

    return Swal.fire({
      title: opts.title,
      text: opts.message,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: opts.confirmLabel || 'Aceptar',
      cancelButtonText: opts.cancelLabel || 'Cancelar',
      buttonsStyling: false,
      customClass: {
        confirmButton: confirmButtonClass,
        cancelButton: 'swal2-cancel'
      }
    }).then((result) => {
      return result.isConfirmed;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
    </ConfirmContext.Provider>
  );
};
