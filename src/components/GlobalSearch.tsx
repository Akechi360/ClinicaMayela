import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Paciente } from '../types/database.types';

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paciente[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      const { data } = await supabase
        .from('pacientes')
        .select('id, nombre, apellido, cedula, telefono, foto_perfil')
        .eq('activo', true)
        .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},cedula.ilike.${searchTerm},telefono.ilike.${searchTerm}`)
        .limit(6);
      setResults(data ?? []);
      setIsOpen(true);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/pacientes/${id}`);
  };

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="flex relative focus-within:ring-1 focus-within:ring-rosa-petalo/30 rounded-xl bg-[#F7F8FA] border border-[#EEEEF0] px-3 py-1.5 items-center transition-all">
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent border-none outline-none focus:ring-0 text-[10px] md:text-xs text-slate-dark placeholder-slate-light w-28 sm:w-36 md:w-44 lg:w-52 font-sans tracking-wide"
        />
        <Search size={12} className={`shrink-0 ${loading ? 'text-rosa-petalo animate-pulse' : 'text-slate-light'}`} />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-luxury border border-[#EEEEF0] overflow-hidden z-50 min-w-[240px]">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] transition-colors text-left cursor-pointer"
            >
              {p.foto_perfil ? (
                <img src={p.foto_perfil} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-rosa-petalo/10 flex items-center justify-center shrink-0">
                  <User size={14} className="text-rosa-petalo" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-dark truncate">
                  {p.nombre} {p.apellido || ''}
                </p>
                {p.cedula && (
                  <p className="text-[10px] text-slate-light truncate">{p.cedula}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-luxury border border-[#EEEEF0] px-4 py-3 z-50">
          <p className="text-xs text-slate-light text-center">Sin resultados</p>
        </div>
      )}
    </div>
  );
};
