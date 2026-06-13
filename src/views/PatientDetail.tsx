import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dbPacientes, dbHistoriales, dbCitas, dbTransacciones } from '../services/db';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { FaceCanvas } from '../components/FaceCanvas';
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Plus, 
  Map, 
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'historial' | 'mapa' | 'citas' | 'finanzas'>('historial');

  // Consultas de datos
  const { data: paciente, isLoading: loadingPaciente } = useQuery({
    queryKey: ['paciente', id],
    queryFn: () => dbPacientes.obtener(id || '')
  });

  const { data: historiales = [], isLoading: loadingHistoriales } = useQuery({
    queryKey: ['paciente-historiales', id],
    queryFn: () => dbHistoriales.listarPorPaciente(id || '')
  });

  const { data: citas = [] } = useQuery({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  const { data: transacciones = [] } = useQuery({
    queryKey: ['transacciones'],
    queryFn: dbTransacciones.listar
  });

  const queryCitasPaciente = citas.filter(c => c.paciente_id === id);
  const queryTransaccionesPaciente = transacciones.filter(t => t.paciente_id === id);

  // Recopilar todos los puntos de inyección acumulados para la vista de mapa
  const todosLosPuntos = historiales.flatMap(h => h.mapa_facial_coordenadas);

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

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

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
              {paciente.nombre.split(' ').map(n => n[0]).join('')}
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
            className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all"
          >
            <Plus size={15} /> Registrar Procedimiento
          </button>
        </div>
      </div>

      {/* Patient Overview Grid (Glassmorphic) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 glass-panel p-6 rounded-3xl shadow-luxury border border-pure-white/40 font-sans">
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Contacto</p>
          <p className="text-xs text-slate-dark font-semibold flex items-center gap-1.5"><Phone size={11} className="text-slate-light" /> {paciente.telefono}</p>
          <p className="text-xs text-slate-dark font-semibold flex items-center gap-1.5"><Mail size={11} className="text-slate-light" /> {paciente.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold">Datos Personales</p>
          <p className="text-xs text-slate-dark font-medium">Nacimiento: {new Date(paciente.fecha_nacimiento).toLocaleDateString()}</p>
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

      {/* Navigation Tabs (Editorial) */}
      <div className="border-b border-rose-champagne flex gap-6 font-sans">
        {['historial', 'mapa', 'citas', 'finanzas'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3.5 text-[10px] font-bold tracking-[0.15em] uppercase border-b-2 transition-all duration-300 ${
              activeTab === tab
                ? 'border-satin-copper text-satin-copper'
                : 'border-transparent text-slate-light hover:text-slate-dark'
            }`}
          >
            {tab === 'historial' ? 'Historial Clínico' : tab === 'mapa' ? 'Mapa Facial' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px] font-sans">
        {/* Tab Historial */}
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
              historiales.map((historial) => (
                <div key={historial.id} className="glass-panel rounded-2xl p-6 md:p-8 luxury-shadow hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left column (Clinical Details) */}
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

                      {/* Recetario Premium Style Note */}
                      <div className="bg-rose-champagne-light/60 p-4 rounded-xl border border-rose-champagne/60 font-sans leading-relaxed relative">
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-satin-copper/20"></div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-1.5">Notas Médicas</p>
                        <p className="text-xs text-slate-medium leading-relaxed italic">"{historial.notas_medicas}"</p>
                      </div>
                    </div>

                    {/* Right column (Before & After Slider / Visual Comparison) */}
                    <div className="w-full lg:w-2/3 flex flex-col md:flex-row gap-6 items-center justify-center">
                      {historial.foto_antes && historial.foto_despues ? (
                        <div className="w-full max-w-xs">
                          <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold mb-2.5 text-center tracking-widest">Comparativa Antes / Después</p>
                          <BeforeAfterSlider 
                            beforeImage={historial.foto_antes}
                            afterImage={historial.foto_despues}
                          />
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

        {/* Tab Mapa Facial */}
        {activeTab === 'mapa' && (
          <div className="glass-panel rounded-2xl p-6 md:p-8 luxury-shadow flex flex-col md:flex-row gap-8 items-center justify-center">
            <div className="w-full md:w-1/2">
              <FaceCanvas 
                coordinates={todosLosPuntos}
                readOnly={true}
              />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <div>
                <h3 className="text-lg font-display font-medium text-slate-dark">Mapa Acumulado de Inyecciones</h3>
                <p className="text-xs text-slate-medium mt-1">Este gráfico muestra de forma consolidada todos los puntos donde se ha inyectado algún producto a Elena a lo largo de sus tratamientos.</p>
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

        {/* Tab Citas */}
        {activeTab === 'citas' && (
          <div className="glass-panel rounded-3xl p-6 shadow-luxury border border-pure-white/40">
            <h3 className="text-base font-display font-medium text-slate-dark mb-4 border-b border-satin-copper/10 pb-3">Registro de Citas</h3>
            {queryCitasPaciente.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-light">No hay citas registradas para este paciente.</div>
            ) : (
              <div className="space-y-3">
                {queryCitasPaciente.map((cita) => (
                  <div key={cita.id} className="p-4 rounded-xl bg-pure-white/15 border border-satin-copper/10 hover:bg-pure-white/25 transition-all duration-300 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-dark flex items-center gap-1.5">
                        <Calendar size={13} className="text-satin-copper-light" />
                        {new Date(cita.fecha_hora).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span className="text-[10px] font-normal text-slate-light">— {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} HS</span>
                      </p>
                      <p className="text-[11px] text-slate-medium">Tratamiento: <span className="font-semibold text-slate-dark">{cita.tratamiento?.nombre}</span></p>
                      {cita.notas && <p className="text-[10px] text-slate-light italic mt-1 font-sans">"{cita.notas}"</p>}
                    </div>
                    <div>
                      {cita.estado === 'confirmado' && (
                        <span className="bg-muted-olive/10 text-muted-olive text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-muted-olive/15">Confirmado</span>
                      )}
                      {cita.estado === 'en_sala' && (
                        <span className="bg-satin-copper/10 text-satin-copper text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-satin-copper/15 animate-pulse">En Sala</span>
                      )}
                      {cita.estado === 'pendiente' && (
                        <span className="bg-slate-light/15 text-slate-medium text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-light/20">Pendiente</span>
                      )}
                      {cita.estado === 'cancelado' && (
                        <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-red-500/15">Cancelado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Finanzas */}
        {activeTab === 'finanzas' && (
          <div className="glass-panel rounded-3xl p-6 shadow-luxury border border-pure-white/40 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-display font-medium text-slate-dark">Historial Financiero</h3>
              <div className="text-right">
                <p className="text-[8px] uppercase text-slate-light tracking-wider font-bold">Total Pagado</p>
                <p className="text-xl font-display font-semibold text-slate-dark mt-0.5">
                  {formatCurrency(queryTransaccionesPaciente.filter(t => t.estado === 'completado').reduce((sum, t) => sum + t.monto, 0))}
                </p>
              </div>
            </div>

            {queryTransaccionesPaciente.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-light">No hay cobros registrados para este paciente.</div>
            ) : (
              <div className="space-y-3">
                {queryTransaccionesPaciente.map((tr) => (
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
                        <span className="font-display font-semibold text-slate-dark text-sm">{formatCurrency(tr.monto)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
