import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FlaskConical, Send, X } from 'lucide-react';
import { dbOrdenesLab } from '../services/db';
import { estudiosDePerfil, perfilDeGenero, type PerfilLab } from '../data/laboratorios';
import { enlaceWa } from '../lib/whatsapp';
import type { DoctorProfile, OrdenLaboratorio, Paciente } from '../types/database.types';
import { useToast } from './Toast';

const fechaLarga = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const nombreCompleto = (p: Paciente) => [p.nombre, p.apellido].filter(Boolean).join(' ');
const NOTAS_POR_DEFECTO = 'Asistir en ayunas de 8 a 12 horas, preferiblemente en la mañana.';

async function descargarPdf(o: Pick<OrdenLaboratorio, 'fecha' | 'perfil' | 'estudios' | 'notas'>, paciente: Paciente, doctor?: DoctorProfile | null) {
  const { pdf } = await import('@react-pdf/renderer');
  const { OrdenLaboratorioPDF } = await import('./OrdenLaboratorioPDF');
  const blob = await pdf(
    <OrdenLaboratorioPDF
      pacienteNombre={nombreCompleto(paciente)}
      pacienteDni={paciente.cedula ?? ''}
      fecha={fechaLarga(o.fecha)}
      perfil={o.perfil}
      estudios={o.estudios}
      notas={o.notas}
      doctorNombre={doctor?.nombre ?? 'Dra. Mayela González'}
      doctorEspecialidad={doctor?.especialidad}
      doctorMpps={doctor?.mpps}
      doctorCol={doctor?.col}
      doctorTelefono={doctor?.telefono}
      firma={doctor?.firma_base64}
      sello={doctor?.sello_base64}
    />,
  ).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orden_laboratorio_${nombreCompleto(paciente).replace(/\s+/g, '_').toLowerCase()}_${o.fecha}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const mensajeWa = (paciente: Paciente, doctor: DoctorProfile | null | undefined, estudios: string[], notas?: string | null) =>
  `Hola ${paciente.nombre}, le envío su orden de laboratorio indicada por ${doctor?.nombre ?? 'la Dra. Mayela González'}:\n\n` +
  estudios.map((e) => `• ${e}`).join('\n') +
  (notas ? `\n\n${notas}` : '') +
  '\n\nCuando tenga los resultados, puede enviármelos por este medio.';

/** Modal para emitir una orden de laboratorio según el sexo del paciente (PDF con firma y sello, o envío por WhatsApp). */
export const OrdenLaboratorioModal: React.FC<{ paciente: Paciente; doctor?: DoctorProfile | null; onClose: () => void }> = ({ paciente, doctor, onClose }) => {
  const toast = useToast();
  const qc = useQueryClient();
  const sugerido = perfilDeGenero(paciente.genero);
  const [perfil, setPerfil] = useState<PerfilLab>(sugerido ?? 'Femenino');
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [otros, setOtros] = useState('');
  const [notas, setNotas] = useState(NOTAS_POR_DEFECTO);

  const base = estudiosDePerfil(perfil);
  const estudios = [...base.filter((e) => !excluidos.includes(e)), ...otros.split(',').map((x) => x.trim()).filter(Boolean)];

  const guardar = useMutation({
    mutationFn: () => dbOrdenesLab.insertar({ paciente_id: paciente.id, fecha: new Date().toISOString().split('T')[0], perfil, estudios, notas: notas || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ordenes-lab', paciente.id] }),
  });

  const emitir = async (via: 'pdf' | 'whatsapp') => {
    if (!estudios.length) { toast.warning('Selecciona al menos un estudio.'); return; }
    try {
      const orden = await guardar.mutateAsync();
      if (via === 'pdf') {
        await descargarPdf(orden, paciente, doctor);
        toast.success('Orden de laboratorio descargada.');
      } else {
        const url = enlaceWa(paciente.telefono, mensajeWa(paciente, doctor, estudios, notas));
        if (!url) { toast.error('El paciente no tiene teléfono registrado.'); return; }
        window.open(url, '_blank');
      }
      onClose();
    } catch (e) {
      toast.error(`No se pudo emitir la orden: ${(e as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div role="dialog" aria-modal="true" aria-label="Orden de laboratorio" className="glass-panel w-full max-w-lg rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
          <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider flex items-center gap-2"><FlaskConical size={15} /> Orden de laboratorio</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Perfil según sexo</label>
            <select value={perfil} onChange={(e) => { setPerfil(e.target.value as PerfilLab); setExcluidos([]); }} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-dark">
              <option value="Femenino">Femenino ({estudiosDePerfil('Femenino').length} estudios)</option>
              <option value="Masculino">Masculino ({estudiosDePerfil('Masculino').length} estudios)</option>
            </select>
            {!sugerido && <p className="text-[10px] text-amber-600 mt-1">El paciente no tiene género registrado; elige el perfil o edítalo en su ficha.</p>}
          </div>
          <div className="space-y-1.5">
            <p className="text-[8px] uppercase tracking-wider text-slate-medium font-bold">Estudios</p>
            {base.map((e) => (
              <label key={e} className="flex items-start gap-2 text-[11px] text-slate-dark cursor-pointer">
                <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 accent-[#A891AA]" checked={!excluidos.includes(e)} onChange={() => setExcluidos((x) => (x.includes(e) ? x.filter((i) => i !== e) : [...x, e]))} />
                <span>{e}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Otros estudios (separados por coma)</label>
            <input value={otros} onChange={(e) => setOtros(e.target.value)} placeholder="ej. Ferritina, B12" className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-dark" />
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Indicaciones</label>
            <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-dark resize-none" />
          </div>
        </div>
        <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex flex-wrap justify-end gap-2.5">
          <button type="button" onClick={() => emitir('whatsapp')} disabled={guardar.isPending} className="px-4 py-2 border border-muted-olive/40 text-muted-olive rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-50"><Send size={12} /> WhatsApp</button>
          <button type="button" onClick={() => emitir('pdf')} disabled={guardar.isPending} className="px-4 py-2 bg-satin-copper hover:bg-satin-copper-hover text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-50"><Download size={12} /> Descargar PDF</button>
        </div>
      </div>
    </div>
  );
};

/** Historial de órdenes emitidas para el paciente, con descarga. */
export const OrdenesEmitidas: React.FC<{ paciente: Paciente; doctor?: DoctorProfile | null }> = ({ paciente, doctor }) => {
  const toast = useToast();
  const { data: ordenes = [] } = useQuery({ queryKey: ['ordenes-lab', paciente.id], queryFn: () => dbOrdenesLab.listarPorPaciente(paciente.id) });
  if (!ordenes.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Órdenes emitidas</p>
      <div className="flex flex-wrap gap-2">
        {ordenes.map((o) => (
          <button
            key={o.id}
            onClick={() => descargarPdf(o, paciente, doctor).catch(() => toast.error('No se pudo generar la orden.'))}
            className="text-[10px] font-semibold px-3 py-1.5 rounded-full border border-satin-copper/25 text-satin-copper hover:bg-satin-copper/10 cursor-pointer flex items-center gap-1.5"
          >
            <Download size={11} /> {fechaLarga(o.fecha)} · {o.perfil} ({o.estudios.length})
          </button>
        ))}
      </div>
    </div>
  );
};
