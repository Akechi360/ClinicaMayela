import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbTratamientos } from '../services/db';
import type { Tratamiento } from '../types/database.types';
import { Plus, Edit2, X, Check, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export const TreatmentsCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);

  const [nombre, setNombre]         = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio]         = useState('');
  const [duracion, setDuracion]     = useState('');
  const [categoria, setCategoria]   = useState('');

  const { data: tratamientos = [], isLoading } = useQuery<Tratamiento[]>({
    queryKey: ['tratamientos'],
    queryFn: dbTratamientos.listar
  });

  const crearMutation = useMutation<Tratamiento, Error, Omit<Tratamiento, 'id' | 'creado_en'>>({
    mutationFn: dbTratamientos.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
      closeModal();
      toast.success('Tratamiento añadido al catálogo.');
    },
    onError: (err) => toast.error(`Error al crear tratamiento: ${err.message}`)
  });

  const actualizarMutation = useMutation<Tratamiento, Error, { id: string; datos: Partial<Tratamiento> }>({
    mutationFn: ({ id, datos }) => dbTratamientos.actualizar(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tratamientos'] });
      closeModal();
      toast.success('Tratamiento actualizado correctamente.');
    },
    onError: (err) => toast.error(`Error al actualizar: ${err.message}`)
  });

  const openCreate = () => {
    setEditingId(null);
    setNombre(''); setDescripcion(''); setPrecio(''); setDuracion(''); setCategoria('');
    setShowModal(true);
  };

  const openEdit = (t: Tratamiento) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setDescripcion(t.descripcion ?? '');
    setPrecio(String(t.precio));
    setDuracion(String(t.duracion_minutos ?? ''));
    setCategoria(t.categoria ?? '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNombre(''); setDescripcion(''); setPrecio(''); setDuracion(''); setCategoria('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datos = {
      nombre,
      descripcion,
      precio: parseFloat(precio),
      duracion_minutos: duracion ? parseInt(duracion) : undefined,
      categoria: categoria || undefined
    };
    if (editingId) {
      actualizarMutation.mutate({ id: editingId, datos });
    } else {
      crearMutation.mutate(datos as Omit<Tratamiento, 'id' | 'creado_en'>);
    }
  };

  const isPending = crearMutation.isPending || actualizarMutation.isPending;

  const categorias = [...new Set(tratamientos.map(t => t.categoria).filter(Boolean))];

  return (
    <div className="space-y-8 px-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-display font-medium text-slate-dark mb-1">Catálogo de Tratamientos</h2>
          <p className="text-sm text-slate-medium">{tratamientos.length} tratamientos registrados en el sistema.</p>
        </div>
        <button
          onClick={openCreate}
          className="rosa-button text-xs font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <Plus size={15} /> Nuevo Tratamiento
        </button>
      </div>

      {/* By category */}
      {isLoading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-xs text-slate-light">
          <Loader2 size={16} className="animate-spin text-satin-copper" /> Cargando catálogo...
        </div>
      ) : (
        <div className="space-y-8">
          {categorias.length === 0 && tratamientos.length > 0 && (
            <TreatmentGrid title="General" items={tratamientos} onEdit={openEdit} />
          )}
          {categorias.map(cat => (
            <TreatmentGrid
              key={cat}
              title={cat!}
              items={tratamientos.filter(t => t.categoria === cat)}
              onEdit={openEdit}
            />
          ))}
          {/* Sin categoría */}
          {(() => {
            const sinCat = tratamientos.filter(t => !t.categoria);
            return sinCat.length > 0 && categorias.length > 0
              ? <TreatmentGrid title="Sin Categoría" items={sinCat} onEdit={openEdit} />
              : null;
          })()}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-dark/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <form
            onSubmit={handleSubmit}
            className="glass-panel w-full max-w-sm rounded-2xl shadow-luxury border border-pure-white/50 overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b border-satin-copper/10 flex justify-between items-center bg-pure-white/20">
              <h3 className="font-display font-medium text-slate-dark text-sm uppercase tracking-wider">
                {editingId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
              </h3>
              <button type="button" onClick={closeModal} className="text-slate-light hover:text-slate-dark cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Nombre del Tratamiento *</label>
                <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="ej. Relleno Labial"
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="Descripción breve del procedimiento..."
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Precio (USD) *</label>
                  <input required type="number" min="0" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="150"
                    className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Duración (min)</label>
                  <input type="number" min="0" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="60"
                    className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
                </div>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-slate-medium mb-1 font-bold">Categoría</label>
                <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="ej. Bioestimulación, Rellenos..."
                  className="w-full bg-pure-white/60 border border-satin-copper/15 rounded-lg px-3 py-2 text-[11px] text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-semibold" />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-pure-white/20 border-t border-satin-copper/10 flex justify-end gap-2.5">
              <button type="button" onClick={closeModal}
                className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">
                Cancelar
              </button>
              <button type="submit" disabled={isPending}
                className="px-4 py-2 satin-button text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                {isPending ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear Tratamiento')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const TreatmentGrid: React.FC<{ title: string; items: Tratamiento[]; onEdit: (t: Tratamiento) => void }> = ({ title, items, onEdit }) => (
  <div>
    <h3 className="text-[9px] uppercase tracking-[0.2em] text-satin-copper font-bold mb-4 flex items-center gap-2">
      <span className="w-8 h-px bg-satin-copper/30"></span>{title}<span className="w-8 h-px bg-satin-copper/30"></span>
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(t => (
        <div key={t.id} className="glass-panel p-5 rounded-2xl border border-pure-white/40 shadow-luxury luxury-hover flex flex-col justify-between gap-4 group">
          <div className="space-y-1.5">
            <h4 className="font-display font-medium text-slate-dark text-base leading-snug">{t.nombre}</h4>
            {t.descripcion && <p className="text-[11px] text-slate-medium leading-relaxed italic line-clamp-2">{t.descripcion}</p>}
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-xl font-display font-medium text-slate-dark">
                {new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(t.precio)}
              </p>
              {t.duracion_minutos && (
                <p className="text-[9px] text-slate-light font-bold uppercase tracking-wider">{t.duracion_minutos} min</p>
              )}
            </div>
            <button
              onClick={() => onEdit(t)}
              className="lg:opacity-0 lg:group-hover:opacity-100 opacity-100 transition-opacity w-8 h-8 rounded-full bg-satin-copper/10 hover:bg-satin-copper/20 flex items-center justify-center text-satin-copper cursor-pointer"
              aria-label={`Editar ${t.nombre}`}
            >
              <Edit2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
