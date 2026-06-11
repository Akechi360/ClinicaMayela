import React, { useState } from 'react';
import { Settings, Save, Shield, Database, RefreshCw, MessageSquare } from 'lucide-react';

export const ClinicSettings: React.FC = () => {
  // Ajustes de contacto
  const [nombreClinica, setNombreClinica] = useState('Rejuvenece Dra. Mayela González');
  const [telefonoClinica, setTelefonoClinica] = useState('+34 600 999 888');
  const [emailClinica, setEmailClinica] = useState('contacto@rejuvenecemayela.com');

  // Estados del bot simulado
  const [botActivo, setBotActivo] = useState(true);
  const [horasRecordatorio, setHorasRecordatorio] = useState(24);
  const [mensajeRecordatorio, setMensajeRecordatorio] = useState(
    'Hola {paciente}, te recordamos tu cita de {tratamiento} programada para mañana {fecha_hora}. Por favor responde CONFIRMAR para asegurar tu lugar. ¡Gracias!'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Ajustes guardados correctamente en la simulación.');
  };

  const handleClearCache = () => {
    if (confirm('¿Deseas restaurar la base de datos a sus valores iniciales? Esto borrará tus registros actuales en localStorage.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

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
        {/* Sección 1: Datos de la Clínica */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-6">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <Settings size={16} className="text-satin-copper" /> Información de la Clínica
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Nombre Comercial</label>
              <input
                type="text"
                value={nombreClinica}
                onChange={(e) => setNombreClinica(e.target.value)}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Teléfono de Atención</label>
              <input
                type="text"
                value={telefonoClinica}
                onChange={(e) => setTelefonoClinica(e.target.value)}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              />
            </div>
            <div className="flex flex-col space-y-1 md:col-span-2">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Correo de Contacto</label>
              <input
                type="email"
                value={emailClinica}
                onChange={(e) => setEmailClinica(e.target.value)}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper w-full font-sans"
              />
            </div>
          </div>
        </section>

        {/* Sección 2: Configuración del Bot de WhatsApp */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-6">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-satin-copper" /> Automatización de WhatsApp Bot
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-pure-white/20 rounded-xl border border-satin-copper/10">
              <div>
                <p className="text-xs font-semibold text-slate-dark">Activar Bot de Recordatorios</p>
                <p className="text-[10px] text-slate-light">El bot enviará recordatorios automáticos de confirmación a los pacientes.</p>
              </div>
              <input
                type="checkbox"
                checked={botActivo}
                onChange={(e) => setBotActivo(e.target.checked)}
                className="rounded text-satin-copper focus:ring-satin-copper border-rose-champagne w-5 h-5 cursor-pointer"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Antelación de Envío (horas)</label>
              <input
                type="number"
                value={hoursRecordatorio(horasRecordatorio)}
                onChange={(e) => setHorasRecordatorio(parseInt(e.target.value) || 24)}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper w-32 font-sans"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Plantilla de Mensaje</label>
              <textarea
                value={mensajeRecordatorio}
                onChange={(e) => setMensajeRecordatorio(e.target.value)}
                rows={3}
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg p-3 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none leading-relaxed font-sans"
              />
              <p className="text-[9px] text-slate-light italic">Variables permitidas: {"{paciente}"}, {"{tratamiento}"}, {"{fecha_hora}"}</p>
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

        {/* Sección 4: Base de Datos y Datos Semilla */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-4">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
            <Database size={16} className="text-satin-copper" /> Mantenimiento del Sistema
          </h3>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-dark">Restaurar Base de Datos Local</p>
              <p className="text-[10px] text-slate-medium">Vuelve a cargar los datos semilla predeterminados de la clínica (incluidos los pacientes de prueba).</p>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="bg-red-500 hover:bg-red-600 text-pure-white text-[10px] font-bold tracking-wider uppercase py-2.5 px-4.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-red-500/10 cursor-pointer"
            >
              <RefreshCw size={13} /> Restaurar Semilla
            </button>
          </div>
        </section>

        {/* Save button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="satin-button text-pure-white text-[10px] font-bold tracking-[0.15em] uppercase py-3 px-8 rounded-xl shadow-lg shadow-satin-copper/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} /> Guardar Ajustes
          </button>
        </div>
      </form>
    </div>
  );

  function hoursRecordatorio(val: number) {
    return val;
  }
};
