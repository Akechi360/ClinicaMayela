import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbPacientes, dbDoctor } from '../services/db';
import { dbProtocolosPeptidos } from '../services/peptidesService';
import { useToast } from '../components/Toast';
import { SignaturePadModal } from '../components/SignaturePadModal';
import { CATEGORY_LABELS, ROUTE_LABELS } from '../types/peptides';
import {
  Printer,
  ArrowLeft,
  CheckCircle,
  PenLine,
} from 'lucide-react';

export const PeptidesConsent: React.FC = () => {
  const { protocolId } = useParams<{ protocolId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [acceptFollow, setAcceptFollow] = useState(false);
  const [acceptRevoke, setAcceptRevoke] = useState(false);
  const [acceptRisk, setAcceptRisk] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);

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

  const signMutation = useMutation({
    mutationFn: () =>
      dbProtocolosPeptidos.actualizar(protocolId!, {
        consentimiento_firmado: true,
        fecha_consentimiento: new Date().toISOString().split('T')[0],
        estado: 'activo',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolo-peptido', protocolId] });
      queryClient.invalidateQueries({ queryKey: ['protocolos-peptidos'] });
      toast.success('Consentimiento firmado correctamente.');
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleSign = (signature: string) => {
    setFirmaBase64(signature);
    setShowSignModal(false);
    signMutation.mutate();
  };

  const handlePrint = () => window.print();

  const allAccepted = acceptFollow && acceptRevoke && acceptRisk;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="w-8 h-8 border-2 border-rosa-petalo/30 border-t-rosa-petalo rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-light mt-4">Cargando protocolo...</p>
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
      {/* Nav buttons — hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs text-slate-medium hover:text-slate-dark transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rosa-button px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
        >
          <Printer size={14} /> Imprimir / PDF
        </button>
      </div>

      {/* Document */}
      <div ref={printRef} className="bg-white rounded-2xl p-8 md:p-12 shadow-luxury print:shadow-none print:rounded-none print:p-0 space-y-8 font-sans text-slate-dark">
        {/* Header */}
        <div className="border-b-2 border-slate-dark pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-display font-semibold text-slate-dark tracking-wide">Consentimiento Informado</h1>
            <p className="text-sm text-rosa-petalo font-medium mt-1">Protocolo de Terapia Peptídica</p>
          </div>
          <div className="text-right text-[10px] text-slate-medium space-y-0.5">
            <p className="font-bold">{doctor?.nombre ?? 'Médico Tratante'}</p>
            <p>{doctor?.especialidad}</p>
            {doctor?.cedula_prof && <p>Cédula Prof: {doctor.cedula_prof}</p>}
            <p>Fecha: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Datos del paciente */}
        <div className="bg-[#FAFBFC] rounded-xl p-4 text-xs space-y-1">
          <p><strong>Paciente:</strong> {patientName}</p>
          {paciente?.cedula && <p><strong>Cédula/DNI:</strong> {paciente.cedula}</p>}
          {paciente?.fecha_nacimiento && <p><strong>Fecha de nacimiento:</strong> {paciente.fecha_nacimiento}</p>}
        </div>

        {/* Estatus regulatorio */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">1. Estatus Regulatorio y Justificación Clínica</h2>
          <p className="text-xs text-slate-medium leading-relaxed">
            Los péptidos terapéuticos incluidos en este protocolo son compuestos de investigación utilizados en el contexto de
            medicina funcional y regenerativa. Algunos cuentan con aprobación regulatoria limitada, mientras que otros se
            utilizan bajo el criterio médico del profesional tratante basándose en la literatura científica disponible.
            El médico ha evaluado los beneficios potenciales frente a los riesgos conocidos y considera que la terapia
            propuesta es apropiada para la condición clínica del paciente.
          </p>
        </div>

        {/* Debate científico */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">2. Reconocimiento del Debate Científico</h2>
          <p className="text-xs text-slate-medium leading-relaxed">
            Entiendo que la terapia con péptidos es un campo en desarrollo. Si bien existe evidencia preclínica y clínica
            temprana que respalda su uso, no todos los compuestos cuentan con ensayos clínicos de Fase III completados.
            Los resultados pueden variar entre pacientes y no se garantizan resultados específicos.
          </p>
        </div>

        {/* Tabla de péptidos */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">3. Péptidos Prescritos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-dark">
                  <th className="text-left py-2 pr-3 font-bold uppercase tracking-wider">Péptido</th>
                  <th className="text-left py-2 pr-3 font-bold uppercase tracking-wider">Categoría</th>
                  <th className="text-left py-2 pr-3 font-bold uppercase tracking-wider">Dosis</th>
                  <th className="text-left py-2 font-bold uppercase tracking-wider">Vía</th>
                </tr>
              </thead>
              <tbody>
                {protocol.peptidos_seleccionados.map(sp => (
                  <tr key={sp.peptide.id} className="border-b border-[#EEEEF0]">
                    <td className="py-2 pr-3 font-semibold">{sp.peptide.name}</td>
                    <td className="py-2 pr-3">{CATEGORY_LABELS[sp.peptide.category]}</td>
                    <td className="py-2 pr-3">{sp.customDose || sp.peptide.doses.standard} {sp.peptide.doses.unit}</td>
                    <td className="py-2">{ROUTE_LABELS[sp.peptide.administration.route]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Riesgos y beneficios por péptido */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">4. Riesgos y Beneficios por Péptido</h2>
          {protocol.peptidos_seleccionados.map(sp => (
            <div key={sp.peptide.id} className="border-l-2 border-rosa-petalo/30 pl-4 py-2 space-y-1">
              <p className="text-xs font-bold text-slate-dark">{sp.peptide.name}</p>
              <p className="text-[11px] text-slate-medium"><strong>Beneficio esperado:</strong> {sp.peptide.indication}</p>
              <p className="text-[11px] text-slate-medium"><strong>Efectos adversos posibles:</strong> {sp.peptide.sideEffects.join(', ')}.</p>
              <p className="text-[11px] text-slate-medium"><strong>Contraindicaciones:</strong> {sp.peptide.contraindications.join('; ')}.</p>
            </div>
          ))}
        </div>

        {/* Cadena de frío */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">5. Cadena de Frío y Origen del Producto</h2>
          <p className="text-xs text-slate-medium leading-relaxed">
            Los péptidos utilizados en este protocolo han sido adquiridos de proveedores certificados con trazabilidad de lotes.
            Se garantiza el mantenimiento de la cadena de frío durante almacenamiento (2-8°C) y transporte.
            Cada producto cuenta con certificado de análisis (COA) que verifica pureza ≥98% y esterilidad.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 print:hidden">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">6. Declaraciones del Paciente</h2>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptFollow}
              onChange={e => setAcceptFollow(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-rosa-petalo focus:ring-rosa-petalo/30"
            />
            <span className="text-xs text-slate-medium leading-relaxed">
              Me comprometo a realizar check-ins de seguimiento cada <strong>{protocol.intervalo_seguimiento} días</strong> durante
              la duración del protocolo ({protocol.duracion_semanas} semanas) y a reportar cualquier efecto adverso de inmediato.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptRevoke}
              onChange={e => setAcceptRevoke(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-rosa-petalo focus:ring-rosa-petalo/30"
            />
            <span className="text-xs text-slate-medium leading-relaxed">
              Entiendo que puedo <strong>revocar este consentimiento en cualquier momento</strong> sin que ello afecte
              la calidad de mi atención médica futura.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptRisk}
              onChange={e => setAcceptRisk(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#D1D5DB] text-rosa-petalo focus:ring-rosa-petalo/30"
            />
            <span className="text-xs text-slate-medium leading-relaxed">
              Asumo los riesgos inherentes a la terapia peptídica descrita, habiendo sido informado(a) adecuadamente.
              Eximo al médico tratante de responsabilidad por resultados no esperados siempre y cuando se haya actuado
              conforme a las mejores prácticas clínicas disponibles.
            </span>
          </label>
        </div>

        {/* Print-only checkbox text */}
        <div className="hidden print:block space-y-3">
          <h2 className="text-sm font-bold text-slate-dark uppercase tracking-wider">6. Declaraciones del Paciente</h2>
          <p className="text-xs text-slate-medium">☐ Me comprometo a realizar check-ins de seguimiento cada {protocol.intervalo_seguimiento} días.</p>
          <p className="text-xs text-slate-medium">☐ Entiendo que puedo revocar este consentimiento en cualquier momento.</p>
          <p className="text-xs text-slate-medium">☐ Asumo los riesgos inherentes, habiendo sido informado(a) adecuadamente.</p>
        </div>

        {/* Firmas */}
        <div className="border-t-2 border-slate-dark pt-6 grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-dark">Firma del Médico</p>
            <div className="h-20 border-b border-slate-dark/30">
              {doctor?.nombre && (
                <p className="text-xs text-slate-medium italic mt-8">{doctor.nombre}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-dark">Firma del Paciente</p>
            <div className="h-20 border-b border-slate-dark/30 relative">
              {firmaBase64 ? (
                <img src={firmaBase64} alt="Firma del paciente" className="h-16 object-contain" />
              ) : (
                <p className="text-xs text-slate-light italic mt-8 print:hidden">Sin firma</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — hidden in print */}
      <div className="flex items-center gap-3 print:hidden">
        {!protocol.consentimiento_firmado && (
          <button
            onClick={() => setShowSignModal(true)}
            disabled={!allAccepted || signMutation.isPending}
            className="rosa-button px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
          >
            <PenLine size={14} /> Firmar Consentimiento
          </button>
        )}
        {protocol.consentimiento_firmado && (
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
            <CheckCircle size={16} /> Consentimiento firmado el {protocol.fecha_consentimiento}
          </div>
        )}
        <button
          onClick={() => navigate(`/peptides/report/${protocolId}`)}
          className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-rosa-petalo/30 text-rosa-petalo hover:bg-rosa-petalo/5 bg-white transition-all"
        >
          Ver Informe Clínico
        </button>
      </div>

      {showSignModal && (
        <SignaturePadModal
          onSave={handleSign}
          onClose={() => setShowSignModal(false)}
        />
      )}
    </div>
  );
};
