import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Copy, KeyRound, Trash2 } from 'lucide-react';
import { supabase, supabaseUrl } from '../services/supabase';
import { updateClinicSettings } from '../services/db';
import { useToast } from './Toast';

/** Suscripción de la agenda a Google Calendar (feed iCal protegido por token; se actualiza solo, sin costo). */
export const CalendarioSuscripcion: React.FC<{ settingsId: string; token?: string | null }> = ({ settingsId, token }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const [visible, setVisible] = useState(false);
  const refrescar = () => qc.invalidateQueries({ queryKey: ['clinicSettings'] });

  const generar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('rotar_calendar_token');
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { refrescar(); setVisible(true); toast.success('Enlace de calendario generado.'); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
  const revocar = useMutation({
    mutationFn: () => updateClinicSettings({ id: settingsId, calendar_token: null }),
    onSuccess: () => { refrescar(); toast.success('Enlace desactivado.'); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const url = token ? `${supabaseUrl}/functions/v1/calendario?token=${token}` : '';
  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); toast.success('Enlace copiado.'); } catch { toast.error('No se pudo copiar.'); }
  };

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
      <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
        <CalendarDays size={16} className="text-satin-copper" /> Agenda en Google Calendar
      </h3>
      <p className="text-xs text-slate-medium leading-relaxed">
        Suscribe tu Google Calendar (en el teléfono o la computadora) a la agenda de la clínica: las citas aparecen y se actualizan solas.
        Google refresca estos calendarios cada pocas horas, no al instante. Es de solo lectura: los cambios se hacen en la app.
      </p>

      {!token ? (
        <button type="button" onClick={() => generar.mutate()} disabled={generar.isPending} className="rosa-button px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50">
          <KeyRound size={13} /> Generar enlace de calendario
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input readOnly value={visible ? url : url.replace(token, '•'.repeat(12))} aria-label="Enlace de suscripción" className="flex-1 min-w-0 bg-pure-white/50 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-dark" />
            <button type="button" onClick={() => setVisible((v) => !v)} className="px-3 text-[10px] font-bold uppercase tracking-wider border border-satin-copper/30 text-satin-copper rounded-lg cursor-pointer">{visible ? 'Ocultar' : 'Mostrar'}</button>
            <button type="button" onClick={copiar} className="px-3 border border-satin-copper/30 text-satin-copper rounded-lg cursor-pointer" aria-label="Copiar enlace"><Copy size={14} /></button>
          </div>
          <ol className="text-[11px] text-slate-medium list-decimal pl-5 space-y-1">
            <li>Copia el enlace y abre Google Calendar en la computadora (calendar.google.com).</li>
            <li>En "Otros calendarios" pulsa <b>+</b> → <b>Desde URL</b> y pega el enlace.</li>
            <li>Listo: también se verá en la app de Google Calendar de tu teléfono.</li>
          </ol>
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Este enlace da acceso a los nombres de tus pacientes y tratamientos. No lo compartas; si crees que se filtró, genera uno nuevo (el anterior deja de funcionar).
          </p>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => generar.mutate()} disabled={generar.isPending} className="px-4 py-2 border border-satin-copper/40 text-satin-copper rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5"><KeyRound size={12} /> Generar enlace nuevo</button>
            <button type="button" onClick={() => revocar.mutate()} disabled={revocar.isPending} className="px-4 py-2 border border-red-300 text-red-500 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5"><Trash2 size={12} /> Desactivar</button>
          </div>
        </div>
      )}
    </section>
  );
};
