import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Shield, MessageSquare, QrCode, Bell } from 'lucide-react';
import { getClinicSettings, updateClinicSettings } from '../services/db';
import { useToast } from '../components/Toast';
import { CalendarioSuscripcion } from '../components/CalendarioSuscripcion';
import { GoogleCalendarSync } from '../components/GoogleCalendarSync';

export const ClinicSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();


  // Settings from Supabase
  const { data: dbSettings, isLoading } = useQuery({
    queryKey: ['clinicSettings'],
    queryFn: getClinicSettings,
    refetchInterval: 5000, // Poll every 5s to catch QR updates
  });

  const updateSettingsMutation = useMutation({
    mutationFn: updateClinicSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicSettings'] });
      toast.success('Ajustes guardados correctamente.');
    }
  });

  // Local form state
  const [botActivo, setBotActivo] = useState(false);
  const [horaRecordatorio, setHoraRecordatorio] = useState('09:00:00');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  // Agenda por WhatsApp
  const [apertura, setApertura] = useState('10:00');
  const [cierre, setCierre] = useState('17:00');
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5]);
  const [intervalo, setIntervalo] = useState(30);
  const [anticipacion, setAnticipacion] = useState(3);
  const [horizonte, setHorizonte] = useState(21);
  const [maxCitas, setMaxCitas] = useState(2);
  const [cancelarHoras, setCancelarHoras] = useState(12);
  const [info, setInfo] = useState('');
  // Alertas a la doctora
  const [alertaActiva, setAlertaActiva] = useState(true);
  const [alertaTelefono, setAlertaTelefono] = useState('');
  const [silencioDesde, setSilencioDesde] = useState('19:00');
  const [silencioHasta, setSilencioHasta] = useState('07:00');
  const [alertaCitas, setAlertaCitas] = useState(true);
  const [alertaCancelaciones, setAlertaCancelaciones] = useState(true);
  const [alertaFichas, setAlertaFichas] = useState(true);

  // Sincronizar estado local con DB
  useEffect(() => {
    if (dbSettings) {
      setBotActivo(dbSettings.bot_activo);
      setHoraRecordatorio(dbSettings.hora_recordatorio || '09:00:00');
      setMensajeBienvenida(dbSettings.mensaje_bienvenida || '');
      setApertura((dbSettings.bot_hora_apertura || '10:00').slice(0, 5));
      setCierre((dbSettings.bot_hora_cierre || '17:00').slice(0, 5));
      setDias(dbSettings.bot_dias?.length ? dbSettings.bot_dias : [1, 2, 3, 4, 5]);
      setIntervalo(dbSettings.bot_intervalo_min ?? 30);
      setAnticipacion(dbSettings.bot_anticipacion_horas ?? 3);
      setHorizonte(dbSettings.bot_horizonte_dias ?? 21);
      setMaxCitas(dbSettings.bot_max_citas_futuras ?? 2);
      setCancelarHoras(dbSettings.bot_cancelar_horas ?? 12);
      setInfo(dbSettings.bot_info || '');
      setAlertaActiva(dbSettings.alerta_activa ?? true);
      setAlertaTelefono(dbSettings.alerta_telefono ?? '');
      setSilencioDesde((dbSettings.alerta_silencio_desde || '19:00').slice(0, 5));
      setSilencioHasta((dbSettings.alerta_silencio_hasta || '07:00').slice(0, 5));
      setAlertaCitas(dbSettings.alerta_citas ?? true);
      setAlertaCancelaciones(dbSettings.alerta_cancelaciones ?? true);
      setAlertaFichas(dbSettings.alerta_fichas ?? true);
    }
  }, [dbSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbSettings?.id) return;
    const digitos = alertaTelefono.replace(/\D/g, '');
    if (alertaActiva && (digitos.length < 10 || digitos.length > 15)) {
      toast.error('Revise su número de WhatsApp para las alertas (con código de área).');
      return;
    }
    updateSettingsMutation.mutate({
      id: dbSettings.id,
      bot_activo: botActivo,
      hora_recordatorio: horaRecordatorio,
      mensaje_bienvenida: mensajeBienvenida,
      bot_hora_apertura: apertura,
      bot_hora_cierre: cierre,
      bot_dias: dias,
      bot_intervalo_min: intervalo,
      bot_anticipacion_horas: anticipacion,
      bot_horizonte_dias: horizonte,
      bot_max_citas_futuras: maxCitas,
      bot_cancelar_horas: cancelarHoras,
      bot_info: info.trim() || null,
      alerta_activa: alertaActiva,
      alerta_telefono: alertaTelefono.trim() || null,
      alerta_silencio_desde: silencioDesde,
      alerta_silencio_hasta: silencioHasta,
      alerta_citas: alertaCitas,
      alerta_cancelaciones: alertaCancelaciones,
      alerta_fichas: alertaFichas,
    });
  };



  if (isLoading) {
    return <div className="text-center text-xs text-slate-medium py-12">Cargando configuraciones...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-light text-slate-dark tracking-wide">
          Ajustes del <span className="italic font-normal text-satin-copper">Sistema</span>
        </h2>
        <p className="text-xs text-slate-light mt-0.5">Personalización de la clínica, automatizaciones de WhatsApp y control del sistema.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sección 2: Configuración del Bot de WhatsApp */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-6">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-satin-copper" /> Automatización de WhatsApp Bot
          </h3>
          <div className="space-y-4">
            
            {/* Status y QR */}
            <div className="flex flex-col md:flex-row gap-6 bg-pure-white/20 p-5 rounded-2xl border border-satin-copper/15">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${dbSettings?.bot_conectado ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-dark">
                    {dbSettings?.bot_conectado ? 'BOT EN LÍNEA' : 'BOT DESCONECTADO'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-medium">
                  {dbSettings?.bot_conectado 
                    ? 'El bot está escuchando mensajes y enviando recordatorios automáticamente.' 
                    : 'Abre la terminal en la PC del consultorio y ejecuta "node bot.js" o el archivo .bat para conectarlo.'}
                </p>

                <div className="flex items-center justify-between p-3.5 bg-pure-white/40 rounded-xl border border-satin-copper/10 mt-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-dark">Activar Funciones del Bot</p>
                    <p className="text-[10px] text-slate-light">El bot responderá mensajes y enviará recordatorios si está en línea.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={botActivo}
                    onChange={(e) => setBotActivo(e.target.checked)}
                    className="rounded text-satin-copper focus:ring-satin-copper border-rose-champagne w-5 h-5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Lector QR en tiempo real */}
              <div className="w-full max-w-[200px] md:w-48 mx-auto md:mx-0 aspect-square bg-pure-white/40 rounded-xl border border-dashed border-satin-copper/30 flex items-center justify-center p-2">
                {dbSettings?.bot_qr_base64 && !dbSettings?.bot_conectado ? (
                  <div className="text-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(dbSettings.bot_qr_base64)}`} alt="WhatsApp QR" className="w-full h-full rounded-lg" />
                    <p className="text-[9px] text-slate-dark font-bold mt-2">Escanea para conectar</p>
                  </div>
                ) : dbSettings?.bot_conectado ? (
                  <div className="text-center text-green-600">
                    <Shield className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-[10px] font-bold">Conectado y Seguro</p>
                  </div>
                ) : (
                  <div className="text-center text-slate-light">
                    <QrCode className="mx-auto mb-2 opacity-30" size={32} />
                    <p className="text-[9px]">Esperando código QR...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Hora de Recordatorios Diarios</label>
              <input
                type="time"
                value={horaRecordatorio}
                onChange={(e) => setHoraRecordatorio(e.target.value)}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper w-32 font-sans"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Mensaje de Bienvenida del Bot</label>
              <textarea
                value={mensajeBienvenida}
                onChange={(e) => setMensajeBienvenida(e.target.value)}
                rows={3}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg p-3 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none leading-relaxed font-sans"
              />
            </div>
          </div>
        </section>

        {/* Agenda por WhatsApp */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-satin-copper" /> Agenda por WhatsApp
          </h3>
          <p className="text-xs text-slate-medium leading-relaxed">
            Los pacientes agendan, ven y cancelan sus citas por WhatsApp dentro de este horario. Los tratamientos que pueden pedir se eligen en el Catálogo de Tratamientos.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Abre</label>
              <input type="time" value={apertura} onChange={(e) => setApertura(e.target.value)} className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Cierra</label>
              <input type="time" value={cierre} onChange={(e) => setCierre(e.target.value)} className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Horarios cada</label>
              <select value={intervalo} onChange={(e) => setIntervalo(Number(e.target.value))} className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper">
                {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Anticipación mínima</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={72} value={anticipacion} onChange={(e) => setAnticipacion(Number(e.target.value))} className="w-20 bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
                <span className="text-[10px] text-slate-light">horas</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Días de atención</label>
            <div className="flex flex-wrap gap-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => {
                const n = i + 1;
                const activo = dias.includes(n);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDias((prev) => (activo ? prev.filter((x) => x !== n) : [...prev, n].sort()))}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[11px] font-bold ${activo ? 'border-satin-copper bg-satin-copper/15 text-satin-copper' : 'border-satin-copper/20 text-slate-medium'}`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Ventana de agenda</label>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={90} value={horizonte} onChange={(e) => setHorizonte(Number(e.target.value))} className="w-20 bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
                <span className="text-[10px] text-slate-light">días hacia adelante</span>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Máx. citas próximas por paciente</label>
              <input type="number" min={1} max={10} value={maxCitas} onChange={(e) => setMaxCitas(Number(e.target.value))} className="w-20 bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Cancelar hasta</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={168} value={cancelarHoras} onChange={(e) => setCancelarHoras(Number(e.target.value))} className="w-20 bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
                <span className="text-[10px] text-slate-light">horas antes</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Texto de "Horario e información" (opcional)</label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              placeholder="Ej. Atendemos de lunes a viernes de 10:00 a. m. a 5:00 p. m. Estamos en … (dirección)."
              className="bg-pure-white/30 border border-satin-copper/15 rounded-lg p-3 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none leading-relaxed font-sans"
            />
            <p className="text-[10px] text-slate-light">Si lo dejas vacío, el bot responde con el horario de arriba.</p>
          </div>
        </section>

        {/* Alertas a la doctora */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <Bell size={16} className="text-satin-copper" /> Alertas a mi WhatsApp
          </h3>
          <p className="text-xs text-slate-medium leading-relaxed">
            El bot le escribe a su número personal cuando hay algo que atender. Fuera de las horas de silencio recibe cada aviso al momento; durante el silencio solo llegan los síntomas urgentes, y el resto se junta en un resumen de buenos días con la agenda del día.
          </p>

          <div className="flex items-center justify-between p-3.5 bg-pure-white/40 rounded-xl border border-satin-copper/10">
            <div>
              <p className="text-xs font-semibold text-slate-dark">Enviarme alertas por WhatsApp</p>
              <p className="text-[10px] text-slate-light">Requiere que el bot esté en línea.</p>
            </div>
            <input type="checkbox" checked={alertaActiva} onChange={(e) => setAlertaActiva(e.target.checked)} className="rounded text-satin-copper focus:ring-satin-copper border-rose-champagne w-5 h-5 cursor-pointer" />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Mi número de WhatsApp (con código de área)</label>
            <input
              type="tel"
              value={alertaTelefono}
              onChange={(e) => setAlertaTelefono(e.target.value)}
              placeholder="+58 424-5500042"
              className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper w-full sm:w-64"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Horas de silencio</label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-light">De</span>
              <input type="time" value={silencioDesde} onChange={(e) => setSilencioDesde(e.target.value)} className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
              <span className="text-[10px] text-slate-light">a</span>
              <input type="time" value={silencioHasta} onChange={(e) => setSilencioHasta(e.target.value)} className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper" />
            </div>
            <p className="text-[10px] text-slate-light">Los síntomas urgentes de un paciente siempre se avisan, también en silencio.</p>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Avisarme de</label>
            {([
              ['Citas nuevas y solicitudes por confirmar', alertaCitas, setAlertaCitas],
              ['Cancelaciones de citas', alertaCancelaciones, setAlertaCancelaciones],
              ['Fichas de ingreso recibidas (en el resumen de la mañana)', alertaFichas, setAlertaFichas],
            ] as const).map(([texto, valor, cambiar]) => (
              <label key={texto} className="flex items-center gap-2 text-xs text-slate-dark cursor-pointer">
                <input type="checkbox" checked={valor} onChange={(e) => cambiar(e.target.checked)} className="rounded text-satin-copper focus:ring-satin-copper border-rose-champagne w-4 h-4 cursor-pointer" />
                {texto}
              </label>
            ))}
            <p className="text-[10px] text-slate-light">Los pacientes que piden hablar con usted siempre se avisan.</p>
          </div>
        </section>

        {dbSettings?.id && <GoogleCalendarSync settingsId={dbSettings.id} calendarId={dbSettings.google_calendar_id} syncToken={dbSettings.google_sync_token} />}

        {dbSettings?.id && <CalendarioSuscripcion settingsId={dbSettings.id} token={dbSettings.calendar_token} />}

        {/* Save button */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="rosa-button text-[10px] font-semibold tracking-[0.12em] uppercase py-3 px-8 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} /> {updateSettingsMutation.isPending ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </div>
      </form>
    </div>
  );
};
