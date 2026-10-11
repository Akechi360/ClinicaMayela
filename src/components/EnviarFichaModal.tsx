import React, { useEffect, useRef, useState } from 'react';
import { X, Copy, Send, Loader2 } from 'lucide-react';
import { dbFichas } from '../services/db';
import { fichaUrl } from '../lib/fichaIngreso';
import { recipeQrDataUrl } from '../lib/recipeVerify';
import { enlaceWa } from '../lib/whatsapp';
import { useToast } from './Toast';

interface Props {
  /** Paciente existente al que se le actualizará la ficha; null = paciente nuevo */
  pacienteId?: string | null;
  nombre?: string;
  telefono?: string | null;
  onClose: () => void;
}

/** Crea un enlace de ficha de ingreso (un solo uso, 7 días) y permite enviarlo por WhatsApp, copiarlo o mostrarlo como QR. */
export const EnviarFichaModal: React.FC<Props> = ({ pacienteId = null, nombre, telefono, onClose }) => {
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const [tel, setTel] = useState(telefono ?? '');
  const creada = useRef(false);

  useEffect(() => {
    if (creada.current) return;
    creada.current = true;
    dbFichas
      .crear(pacienteId)
      .then(async (f) => {
        const u = fichaUrl(f.token);
        setUrl(u);
        setQr(await recipeQrDataUrl(u));
      })
      .catch((e: Error) => setError(e.message));
  }, [pacienteId]);

  const mensaje = `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}, para agilizar su atención en la Clínica Dra. Mayela González, por favor complete su ficha de ingreso (toma unos 3 minutos):\n${url}`;
  const wa = url ? enlaceWa(tel, mensaje) : null;

  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Enlace copiado.'); }
    catch { toast.error('No se pudo copiar. Selecciónalo manualmente.'); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-dark/40 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="ficha-modal-title" className="glass-panel w-full max-w-sm overflow-hidden rounded-2xl border border-pure-white/50 shadow-luxury">
        <div className="flex items-center justify-between border-b border-satin-copper/10 bg-pure-white/20 px-5 py-4">
          <h3 id="ficha-modal-title" className="font-display text-sm font-medium uppercase tracking-wider text-slate-dark">Ficha de ingreso</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="cursor-pointer border-none bg-transparent text-slate-light hover:text-slate-dark"><X size={16} /></button>
        </div>
        <div className="space-y-4 p-5 text-xs">
          {!url && !error && <p className="flex items-center gap-2 text-slate-medium"><Loader2 size={14} className="animate-spin" /> Creando enlace…</p>}
          {error && <p className="text-red-600">No se pudo crear el enlace: {error}</p>}
          {url && (
            <>
              <p className="text-slate-medium">
                El paciente completa sus datos y antecedentes desde su teléfono. Luego tú los cargas con un botón. El enlace sirve una sola vez y vence en 7 días.
              </p>
              {qr && <img src={qr} alt="Código QR de la ficha de ingreso" className="mx-auto h-40 w-40 rounded-lg bg-white p-1" />}
              <p className="break-all rounded-lg bg-pure-white/50 px-3 py-2 font-mono text-[10px] text-slate-dark">{url}</p>
              {!telefono && (
                <input
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="WhatsApp del paciente (ej. 0414-0000000)"
                  className="w-full rounded-lg border border-satin-copper/15 bg-pure-white/60 px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper"
                />
              )}
              <div className="flex gap-2">
                <button type="button" onClick={copiar} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-satin-copper/25 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-dark hover:bg-pure-white/40">
                  <Copy size={12} /> Copiar
                </button>
                <a
                  href={wa ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!wa}
                  onClick={(e) => { if (!wa) { e.preventDefault(); toast.warning('Escribe el WhatsApp del paciente.'); } }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-pure-white ${wa ? 'satin-button cursor-pointer' : 'cursor-not-allowed bg-slate-light/50'}`}
                >
                  <Send size={12} /> WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
