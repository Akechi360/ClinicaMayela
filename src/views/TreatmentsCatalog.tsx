import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbTratamientos } from '../services/db';
import { Sparkles, Plus, Edit3, Clock, DollarSign, X } from 'lucide-react';

export const TreatmentsCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTratamiento, setEditingTratamiento] = useState<any | null>(null);

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState(0);
  const [duracion, setDuracion] = useState(30);

  // Consultar tratamientos
  const { data: tratamientos = [], isLoading } = useQuery({
    queryKey: ['tratamientos'],
    queryFn: dbTratamientos.listar
  });

  // Mutación para agregar tratamiento
  const addMutation = useMutation({
    mutationFn: dbTratamientos.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
      setShowAddModal(false);
      resetForm();
    }
  });

  // Mutación para editar tratamiento
  const editMutation = useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: any }) => dbTratamientos.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
      setEditingTratamiento(null);
      resetForm();
    }
  });

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setPrecio(0);
    setDuracion(30);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTratamiento(t);
    setNombre(t.nombre);
    setDescripcion(t.descripcion);
    setPrecio(t.precio);
    setDuracion(t.duracion_minutos);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTratamiento) {
      editMutation.mutate({
        id: editingTratamiento.id,
        datos: {
          nombre,
          descripcion,
          precio,
          duracion_minutos: duracion
        }
      });
    } else {
      addMutation.mutate({
        nombre,
        descripcion,
        precio,
        duracion_minutos: duracion
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-slate-dark mb-1">Catálogo de Tratamientos</h2>
          <p className="text-sm text-slate-medium">Administra los procedimientos, tarifas y tiempos de la clínica.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingTratamiento(null);
            setShowAddModal(true);
          }}
          className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-xs font-semibold py-2.5 px-5 rounded-lg shadow-lg shadow-satin-copper/10 flex items-center gap-2 transition-all"
        >
          <Plus size={16} /> Añadir Procedimiento
        </button>
      </div>

      {/* Grid of Treatments */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-slate-light">Cargando catálogo...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {tratamientos.map((t) => (
            <div 
              key={t.id} 
              className="glass-panel rounded-3xl border border-pure-white/40 shadow-luxury p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative group"
            >
              <div className="space-y-4">
                {/* Icon & Title */}
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-full bg-satin-copper/10 text-satin-copper flex items-center justify-center border border-satin-copper/15">
                    <Sparkles size={16} />
                  </div>
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="text-slate-light hover:text-satin-copper opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-pure-white/40 cursor-pointer"
                    title="Editar tratamiento"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-medium text-slate-dark font-display">{t.nombre}</h3>
                  <p className="text-xs text-slate-medium leading-relaxed line-clamp-3">{t.descripcion}</p>
                </div>
              </div>

              {/* Price and Duration */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-satin-copper/15 text-xs">
                <span className="flex items-center gap-1 text-slate-medium"><Clock size={13} className="text-satin-copper-light" /> {t.duracion_minutos} min</span>
                <span className="font-semibold text-satin-copper flex items-center"><DollarSign size={13} /> {t.precio}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para añadir/editar tratamiento */}
      {(showAddModal || editingTratamiento !== null) && (
        <div className="fixed inset-0 bg-slate-dark/25 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl shadow-luxury border border-pure-white/50 p-6 w-full max-w-md font-sans">
            <div className="flex justify-between items-center mb-4 border-b border-rose-champagne pb-3">
              <h3 className="text-base font-bold text-slate-dark font-display">
                {editingTratamiento ? 'Editar Procedimiento' : 'Añadir Procedimiento'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTratamiento(null);
                }}
                className="text-slate-medium hover:text-slate-dark"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Nombre del Tratamiento</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Radiesse Bioestimulador"
                  className="bg-rose-champagne-light/50 border border-rose-champagne rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper"
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Descripción</label>
                <textarea
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve descripción clínica y beneficios..."
                  rows={3}
                  className="bg-rose-champagne-light/50 border border-rose-champagne rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none"
                />
              </div>

              {/* Precio y Duración */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Precio ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={precio}
                    onChange={(e) => setPrecio(parseInt(e.target.value) || 0)}
                    className="bg-rose-champagne-light/50 border border-rose-champagne rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Duración (minutos)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={duracion}
                    onChange={(e) => setDuracion(parseInt(e.target.value) || 30)}
                    className="bg-rose-champagne-light/50 border border-rose-champagne rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper"
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-rose-champagne mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTratamiento(null);
                  }}
                  className="px-5 py-2 rounded border border-rose-champagne text-xs text-slate-dark hover:bg-rose-champagne-light/40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || editMutation.isPending}
                  className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-xs font-semibold py-2 px-6 rounded transition-colors shadow-md shadow-satin-copper/10"
                >
                  {addMutation.isPending || editMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
