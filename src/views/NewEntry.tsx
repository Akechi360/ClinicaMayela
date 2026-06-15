import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbPacientes, dbTratamientos, dbHistoriales, dbConsentimientos } from '../services/db';
import { supabase } from '../services/supabase';
import type { Paciente, Tratamiento, Consentimiento, MapaFacialCoordenada } from '../types/database.types';
import { FaceCanvas } from '../components/FaceCanvas';
import { SignaturePadModal } from '../components/SignaturePadModal';
import { useToast } from '../components/Toast';
import { Upload, Loader2, CheckCircle, ChevronRight, ChevronLeft, PenLine } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Paciente & Tratamiento' },
  { id: 2, label: 'Detalles Clínicos' },
  { id: 3, label: 'Mapa Facial' },
  { id: 4, label: 'Consentimiento' },
];

export const NewEntry: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [pacienteId, setPacienteId]       = useState(searchParams.get('pacienteId') ?? '');
  const [tratamientoId, setTratamientoId]   = useState('');
  const [fecha, setFecha]                 = useState(new Date().toISOString().split('T')[0]);

  // Step 2
  const [producto, setProducto]           = useState('');
  const [cantidad, setCantidad]           = useState('');
  const [lote, setLote]                   = useState('');
  const [tecnica, setTecnica]             = useState('');
  const [notasMedicas, setNotasMedicas]   = useState('');
  const [fotoAntes, setFotoAntes]         = useState('');
  const [fotoDespues, setFotoDespues]     = useState('');
  const [isUploading, setIsUploading]     = useState<'antes' | 'despues' | null>(null);

  // Step 3
  const [mapaCoords, setMapaCoords]       = useState<MapaFacialCoordenada[]>([]);

  // Step 4
  const [firmaBase64, setFirmaBase64]     = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const { data: pacientes = [] } = useQuery<Paciente[]>({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  const { data: tratamientos = [] } = useQuery<Tratamiento[]>({
    queryKey: ['tratamientos'],
    queryFn: dbTratamientos.listar
  });

  const selectedPaciente    = pacientes.find(p => p.id === pacienteId);
  const selectedTratamiento = tratamientos.find(t => t.id === tratamientoId);

  const guardarMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (!pacienteId || !tratamientoId) throw new Error('Paciente y tratamiento son requeridos.');

      await dbHistoriales.insertar({
        paciente_id: pacienteId,
        tratamiento_id: tratamientoId,
        fecha,
        producto,
        cantidad,
        lote,
        tecnica,
        notas_medicas: notasMedicas,
        foto_antes:    fotoAntes    || null,
        foto_despues:  fotoDespues  || null,
        mapa_facial_coordenadas: mapaCoords
      });

      if (consentAccepted && selectedPaciente && selectedTratamiento) {
        await dbConsentimientos.insertar({
          paciente_id:       pacienteId,
          paciente_nombre:   selectedPaciente.nombre,
          paciente_dni:      selectedPaciente.cedula ?? '',
          tratamiento_nombre: selectedTratamiento.nombre,
          doctor_nombre:     'Dra. Mayela González',
          fecha,
          firma_base64:      firmaBase64,
          estado:            'Activo',
          clausulas:         CLAUSULAS_DEFAULT
        } as Omit<Consentimiento, 'id' | 'created_at'>);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente-historiales', pacienteId] });
      queryClient.invalidateQueries({ queryKey: ['paciente-consentimientos', pacienteId] });
      toast.success('Procedimiento registrado correctamente.');
      navigate(`/pacientes/${pacienteId}`);
    },
    onError: (err) => toast.error(`Error al guardar: ${err.message}`)
  });

  const handlePhotoUpload = async (type: 'antes' | 'despues', file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.warning('La imagen supera el límite de 8MB.');
      return;
    }
    setIsUploading(type);
    const uploadId = toast.loading(`Subiendo foto ${type === 'antes' ? 'antes' : 'después'}...`);
    try {
      const path = `${pacienteId}/${Date.now()}_${type}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('pacientes-fotos')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from('pacientes-fotos').getPublicUrl(data.path);
      if (type === 'antes') setFotoAntes(publicUrl);
      else setFotoDespues(publicUrl);
      toast.dismiss(uploadId);
      toast.success(`Foto ${type === 'antes' ? 'antes' : 'después'} cargada.`);
    } catch (err) {
      toast.dismiss(uploadId);
      toast.error(`Error al subir foto: ${(err as Error).message}`);
    } finally {
      setIsUploading(null);
    }
  };

  const canGoNext = () => {
    if (step === 1) return !!pacienteId && !!tratamientoId && !!fecha;
    if (step === 2) return !!producto && !!cantidad && !!tecnica;
    return true;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 px-2 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-medium text-slate-dark mb-1">Nuevo Procedimiento</h2>
        <p className="text-sm text-slate-medium">Registra un nuevo tratamiento en el expediente del paciente.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                step > s.id
                  ? 'bg-muted-olive border-muted-olive text-pure-white'
                  : step === s.id
                  ? 'bg-satin-copper border-satin-copper text-pure-white shadow-md'
                  : 'bg-pure-white/40 border-satin-copper/20 text-slate-light'
              }`}>
                {step > s.id ? <CheckCircle size={14} /> : s.id}
              </div>
              <span className={`text-[8px] uppercase tracking-wider font-bold hidden md:block text-center leading-tight ${
                step === s.id ? 'text-satin-copper' : 'text-slate-light'
              }`}>{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 transition-all ${
                step > s.id ? 'bg-muted-olive/50' : 'bg-satin-copper/15'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-luxury border border-pure-white/40 animate-fadeIn">

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-display font-medium text-slate-dark">Paciente y Tratamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Paciente *</label>
                <select required value={pacienteId} onChange={e => setPacienteId(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold">
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Tratamiento *</label>
                <select required value={tratamientoId} onChange={e => setTratamientoId(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold">
                  <option value="">Seleccionar tratamiento...</option>
                  {tratamientos.map(t => <option key={t.id} value={t.id}>{t.nombre} — ${t.precio}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Fecha del Procedimiento *</label>
                <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-display font-medium text-slate-dark">Detalles Clínicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Producto Utilizado *</label>
                <input type="text" required value={producto} onChange={e => setProducto(e.target.value)} placeholder="ej. Restylane Lyft"
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Cantidad / Dosis *</label>
                <input type="text" required value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="ej. 1.0 ml"
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Lote / Registro Sanitario</label>
                <input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="ej. LOT-2024-ABC"
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Técnica Empleada *</label>
                <input type="text" required value={tecnica} onChange={e => setTecnica(e.target.value)} placeholder="ej. Microcannula, Inyección en bolo"
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">Notas Médicas</label>
              <textarea value={notasMedicas} onChange={e => setNotasMedicas(e.target.value)} rows={4}
                placeholder="Observaciones clínicas, reacciones, plan de seguimiento..."
                className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-xl px-3 py-2.5 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['antes', 'despues'] as const).map(tipo => (
                <div key={tipo}>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1.5 font-bold">
                    Foto {tipo === 'antes' ? 'Antes' : 'Después'} <span className="text-slate-light">(Máx. 8MB)</span>
                  </label>
                  {(tipo === 'antes' ? fotoAntes : fotoDespues) ? (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-satin-copper/20">
                      <img src={tipo === 'antes' ? fotoAntes : fotoDespues} alt={`Foto ${tipo}`} className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => tipo === 'antes' ? setFotoAntes('') : setFotoDespues('')}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] cursor-pointer">×</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border border-dashed border-satin-copper/25 rounded-xl bg-pure-white/20 hover:bg-pure-white/35 transition-all cursor-pointer group">
                      {isUploading === tipo
                        ? <Loader2 size={24} className="text-satin-copper animate-spin" />
                        : <>
                            <Upload size={24} className="text-satin-copper-light group-hover:scale-110 transition-transform mb-2" />
                            <span className="text-[10px] text-slate-light font-semibold">Subir foto {tipo}</span>
                          </>
                      }
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(tipo, f); }} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-medium text-slate-dark">Mapa Facial Interactivo</h3>
              <p className="text-xs text-slate-medium mt-1">Haz clic en el área tratada para marcar los puntos de aplicación.</p>
            </div>
            <FaceCanvas coordinates={mapaCoords} onChange={setMapaCoords} />
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-medium text-slate-dark">Consentimiento Informado</h3>
              <p className="text-xs text-slate-medium mt-1">El paciente debe leer y firmar el consentimiento para completar el registro.</p>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {CLAUSULAS_DEFAULT.map((clausula, idx) => (
                <div key={idx} className="bg-pure-white/20 p-4 rounded-xl border border-satin-copper/10 text-[11px] text-slate-medium leading-relaxed">
                  <span className="font-bold text-slate-dark">{idx + 1}. </span>{clausula}
                </div>
              ))}
            </div>

            {/* Firma */}
            <div>
              <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-2 font-bold">Firma del Paciente</label>
              {firmaBase64 ? (
                <div className="relative">
                  <img src={firmaBase64} alt="Firma" className="w-full h-32 object-contain rounded-xl border border-satin-copper/15 bg-pure-white" />
                  <button type="button" onClick={() => setFirmaBase64(null)}
                    className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-red-500 hover:text-red-700 cursor-pointer">
                    Borrar firma
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSignModal(true)}
                  className="w-full h-32 flex flex-col items-center justify-center border border-dashed border-satin-copper/25 rounded-xl bg-pure-white/20 hover:bg-pure-white/35 transition-all cursor-pointer group gap-2">
                  <PenLine size={24} className="text-satin-copper-light group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-slate-light font-semibold">Toca para firmar</span>
                </button>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                className="w-4 h-4 accent-satin-copper cursor-pointer" />
              <span className="text-xs text-slate-medium leading-snug group-hover:text-slate-dark transition-colors">
                El paciente ha leído, comprende y acepta las condiciones del tratamiento.
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button type="button"
          onClick={() => setStep(prev => (prev > 1 ? (prev - 1) as Step : prev))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 border border-satin-copper/20 text-slate-medium hover:bg-pure-white/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 cursor-pointer">
          <ChevronLeft size={14} /> Anterior
        </button>

        {step < 4 ? (
          <button type="button"
            onClick={() => { if (canGoNext()) setStep(prev => (prev + 1) as Step); }}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-5 py-2.5 satin-button text-pure-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-40 cursor-pointer">
            Siguiente <ChevronRight size={14} />
          </button>
        ) : (
          <button type="button"
            onClick={() => guardarMutation.mutate()}
            disabled={guardarMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 satin-button text-pure-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer">
            {guardarMutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              : <><CheckCircle size={14} /> Guardar Procedimiento</>
            }
          </button>
        )}
      </div>

      {/* Modal firma */}
      <SignaturePadModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSave={(b64) => { setFirmaBase64(b64); setShowSignModal(false); }}
      />
    </div>
  );
};

const CLAUSULAS_DEFAULT: string[] = [
  'He sido informado/a sobre el procedimiento estético que se realizará, incluyendo sus beneficios, riesgos potenciales y alternativas disponibles.',
  'Entiendo que los resultados pueden variar según las características individuales de cada paciente y que no se pueden garantizar resultados específicos.',
  'Acepto que pueden existir efectos secundarios temporales como enrojecimiento, inflamación o moretones en el área tratada.',
  'Confirmo que he informado al médico sobre todas mis condiciones médicas, medicamentos actuales y posibles alergias conocidas.',
  'Autorizo al equipo médico a realizar el procedimiento descrito y cualquier intervención adicional necesaria para mi seguridad durante el tratamiento.',
  'He recibido y comprendo las instrucciones de cuidado post-procedimiento y me comprometo a seguirlas para obtener los mejores resultados.',
];
