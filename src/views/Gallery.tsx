import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbHistoriales, dbTratamientos } from '../services/db';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ImageIcon, ListFilter, Sparkles } from 'lucide-react';

export const Gallery: React.FC = () => {
  const [selectedTratamientoId, setSelectedTratamientoId] = useState<string>('todos');

  // Consultar historiales con fotos
  const { data: historiales = [], isLoading } = useQuery({
    queryKey: ['historiales-todos'],
    queryFn: dbHistoriales.listarTodos
  });

  // Consultar tratamientos para filtros
  const { data: tratamientos = [] } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: dbTratamientos.listar
  });

  // Filtrar historiales que tengan fotos de antes y después
  const historialesConFotos = historiales.filter(h => h.foto_antes && h.foto_despues);

  // Filtrar por tratamiento seleccionado
  const historialesFiltrados = historialesConFotos.filter(h => {
    if (selectedTratamientoId === 'todos') return true;
    return h.tratamiento_id === selectedTratamientoId;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-slate-dark mb-1">Galería de Casos</h2>
          <p className="text-sm text-slate-medium">Comparativas de evolución clínica antes/después de los pacientes.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 glass-panel p-4 rounded-2xl shadow-luxury border border-pure-white/40 w-full">
        <span className="text-xs text-slate-medium flex items-center gap-1.5 font-semibold"><ListFilter size={14} className="text-satin-copper" /> Filtrar por procedimiento:</span>
        <select
          value={selectedTratamientoId}
          onChange={(e) => setSelectedTratamientoId(e.target.value)}
          className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-1.5 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold cursor-pointer"
        >
          <option value="todos">Todos los tratamientos</option>
          {tratamientos.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-light font-sans">Cargando portafolio clínico...</div>
      ) : historialesFiltrados.length === 0 ? (
        <div className="glass-panel py-16 text-center rounded-3xl border border-pure-white/40 shadow-luxury">
          <ImageIcon className="mx-auto text-satin-copper-light mb-3 opacity-60" size={32} />
          <p className="text-sm font-semibold text-slate-dark mb-1 font-display">No hay comparativas registradas</p>
          <p className="text-xs text-slate-medium">No se encontraron historiales clínicos con fotos para este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {historialesFiltrados.map((item) => (
            <div 
              key={item.id} 
              className="glass-panel p-5 rounded-3xl border border-pure-white/40 shadow-luxury hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Comparador Slider */}
                <div className="w-full">
                  <BeforeAfterSlider 
                    beforeImage={item.foto_antes || ''} 
                    afterImage={item.foto_despues || ''} 
                  />
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <p className="text-[9px] text-satin-copper font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} />
                    {item.tratamiento?.nombre}
                  </p>
                  <h4 className="text-sm font-medium text-slate-dark font-display">Paciente: {item.paciente?.nombre}</h4>
                  <p className="text-xs text-slate-medium line-clamp-2 italic leading-relaxed">"{item.notas_medicas}"</p>
                </div>
              </div>

              {/* Date Footer */}
              <div className="text-[9px] text-slate-light font-bold uppercase tracking-wide mt-4 pt-3 border-t border-satin-copper/10 text-right">
                Tratamiento: {new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
