import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, PenTool, CheckCircle, Clock, Archive, Download, Plus, X, User } from 'lucide-react';
import { SignaturePadModal } from '../components/SignaturePadModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbDoctor, dbPacientes, dbConsentimientos } from '../services/db';
import type { Consentimiento } from '../types/database.types';

// Clausulado base por tipo de tratamiento
const CLAUSULAS_POR_TRATAMIENTO: Record<string, string[]> = {
  'Toxina Botulínica (Botox)': [
    'Entiendo que los efectos suelen manifestarse entre los 3 y 7 días posteriores y tienen una duración de 3 a 5 meses.',
    'Acepto seguir las indicaciones post-tratamiento dadas (no acostarse, frotarse ni hacer deporte en las siguientes 4 horas).',
    'Reconozco que pueden presentarse efectos secundarios menores como cefalea leve, hematomas locales o asimetrías corregibles en el control.',
    'Doy mi conformidad para la realización de fotografías clínicas antes y después del tratamiento con fines de control médico.'
  ],
  'Restylane Kysse (Labios)': [
    'Entiendo que el ácido hialurónico es reabsorbible y los resultados suelen durar de 6 a 12 meses según el metabolismo.',
    'Acepto que tras la inyección es normal presentar inflamación, enrojecimiento y pequeños hematomas transitorios.',
    'Comprendo la remota posibilidad de complicaciones por compresión vascular y que se dispone de hialuronidasa para su manejo inmediato.',
    'Se me ha informado de los cuidados de hidratación posteriores y de evitar la exposición directa a altas temperaturas en las primeras 48 horas.'
  ],
  'Juvéderm Voluma (Pómulos)': [
    'Comprendo que el relleno de volumen facial busca armonizar y recuperar contornos y que sus efectos duran entre 12 y 18 meses.',
    'Acepto que pueden palparse ligeras irregularidades al principio que irán suavizándose en las semanas de integración cutánea.',
    'Reconozco que he declarado todas mis condiciones de salud previas, alergias y antecedentes de implantes permanentes.',
    'Comprendo que los resultados dependen de la estructura anatómica ósea previa y del estado general de soporte cutáneo.'
  ],
  'Juvéderm Volux XC (Mentón/Mandíbula)': [
    'Comprendo que la proyección del contorno mandibular requiere geles de alta cohesividad y elasticidad para simular soporte óseo.',
    'Reconozco que el edema o inflamación puede persistir de 3 a 5 días y es de carácter benigno y autolimitado.',
    'Entiendo las pautas higiénicas de no presionar excesivamente la zona ni dormir boca abajo durante las primeras 72 horas.'
  ]
};

