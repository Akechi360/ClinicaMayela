import React, { useState, useMemo } from 'react';
import { Search, FileText, PenTool, CheckCircle, Clock, Archive, Download, Plus, X, User } from 'lucide-react';
import { SignaturePadModal } from '../components/SignaturePadModal';

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

interface Consentimiento {
  id: string;
  pacienteNombre: string;
  pacienteDni: string;
  tratamientoNombre: string;
  fecha: string;
  doctorNombre: string;
  estado: 'Activo' | 'Pendiente' | 'Archivado';
  firmaBase64: string | null;
  version: number;
}

export const Consentimientos: React.FC = () => {
  // Datos mock iniciales
  const [documentos, setDocumentos] = useState<Consentimiento[]>([
    {
      id: 'cons-001',
      pacienteNombre: 'María Paula Benavides',
      pacienteDni: '12.345.678-9',
      tratamientoNombre: 'Toxina Botulínica (Botox)',
      fecha: '2026-06-10',
      doctorNombre: 'Dra. Mayela Silva',
      estado: 'Activo',
      firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAA8CAYAAAC/S16WAAAACXBIWXMAAAsTAAALEwEAmpwYAAABJGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4wLWMwMDAgNzkuZGE3Y2MyYiwgMjAyMy8wNC8xNC0wMDozOToxMiAgICAgICAgIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgRmlyZXdvcmtzPC94bXA6Q3JlYXRvclRvb2w+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+Cjw/eHBhY2tldCBlbmQ9InciPz504e90AAAAmUlEQVRoge3QMQ0AMAzAsPr3zVOaYkF2pW1yZgZ2K1vZyFawVbaylW1grWxlK1vBVtkytrKVrWCreBnbyla2gq2yZWxlK1vBVvEytpWtbAVbZcvYyla2gq2yZWxlK1vBVvEytpWtbAVbZcvYyla2gq2yZWxlK1vBVvEytpWtbAVbZcvYyla2gq2yZWxlK1vBVtkytvICtpoGecY/4yUAAAAASUVORK5CYII=',
      version: 1
    },
    {
      id: 'cons-002',
      pacienteNombre: 'Carlos Eduardo Rivas',
      pacienteDni: '15.672.981-K',
      tratamientoNombre: 'Restylane Kysse (Labios)',
      fecha: '2026-06-12',
      doctorNombre: 'Dra. Mayela Silva',
      estado: 'Pendiente',
      firmaBase64: null,
      version: 1
    },
    {
      id: 'cons-003',
      pacienteNombre: 'Lucía Fernanda Gómez',
      pacienteDni: '18.902.124-5',
      tratamientoNombre: 'Juvéderm Voluma (Pómulos)',
      fecha: '2026-05-20',
      doctorNombre: 'Dra. Mayela Silva',
      estado: 'Archivado',
      firmaBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAA8CAYAAAC/S16WAAAACXBIWXMAAAsTAAALEwEAmpwYAAABJGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4wLWMwMDAgNzkuZGE3Y2MyYiwgMjAyMy8wNC8xNC0wMDozOToxMiAgICAgICAgIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+CiAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgRmlyZXdvcmtzPC94bXA6Q3JlYXRvclRvb2w+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+Cjw/eHBhY2tldCBlbmQ9InciPz504e90AAAAmUlEQVRoge3QMQ0AMAzAsPr3zVOaYkF2pW1yZgZ2K1vZyFawVbaylW1grWxlK1vBVtkytrKVrWCreBnbyla2gq2yZWxlK1vBVvEytpWtbAVbZcvYyla2gq2yZWxlK1vBVvEytpWtbAVbZcvYyla2gq2yZWxlK1vBVvEytpWtbAVbZcvYyla2gq2yZWxlK1vBVtkytvICtpoGecY/4yUAAAAASUVORK5CYII=',
      version: 2
    }
  ]);

  // Estados de búsqueda, filtros y modales
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Pendiente' | 'Archivado'>('Todos');
  const [selectedDoc, setSelectedDoc] = useState<Consentimiento | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Formulario nuevo consentimiento
  const [nuevoPaciente, setNuevoPaciente] = useState('');
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoTratamiento, setNuevoTratamiento] = useState('Toxina Botulínica (Botox)');
  const [nuevoDoctor, setNuevoDoctor] = useState('Dra. Mayela Silva');

  const handleDownloadPdf = async (doc: Consentimiento) => {
    setIsGeneratingPdf(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { ConsentimientoPDF } = await import('../components/ConsentimientoPDF');
      
      const blob = await pdf(
        <ConsentimientoPDF
          pacienteNombre={doc.pacienteNombre}
          pacienteDni={doc.pacienteDni}
          tratamientoNombre={doc.tratamientoNombre}
          fecha={doc.fecha}
          doctorNombre={doc.doctorNombre}
          firmaBase64={doc.firmaBase64}
          clausulas={CLAUSULAS_POR_TRATAMIENTO[doc.tratamientoNombre] || []}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `consentimiento_${doc.pacienteNombre.replace(/\s+/g, '_').toLowerCase()}.pdf`;
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
      const matchesSearch = doc.pacienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.pacienteDni.includes(searchQuery) ||
                            doc.tratamientoNombre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || doc.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [documentos, searchQuery, statusFilter]);

  // Guardar nueva firma y cambiar estado del documento
  const handleSaveSignature = (signatureBase64: string) => {
    if (!selectedDoc) return;
    const updated = documentos.map(doc => {
      if (doc.id === selectedDoc.id) {
        const docActualizado: Consentimiento = {
          ...doc,
          firmaBase64: signatureBase64,
          estado: 'Activo'
        };
        setSelectedDoc(docActualizado);
        return docActualizado;
      }
      return doc;
    });
    setDocumentos(updated);
  };

  // Crear nuevo documento
  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPaciente || !nuevoDni) {
      alert('Por favor complete los datos obligatorios.');
      return;
    }

    const nuevo: Consentimiento = {
      id: `cons-${Date.now().toString().slice(-3)}`,
      pacienteNombre: nuevoPaciente,
      pacienteDni: nuevoDni,
      tratamientoNombre: nuevoTratamiento,
      fecha: new Date().toISOString().split('T')[0],
      doctorNombre: nuevoDoctor,
      estado: 'Pendiente',
      firmaBase64: null,
      version: 1
    };

    setDocumentos([nuevo, ...documentos]);
    setShowCreateModal(false);
    // Limpiar campos
    setNuevoPaciente('');
    setNuevoDni('');
  };

  // Archivar documento
  const handleArchiveDocument = (id: string) => {
    const updated = documentos.map(doc => {
      if (doc.id === id) {
        const docActualizado: Consentimiento = { ...doc, estado: 'Archivado' as const };
        if (selectedDoc && selectedDoc.id === id) {
          setSelectedDoc(docActualizado);
        }
        return docActualizado;
      }
      return doc;
    });
    setDocumentos(updated);
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
            {documentosFiltrados.length > 0 ? (
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
                      <h4 className="text-xs font-semibold text-slate-dark">{doc.pacienteNombre}</h4>
                      <p className="text-[9px] text-slate-medium mt-0.5 font-sans font-bold">
                        {doc.tratamientoNombre} • DNI: {doc.pacienteDni}
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
          {selectedDoc ? (
            <div className="glass-panel p-5 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
              {/* Encabezado Detalle */}
              <div className="flex justify-between items-start border-b border-satin-copper/10 pb-4">
                <div>
                  <span className="text-[8px] text-satin-copper border border-satin-copper/25 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold bg-satin-copper/10">
                    Detalles del Documento
                  </span>
                  <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider mt-2">
                    {selectedDoc.pacienteNombre}
                  </h3>
                  <p className="text-[9px] text-slate-light font-sans font-semibold uppercase mt-0.5">ID: {selectedDoc.id}</p>
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
                  <span className="text-slate-dark font-bold">{selectedDoc.pacienteDni}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Tratamiento:</span>
                  <span className="text-slate-dark font-bold">{selectedDoc.tratamientoNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Médico:</span>
                  <span className="text-slate-dark font-bold">{selectedDoc.doctorNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Fecha Emisión:</span>
                  <span className="text-slate-dark font-bold">{selectedDoc.fecha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-medium font-semibold">Historial Versión:</span>
                  <span className="text-slate-dark font-bold">v{selectedDoc.version} (Actual)</span>
                </div>
              </div>

              {/* Sección de Firma o Previsualización */}
              <div className="border-t border-b border-satin-copper/10 py-4 flex flex-col items-center">
                {selectedDoc.firmaBase64 ? (
                  <div className="text-center">
                    <p className="text-[8px] text-slate-medium uppercase tracking-wider mb-2 font-bold">Firma Registrada</p>
                    <div className="bg-pure-white rounded-lg border border-satin-copper/10 p-2 shadow-inner">
                      <img src={selectedDoc.firmaBase64} alt="Firma" className="h-16 w-32 object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center w-full py-2">
                    <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider mb-3">Este consentimiento no está firmado</p>
                    <button
                      onClick={() => setShowSignPad(true)}
                      className="satin-button w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-pure-white cursor-pointer"
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
                  onClick={() => handleDownloadPdf(selectedDoc)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-satin-copper text-satin-copper rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-satin-copper/5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download size={12} /> {isGeneratingPdf ? 'Generando PDF...' : 'Descargar Documento (PDF)'}
                </button>

                {selectedDoc.estado !== 'Archivado' && (
                  <button
                    onClick={() => handleArchiveDocument(selectedDoc.id)}
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
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Paciente (Nombre Completo)</label>
                <input
                  type="text"
                  required
                  placeholder="ej. María Paula Benavides"
                  value={nuevoPaciente}
                  onChange={(e) => setNuevoPaciente(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-semibold"
                />
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Identificación / DNI / RUT</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 12.345.678-9"
                  value={nuevoDni}
                  onChange={(e) => setNuevoDni(e.target.value)}
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans font-bold"
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
                  <option value="Juvéderm Volux XC (Mentón/Mandíbula)">Juvéderm Volux (Mentón/Mandíbula)</option>
                </select>
              </div>

              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Médico Firmante</label>
                <input
                  type="text"
                  disabled
                  value={nuevoDoctor}
                  onChange={(e) => setNuevoDoctor(e.target.value)}
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
                className="px-5 py-2 satin-button text-pure-white rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
              >
                Crear Documento
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
