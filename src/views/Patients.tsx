import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbPacientes, dbCitas } from '../services/db';
import { Search, UserPlus, Phone, Mail, Award, Calendar, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Patients: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVip, setFilterVip] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [fecha_nacimiento, setFechaNacimiento] = useState('');
  const [notas, setNotas] = useState('');

  // Consultar pacientes
  const { data: pacientes = [], isLoading } = useQuery({
    queryKey: ['pacientes'],
    queryFn: dbPacientes.listar
  });

  // Consultar citas para saber la última visita
  const { data: citas = [] } = useQuery({
    queryKey: ['citas'],
    queryFn: dbCitas.listar
  });

  // Mutación para agregar paciente
  const addPacienteMutation = useMutation({
    mutationFn: dbPacientes.insertar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setShowAddModal(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setCedula('');
    setTelefono('');
    setEmail('');
    setFechaNacimiento('');
    setNotas('');
  };

  const handleAddPaciente = (e: React.FormEvent) => {
    e.preventDefault();
    addPacienteMutation.mutate({
      nombre,
      apellido,
      cedula,
      telefono,
      email,
      fecha_nacimiento,
      notas,
    });
  };

  const getUltimaVisita = (pacienteId: string) => {
    const citasPaciente = citas
      .filter(c => c.paciente_id === pacienteId && new Date(c.fecha_hora).getTime() < new Date().getTime())
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
    
    if (citasPaciente.length === 0) return 'Ninguna';
    
    return new Date(citasPaciente[0].fecha_hora).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const pacientesFiltrados = pacientes.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.apellido && p.apellido.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.cedula && p.cedula.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.telefono && p.telefono.includes(searchQuery)) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filtro VIP removido por schema
    return matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterVip]);

  const itemsPerPage = 10;
  const paginatedPacientes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return pacientesFiltrados.slice(startIndex, startIndex + itemsPerPage);
  }, [pacientesFiltrados, currentPage]);

  return (
    <div className="space-y-8 px-2 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 font-sans">
        <div>
          <h2 className="text-3xl font-display font-light text-slate-dark tracking-wide">
            Expedientes de <span className="italic font-normal text-satin-copper">Pacientes</span>
          </h2>
          <p className="text-xs text-slate-light mt-0.5">Fichas clínicas y registro general de pacientes de la clínica.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-satin-copper hover:bg-satin-copper-hover text-pure-white text-[10px] font-bold tracking-[0.15em] uppercase py-3 px-5 rounded-xl transition-all duration-300 shadow-lg shadow-satin-copper/10 flex items-center gap-2 cursor-pointer"
        >
          <UserPlus size={13} /> Registrar Paciente
        </button>
      </div>

      {/* Filters and Search (Glassmorphic) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center glass-panel p-4 rounded-2xl shadow-luxury border border-pure-white/40 w-full">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-pure-white/30 border border-satin-copper/15 focus:ring-1 focus:ring-satin-copper/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-dark focus:outline-none placeholder-slate-light font-sans tracking-wide"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-satin-copper-light" size={13} />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setFilterVip(!filterVip)}
            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all border cursor-pointer ${
              filterVip 
                ? 'bg-satin-copper/15 border-satin-copper text-satin-copper font-bold shadow-sm' 
                : 'bg-pure-white/20 border-satin-copper/15 text-slate-medium hover:text-slate-dark'
            }`}
          >
            <Award size={12} /> Solo VIP
          </button>
        </div>
      </div>

      {/* Patients List (Floating Cards) */}
      <div className="space-y-3.5">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-light">Cargando expedientes de pacientes...</div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-3xl border border-pure-white/40">
            <Search className="mx-auto text-slate-light mb-3 opacity-40" size={30} />
            <p className="text-sm font-semibold text-slate-dark mb-1 font-display">No se encontraron pacientes</p>
            <p className="text-xs text-slate-medium">Intenta cambiar los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          paginatedPacientes.map((paciente) => (
            <div key={paciente.id} className="floating-row rounded-2xl p-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group border border-pure-white/40">
              
              {/* Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pure-white to-rose-champagne/60 border border-satin-copper/20 flex items-center justify-center text-sm text-satin-copper font-bold shadow-sm">
                  {paciente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <Link to={`/pacientes/${paciente.id}`} className="font-display font-medium text-base text-slate-dark hover:text-satin-copper transition-colors flex items-center gap-2">
                    {paciente.nombre} {paciente.apellido}
                  </Link>
                  <p className="text-[9px] text-slate-light mt-0.5 font-bold tracking-wider uppercase">EXPEDIENTE #{paciente.id.split('-')[0]} • REGISTRADO EL {new Date(paciente.created_at || new Date()).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-xs text-slate-medium md:max-w-xs w-full font-sans">
                {paciente.telefono && <span className="flex items-center gap-1.5 font-semibold"><Phone size={11} className="text-satin-copper-light" /> {paciente.telefono}</span>}
                {paciente.email && <span className="flex items-center gap-1.5 text-[11px]"><Mail size={11} className="text-satin-copper-light" /> {paciente.email}</span>}
              </div>

              {/* Last Visit */}
              <div className="flex flex-col gap-0.5 text-xs text-slate-medium font-sans">
                <span className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Última Visita</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-dark">
                  <Calendar size={12} className="text-satin-copper-light" />
                  {getUltimaVisita(paciente.id)}
                </span>
              </div>

              {/* Medical Alerts */}
              <div className="text-xs text-slate-medium max-w-xs w-full font-sans">
                {paciente.notas ? (
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-light font-bold">Notas</span>
                    <p className="italic text-[11px] text-slate-medium truncate">{paciente.notas}</p>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-light italic">Sin notas clínicas</span>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end w-full md:w-auto">
                <Link
                  to={`/pacientes/${paciente.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 text-[9px] font-bold text-satin-copper hover:text-pure-white border border-satin-copper/25 hover:bg-satin-copper rounded-xl transition-all uppercase tracking-wider bg-pure-white/40 cursor-pointer"
                >
                  <Eye size={12} /> Expediente
                </Link>
              </div>

            </div>
          ))
        )}

        {/* Pagination Controls */}
        {pacientesFiltrados.length > itemsPerPage && (
          <div className="flex justify-between items-center mt-6 p-4 glass-panel border border-pure-white/40 rounded-2xl font-sans">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4.5 py-2 border border-satin-copper/20 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-medium hover:text-slate-dark disabled:opacity-50 disabled:cursor-not-allowed bg-pure-white/20 transition-all cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-[10px] font-bold text-slate-medium uppercase tracking-widest font-sans">
              Página {currentPage} de {Math.ceil(pacientesFiltrados.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(pacientesFiltrados.length / itemsPerPage)))}
              disabled={currentPage === Math.ceil(pacientesFiltrados.length / itemsPerPage)}
              className="px-4.5 py-2 border border-satin-copper/20 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-medium hover:text-slate-dark disabled:opacity-50 disabled:cursor-not-allowed bg-pure-white/20 transition-all cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal para agregar paciente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-dark/45 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl shadow-2xl p-6 w-full max-w-lg font-sans overflow-y-auto max-h-[90vh] border border-pure-white/45">
            <div className="flex justify-between items-center mb-4 border-b border-satin-copper/15 pb-3">
              <h3 className="text-base font-medium text-slate-dark font-display">Registrar Nuevo Paciente</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-medium hover:text-slate-dark cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPaciente} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. María"
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans"
                  />
                </div>

                {/* Apellido */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Apellido</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="Ej. López"
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans"
                  />
                </div>

                {/* Cédula */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Cédula</label>
                  <input
                    type="text"
                    required
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej. V-12345678"
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans"
                  />
                </div>

                {/* Teléfono */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej. +34 600 000 000"
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans"
                  />
                       {/* Email */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria.lopez@example.com"
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans"
                  />
                </div>

                {/* Fecha Nacimiento */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={fecha_nacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper font-sans"
                  />
                </div>             </div>
              </div>

              {/* Notas */}
              <div className="flex flex-col space-y-1 pt-2">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Notas del Paciente</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones generales..."
                  rows={2}
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none placeholder:text-slate-light/60 font-sans"
                />
              </div>

              {/* Acciones del formulario */}
              <div className="flex justify-end gap-3 pt-4 border-t border-satin-copper/15 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-satin-copper/25 text-[10px] font-bold uppercase tracking-wider text-slate-dark hover:bg-pure-white/40 transition-all cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="satin-button text-pure-white text-[10px] font-bold tracking-wider uppercase py-2.5 px-6 rounded-xl cursor-pointer font-sans"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
