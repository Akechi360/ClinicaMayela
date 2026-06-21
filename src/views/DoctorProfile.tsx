// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbDoctor } from '../services/db';
import { Save, Upload, User, Globe, Mail, Phone, Calendar, Shield, Camera } from 'lucide-react';
import { useToast } from '../components/Toast';

export const DoctorProfile: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor'],
    queryFn: dbDoctor.obtener
  });

  const updateMutation = useMutation({
    mutationFn: dbDoctor.actualizar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor'] });
      setSuccessMessage('¡Perfil guardado correctamente!');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage('Ocurrió un error al guardar los cambios: ' + (err?.message || ''));
      setTimeout(() => setErrorMessage(''), 5000);
    }
  });

  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [cedulaProf, setCedulaProf] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [foto, setFoto] = useState('');
  const [biografia, setBiografia] = useState('');
  const [horario, setHorario] = useState('');
  const [mpps, setMpps] = useState('');
  const [col, setCol] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (doctor) {
      setNombre(doctor.nombre || '');
      setEspecialidad(doctor.especialidad || '');
      setCedulaProf(doctor.cedula_prof || '');
      setCorreo(doctor.correo || '');
      setTelefono(doctor.telefono || '');
      setFoto(doctor.foto || '');
      setBiografia(doctor.biografia || '');
      const h = doctor.horario;
      if (!h) setHorario('');
      else if (typeof h === 'object') setHorario(Object.entries(h).map(([k, v]) => `${k}: ${v}`).join(', '));
      else setHorario(String(h));
      setMpps(doctor.mpps || '');
      setCol(doctor.col || '');
    }
  }, [doctor]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('La imagen supera el límite de 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => { if (typeof reader.result === 'string') setFoto(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !especialidad || !cedulaProf || !correo || !telefono) {
      setErrorMessage('Por favor rellena todos los campos obligatorios.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    updateMutation.mutate({
      id: doctor?.id,
      nombre,
      especialidad,
      cedula_prof: cedulaProf,
      correo,
      telefono,
      foto,
      biografia,
      horario: horario || null,
      mpps: mpps || null,
      col: col || null,
      updated_at: new Date().toISOString()
    });
  };

  if (isLoading) return <div className="py-12 text-center text-xs text-slate-light">Cargando perfil profesional...</div>;

  return (
    <div className="space-y-8 px-2 max-w-6xl mx-auto font-sans">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-light text-slate-dark tracking-wide">
          Perfil <span className="italic font-normal text-satin-copper">Profesional</span>
        </h2>
        {/* CORREGIDO: eliminado “clínica” */}
        <p className="text-xs text-slate-light mt-0.5">Administra tu identidad, credenciales de especialidad y redes sociales.</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-xs font-semibold animate-fade-in shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 text-xs font-semibold animate-fade-in shadow-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">

          {/* Información General — CORREGIDO desde “Información Básica” */}
          <section className="glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
            <h3 className="text-sm font-display font-semibold text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
              <User size={15} className="text-satin-copper" /> Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Nombre Completo *</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Dra. Mayela González"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Especialidad *</label>
                <input type="text" required value={especialidad} onChange={(e) => setEspecialidad(e.target.value)}
                  placeholder="Ej. Medicina Estética"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              {/* CORREGIDO: label dice Cédula Profesional, Tailwind uppercase lo renderiza en mayúsculas */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Cédula Profesional *</label>
                <input type="text" required value={cedulaProf} onChange={(e) => setCedulaProf(e.target.value)}
                  placeholder="Ej. 12345678-A"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Registro MPPS</label>
                <input type="text" value={mpps} onChange={(e) => setMpps(e.target.value)}
                  placeholder="Ej. MPPS-12345"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Colegio de Médicos (COL)</label>
                <input type="text" value={col} onChange={(e) => setCol(e.target.value)}
                  placeholder="Ej. COL-67890"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Horario de Consulta</label>
                <input type="text" value={horario} onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ej. Lunes a Viernes de 9:00 a 18:30"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
            </div>
          </section>

          {/* Contacto & Redes */}
          <section className="glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury space-y-5">
            <h3 className="text-sm font-display font-semibold text-slate-dark border-b border-satin-copper/10 pb-3 flex items-center gap-2">
              <Globe size={15} className="text-satin-copper" /> Canales de Contacto & Redes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Correo de Contacto *</label>
                <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
                  placeholder="doctora@example.com"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              {/* CORREGIDO: Teléfono (Tailwind uppercase lo renderiza en mayúsculas visualmente) */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Teléfono *</label>
                <input type="text" required value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+58 414 000 0000"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Enlace LinkedIn <span className="text-slate-light/60">(solo vista previa)</span></label>
                <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/doctora"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-slate-medium font-semibold">Enlace Instagram <span className="text-slate-light/60">(solo vista previa)</span></label>
                <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/doctora"
                  className="bg-pure-white/30 border border-satin-copper/15 rounded-lg px-3 py-2 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper placeholder:text-slate-light/60 font-sans" />
              </div>
            </div>
          </section>

          {/* Biografía */}
          <section className="glass-panel p-6 rounded-3xl border border-pure-white/40 shadow-luxury space-y-4">
            <h3 className="text-sm font-display font-semibold text-slate-dark border-b border-satin-copper/10 pb-3">Biografía Profesional</h3>
            <textarea value={biografia} onChange={(e) => setBiografia(e.target.value)}
              placeholder="Introduce una breve descripción de tu trayectoria..."
              rows={4}
              className="w-full bg-pure-white/30 border border-satin-copper/15 rounded-xl p-3 text-xs text-slate-dark focus:outline-none focus:ring-1 focus:ring-satin-copper resize-none leading-relaxed placeholder:text-slate-light/60 font-sans" />
          </section>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={updateMutation.isPending}
              className="rosa-button text-[10px] font-semibold tracking-[0.12em] uppercase py-3.5 px-8 rounded-xl flex items-center gap-1.5 cursor-pointer">
              <Save size={14} />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </div>
        </form>

        {/* Vista Previa */}
        <div className="lg:col-span-5 space-y-6">
          <div className="lg:sticky lg:top-28 space-y-6">
            <p className="text-[9px] uppercase tracking-wider text-slate-light font-bold px-1 select-none">Vista Previa de Tarjeta Médica</p>
            <div className="glass-panel rounded-3xl border border-pure-white/45 p-6 flex flex-col justify-between min-h-[450px] h-auto relative overflow-hidden group shadow-luxury">
              <div className="absolute -right-12 -top-12 w-44 h-44 bg-satin-copper/10 rounded-full filter blur-2xl pointer-events-none group-hover:scale-110 duration-700" />
              <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-slate-light/5 rounded-full filter blur-2xl pointer-events-none" />
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-satin-copper/25 shadow-md shrink-0 bg-pure-white/20 flex items-center justify-center text-slate-light">
                    {foto ? <img src={foto} alt="Preview" className="w-full h-full object-cover" /> : <User size={30} className="opacity-60" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-medium text-slate-dark">{nombre || 'Dra. Mayela González'}</h4>
                    <p className="text-[10px] text-satin-copper font-bold uppercase tracking-wider mt-0.5">{especialidad || 'Especialista'}</p>
                  </div>
                </div>
                <div className="space-y-2.5 text-xs text-slate-medium border-t border-satin-copper/10 pt-4">
                  <p className="flex items-center gap-2"><Shield size={13} className="text-satin-copper-light" /> Cédula: <span className="font-semibold text-slate-dark">{cedulaProf || 'Pendiente'}</span></p>
                  <p className="flex items-center gap-2"><Calendar size={13} className="text-satin-copper-light" /> Horario: <span className="font-semibold text-slate-dark">{horario || 'Lunes a Viernes'}</span></p>
                  <p className="flex items-center gap-2"><Mail size={13} className="text-satin-copper-light" /> Correo: <span className="font-semibold text-slate-dark truncate max-w-[200px]">{correo || 'doctora@clinica.com'}</span></p>
                  <p className="flex items-center gap-2"><Phone size={13} className="text-satin-copper-light" /> Teléfono: <span className="font-semibold text-slate-dark">{telefono || 'Sin registrar'}</span></p>
                </div>
                <div className="text-xs text-slate-medium italic leading-relaxed border-t border-satin-copper/10 pt-4">
                  <p className="line-clamp-4">"{biografia || 'Sin descripción biográfica.'}"</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-satin-copper/10 relative z-10">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-pure-white/40 hover:bg-pure-white/60 border border-satin-copper/15 hover:border-satin-copper/25 rounded-xl text-[9px] font-bold uppercase tracking-wider text-slate-dark transition-all cursor-pointer shadow-xs select-none">
                  <Upload size={11} className="text-satin-copper" /> Subir Foto
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <div className="flex gap-2">
                  {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-pure-white/30 hover:bg-satin-copper/10 text-slate-medium hover:text-satin-copper transition-colors"><Globe size={14} /></a>}
                  {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full bg-pure-white/30 hover:bg-satin-copper/10 text-slate-medium hover:text-satin-copper transition-colors"><Camera size={14} /></a>}
                </div>
              </div>
            </div>

            {/* Cuadro inferior derecho — pendiente de instrucción del usuario sobre qué cambiar */}
            <div className="p-4 bg-satin-copper/5 border border-satin-copper/15 rounded-2xl text-[10px] text-slate-medium leading-relaxed font-sans shadow-inner">
              <p className="font-bold text-satin-copper mb-1 uppercase tracking-wide">Credenciales Clínicas</p>
              La información guardada aquí se usa en consentimientos informados, Topbar y correos automáticos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
