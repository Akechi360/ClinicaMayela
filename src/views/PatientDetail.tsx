import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbPacientes, dbHistoriales, dbCitas, dbTransacciones, dbExamenes, dbRecipes, dbDoctor, dbConsentimientos } from '../services/db';
import { supabase } from '../services/supabase';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { FaceCanvas } from '../components/FaceCanvas';
import { ComposicionCorporalTab } from '../components/ComposicionCorporalTab';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import type { ExamenLaboratorio, RecipeMedico, Consentimiento, Paciente, DoctorProfile, MapaFacialCoordenada } from '../types/database.types';
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  FileText,
  Plus,
  Map,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Trash2,
  Download,
  Printer,
  X
} from 'lucide-react';

type ActiveTab = 'historial' | 'mapa' | 'citas' | 'finanzas' | 'examenes' | 'recipes' | 'consentimientos' | 'composicion';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<ActiveTab>('historial');
  const queryClient = useQueryClient();

  const [showExamenModal, setShowExamenModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const [examenTitulo, setExamenTitulo] = useState('');
  const [examenFecha, setExamenFecha] = useState(new Date().toISOString().split('T')[0]);
  const [examenNotas, setExamenNotas] = useState('');
  const [examenArchivoUrl, setExamenArchivoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [recipeMedicamentos, setRecipeMedicamentos] = useState('');
  const [recipeIndicaciones, setRecipeIndicaciones] = useState('');
  const [recipeFecha, setRecipeFecha] = useState(new Date().toISOString().split('T')[0]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const examModalRef = useRef<HTMLFormElement | null>(null);
  const recipeModalRef = useRef<HTMLFormElement | null>(null);

  const { data: paciente, isLoading: loadingPaciente } = useQuery<Paciente | null>({
    queryKey: ['paciente', id],
    queryFn: () => dbPacientes.obtener(id ?? '')
  });

  const { data: doctor } = useQuery<DoctorProfile | null>({
    queryKey: ['doctor-profile'],
    queryFn: dbDoctor.obtener
  });

  const { data: historiales = [], isLoading: loadingHistoriales } = useQuery({
    queryKey: ['paciente-historiales', id],
    queryFn: () => dbHistoriales.listarPorPaciente(id ?? '')
  });

  const { data: citas = [] } = useQuery({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: dbTransacciones.listar
  });

  const { data: examenes = [] } = useQuery<ExamenLaboratorio[]>({
    queryKey: ['paciente-examenes', id],
    queryFn: () => dbExamenes.listarPorPaciente(id ?? '')
  });

  const { data: recipes = [] } = useQuery<RecipeMedico[]>({
    queryKey: ['paciente-recipes', id],
    queryFn: () => dbRecipes.listarPorPaciente(id ?? '')
  });

  const { data: consentimientos = [], isLoading: loadingConsentimientos } = useQuery<Consentimiento[]>({
    queryKey: ['paciente-consentimientos', id],
    queryFn: () => dbConsentimientos.listarPorPaciente(id ?? '')
  });

  const addExamenMutation = useMutation({
    mutationFn: dbExamenes.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente-examenes', id] });
      setShowExamenModal(false);
      setExamenTitulo('');
      setExamenFecha(new Date().toISOString().split('T')[0]);
      setExamenNotas('');
      setExamenArchivoUrl('');
      toast.success('Examen cargado correctamente.');
    },
    onError: (err: Error) => toast.error(`Error al cargar examen: ${err.message}`)
  });

  const deleteExamenMutation = useMutation({
    mutationFn: dbExamenes.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente-examenes', id] });
      toast.success('Examen eliminado.');
    },
    onError: (err: Error) => toast.error(`Error al eliminar: ${err.message}`)
  });

  const addRecipeMutation = useMutation({
    mutationFn: dbRecipes.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente-recipes', id] });
      setShowRecipeModal(false);
      setRecipeMedicamentos('');
      setRecipeIndicaciones('');
      setRecipeFecha(new Date().toISOString().split('T')[0]);
      toast.success('Récipe médico emitido correctamente.');
    },
    onError: (err: Error) => toast.error(`Error al emitir récipe: ${err.message}`)
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: dbRecipes.eliminar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente-recipes', id] });
      toast.success('Récipe eliminado.');
    },
    onError: (err: Error) => toast.error(`Error al eliminar: ${err.message}`)
  });

  useEffect(() => {
    if (!showExamenModal || !examModalRef.current) return;
    const modal = examModalRef.current;
    const previouslyFocused = document.activeElement as HTMLElement;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled])'
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowExamenModal(false); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) { lastFocusable.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === lastFocusable) { firstFocusable.focus(); e.preventDefault(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); previouslyFocused?.focus(); };
  }, [showExamenModal]);

  useEffect(() => {
    if (!showRecipeModal || !recipeModalRef.current) return;
    const modal = recipeModalRef.current;
    const previouslyFocused = document.activeElement as HTMLElement;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled])'
    );
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    if (firstFocusable) setTimeout(() => firstFocusable.focus(), 50);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShowRecipeModal(false); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) { lastFocusable.focus(); e.preventDefault(); }
      } else {
        if (document.activeElement === lastFocusable) { firstFocusable.focus(); e.preventDefault(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); previouslyFocused?.focus(); };
  }, [showRecipeModal]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('El archivo supera el límite de 5MB.');
      e.target.value = '';
      return;
    }
    setIsUploading(true);
    const uploadToastId = toast.loading('Subiendo archivo...');
    try {
      const { data: storageData, error: storageError } = await supabase.storage
        .from('examenes')
        .upload(`${id}/${Date.now()}_${file.name}`, file, { cacheControl: '3600', upsert: false });
      if (storageError) throw new Error(storageError.message);
      const { data: { publicUrl } } = supabase.storage.from('examenes').getPublicUrl(storageData.path);
      setExamenArchivoUrl(publicUrl);
      toast.dismiss(uploadToastId);
      toast.success('Archivo subido correctamente.');
    } catch (err) {
      toast.dismiss(uploadToastId);
      toast.error(`Error al subir el archivo: ${(err as Error).message}`);
      e.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadConsentimiento = async (doc: Consentimiento) => {
    const toastId = toast.loading('Generando PDF del consentimiento...');
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { ConsentimientoPDF } = await import('../components/ConsentimientoPDF');
      const blob = await pdf(
        <ConsentimientoPDF
          pacienteNombre={doc.paciente_nombre}
          pacienteDni={doc.paciente_dni}
          tratamientoNombre={doc.tratamiento_nombre}
          fecha={doc.fecha}
          doctorNombre={doc.doctor_nombre}
          firmaBase64={doc.firma_base64 ?? null}
          clausulas={doc.clausulas ?? []}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consentimiento_${doc.paciente_nombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success('Consentimiento descargado.');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al generar el PDF. Intente de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadExamen = (examen: ExamenLaboratorio) => {
    if (!examen.archivo_url) return;
    const link = document.createElement('a');
    link.href = examen.archivo_url;
    link.download = examen.titulo.replace(/\s+/g, '_').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRecipe = async (recipe: RecipeMedico) => {
    if (!paciente) return;
    const toastId = toast.loading('Generando PDF del récipe...');
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { RecipePDF } = await import('../components/RecipePDF');
      const blob = await pdf(
        <RecipePDF
          pacienteNombre={paciente.nombre}
          pacienteDni={paciente.cedula ?? ''}
          fecha={new Date(recipe.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          doctorNombre={doctor?.nombre ?? 'Dra. Mayela González'}
          doctorEspecialidad={doctor?.especialidad ?? 'Medicina Estética & Bienestar'}
          doctorCedula={doctor?.cedula ?? '12345678-A'}
          doctorMpps={doctor?.mpps}
          doctorCol={doctor?.col}
          medicamentos={recipe.medicamentos}
          indicaciones={recipe.indicaciones}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recipe_${paciente.nombre.replace(/\s+/g, '_').toLowerCase()}_${recipe.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success('Récipe descargado correctamente.');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al generar el récipe PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const queryCitasPaciente = citas.filter((c: { paciente_id?: string }) => c.paciente_id === id);
  const queryTransaccionesPaciente = transacciones.filter((t: { paciente_id?: string }) => t.paciente_id === id);
  const todosLosPuntos = historiales.flatMap(
    (h: { mapa_facial_coordenadas: MapaFacialCoordenada[] }) => h.mapa_facial_coordenadas
  );

  if (loadingPaciente) {
    return <div className="py-12 text-center text-xs text-slate-light">Cargando expediente del paciente...</div>;
  }

  if (!paciente) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-semibold text-slate-dark mb-4">Paciente no encontrado</p>
        <Link to="/pacientes" className="text-xs text-satin-copper font-semibold flex items-center gap-1 justify-center hover:underline">
          <ArrowLeft size={14} /> Volver a la lista
        </Link>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: 'historial',       label: 'Historial Clínico' },
    { id: 'composicion',     label: 'Composición Corporal' },
    { id: 'mapa',            label: 'Mapa Facial' },
    { id: 'citas',           label: 'Citas' },
    { id: 'finanzas',        label: 'Finanzas' },
    { id: 'examenes',        label: 'Exámenes de Lab.' },
    { id: 'recipes',         label: 'Récipes' },
    { id: 'consentimientos', label: 'Consentimientos' },
  ];

  return (
    <div className="space-y-8 px-2">
      {/* Back & Title */}
      <div className="space-y-2 font-sans">
        <Link to="/pacientes" className="text-xs text-slate-medium hover:text-slate-dark flex items-center gap-1 transition-colors w-fit">
          <ArrowLeft size={13} /> Volver a Pacientes
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-satin-copper/10 border border-satin-copper/15 flex items-center justify-center text-lg text-satin-copper font-bold shadow-md">
              {paciente.nombre.split(' ').map((n: string) => n[0]).join('')}
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-medium text-slate-dark flex items-center gap-2 leading-none">
                {paciente.nombre}
                {paciente.es_vip && (
                  <span className="text-[9px] bg-satin-copper/10 border border-satin-copper/20 text-satin-copper font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">VIP</span>
                )}
              </h2>
              <p className="text-[10px] text-slate-light mt-1">Expediente Clínico: #{paciente.id}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/nueva-entrada?pacienteId=${paciente.id}`)}
            className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2"
          >
            <Plus size={15} /> Registrar Procedimiento
          </button>
        </div>
      </div>

      {/* Patient Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 glass-panel p-6 rounded-3xl shadow-luxury border border-pure-white/40 font-sans">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Contacto</p>
          <p className="text-xs text-slate-dark font-semibold flex items-center gap-1.5"><Phone size={11} className="text-slate-light" /> {paciente.telefono}</p>
          <p className="text-xs text-slate-dark font-semibold flex items-center gap-1.5"><Mail size={11} className="text-slate-light" /> {paciente.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Datos Personales</p>
          <p className="text-xs text-slate-dark font-medium">Nacimiento: {new Date(paciente.fecha_nacimiento ?? '').toLocaleDateString()}</p>
          <p className="text-xs text-slate-dark font-medium">Género: {paciente.genero}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Alergias</p>
          <p className="text-xs font-bold text-red-500">{paciente.alergias || 'Ninguna conocida'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Antecedentes Médicos</p>
          <p className="text-xs text-slate-medium italic line-clamp-2 leading-relaxed">{paciente.antecedentes || 'Sin registrar'}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-rose-champagne flex flex-wrap gap-x-6 gap-y-2 font-sans">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3.5 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all duration-300 ${
              activeTab === tab.id
                ? 'border-satin-copper text-satin-copper'
                : 'border-transparent text-slate-light hover:text-slate-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] font-sans">

        {/* Historial */}
        {activeTab === 'historial' && (
          <div className="space-y-8">
            {loadingHistoriales ? (
              <div className="text-center text-xs text-slate-light py-8">Cargando notas de evolución...</div>
            ) : historiales.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-satin-copper/25 rounded-2xl bg-pure-white/15 backdrop-blur-md">
                <FileText className="mx-auto text-slate-light mb-2 opacity-50" size={32} />
                <p className="text-xs text-slate-medium font-semibold">No hay tratamientos registrados para este paciente</p>
                <p className="text-[10px] text-slate-light mt-1">Registra su primer procedimiento con el botón superior.</p>
              </div>
            ) : (
              historiales.map((historial: { id: string; fecha: string; tratamiento?: { nombre?: string }; producto?: string; cantidad?: string; lote?: string; tecnica?: string; notas_medicas?: string; foto_antes?: string; foto_despues?: string }) => (
                <div key={historial.id} className="glass-panel rounded-2xl p-6 md:p-8 luxury-shadow hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/3 space-y-5">
                      <div>
                        <span className="text-[9px] text-satin-copper font-bold uppercase tracking-widest bg-satin-copper/10 px-2.5 py-1 rounded-full">
                          {new Date(historial.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <h3 className="text-lg font-display font-medium text-slate-dark mt-3">{historial.tratamiento?.nombre}</h3>
                      </div>
                      <div className="space-y-3.5 border-t border-rose-champagne pt-4 text-xs">
                        <div className="flex gap-3">
                          <Sparkles size={15} className="text-satin-copper shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-dark">Producto y Cantidad</p>
                            <p className="text-slate-medium mt-0.5">{historial.producto} — {historial.cantidad}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <FileText size={15} className="text-satin-copper shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-dark">Lote / Registro</p>
                            <p className="text-slate-medium mt-0.5">{historial.lote || 'Sin lote'}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Map size={15} className="text-satin-copper shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-dark">Técnica Empleada</p>
                            <p className="text-slate-medium mt-0.5">{historial.tecnica}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-rose-champagne-light/60 p-4 rounded-xl border border-rose-champagne/60 font-sans leading-relaxed relative">
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-satin-copper/20"></div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-1.5">Notas Médicas</p>
                        <p className="text-xs text-slate-medium leading-relaxed italic">&ldquo;{historial.notas_medicas}&rdquo;</p>
                      </div>
                    </div>
                    <div className="w-full lg:w-2/3 flex flex-col md:flex-row gap-6 items-center justify-center">
                      {historial.foto_antes && historial.foto_despues ? (
                        <div className="w-full max-w-xs">
                          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-2.5 text-center tracking-widest">Comparativa Antes / Después</p>
                          <BeforeAfterSlider beforeImage={historial.foto_antes} afterImage={historial.foto_despues} />
                        </div>
                      ) : (
                        <div className="w-full h-60 border border-dashed border-satin-copper/25 rounded-xl flex flex-col items-center justify-center bg-pure-white/10 backdrop-blur-sm">
                          <ImageIcon className="text-slate-light opacity-50 mb-2" size={28} />
                          <p className="text-xs text-slate-medium font-semibold font-display">Sin Registro Fotográfico</p>
                          <p className="text-[10px] text-slate-light mt-0.5">No se subieron fotos para esta sesión.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Composición Corporal */}
        {activeTab === 'composicion' && id && (
          <ComposicionCorporalTab pacienteId={id} />
        )}

        {/* Mapa Facial */}
        {activeTab === 'mapa' && (
          <div className="glass-panel rounded-2xl p-6 md:p-8 luxury-shadow flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="w-full md:w-1/2">
              <FaceCanvas coordinates={todosLosPuntos} readOnly={true} />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <h3 className="text-lg font-display font-medium text-slate-dark">Mapa Acumulado de Inyecciones</h3>
                <p className="text-xs text-slate-medium mt-1">
                  Este gráfico muestra de forma consolidada todos los puntos donde se ha inyectado algún producto a <strong>{paciente.nombre}</strong> a lo largo de sus tratamientos.
                </p>
              </div>
              <div className="border-t border-satin-copper/10 pt-4 space-y-2.5">
                <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-2">Puntos del Historial ({todosLosPuntos.length})</p>
                {todosLosPuntos.map((pt, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-pure-white/15 p-3 rounded-xl border border-satin-copper/10 text-xs hover:bg-pure-white/25 transition-all">
                    <span className="flex items-center gap-2 font-semibold text-slate-dark">
                      <span className="w-5 h-5 rounded-full bg-satin-copper text-pure-white flex items-center justify-center text-[10px] font-bold shadow-sm">{idx + 1}</span>
                      {pt.producto}
                    </span>
                    <span className="font-semibold text-satin-copper">{pt.dosis} {pt.producto.toLowerCase().includes('botox') ? 'U' : 'ml'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Citas */}
        {activeTab === 'citas' && (
          <div className="glass-panel rounded-3xl p-6 shadow-luxury border border-pure-white/40">
            <h3 className="text-base font-display font-medium text-slate-dark mb-4 border-b border-satin-copper/10 pb-3">Registro de Citas</h3>
            {queryCitasPaciente.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-light">No hay citas registradas para este paciente.</div>
            ) : (
              <div className="space-y-3">
                {queryCitasPaciente.map((cita: { id: string; fecha_hora: string; tratamiento?: { nombre?: string }; notas?: string; estado: string }) => (
                  <div key={cita.id} className="p-4 rounded-xl bg-pure-white/15 border border-satin-copper/10 hover:bg-pure-white/25 transition-all duration-300 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-dark flex items-center gap-1.5">
                        <Calendar size={13} className="text-satin-copper-light" />
                        {new Date(cita.fecha_hora).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span className="text-[10px] font-normal text-slate-light">— {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} HS</span>
                      </p>
                      <p className="text-[11px] text-slate-medium">Tratamiento: <span className="font-semibold text-slate-dark">{cita.tratamiento?.nombre}</span></p>
                      {cita.notas && <p className="text-[10px] text-slate-light italic mt-1 font-sans">&ldquo;{cita.notas}&rdquo;</p>}
                    </div>
                    <div>
                      {cita.estado === 'confirmado' && <span className="bg-muted-olive/10 text-muted-olive text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-muted-olive/15">Confirmado</span>}
                      {cita.estado === 'en_sala' && <span className="bg-satin-copper/10 text-satin-copper text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-satin-copper/15 animate-pulse">En Sala</span>}
                      {cita.estado === 'pendiente' && <span className="bg-slate-light/15 text-slate-medium text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-light/20">Pendiente</span>}
                      {cita.estado === 'cancelado' && <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-500/15">Cancelado</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Finanzas */}
        {activeTab === 'finanzas' && (
          <div className="glass-panel rounded-3xl p-6 shadow-luxury border border-pure-white/40 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-display font-medium text-slate-dark">Historial Financiero</h3>
              <div className="text-right">
                <p className="text-[8px] uppercase text-slate-light tracking-wider font-bold">Total Pagado</p>
                <p className="text-xl font-display font-semibold text-slate-dark mt-0.5">
                  {formatCurrency(queryTransaccionesPaciente.filter((t: { estado: string }) => t.estado === 'completado').reduce((sum: number, t: { monto: number }) => sum + Number(t.monto), 0))}
                </p>
              </div>
            </div>
            {queryTransaccionesPaciente.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-light">No hay cobros registrados para este paciente.</div>
            ) : (
              <div className="space-y-3">
                {queryTransaccionesPaciente.map((tr: { id: string; fecha: string; metodo_pago?: string; estado: string; monto: number }) => (
                  <div key={tr.id} className="p-4 rounded-xl bg-pure-white/15 border border-satin-copper/10 hover:bg-pure-white/25 transition-all duration-300 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-dark">
                        {new Date(tr.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-[9px] text-slate-light font-bold tracking-wider uppercase">{tr.metodo_pago ? `VÍA ${tr.metodo_pago}` : 'PAGO PENDIENTE'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        {tr.estado === 'completado' ? (
                          <span className="bg-muted-olive/10 text-muted-olive text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-muted-olive/15">Completado</span>
                        ) : tr.estado === 'pendiente' ? (
                          <span className="bg-satin-copper/10 text-satin-copper text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-satin-copper/15">Pendiente</span>
                        ) : (
                          <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-500/15">Reembolsado</span>
                        )}
                      </div>
                      <div className="text-right w-16">
                        <span className="font-display font-semibold text-slate-dark text-sm">{formatCurrency(Number(tr.monto))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exámenes */}
        {activeTab === 'examenes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-display font-medium text-slate-dark">Exámenes de Laboratorio</h3>
              <button
                onClick={() => setShowExamenModal(true)}
                className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-[11px] font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload size={13} /> Cargar Examen
              </button>
            </div>
            {examenes.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-satin-copper/25 rounded-2xl bg-pure-white/15 backdrop-blur-md">
                <FileText className="mx-auto text-slate-light mb-2 opacity-50" size={32} />
                <p className="text-xs text-slate-medium font-semibold">No hay exámenes de laboratorio registrados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examenes.map((examen) => (
                  <div key={examen.id} className="p-5 rounded-2xl bg-pure-white/15 border border-satin-copper/10 hover:bg-pure-white/25 transition-all duration-300 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-satin-copper font-bold uppercase tracking-widest bg-satin-copper/10 px-2.5 py-1 rounded-full">
                          {new Date(examen.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Eliminar Examen',
                              message: '¿Desea eliminar este examen?',
                              severity: 'danger'
                            });
                            if (ok) deleteExamenMutation.mutate(examen.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <h4 className="text-sm font-display font-medium text-slate-dark">{examen.titulo}</h4>
                      {examen.notas && <p className="text-xs text-slate-medium leading-relaxed font-sans italic">&ldquo;{examen.notas}&rdquo;</p>}
                    </div>
                    {examen.archivo_url && (
                      <button onClick={() => handleDownloadExamen(examen)} className="text-[11px] text-satin-copper font-semibold flex items-center gap-1 hover:underline cursor-pointer border-none bg-transparent w-fit">
                        <Download size={13} /> Descargar / Ver Adjunto
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Récipes */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-display font-medium text-slate-dark">Récipes Médicos</h3>
              <button
                onClick={() => setShowRecipeModal(true)}
                className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-[11px] font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Emitir Récipe
              </button>
            </div>
            {recipes.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-satin-copper/25 rounded-2xl bg-pure-white/15 backdrop-blur-md">
                <FileText className="mx-auto text-slate-light mb-2 opacity-50" size={32} />
                <p className="text-xs text-slate-medium font-semibold">No se han emitido récipes médicos</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="p-5 rounded-2xl bg-pure-white/15 border border-satin-copper/10 hover:bg-pure-white/25 transition-all duration-300 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-satin-copper font-bold uppercase tracking-widest bg-satin-copper/10 px-2.5 py-1 rounded-full">
                          {new Date(recipe.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Eliminar Récipe',
                              message: '¿Desea eliminar este récipe?',
                              severity: 'danger'
                            });
                            if (ok) deleteRecipeMutation.mutate(recipe.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="space-y-3 font-sans">
                        <div>
                          <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Prescripción (Rx)</p>
                          <p className="text-xs text-slate-dark mt-0.5 whitespace-pre-line leading-relaxed font-semibold">{recipe.medicamentos}</p>
                        </div>
                        {recipe.indicaciones && (
                          <div>
                            <p className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Indicaciones</p>
                            <p className="text-xs text-slate-medium mt-0.5 whitespace-pre-line leading-relaxed italic">&ldquo;{recipe.indicaciones}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadRecipe(recipe)}
                      disabled={isGeneratingPdf}
                      className="text-[11px] text-satin-copper font-semibold flex items-center gap-1 hover:underline cursor-pointer border-none bg-transparent disabled:opacity-50 w-fit"
                    >
                      <Printer size={13} /> {isGeneratingPdf ? 'Generando PDF...' : 'Imprimir Récipe (PDF)'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Consentimientos */}
        {activeTab === 'consentimientos' && (
          <div className="space-y-6">
            <h3 className="text-base font-display font-medium text-slate-dark">Consentimientos Informados</h3>
            {loadingConsentimientos ? (
              <p className="text-xs text-slate-light animate-pulse font-semibold">Cargando consentimientos...</p>
            ) : consentimientos.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-satin-copper/25 rounded-2xl bg-pure-white/15 backdrop-blur-md">
                <FileText className="mx-auto text-slate-light mb-2 opacity-50" size={32} />
                <p className="text-xs text-slate-medium font-semibold">No hay consentimientos registrados para este paciente</p>
                <p className="text-[10px] text-slate-light mt-1 font-sans">Puedes gestionar y firmar nuevos consentimientos desde el panel principal de Consentimientos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consentimientos.map((doc) => (
                  <div key={doc.id} className="p-5 rounded-2xl bg-pure-white/15 border border-satin-copper/10 hover:bg-pure-white/25 transition-all duration-300 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-satin-copper font-bold uppercase tracking-widest bg-satin-copper/10 px-2.5 py-1 rounded-full">
                          {new Date(doc.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          doc.estado === 'Activo'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : doc.estado === 'Pendiente'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-slate-300 text-slate-600'
                        }`}>{doc.estado}</span>
                      </div>
                      <h4 className="text-sm font-display font-medium text-slate-dark">{doc.tratamiento_nombre}</h4>
                      <p className="text-[11px] text-slate-light font-semibold">Doctor(a): <span className="text-slate-medium font-bold">{doc.doctor_nombre}</span></p>
                    </div>
                    <button
                      onClick={() => handleDownloadConsentimiento(doc)}
                      disabled={isGeneratingPdf}
                      className="text-[11px] text-satin-copper font-semibold flex items-center gap-1 hover:underline cursor-pointer border-none bg-transparent disabled:opacity-50 w-fit"
                    >
                      <Download size={13} /> {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Consentimiento (PDF)'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Examen */}
      {showExamenModal && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4 select-none">
          <form
            ref={examModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-exam-title"
            onSubmit={(e) => {
              e.preventDefault();
              if (isUploading) return;
              addExamenMutation.mutate({
                paciente_id: id ?? '',
                titulo: examenTitulo,
                fecha: examenFecha,
                notas: examenNotas,
                archivo_url: examenArchivoUrl
              });
            }}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h3 id="modal-exam-title" className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Cargar Examen</h3>
              <button type="button" onClick={() => setShowExamenModal(false)} aria-label="Cerrar" className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Título del Examen</label>
                <input type="text" required placeholder="ej. Perfil Hormonal" value={examenTitulo} onChange={(e) => setExamenTitulo(e.target.value)} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Fecha de Emisión</label>
                <input type="date" required value={examenFecha} onChange={(e) => setExamenFecha(e.target.value)} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Notas o Hallazgos</label>
                <textarea placeholder="Notas adicionales..." value={examenNotas} onChange={(e) => setExamenNotas(e.target.value)} rows={3} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold resize-none" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Adjuntar Documento / Imagen (Máx. 5MB)</label>
                <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold cursor-pointer" />
                {isUploading && <p className="text-[10px] text-satin-copper mt-1 animate-pulse font-semibold">Procesando archivo...</p>}
                {examenArchivoUrl && !isUploading && <p className="text-[10px] text-muted-olive mt-1 font-semibold">✓ Archivo cargado correctamente</p>}
              </div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowExamenModal(false)} className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 transition-all rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">Cancelar</button>
              <button type="submit" disabled={isUploading || addExamenMutation.isPending || !examenTitulo} className="px-4 py-2 bg-satin-copper hover:bg-satin-copper-hover disabled:opacity-50 text-pure-white transition-all rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer">
                {addExamenMutation.isPending ? 'Cargando...' : 'Guardar Examen'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Récipe */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4 select-none">
          <form
            ref={recipeModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-recipe-title"
            onSubmit={(e) => {
              e.preventDefault();
              addRecipeMutation.mutate({
                paciente_id: id ?? '',
                fecha: recipeFecha,
                medicamentos: recipeMedicamentos,
                indicaciones: recipeIndicaciones
              });
            }}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h3 id="modal-recipe-title" className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Emitir Récipe Médico</h3>
              <button type="button" onClick={() => setShowRecipeModal(false)} aria-label="Cerrar" className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Fecha de Emisión</label>
                <input type="date" required value={recipeFecha} onChange={(e) => setRecipeFecha(e.target.value)} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Prescripción (Medicamentos / Dosificación)</label>
                <textarea required placeholder="ej. 1. Restylane Lip Volume 1ml" value={recipeMedicamentos} onChange={(e) => setRecipeMedicamentos(e.target.value)} rows={4} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold resize-none" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Indicaciones Adicionales</label>
                <textarea placeholder="ej. No realizar ejercicio por 24 horas..." value={recipeIndicaciones} onChange={(e) => setRecipeIndicaciones(e.target.value)} rows={3} className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold resize-none" />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowRecipeModal(false)} className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 transition-all rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">Cancelar</button>
              <button type="submit" disabled={addRecipeMutation.isPending || !recipeMedicamentos} className="px-4 py-2 bg-satin-copper hover:bg-satin-copper-hover disabled:opacity-50 text-pure-white transition-all rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer">
                {addRecipeMutation.isPending ? 'Guardando...' : 'Emitir Récipe'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