export const Consentimientos: React.FC = () => {
  const queryClient = useQueryClient();

  // Consultar consentimientos reales
  const { data: documentos = [], isLoading: loadingDocumentos } = useQuery({
    queryKey: ['consentimientos'],
    queryFn: dbConsentimientos.listar
  });

  // Consultar pacientes reales
  const { data: pacientes = [] } = useQuery({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  // Consultar perfil de la doctora
  const { data: doctor } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  // Estados de búsqueda, filtros y modales
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Pendiente' | 'Archivado'>('Todos');
  const [selectedDoc, setSelectedDoc] = useState<Consentimiento | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Formulario nuevo consentimiento
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [nuevoPaciente, setNuevoPaciente] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoTratamiento, setNuevoTratamiento] = useState('Toxina Botulínica (Botox)');
  const [nuevoDoctor, setNuevoDoctor] = useState('');

  // Sincronizar el nombre del doctor por defecto
  useEffect(() => {
    if (doctor && !nuevoDoctor) {
      setNuevoDoctor(doctor.nombre);
    }
  }, [doctor]);

  // Sincronizar el documento seleccionado si cambia en la lista
  const selectedDocFromList = useMemo(() => {
    if (!selectedDoc) return null;
    return documentos.find(d => d.id === selectedDoc.id) || selectedDoc;
  }, [documentos, selectedDoc]);

  // Mutaciones
  const addConsentimientoMutation = useMutation({
    mutationFn: dbConsentimientos.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos'] });
      setShowCreateModal(false);
      setSelectedPacienteId('');
      setNuevoPaciente('');
      setNuevoDni('');
    }
  });

  const signConsentimientoMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Consentimiento> }) =>
      dbConsentimientos.actualizar(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos'] });
      setSelectedDoc(data);
    }
  });

  const archiveConsentimientoMutation = useMutation({
    mutationFn: (id: string) => dbConsentimientos.actualizar(id, { estado: 'Archivado' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consentimientos'] });
      setSelectedDoc(data);
    }
  });

  const handleDownloadPdf = async (doc: Consentimiento) => {
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
          firmaBase64={doc.firma_base64 || null}
          clausulas={doc.clausulas || CLAUSULAS_POR_TRATAMIENTO[doc.tratamiento_nombre] || []}
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
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor intente de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Filtrado de documentos
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      const matchesSearch = doc.paciente_nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.paciente_dni.includes(searchQuery) ||
                            doc.tratamiento_nombre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || doc.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documentos, searchQuery, statusFilter]);

  // Guardar nueva firma y cambiar estado del documento
  const handleSaveSignature = (signatureBase64: string) => {
    if (!selectedDocFromList) return;
    signConsentimientoMutation.mutate({
      id: selectedDocFromList.id,
      updates: {
        firma_base64: signatureBase64,
        estado: 'Activo'
      }
    });
  };

  // Crear nuevo documento
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPacienteId || !nuevoPaciente || !nuevoDni) {
      alert('Por favor seleccione un paciente.');
      return;
    }

    addConsentimientoMutation.mutate({
      paciente_id: selectedPacienteId,
      paciente_nombre: nuevoPaciente,
      paciente_dni: nuevoDni,
      tratamiento_nombre: nuevoTratamiento,
      fecha: new Date().toISOString().split('T')[0],
      doctor_nombre: nuevoDoctor,
      estado: 'Pendiente',
      firma_base64: null,
      version: 1,
      clausulas: CLAUSULAS_POR_TRATAMIENTO[nuevoTratamiento] || []
    });
  };

  // Archivar documento
  const handleArchiveDocument = (id: string) => {
    archiveConsentimientoMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y botón de creación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-medium text-slate-dark tracking-wider uppercase">
            Consentimientos Informados
          </h2>
          <p className="text-[11px] text-slate-medium mt-1 font-semibold uppercase tracking-wider">
            Gestión digital de firmas médicas e historial de consentimientos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="satin-button flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-pure-white cursor-pointer shadow-lg"
        >
          <Plus size={14} /> Nuevo Consentimiento
        </button>
      </div>

      {/* Contenedor principal con filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Listado de Documentos (Lado izquierdo) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Filtros */}
          <div className="glass-panel p-4 rounded-2xl border border-pure-white/40 flex flex-col sm:flex-row gap-3 items-center">
            {/* Input Buscar */}
            <div className="relative w-full flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-light" size={14} />
              <input
                type="text"
                placeholder="Buscar paciente, RUT o tratamiento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-pure-white/50 border border-satin-copper/15 rounded-xl pl-9 pr-4 py-2 text-[11px] text-slate-dark placeholder-slate-light focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold"
              />
            </div>
            {/* Select Filtro Estado */}
            <div className="flex bg-rose-champagne/45 p-0.5 rounded-xl border border-rose-champagne/80 shrink-0 w-full sm:w-auto justify-between">
              {(['Todos', 'Activo', 'Pendiente', 'Archivado'] as const).map((estado) => (
                <button
                  key={estado}
                  onClick={() => setStatusFilter(estado)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === estado
                      ? 'bg-slate-dark text-pure-white shadow-sm'
                      : 'text-slate-medium hover:text-slate-dark'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Tarjetas */}
          <div className="space-y-3">
            {loadingDocumentos ? (
              <div className="text-center py-8 text-xs text-slate-medium">Cargando consentimientos...</div>
            ) : documentosFiltrados.length > 0 ? (
              documentosFiltrados.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`floating-row p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all ${
                    selectedDoc?.id === doc.id ? 'border-satin-copper/60 bg-pure-white/60 shadow-lg translate-x-1' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-champagne/40 flex items-center justify-center text-satin-copper">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-dark">{doc.paciente_nombre}</h4>
                      <p className="text-[9px] text-slate-medium mt-0.5 font-sans font-bold">
                        {doc.tratamiento_nombre} • DNI: {doc.paciente_dni}
                      </p>
                      <p className="text-[8px] text-slate-light mt-0.5 font-sans">
                        Emitido: {doc.fecha} • v{doc.version}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    {doc.estado === 'Activo' && (
                      <span className="flex items-center gap-1 text-[8px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        <CheckCircle size={10} /> Firmado
                      </span>
                    )}
                    {doc.estado === 'Pendiente' && (
                      <span className="flex items-center gap-1 text-[8px] bg-amber-500/10 text-amber-600 border border-amber-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        <Clock size={10} /> Pendiente
                      </span>
                    )}
                    {doc.estado === 'Archivado' && (
                      <span className="flex items-center gap-1 text-[8px] bg-slate-light/10 text-slate-medium border border-slate-light/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        <Archive size={10} /> Archivado
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel p-8 text-center rounded-2xl border border-pure-white/40">
                <FileText className="mx-auto text-slate-light/50 mb-3" size={32} />
                <p className="text-xs font-semibold text-slate-medium uppercase tracking-wider">No se encontraron documentos</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Vista Previa y Acciones (Lado derecho) */}
        <div className="lg:col-span-5">
          {selectedDocFromList ? (
            <div className="glass-panel p-5 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
              {/* Encabezado Detalle */}
              <div className="flex justify-between items-start border-b border-satin-copper/10 pb-4">
                <div>
                  <span className="text-[8px] text-satin-copper border border-satin-copper/25 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold bg-satin-copper/10">
                    Detalles del Documento
                  </span>
                  <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider mt-2">
                    {selectedDocFromList.paciente_nombre}
                  </h3>
                  <p className="text-[9px] text-slate-light font-sans font-semibold uppercase mt-0.5">ID: {selectedDocFromList.id}</p>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-slate-light hover:text-slate-dark transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Ficha Resumen */}
              <div className="space-y-2.5 text-[11px] font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">DNI Paciente:</span>
                  <span className="text-slate-dark font-bold">{selectedDocFromList.paciente_dni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Tratamiento:</span>
                  <span className="text-slate-dark font-bold">{selectedDocFromList.tratamiento_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Médico:</span>
                  <span className="text-slate-dark font-bold">{selectedDocFromList.doctor_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Fecha Emisión:</span>
                  <span className="text-slate-dark font-bold">{selectedDocFromList.fecha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Historial Versión:</span>
                  <span className="text-slate-dark font-bold">v{selectedDocFromList.version} (Actual)</span>
                </div>
              </div>

              {/* Sección de Firma o Previsualización */}
              <div className="border-t border-b border-satin-copper/10 py-4 flex flex-col items-center">
                {selectedDocFromList.firma_base64 ? (
                  <div className="text-center">
                    <p className="text-[8px] text-slate-medium uppercase tracking-wider mb-2 font-bold">Firma Registrada</p>
                    <div className="bg-pure-white rounded-lg border border-satin-copper/10 p-2 shadow-inner">
                      <img src={selectedDocFromList.firma_base64} alt="Firma" className="h-16 w-32 object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full py-2">
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider mb-3">Este consentimiento no está firmado</p>
                    <button
                      onClick={() => setShowSignPad(true)}
                      className="satin-button w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-pure-white cursor-pointer animate-pulse"
                    >
                      <PenTool size={12} /> Firmar Consentimiento
                    </button>
                  </div>
                )}
              </div>

              {/* Botón de Descarga PDF */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={() => handleDownloadPdf(selectedDocFromList)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-satin-copper text-satin-copper rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-satin-copper/5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download size={12} /> {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Documento (PDF)'}
                </button>

                {selectedDocFromList.estado !== 'Archivado' && (
                  <button
                    onClick={() => handleArchiveDocument(selectedDocFromList.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-light/10 hover:bg-slate-light/20 text-slate-dark rounded-xl text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Archive size={11} /> Archivar en Ficha Clínica
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury text-center py-16">
              <User className="mx-auto text-slate-light/50 mb-3" size={28} />
              <p className="text-[10px] text-slate-medium uppercase tracking-widest font-semibold">
                Seleccione un documento del listado para ver sus detalles o firmar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Creación Nuevo Documento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4 select-none">
          <form
            onSubmit={handleCreateDocument}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">Nuevo Consentimiento</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-light hover:text-slate-dark cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Paciente</label>
                <select
                  required
                  value={selectedPacienteId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setSelectedPacienteId(pId);
                    const p = pacientes.find(item => item.id === pId);
                    if (p) {
                      setNuevoPaciente(p.nombre);
                      setNuevoDni(p.cedula || '');
                    } else {
                      setNuevoPaciente('');
                      setNuevoDni('');
                    }
                  }}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold cursor-pointer"
                >
                  <option value="">Selecciona un paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.cedula || 'Sin DNI'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Identificación / DNI</label>
                <input
                  type="text"
                  required
                  disabled
                  placeholder="Se autocompleta al seleccionar paciente"
                  value={nuevoDni}
                  className="w-full bg-pure-white/40 border border-satin-copper/10 rounded-lg px-3 py-2 text-[11px] text-slate-medium focus:outline-none font-sans font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Tratamiento a Consentir</label>
                <select
                  value={nuevoTratamiento}
                  onChange={(e) => setNuevoTratamiento(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold cursor-pointer"
                >
                  <option value="Toxina Botulínica (Botox)">Toxina Botulínica (Botox)</option>
                  <option value="Restylane Kysse (Labios)">Restylane Kysse (Labios)</option>
                  <option value="Juvéderm Voluma (Pómulos)">Juvéderm Voluma (Pómulos)</option>
                  <option value="Juvéderm Volux XC (Mentón/Mandíbula)">Juvéderm Volux XC (Mentón/Mandíbula)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Médico Firmante</label>
                <input
                  type="text"
                  disabled
                  value={nuevoDoctor}
                  className="w-full bg-pure-white/40 border border-satin-copper/10 rounded-lg px-3 py-2 text-[11px] text-slate-medium font-sans font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-satin-copper/10 bg-pure-white/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-satin-copper/25 text-satin-copper rounded-xl text-[10px] uppercase tracking-wider font-bold hover:bg-rose-champagne/20 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addConsentimientoMutation.isPending}
                className="px-5 py-2 satin-button text-pure-white rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
              >
                {addConsentimientoMutation.isPending ? 'Creando...' : 'Crear Documento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Signature Pad Canvas Modal */}
      <SignaturePadModal
        isOpen={showSignPad}
        onClose={() => setShowSignPad(false)}
        onSave={handleSaveSignature}
      />
    </div>
  );
};

export default Consentimientos;
