import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, Loader2, RefreshCw, PlugZap } from 'lucide-react';
import { supabase, supabaseUrl } from '../services/supabase';
import { updateClinicSettings } from '../services/db';
import { useToast } from './Toast';

interface RespuestaSync {
  ok: boolean;
  motivo?: string;
  mensaje?: string;
  calendario?: string | boolean;
  credenciales?: boolean;
  sincronizadas?: number;
  fallidas?: number;
}

/** Sincronización automática de las citas con el Google Calendar de la Dra. (cuenta de servicio; sin archivos). */
export const GoogleCalendarSync: React.FC<{ settingsId: string; calendarId?: string | null; syncToken?: string | null }> = ({ settingsId, calendarId, syncToken }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const [id, setId] = useState(calendarId ?? '');
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const llamar = async (op: 'ping' | 'pendientes'): Promise<RespuestaSync> => {
    const r = await fetch(`${supabaseUrl}/functions/v1/calendario-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-token': syncToken ?? '' },
      body: JSON.stringify({ op }),
    });
    if (r.status === 404) throw new Error('La sincronización aún no está activada en el servidor.');
    return (await r.json()) as RespuestaSync;
  };

  const { data: conteo } = useQuery({
    queryKey: ['google-sync-conteo'],
    queryFn: async () => {
      const desde = new Date(Date.now() - 86_400_000).toISOString();
      const base = () => supabase.from('citas').select('id', { count: 'exact', head: true }).gte('fecha_hora', desde).neq('estado', 'cancelado');
      const [total, sync, err] = await Promise.all([
        base(),
        base().not('google_event_id', 'is', null),
        base().not('google_sync_error', 'is', null),
      ]);
      return { total: total.count ?? 0, sincronizadas: sync.count ?? 0, conError: err.count ?? 0 };
    },
    enabled: !!calendarId,
  });

  const guardar = useMutation({
    mutationFn: () => updateClinicSettings({ id: settingsId, google_calendar_id: id.trim() || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinicSettings'] }); toast.success(id.trim() ? 'Calendario guardado.' : 'Sincronización desactivada.'); },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });

  const probar = useMutation({
    mutationFn: () => llamar('ping'),
    onSuccess: (r) => {
      if (r.ok) setEstado({ tipo: 'ok', texto: 'Conexión correcta: la app puede escribir en tu calendario.' });
      else if (r.motivo === 'no_configurado') setEstado({ tipo: 'error', texto: r.credenciales === false ? 'Faltan las credenciales de Google en el servidor.' : 'Falta guardar el ID del calendario.' });
      else setEstado({ tipo: 'error', texto: r.mensaje ?? 'No se pudo conectar con Google.' });
    },
    onError: (e: Error) => setEstado({ tipo: 'error', texto: e.message }),
  });

  const sincronizar = useMutation({
    mutationFn: () => llamar('pendientes'),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['google-sync-conteo'] });
      if (r.ok) setEstado({ tipo: 'ok', texto: `Citas enviadas a Google: ${r.sincronizadas ?? 0}${r.fallidas ? ` · con error: ${r.fallidas}` : ''}.` });
      else setEstado({ tipo: 'error', texto: r.mensaje ?? 'No se pudo sincronizar.' });
    },
    onError: (e: Error) => setEstado({ tipo: 'error', texto: e.message }),
  });

  return (
    <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
      <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
        <CalendarCheck size={16} className="text-satin-copper" /> Sincronización automática con Google Calendar
      </h3>
      <p className="text-xs text-slate-medium leading-relaxed">
        Cada cita que se cree, mueva o cancele (desde la app o por WhatsApp) aparece sola en tu Google Calendar, sin descargar archivos.
        Funciona de la app hacia Google.
      </p>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">ID del calendario de Google</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="xxxxxxxx@group.calendar.google.com"
            className="flex-1 bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-mono"
          />
          <button
            onClick={() => guardar.mutate()}
            disabled={guardar.isPending || id.trim() === (calendarId ?? '')}
            className="satin-button text-pure-white text-[10px] font-bold tracking-wider uppercase py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
        <p className="text-[10px] text-slate-light">Déjalo vacío para desactivar la sincronización.</p>
      </div>

      {calendarId && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => probar.mutate()}
              disabled={probar.isPending}
              className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-satin-copper/25 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-satin-copper hover:bg-satin-copper/10 disabled:opacity-50"
            >
              {probar.isPending ? <Loader2 size={12} className="animate-spin" /> : <PlugZap size={12} />} Probar conexión
            </button>
            <button
              onClick={() => sincronizar.mutate()}
              disabled={sincronizar.isPending}
              className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-satin-copper/25 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-satin-copper hover:bg-satin-copper/10 disabled:opacity-50"
            >
              {sincronizar.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Sincronizar citas pendientes
            </button>
          </div>
          {estado && (
            <p role="status" className={`rounded-lg px-3 py-2 text-xs ${estado.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{estado.texto}</p>
          )}
          {conteo && (
            <p className="text-[11px] text-slate-medium">
              Citas próximas: {conteo.total} · en Google: {conteo.sincronizadas}
              {conteo.conError > 0 ? <span className="text-red-600"> · con error: {conteo.conError}</span> : null}
            </p>
          )}
        </div>
      )}

      <details className="rounded-xl border border-satin-copper/15 bg-pure-white/30">
        <summary className="cursor-pointer select-none px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-dark">Cómo configurarlo (una sola vez)</summary>
        <ol className="list-decimal space-y-1.5 border-t border-satin-copper/10 px-8 py-4 text-xs text-slate-medium">
          <li>En Google Calendar crea un calendario nuevo llamado "Clínica Dra. Mayela" (así no se mezcla con lo personal).</li>
          <li>En sus ajustes, comparte el calendario con el correo de la cuenta de servicio, con permiso "Hacer cambios en los eventos".</li>
          <li>En "Integrar el calendario" copia el ID del calendario y pégalo arriba.</li>
          <li>Pulsa "Probar conexión". Si dice correcta, ya está: las citas nuevas se envían solas.</li>
        </ol>
      </details>
    </section>
  );
};
