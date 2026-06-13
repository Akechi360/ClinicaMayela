// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbPacientes, dbTratamientos, dbHistoriales, dbCitas, dbTransacciones } from '../services/db';
import { FaceCanvas } from '../components/FaceCanvas';
import type { MapaFacialCoordenada } from '../types/database.types';
import { ArrowLeft, Save, Upload, Mic } from 'lucide-react';

export const NewEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlPacienteId = searchParams.get('pacienteId') || '';
  const urlCitaId = searchParams.get('citaId') || '';

  // Consultar pacientes y tratamientos para los dropdowns
  const { data: pacientes = [] } = useQuery({ queryKey: ['pacientes'], queryFn: dbPacientes.listar });
  const { data: tratamientos = [] } = useQuery({ queryKey: ['tratamientos'], queryFn: dbTratamientos.listar });

  // Estados del formulario
  const [pacienteId, setPacienteId] = useState(urlPacienteId);
  const [tratamientoId, setTratamientoId] = useState('');
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [lote, setLote] = useState('');
  const [tecnica, setTecnica] = useState('');
  const [notasMedicas, setNotasMedicas] = useState('');
  const [antecedentes, setAntecedentes] = useState('');
  const [coordinates, setCoordinates] = useState<MapaFacialCoordenada[]>([]);
  const [isRecordingNotas, setIsRecordingNotas] = useState(false);
  const [isRecordingAntecedentes, setIsRecordingAntecedentes] = useState(false);

  // Detectar soporte ANTES de montar el componente
  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null;
  const speechSupported = SpeechRecognitionAPI !== null;

  const startDictation = (field: 'notas' | 'antecedentes') => {
    if (!speechSupported) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      if (field === 'notas') setIsRecordingNotas(true);
      else setIsRecordingAntecedentes(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'notas') {
        setNotasMedicas(prev => prev ? prev + ' ' + transcript : transcript);
      } else {
        setAntecedentes(prev => prev ? prev + ' ' + transcript : transcript);
      }
    };

    recognition.onend = () => {
      if (field === 'notas') setIsRecordingNotas(false);
      else setIsRecordingAntecedentes(false);
    };

    recognition.start();
  };
  
  // Fotos (Base64)
  const [fotoAntes, setFotoAntes] = useState<string>('');
  const [fotoDespues, setFotoDespues] = useState<string>('');

  // Sincronizar el tratamientoId si viene de una cita
  useEffect(() => {
    if (urlCitaId) {
      dbCitas.listar().then(citas => {
        const cita = citas.find(c => c.id === urlCitaId);
        if (cita) {
          setPacienteId(cita.paciente_id);
          setTratamientoId(cita.tratamiento_id);
          if (cita.tratamiento) {
            setProducto(cita.tratamiento.nombre);
          }
        }
      });
    }
  }, [urlCitaId]);

  // Si cambia el tratamiento, autocompletar el nombre del producto de forma sugerida
  useEffect(() => {
    const seleccionado = tratamientos.find(t => t.id === tratamientoId);
    if (seleccionado) {
      setProducto(seleccionado.nombre);
    }
  }, [tratamientoId, tratamientos]);

  // Mutación para guardar el historial
  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      // 1. Guardar nota clínica
      const historial = await dbHistoriales.insertar({
        paciente_id: pacienteId,
        cita_id: urlCitaId || undefined,
        fecha: new Date().toISOString().split('T')[0],
        tratamiento_id: tratamientoId,
        producto,
        cantidad,
        lote,
        tecnica,
        notas_medicas: notasMedicas,
        antecedentes,
        mapa_facial_coordenadas: coordinates,
        foto_antes: fotoAntes || undefined,
        foto_despues: fotoDespues || undefined
      });

      // 2. Si venía de una cita, marcar la cita como confirmada (completada) y actualizar la transacción
      if (urlCitaId) {
        await dbCitas.actualizarEstado(urlCitaId, 'confirmado');
        await dbTransacciones.actualizarPorCita(urlCitaId, 'completado', 'tarjeta');
      }

      return historial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['transacciones'] });
      queryClient.invalidateQueries({ queryKey: ['paciente-historiales', pacienteId] });
      navigate(`/pacientes/${pacienteId}`);
    }
  });

  // Procesar archivos de foto a Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'antes' | 'despues') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (type === 'antes') setFotoAntes(reader.result);
        else setFotoDespues(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId || !tratamientoId) {
      alert('Por favor selecciona un paciente y un tratamiento.');
      return;
    }
    saveEntryMutation.mutate();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <button onClick={() => navigate(-1)} className="text-xs text-slate-medium hover:text-slate-dark flex items-center gap-1 transition-colors font-sans cursor-pointer">
          <ArrowLeft size={13} /> Volver
        </button>
        <h2 className="text-3xl font-display font-light text-slate-dark tracking-wide">
          Registrar <span className="italic font-normal text-satin-copper">Procedimiento</span>
        </h2>
        <p className="text-xs text-slate-light mt-0.5">Documenta la evolución médica, mapa de inyección y fotos comparativas.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 font-sans">
        
        {/* Sección 1: Datos Base */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-6">
          <h3 className="text-base font-display font-medium text-slate-dark border-b border-satin-copper/10 pb-3">Información General</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paciente */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Paciente</label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                disabled={!!urlPacienteId}
                required
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper disabled:opacity-75 font-sans"
              >
                <option value="">Selecciona un paciente</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Tratamiento */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Tratamiento Realizado</label>
              <select
                value={tratamientoId}
                onChange={(e) => setTratamientoId(e.target.value)}
                required
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              >
                <option value="">Selecciona un tratamiento</option>
                {tratamientos.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre} (${t.precio})</option>
                ))}
              </select>
            </div>

            {/* Producto y Dosis */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Nombre Comercial de Producto</label>
              <input
                type="text"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Ej. Juvéderm Volift"
                required
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Cantidad Total (ml o U)</label>
              <input
                type="text"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej. 1.0 ml / 50 U"
                required
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              />
            </div>

            {/* Lote y Técnica */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Número de Lote</label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ej. L-BXT99"
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-medium font-bold">Técnica Clínica</label>
              <input
                type="text"
                value={tecnica}
                onChange={(e) => setTecnica(e.target.value)}
                placeholder="Ej. Microinyecciones / Cánula"
                className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
              />
            </div>
          </div>
        </section>

        {/* Sección 2: Mapeo Facial */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-6">
          <div>
            <h3 className="text-base font-display font-medium text-slate-dark mb-1">Mapeo Facial Interactivo</h3>
            <p className="text-xs text-slate-light">Haz clic en el rostro para colocar los puntos y detallar las dosis inyectadas.</p>
          </div>
          
          <FaceCanvas 
            coordinates={coordinates}
            onChange={setCoordinates}
            readOnly={false}
          />
        </section>

        {/* Sección 3: Registro Fotográfico */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-6">
          <div>
            <h3 className="text-base font-display font-medium text-slate-dark mb-1">Registro Fotográfico</h3>
            <p className="text-xs text-slate-light">Añade imágenes del antes y después para el slider comparativo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Foto Antes */}
            <div className="space-y-3">
              <label className="block text-[9px] uppercase tracking-wider text-slate-medium font-bold text-center">Foto Antes</label>
              {fotoAntes ? (
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-satin-copper/15 shadow-sm">
                  <img src={fotoAntes} alt="Antes" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setFotoAntes('')}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-pure-white p-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <label className="aspect-[4/5] bg-pure-white/20 hover:bg-pure-white/30 border border-dashed border-satin-copper/25 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors p-4">
                  <Upload className="text-satin-copper-light opacity-80 mb-2" size={24} />
                  <span className="text-xs text-slate-dark font-medium">Subir foto de Antes</span>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'antes')} className="hidden" />
                </label>
              )}
            </div>

            {/* Foto Después */}
            <div className="space-y-3">
              <label className="block text-[9px] uppercase tracking-wider text-slate-medium font-bold text-center">Foto Después</label>
              {fotoDespues ? (
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-satin-copper/15 shadow-sm">
                  <img src={fotoDespues} alt="Después" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => setFotoDespues('')}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-pure-white p-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <label className="aspect-[4/5] bg-pure-white/20 hover:bg-pure-white/30 border border-dashed border-satin-copper/25 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors p-4">
                  <Upload className="text-satin-copper-light opacity-80 mb-2" size={24} />
                  <span className="text-xs text-slate-dark font-medium">Subir foto de Después</span>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'despues')} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </section>

        {/* Sección 4: Notas Clínicas y Antecedentes */}
        <section className="glass-panel p-6 md:p-8 rounded-3xl border border-pure-white/40 shadow-luxury space-y-4">
          <div className="flex items-center justify-between border-b border-satin-copper/10 pb-3">
            <h3 className="text-base font-display font-medium text-slate-dark">Antecedentes</h3>
            {speechSupported ? (
              <button
                type="button"
                onClick={() => startDictation('antecedentes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${isRecordingAntecedentes ? 'bg-red-500 text-white animate-pulse' : 'bg-satin-copper/10 text-satin-copper hover:bg-satin-copper/20'}`}
              >
                <Mic size={12} /> {isRecordingAntecedentes ? 'Escuchando...' : 'Dictar'}
              </button>
            ) : (
              <span className="text-[10px] text-slate-medium">Dictado no disponible en este navegador</span>
            )}
          </div>
          <textarea
            value={antecedentes}
            onChange={(e) => setAntecedentes(e.target.value)}
            placeholder="Alergias, medicamentos actuales, condiciones previas..."
            rows={3}
            className="w-full bg-pure-white/30 border border-satin-copper/15 rounded-xl p-4 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between border-b border-satin-copper/10 pb-3 pt-4">
            <h3 className="text-base font-display font-medium text-slate-dark">Notas Clínicas</h3>
            {speechSupported ? (
              <button
                type="button"
                onClick={() => startDictation('notas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${isRecordingNotas ? 'bg-red-500 text-white animate-pulse' : 'bg-satin-copper/10 text-satin-copper hover:bg-satin-copper/20'}`}
              >
                <Mic size={12} /> {isRecordingNotas ? 'Escuchando...' : 'Dictar'}
              </button>
            ) : (
              <span className="text-[10px] text-slate-medium">Dictado no disponible en este navegador</span>
            )}
          </div>
          <textarea
            value={notasMedicas}
            onChange={(e) => setNotasMedicas(e.target.value)}
            placeholder="Introduce las observaciones médicas, detalles de tolerancia del paciente, complicaciones secundarias y recomendaciones para su cuidado en casa..."
            rows={5}
            className="w-full bg-pure-white/30 border border-satin-copper/15 rounded-xl p-4 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none leading-relaxed font-sans"
          />
        </section>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t border-satin-copper/10 pt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl border border-satin-copper/20 text-[10px] font-bold uppercase tracking-wider text-slate-medium hover:text-slate-dark hover:bg-pure-white/40 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saveEntryMutation.isPending}
            className="satin-button text-pure-white text-[10px] font-bold tracking-[0.15em] uppercase py-3 px-8 rounded-xl shadow-lg shadow-satin-copper/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Save size={14} /> 
            {saveEntryMutation.isPending ? 'Guardando expediente...' : 'Guardar Procedimiento'}
          </button>
        </div>
      </form>
    </div>
  );
};
