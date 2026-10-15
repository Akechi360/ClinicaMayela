import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, HeartPulse, FileDown } from 'lucide-react';
import { dbHistoriasLongevidad, dbPacientes, dbDoctor } from '../services/db';
import { etiquetaPatologia } from '../data/patologias';
import { LongevidadSeccion } from './LongevidadForm';
import { SECCIONES_LONGEVIDAD, hayDatosLongevidad, limpiarLongevidad, resumenLongevidad, type DatosLongevidad } from '../data/longevidad';
import type { HistoriaLongevidad } from '../types/database.types';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const fechaCorta = (f: string) => new Date(f + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

interface Editor { modo: 'nueva' | 'editar'; id?: string; datos: DatosLongevidad }

/** Pestaña de la ficha: historia clínica de longevidad (una evaluación por fecha; la más reciente primero). */
export const LongevidadTab: React.FC<{ pacienteId: string }> = ({ pacienteId }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);

  // Mismas claves que la ficha del paciente y el perfil: se reutiliza la caché
  const { data: paciente } = useQuery({ queryKey: ['paciente', pacienteId], queryFn: () => dbPacientes.obtener(pacienteId) });
  const { data: doctor } = useQuery({ queryKey: ['doctor'], queryFn: dbDoctor.obtener });

  const { data: historias = [], isLoading } = useQuery({
    queryKey: ['historias-longevidad', pacienteId],
    queryFn: () => dbHistoriasLongevidad.listarPorPaciente(pacienteId),
  });

  const actual: HistoriaLongevidad | undefined = useMemo(
    () => historias.find((h) => h.id === seleccion) ?? historias[0],
    [historias, seleccion],
  );

  const refrescar = () => queryClient.invalidateQueries({ queryKey: ['historias-longevidad', pacienteId] });

  const guardar = useMutation({
    mutationFn: async (e: Editor) => {
      const datos = limpiarLongevidad(e.datos);
      if (e.modo === 'editar' && e.id) return dbHistoriasLongevidad.actualizar(e.id, datos);
      return dbHistoriasLongevidad.insertar({ paciente_id: pacienteId, origen: 'consulta', datos });
    },
    onSuccess: (h) => {
      refrescar();
      setSeleccion(h.id);
      setEditor(null);
      toast.success('Historia de longevidad guardada.');
    },
    onError: (err: Error) => toast.error(`No se pudo guardar: ${err.message}`),
  });

  const eliminar = useMutation({
    mutationFn: dbHistoriasLongevidad.eliminar,
    onSuccess: () => { refrescar(); setSeleccion(null); toast.success('Evaluación eliminada.'); },
    onError: (err: Error) => toast.error(`No se pudo eliminar: ${err.message}`),
  });

  const descargarPdf = async () => {
    if (!actual || !paciente) return;
    setGenerando(true);
    try {
      const larga = (f: string) => new Date(f.length === 10 ? f + 'T00:00:00' : f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      const nac = paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento + 'T00:00:00') : null;
      const edad = nac ? Math.floor((Date.now() - nac.getTime()) / 31557600000) : null;
      const motivo = paciente.notas?.match(/Motivo de consulta:\s*(.+)/i)?.[1] ?? null;
      const { pdf } = await import('@react-pdf/renderer');
      const { HistoriaLongevidadPDF } = await import('./HistoriaLongevidadPDF');
      const blob = await pdf(
        <HistoriaLongevidadPDF
          paciente={{
            nombre: [paciente.nombre, paciente.apellido].filter(Boolean).join(' '),
            cedula: paciente.cedula, fechaNacimiento: nac ? larga(paciente.fecha_nacimiento!) : null, edad,
            sexo: paciente.genero, telefono: paciente.telefono, email: paciente.email,
            expediente: paciente.id.slice(0, 8).toUpperCase(),
            patologias: (paciente.patologias ?? []).map(etiquetaPatologia),
            alergias: paciente.alergias, antecedentes: paciente.antecedentes, estaturaCm: paciente.estatura_cm, motivo,
          }}
          fechaEvaluacion={larga(actual.fecha)}
          origen={actual.origen}
          datos={actual.datos as DatosLongevidad}
          fechaEmision={larga(new Date().toISOString())}
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
      a.download = `historia_longevidad_${paciente.nombre.replace(/\s+/g, '_').toLowerCase()}_${actual.fecha}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error('No se pudo generar el PDF.');
    } finally {
      setGenerando(false);
    }
  };

  if (isLoading) return <p className="py-8 text-center text-xs text-slate-light">Cargando…</p>;

  const resumen = actual ? resumenLongevidad(actual.datos) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-medium text-slate-dark">Historia clínica de longevidad</h3>
          <p className="text-[11px] text-slate-light">Estilo de vida, antecedentes familiares, sueño, nutrición y tratamientos previos. Cada evaluación queda con su fecha.</p>
        </div>
        <button
          onClick={() => setEditor({ modo: 'nueva', datos: actual ? (actual.datos as DatosLongevidad) : {} })}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-satin-copper px-4 py-2 text-[11px] font-bold text-pure-white transition-all hover:bg-satin-copper-hover"
        >
          <Plus size={13} /> {actual ? 'Nueva evaluación' : 'Registrar historia'}
        </button>
      </div>

      {historias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-satin-copper/25 bg-pure-white/20 p-8 text-center">
          <HeartPulse className="mx-auto mb-2 text-satin-copper-light" size={26} />
          <p className="text-xs text-slate-medium">Aún no hay historia de longevidad para este paciente.</p>
          <p className="mt-1 text-[11px] text-slate-light">Puedes enviarla al paciente con la ficha de ingreso (casilla "Incluir historia de longevidad") o registrarla aquí.</p>
        </div>
      ) : (
        <>
          {historias.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {historias.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSeleccion(h.id)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                    actual?.id === h.id ? 'border-satin-copper bg-satin-copper/15 text-satin-copper' : 'border-satin-copper/20 text-slate-medium'
                  }`}
                >
                  {fechaCorta(h.fecha)}{h.origen === 'ficha' ? ' · paciente' : ''}
                </button>
              ))}
            </div>
          )}

          {actual && (
            <div className="space-y-4 rounded-2xl border border-satin-copper/15 bg-pure-white/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-satin-copper">
                  Evaluación del {fechaCorta(actual.fecha)} · {actual.origen === 'ficha' ? 'declarada por el paciente' : 'registrada en consulta'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={descargarPdf}
                    disabled={generando || !paciente}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-satin-copper/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-satin-copper hover:bg-satin-copper/10 disabled:opacity-50"
                  >
                    <FileDown size={11} /> {generando ? 'Generando…' : 'PDF'}
                  </button>
                  <button onClick={() => setEditor({ modo: 'editar', id: actual.id, datos: actual.datos as DatosLongevidad })}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-satin-copper/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-satin-copper hover:bg-satin-copper/10">
                    <Pencil size={11} /> Editar
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ title: 'Eliminar evaluación', message: '¿Desea eliminar esta evaluación de la historia de longevidad?', severity: 'danger' });
                      if (ok) eliminar.mutate(actual.id);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {!hayDatosLongevidad(actual.datos as DatosLongevidad) && <p className="text-xs text-slate-light">Esta evaluación no tiene respuestas.</p>}
              {resumen.map((s) => (
                <div key={s.seccion}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-medium">{s.seccion}</p>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                    {s.lineas.map((l) => (
                      <div key={l.label} className="text-xs">
                        <dt className="text-slate-light">{l.label}</dt>
                        <dd className="font-semibold text-slate-dark">{l.valor}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editor && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-dark/40 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="long-title" className="glass-panel my-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-pure-white/50 shadow-luxury">
            <div className="flex items-center justify-between border-b border-satin-copper/10 bg-pure-white/20 px-5 py-4">
              <h3 id="long-title" className="font-display text-sm font-medium uppercase tracking-wider text-slate-dark">
                {editor.modo === 'editar' ? 'Editar evaluación' : 'Nueva evaluación de longevidad'}
              </h3>
              <button onClick={() => setEditor(null)} aria-label="Cerrar" className="cursor-pointer border-none bg-transparent text-slate-light hover:text-slate-dark"><X size={16} /></button>
            </div>
            <div className="space-y-3 p-5">
              {editor.modo === 'nueva' && hayDatosLongevidad(editor.datos) && (
                <p className="rounded-lg bg-satin-copper/10 px-3 py-2 text-[11px] text-slate-medium">
                  Se partió de la evaluación anterior para ahorrarte tipeo. Ajusta lo que cambió; la anterior se conserva.
                </p>
              )}
              {SECCIONES_LONGEVIDAD.map((sec, i) => (
                <details key={sec.id} open={i === 0} className="rounded-xl border border-satin-copper/15 bg-pure-white/30">
                  <summary className="cursor-pointer select-none px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-dark">{sec.titulo}</summary>
                  <div className="border-t border-satin-copper/10 p-4">
                    <LongevidadSeccion
                      seccion={sec}
                      valor={editor.datos[sec.id]}
                      onChange={(parche) => setEditor((e) => (e ? { ...e, datos: { ...e.datos, [sec.id]: { ...e.datos[sec.id], ...parche } } } : e))}
                    />
                  </div>
                </details>
              ))}
            </div>
            <div className="flex justify-end gap-2.5 border-t border-satin-copper/10 bg-pure-white/20 px-5 py-3.5">
              <button onClick={() => setEditor(null)} className="cursor-pointer rounded-lg border border-slate-medium/20 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-medium hover:bg-slate-medium/5">Cancelar</button>
              <button
                onClick={() => guardar.mutate(editor)}
                disabled={guardar.isPending}
                className="satin-button cursor-pointer rounded-lg px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-pure-white disabled:opacity-50"
              >
                {guardar.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
