import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbPacientes, dbDoctor } from '../services/db';
import { dbProtocolosPeptidos } from '../services/peptidesService';
import { PEPTIDES_CATALOG, CONTRAINDICATIONS } from '../data/peptidesData';
import { useToast } from '../components/Toast';
import type { Paciente } from '../types/database.types';
import type { Peptide, SelectedPeptide, PeptideProtocol } from '../types/peptides';
import { CATEGORY_LABELS, CATEGORY_COLORS, ROUTE_LABELS } from '../types/peptides';
import {
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  FilePlus,
  Save,
  Beaker,
  User,
  Calendar,
  Clock,
  Syringe,
  ShieldAlert,
  FlaskConical,
  X,
} from 'lucide-react';

const CANCER_KEYWORDS = ['cáncer', 'cancer', 'neoplasia', 'tumor', 'carcinoma', 'linfoma', 'leucemia', 'melanoma', 'sarcoma', 'metástasis'];

function detectCancerFlag(paciente: Paciente): boolean {
  const fields = [paciente.antecedentes, paciente.notas, paciente.alergias].filter(Boolean).join(' ').toLowerCase();
  return CANCER_KEYWORDS.some(kw => fields.includes(kw));
}

export const PeptidesProtocol: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const preselectedPatientId = searchParams.get('pacienteId') ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [showPatientSearch, setShowPatientSearch] = useState(!preselectedPatientId);

  const [selectedPeptides, setSelectedPeptides] = useState<SelectedPeptide[]>([]);
  const [expandedPeptide, setExpandedPeptide] = useState<string | null>(null);

  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [duracionSemanas, setDuracionSemanas] = useState(8);
  const [intervaloSeguimiento, setIntervaloSeguimiento] = useState(15);
  const [notasMedico, setNotasMedico] = useState('');

  const { data: pacientes = [] } = useQuery<Paciente[]>({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar,
  });

  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPatients = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase();
    return pacientes.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.apellido?.toLowerCase().includes(q)) ||
      (p.cedula?.toLowerCase().includes(q)) ||
      (p.telefono?.includes(q))
    ).slice(0, 8);
  }, [pacientes, debouncedQuery]);

  const selectedPatient = useMemo(
    () => pacientes.find(p => p.id === selectedPatientId) ?? null,
    [pacientes, selectedPatientId]
  );

  const hasCancer = selectedPatient ? detectCancerFlag(selectedPatient) : false;

  const patientContraindications = useMemo(() => {
    if (!selectedPatient) return [];
    const fields = [selectedPatient.antecedentes, selectedPatient.notas].filter(Boolean).join(' ').toLowerCase();
    return CONTRAINDICATIONS.filter(c =>
      fields.includes(c.condition.toLowerCase())
    );
  }, [selectedPatient]);

  const togglePeptide = useCallback((peptide: Peptide) => {
    setSelectedPeptides(prev => {
      const exists = prev.find(sp => sp.peptide.id === peptide.id);
      if (exists) return prev.filter(sp => sp.peptide.id !== peptide.id);
      return [...prev, { peptide }];
    });
  }, []);

  const updatePeptideCustom = useCallback((peptideId: string, field: 'customDose' | 'customNotes', value: string) => {
    setSelectedPeptides(prev =>
      prev.map(sp => sp.peptide.id === peptideId ? { ...sp, [field]: value } : sp)
    );
  }, []);

  const isPeptideSelected = useCallback((id: string) => selectedPeptides.some(sp => sp.peptide.id === id), [selectedPeptides]);

  const saveMutation = useMutation({
    mutationFn: (data: Omit<PeptideProtocol, 'id' | 'created_at'>) =>
      dbProtocolosPeptidos.insertar(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['protocolos-peptidos'] });
      toast.success('Protocolo peptídico guardado correctamente.');
      navigate(`/peptides/consent/${saved.id}`);
    },
    onError: (err: Error) => toast.error(`Error al guardar: ${err.message}`),
  });

  const handleSave = (andNavigate?: 'consent' | 'report') => {
    if (!selectedPatientId) { toast.warning('Selecciona un paciente.'); return; }
    if (selectedPeptides.length === 0) { toast.warning('Selecciona al menos un péptido.'); return; }
    if (hasCancer) { toast.error('No se puede crear protocolo: paciente con diagnóstico de cáncer activo.'); return; }

    const protocol: Omit<PeptideProtocol, 'id' | 'created_at'> = {
      paciente_id: selectedPatientId,
      doctor_id: doctor?.id ?? '',
      fecha_inicio: fechaInicio,
      peptidos_seleccionados: selectedPeptides,
      intervalo_seguimiento: intervaloSeguimiento,
      notas_medico: notasMedico,
      estado: 'borrador',
      consentimiento_firmado: false,
      duracion_semanas: duracionSemanas,
    };

    saveMutation.mutate(protocol, {
      onSuccess: (saved) => {
        if (andNavigate === 'consent') navigate(`/peptides/consent/${saved.id}`);
        else if (andNavigate === 'report') navigate(`/peptides/report/${saved.id}`);
      },
    });
  };

  const selectPatient = (p: Paciente) => {
    setSelectedPatientId(p.id);
    setShowPatientSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-2 pb-12">
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-emerald-50 flex items-center justify-center">
            <FlaskConical size={20} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-medium text-slate-dark tracking-wide">Protocolos Peptídicos</h2>
            <p className="text-sm text-slate-medium">Medicina regenerativa y optimización biológica</p>
          </div>
        </div>
      </div>

      {/* Sección 1: Buscador de paciente */}
      <section className="glass-panel rounded-2xl p-6 luxury-shadow space-y-4">
        <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-dark flex items-center gap-2">
          <User size={14} className="text-rosa-petalo" /> Paciente
        </h3>

        {selectedPatient && !showPatientSearch ? (
          <div className="flex items-center justify-between gap-4 bg-white rounded-xl p-4 border border-white/60 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rosa-petalo/20 to-satin-copper-light/20 border border-rosa-petalo/20 flex items-center justify-center text-sm text-rosa-petalo font-bold shrink-0 overflow-hidden">
                {selectedPatient.foto_perfil ? (
                  <img src={selectedPatient.foto_perfil} alt="" className="w-full h-full object-cover" />
                ) : (
                  [selectedPatient.nombre, selectedPatient.apellido].filter(Boolean).map(n => n![0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>
              <div>
                <p className="font-display font-medium text-slate-dark text-sm">
                  {[selectedPatient.nombre, selectedPatient.apellido].filter(Boolean).join(' ')}
                  {selectedPatient.es_vip && (
                    <span className="ml-2 text-[7px] bg-rosa-petalo/10 border border-rosa-petalo/20 text-rosa-petalo font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">VIP</span>
                  )}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-light mt-0.5">
                  {selectedPatient.fecha_nacimiento && (
                    <span className="flex items-center gap-1"><Calendar size={10} /> {selectedPatient.fecha_nacimiento}</span>
                  )}
                  {selectedPatient.telefono && (
                    <span>{selectedPatient.telefono}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setShowPatientSearch(true); setSelectedPatientId(''); }}
              className="text-[9px] font-bold uppercase tracking-wider text-slate-light hover:text-slate-dark border border-slate-light/20 hover:border-slate-light/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-light" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-white/60 text-sm text-slate-dark placeholder:text-slate-light/60 focus:outline-none focus:ring-2 focus:ring-rosa-petalo/30 transition-all"
                autoFocus
              />
            </div>
            {filteredPatients.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-xl border border-white/60 shadow-luxury max-h-64 overflow-y-auto">
                {filteredPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rosa-petalo/5 transition-colors text-left cursor-pointer border-b border-[#F7F8FA] last:border-b-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rosa-petalo/15 to-satin-copper-light/15 flex items-center justify-center text-[10px] text-rosa-petalo font-bold shrink-0">
                      {[p.nombre, p.apellido].filter(Boolean).map(n => n![0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-dark">{[p.nombre, p.apellido].filter(Boolean).join(' ')}</p>
                      <p className="text-[10px] text-slate-light">{p.cedula || p.telefono || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerta de cáncer */}
        {hasCancer && selectedPatient && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Contraindicación Absoluta Detectada</p>
              <p className="text-xs text-red-600 mt-1">
                Se detectó un posible diagnóstico de cáncer activo en los antecedentes del paciente. Los protocolos peptídicos están contraindicados en pacientes con neoplasias activas por riesgo de estimulación del crecimiento tumoral.
              </p>
            </div>
          </div>
        )}

        {/* Contraindicaciones relativas */}
        {patientContraindications.filter(c => c.severity === 'relative').length > 0 && !hasCancer && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-700">Precauciones Relativas</p>
              <ul className="text-[11px] text-amber-600 mt-1 space-y-0.5">
                {patientContraindications.filter(c => c.severity === 'relative').map(c => (
                  <li key={c.condition}>• {c.condition} — afecta: {c.affectedPeptides.map(id => PEPTIDES_CATALOG.find(p => p.id === id)?.name).filter(Boolean).join(', ')}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Sección 2: Catálogo de péptidos */}
      <section className="space-y-4">
        <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-dark flex items-center gap-2 px-1">
          <Beaker size={14} className="text-rosa-petalo" /> Catálogo de Péptidos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PEPTIDES_CATALOG.map(peptide => {
            const selected = isPeptideSelected(peptide.id);
            const expanded = expandedPeptide === peptide.id;
            const sp = selectedPeptides.find(s => s.peptide.id === peptide.id);

            return (
              <div
                key={peptide.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  selected
                    ? 'border-rosa-petalo/40 shadow-md bg-white'
                    : 'border-white/60 bg-white/80 hover:border-rosa-petalo/20 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[peptide.category]}`}>
                          {CATEGORY_LABELS[peptide.category]}
                        </span>
                      </div>
                      <h4 className="font-display font-medium text-slate-dark text-base">{peptide.name}</h4>
                      <p className="text-[11px] text-slate-medium mt-1 leading-relaxed">{peptide.indication}</p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => togglePeptide(peptide)}
                      disabled={hasCancer}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        selected
                          ? 'bg-rosa-petalo text-white shadow-sm'
                          : 'bg-[#F7F8FA] text-slate-light hover:bg-rosa-petalo/10 hover:text-rosa-petalo'
                      } ${hasCancer ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {selected ? <Check size={14} /> : <FlaskConical size={14} />}
                    </button>
                  </div>

                  {/* Quick info */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[9px] text-slate-light bg-[#F7F8FA] px-2 py-1 rounded-md flex items-center gap-1">
                      <Syringe size={10} /> {ROUTE_LABELS[peptide.administration.route]}
                    </span>
                    <span className="text-[9px] text-slate-light bg-[#F7F8FA] px-2 py-1 rounded-md flex items-center gap-1">
                      <Clock size={10} /> {peptide.administration.cycleDuration}
                    </span>
                    <span className="text-[9px] text-slate-light bg-[#F7F8FA] px-2 py-1 rounded-md">
                      {peptide.doses.standard} {peptide.doses.unit}
                    </span>
                  </div>

                  {/* Expand button */}
                  <button
                    onClick={() => setExpandedPeptide(expanded ? null : peptide.id)}
                    className="mt-3 text-[9px] font-bold uppercase tracking-wider text-rosa-petalo hover:text-rosa-petalo/80 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {expanded ? 'Menos detalles' : 'Ver detalles'}
                    {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-[#F0F1F3] px-5 py-4 space-y-4 bg-[#FAFBFC] animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      <div>
                        <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Dosis</p>
                        <p className="text-slate-medium">Estándar: {peptide.doses.standard} {peptide.doses.unit}</p>
                        <p className="text-slate-light">Rango: {peptide.doses.range} {peptide.doses.unit}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Administración</p>
                        <p className="text-slate-medium">{ROUTE_LABELS[peptide.administration.route]}</p>
                        <p className="text-slate-light">{peptide.administration.frequency}</p>
                      </div>
                    </div>

                    {peptide.administration.preparation && (
                      <div>
                        <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Preparación</p>
                        <p className="text-[11px] text-slate-medium leading-relaxed">{peptide.administration.preparation}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Estudios Previos Recomendados</p>
                      <ul className="text-[11px] text-slate-medium space-y-0.5">
                        {peptide.recommendedStudies.map(s => <li key={s}>• {s}</li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Contraindicaciones</p>
                      <ul className="text-[11px] text-red-600/80 space-y-0.5">
                        {peptide.contraindications.map(c => <li key={c}>• {c}</li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Efectos Adversos</p>
                      <ul className="text-[11px] text-amber-600/80 space-y-0.5">
                        {peptide.sideEffects.map(s => <li key={s}>• {s}</li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="font-bold text-slate-dark uppercase tracking-wider text-[9px] mb-1">Evidencia Científica</p>
                      <p className="text-[11px] text-slate-medium leading-relaxed">{peptide.evidence}</p>
                    </div>

                    {/* Custom dose/notes for selected peptides */}
                    {selected && sp && (
                      <div className="border-t border-[#EEEEF0] pt-3 space-y-2">
                        <p className="font-bold text-rosa-petalo uppercase tracking-wider text-[9px]">Personalización</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-slate-light font-medium uppercase tracking-wider">Dosis personalizada</label>
                            <input
                              type="text"
                              value={sp.customDose ?? ''}
                              onChange={e => updatePeptideCustom(peptide.id, 'customDose', e.target.value)}
                              placeholder={`${peptide.doses.standard} ${peptide.doses.unit}`}
                              className="w-full mt-1 px-3 py-2 rounded-lg border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-light font-medium uppercase tracking-wider">Notas</label>
                            <input
                              type="text"
                              value={sp.customNotes ?? ''}
                              onChange={e => updatePeptideCustom(peptide.id, 'customNotes', e.target.value)}
                              placeholder="Indicaciones específicas..."
                              className="w-full mt-1 px-3 py-2 rounded-lg border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sección 3: Resumen del protocolo */}
      {selectedPeptides.length > 0 && (
        <section className="glass-panel rounded-2xl p-6 luxury-shadow space-y-5">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-dark flex items-center gap-2">
            <FileText size={14} className="text-rosa-petalo" /> Resumen del Protocolo
          </h3>

          {/* Péptidos seleccionados */}
          <div className="space-y-2">
            {selectedPeptides.map(sp => (
              <div key={sp.peptide.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-white/60">
                <div className="flex items-center gap-3">
                  <span className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[sp.peptide.category]}`}>
                    {CATEGORY_LABELS[sp.peptide.category]}
                  </span>
                  <span className="text-xs font-semibold text-slate-dark">{sp.peptide.name}</span>
                  <span className="text-[10px] text-slate-light">
                    {sp.customDose || sp.peptide.doses.standard} {sp.peptide.doses.unit} — {ROUTE_LABELS[sp.peptide.administration.route]}
                  </span>
                </div>
                <button
                  onClick={() => togglePeptide(sp.peptide)}
                  className="text-slate-light hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] text-slate-light font-bold uppercase tracking-wider">Fecha de inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-light font-bold uppercase tracking-wider">Duración (semanas)</label>
              <select
                value={duracionSemanas}
                onChange={e => setDuracionSemanas(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
              >
                {[4, 6, 8, 10, 12, 16, 20, 24].map(w => (
                  <option key={w} value={w}>{w} semanas</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-light font-bold uppercase tracking-wider">Seguimiento cada</label>
              <select
                value={intervaloSeguimiento}
                onChange={e => setIntervaloSeguimiento(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
              >
                <option value={7}>7 días</option>
                <option value={15}>15 días</option>
                <option value={21}>21 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] text-slate-light font-bold uppercase tracking-wider">Notas del médico</label>
            <textarea
              value={notasMedico}
              onChange={e => setNotasMedico(e.target.value)}
              rows={3}
              placeholder="Indicaciones adicionales, justificación clínica, observaciones..."
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20 resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => handleSave('consent')}
              disabled={saveMutation.isPending || hasCancer}
              className="rosa-button px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              <FilePlus size={14} /> Generar Consentimiento
            </button>
            <button
              onClick={() => handleSave('report')}
              disabled={saveMutation.isPending || hasCancer}
              className="satin-button px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              <FileText size={14} /> Generar Informe PDF
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saveMutation.isPending || hasCancer}
              className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all border border-rosa-petalo/30 text-rosa-petalo hover:bg-rosa-petalo/5 bg-white"
            >
              <Save size={14} /> Guardar Protocolo
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
