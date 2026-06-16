import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-xs flex items-center justify-center z-[250] p-4 animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <div className="flex items-center gap-2">
                {options.severity === 'danger' || options.severity === 'warning' ? (
                  <AlertTriangle size={16} className={options.severity === 'danger' ? 'text-red-500' : 'text-amber-500'} />
                ) : (
                  <Info size={16} className="text-satin-copper" />
                )}
                <h3 className="font-display font-medium text-slate-dark text-xs uppercase tracking-wider">
                  {options.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Cerrar modal"
                className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 text-xs text-slate-medium leading-relaxed font-sans font-semibold">
              {options.message}
            </div>

            {/* Actions */}
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 hover:text-slate-dark transition-all rounded-lg font-bold text-[9px] uppercase tracking-wider cursor-pointer"
              >
                {options.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 text-pure-white transition-all rounded-lg font-bold text-[9px] uppercase tracking-wider shadow-md cursor-pointer ${
                  options.severity === 'danger'
                    ? 'bg-red-500 hover:bg-red-600'
                    : options.severity === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-satin-copper hover:bg-satin-copper-hover'
                }`}
              >
                {options.confirmLabel || 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
