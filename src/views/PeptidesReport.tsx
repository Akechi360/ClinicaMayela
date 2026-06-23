import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dbPacientes, dbDoctor } from '../services/db';
import { dbProtocolosPeptidos } from '../services/peptidesService';
import { CATEGORY_LABELS, ROUTE_LABELS } from '../types/peptides';
import {
  Printer,
  ArrowLeft,
  Calendar,
  FlaskConical,
} from 'lucide-react';

function generateFollowUpDates(startDate: string, intervalDays: number, durationWeeks: number): string[] {
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + durationWeeks * 7);
  const dates: string[] = [];
  const current = new Date(start);
  current.setDate(current.getDate() + intervalDays);
  while (current <= endDate) {
    dates.push(current.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));
    current.setDate(current.getDate() + intervalDays);
  }
  return dates;
}

export const PeptidesReport: React.FC = () => {
  const { protocolId } = useParams<{ protocolId: string }>();
  const navigate = useNavigate();

  const { data: protocol, isLoading } = useQuery({
    queryKey: ['protocolo-peptido', protocolId],
    queryFn: () => dbProtocolosPeptidos.obtener(protocolId ?? ''),
    enabled: !!protocolId,
  });

  const { data: paciente } = useQuery({
    queryKey: ['paciente', protocol?.paciente_id],
    queryFn: () => dbPacientes.obtener(protocol!.paciente_id),
    enabled: !!protocol?.paciente_id,
  });

  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener,
  });

  const followUpDates = useMemo(() => {
    if (!protocol) return [];
    return generateFollowUpDates(protocol.fecha_inicio, protocol.intervalo_seguimiento, protocol.duracion_semanas);
  }, [protocol]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-rosa-petalo/30 border-t-rosa-petalo rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-light mt-4">Cargando informe...</p>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-sm text-slate-medium">Protocolo no encontrado.</p>
        <button onClick={() => navigate('/peptides')} className="mt-4 text-xs text-rosa-petalo hover:underline cursor-pointer">
          Volver a Péptidos
        </button>
      </div>
    );
  }

  const patientName = paciente
    ? [paciente.nombre, paciente.apellido].filter(Boolean).join(' ')
    : 'Paciente';

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 pb-12">
      {/* Nav — hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs text-slate-medium hover:text-slate-dark transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rosa-button px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <Printer size={14} /> Imprimir / PDF
        </button>
      </div>

      {/* Report document */}
      <div className="bg-white rounded-2xl p-8 md:p-12 shadow-luxury print:shadow-none print:rounded-none print:p-0 space-y-8 font-sans text-slate-dark print:text-black">
        {/* Header */}
        <div className="border-b-2 border-slate-dark pb-6">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={24} className="text-rosa-petalo print:text-black" />
            <h1 className="text-xl font-display font-semibold tracking-wide">Informe Clínico — Protocolo Peptídico</h1>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-medium mt-4">
            <div className="space-y-1">
              <p><strong>Paciente:</strong> {patientName}</p>
              {paciente?.cedula && <p><strong>Cédula:</strong> {paciente.cedula}</p>}
              {paciente?.fecha_nacimiento && <p><strong>Fecha de nacimiento:</strong> {paciente.fecha_nacimiento}</p>}
            </div>
            <div className="space-y-1 text-right">
              <p><strong>Médico:</strong> {doctor?.nombre ?? 'Médico Tratante'}</p>
              {doctor?.especialidad && <p>{doctor.especialidad}</p>}
              <p><strong>Fecha del informe:</strong> {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-medium">
            <p><strong>Fecha de inicio:</strong> {new Date(protocol.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Duración:</strong> {protocol.duracion_semanas} semanas — Seguimiento cada {protocol.intervalo_seguimiento} días</p>
          </div>
        </div>

        {/* Per-peptide sections */}
        {protocol.peptidos_seleccionados.map((sp, idx) => (
          <section key={sp.peptide.id} className="space-y-4 page-break-inside-avoid">
            <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider border-b border-[#EEEEF0] pb-2">
              {idx + 1}. {sp.peptide.name} — {CATEGORY_LABELS[sp.peptide.category]}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[11px]">
              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Indicación</p>
                <p className="text-slate-medium leading-relaxed">{sp.peptide.indication}</p>
                {sp.customNotes && (
                  <p className="text-slate-medium mt-1"><em>Nota: {sp.customNotes}</em></p>
                )}
              </div>

              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Dosis Prescrita</p>
                <p className="text-slate-medium">
                  {sp.customDose || sp.peptide.doses.standard} {sp.peptide.doses.unit}
                  <span className="text-slate-light"> (rango: {sp.peptide.doses.range} {sp.peptide.doses.unit})</span>
                </p>
              </div>

              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Protocolo de Administración</p>
                <ul className="text-slate-medium space-y-0.5">
                  <li>Vía: {ROUTE_LABELS[sp.peptide.administration.route]}</li>
                  <li>Frecuencia: {sp.peptide.administration.frequency}</li>
                  <li>Duración del ciclo: {sp.peptide.administration.cycleDuration}</li>
                </ul>
              </div>

              {sp.peptide.administration.preparation && (
                <div>
                  <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Preparación</p>
                  <p className="text-slate-medium leading-relaxed">{sp.peptide.administration.preparation}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[11px]">
              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Estudios Previos al Inicio</p>
                <ul className="text-slate-medium space-y-0.5">
                  {sp.peptide.recommendedStudies.map(s => <li key={s}>• {s}</li>)}
                </ul>
              </div>

              <div>
                <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Marcadores de Respuesta Terapéutica</p>
                <ul className="text-slate-medium space-y-0.5">
                  {sp.peptide.recommendedStudies.slice(0, 3).map(s => <li key={s}>• {s} (control a las 4 semanas)</li>)}
                </ul>
              </div>
            </div>

            <div>
              <p className="font-bold text-[10px] uppercase tracking-wider text-slate-dark mb-1">Efectos Adversos y Señales de Alarma</p>
              <div className="text-[11px] text-slate-medium grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="font-semibold text-[10px] text-amber-700 mb-0.5">Efectos esperados:</p>
                  <ul className="space-y-0.5">
                    {sp.peptide.sideEffects.map(e => <li key={e}>• {e}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-[10px] text-red-600 mb-0.5">Señales de alarma (suspender y consultar):</p>
                  <ul className="space-y-0.5">
                    <li>• Reacción alérgica (urticaria, dificultad respiratoria)</li>
                    <li>• Dolor torácico o palpitaciones</li>
                    <li>• Edema significativo</li>
                    <li>• Fiebre persistente</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Notas del médico */}
        {protocol.notas_medico && (
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider border-b border-[#EEEEF0] pb-2">
              Notas del Médico
            </h2>
            <p className="text-[11px] text-slate-medium leading-relaxed whitespace-pre-wrap">{protocol.notas_medico}</p>
          </section>
        )}

        {/* Calendario de seguimiento */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider border-b border-[#EEEEF0] pb-2 flex items-center gap-2">
            <Calendar size={14} /> Calendario de Seguimiento
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {followUpDates.map((date, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-medium bg-[#FAFBFC] rounded-lg px-3 py-2 print:bg-transparent print:border print:border-[#EEEEF0]">
                <span className="w-5 h-5 rounded-full bg-rosa-petalo/10 text-rosa-petalo text-[9px] font-bold flex items-center justify-center print:bg-transparent print:border print:border-black print:text-black">
                  {idx + 1}
                </span>
                <span>{date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="border-t-2 border-slate-dark pt-4 text-[10px] text-slate-light text-center">
          <p>Este informe es confidencial y de uso exclusivo del paciente y su médico tratante.</p>
          <p className="mt-1">{doctor?.nombre} — {doctor?.especialidad}</p>
        </div>
      </div>
    </div>
  );
};
