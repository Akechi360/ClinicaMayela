// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Shield, Database, RefreshCw, MessageSquare, QrCode } from 'lucide-react';
import { getClinicSettings, updateClinicSettings } from '../services/db';
import type { ClinicSettings as ClinicSettingsType } from '../types/database.types';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

export const ClinicSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();

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

  // Sincronizar estado local con DB
  useEffect(() => {
    if (dbSettings) {
      setBotActivo(dbSettings.bot_activo);
      setHoraRecordatorio(dbSettings.hora_recordatorio || '09:00:00');
      setMensajeBienvenida(dbSettings.mensaje_bienvenida || '');
    }
  }, [dbSettings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      bot_activo: botActivo,
      hora_recordatorio: horaRecordatorio,
      mensaje_bienvenida: mensajeBienvenida
    });
  };

  const handleClearCache = async () => {
    const ok = await confirm({
      title: '¿Restaurar Base de Datos?',
      message: '¿Deseas restaurar la base de datos a sus valores iniciales? Esto ejecutará el script de migración en la base de datos de producción.',
      confirmLabel: 'Sí, restaurar',
      cancelLabel: 'Cancelar',
      severity: 'danger'
    });
    if (ok) {
      toast.warning('Esta acción ahora se gestiona directamente desde la consola o el script migrate_db.js.');
    }
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

        {/* Sección 3: Paleta de Colores de Identidad */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-4">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <Shield size={16} className="text-satin-copper" /> Paleta de Colores Corporativos
          </h3>
          <p className="text-xs text-slate-medium">La aplicación utiliza la siguiente paleta de tres colores definidos para tu clínica:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-dark text-pure-white rounded-xl border border-slate-dark">
              <div className="w-8 h-8 rounded-full bg-pure-white/10 flex items-center justify-center font-bold text-xs">1</div>
              <div>
                <p className="text-xs font-semibold">Gris Pizarra / Slate Dark</p>
                <p className="text-[9px] opacity-75">Hex: #3A434D (Estructura)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-satin-copper text-pure-white rounded-xl border border-satin-copper">
              <div className="w-8 h-8 rounded-full bg-pure-white/10 flex items-center justify-center font-bold text-xs">2</div>
              <div>
                <p className="text-xs font-semibold">Cobre Bronce / Satin Copper</p>
                <p className="text-[9px] opacity-75">Hex: #A66E53 (Acción/Acentos)</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-rose-champagne text-slate-dark rounded-xl border border-rose-champagne">
              <div className="w-8 h-8 rounded-full bg-slate-dark/10 flex items-center justify-center font-bold text-xs">3</div>
              <div>
                <p className="text-xs font-semibold">Champaña / Rose Champagne</p>
                <p className="text-[9px] opacity-75">Hex: #F2E7E2 (Fondos/Cards)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="satin-button text-pure-white text-[10px] font-bold tracking-[0.15em] uppercase py-3 px-8 rounded-xl shadow-lg shadow-satin-copper/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save size={14} /> {updateSettingsMutation.isPending ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </div>
      </form>
    </div>
  );
};
