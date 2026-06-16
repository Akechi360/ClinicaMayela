import React, { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad';
import { X } from 'lucide-react';
import { useToast } from './Toast';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureBase64: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Focus trap y control de teclado (Escape para cerrar, Tab circular)
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    
    const previouslyFocused = document.activeElement as HTMLElement;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex="0"]:not([disabled])'
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    let pad: SignaturePad | null = null;

    const initPad = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = canvas.offsetWidth || 350;
      const height = canvas.offsetHeight || 190;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, width, height);
      }

      pad = new SignaturePad(canvas, {
        penColor: '#3A434D', // color slate-dark
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
      });
      signaturePadRef.current = pad;
    };

    const timer = setTimeout(initPad, 100);

    return () => {
      clearTimeout(timer);
      if (pad) {
        pad.off();
      }
      signaturePadRef.current = null;
    };
  }, [isOpen]);

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSave = () => {
    if (!signaturePadRef.current) return;
    if (signaturePadRef.current.isEmpty()) {
      toast.warning('Por favor, dibuje su firma antes de guardar.');
      return;
    }
    const dataUrl = signaturePadRef.current.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 select-none">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-title"
        className="glass-panel w-full max-w-md rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
          <h3 id="signature-title" className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Firma Digital del Paciente</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar firma digital"
            className="text-slate-light hover:text-slate-dark transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="p-5 flex flex-col items-center bg-rose-champagne-light/30">
          <p className="text-[10px] text-slate-medium mb-3 uppercase tracking-wider text-center font-semibold">
            Por favor, firme dentro del recuadro utilizando el dedo, lápiz o mouse.
          </p>
          <div className="w-full h-48 bg-pure-white rounded-xl border border-satin-copper/15 overflow-hidden shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none cursor-crosshair"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-satin-copper/10 bg-pure-white/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 border border-satin-copper/25 text-satin-copper rounded-xl text-[10px] uppercase tracking-wider font-bold hover:bg-rose-champagne/20 transition-all cursor-pointer"
          >
            Limpiar Lienzo
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 satin-button text-pure-white rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
          >
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
