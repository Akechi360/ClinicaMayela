import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, ShieldX, Loader2, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { fichaObtener, fichaEnviar } from '../services/db';
import { PatologiasSelector } from '../components/PatologiasUi';
import { LongevidadSeccion } from '../components/LongevidadForm';
import { SECCIONES_LONGEVIDAD, limpiarLongevidad, type DatosLongevidad } from '../data/longevidad';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'invalida'; motivo: string }
  | { tipo: 'formulario'; nombre: string | null; longevidad: boolean }
  | { tipo: 'enviada' };

const MOTIVOS: Record<string, string> = {
  no_existe: 'Este enlace no es válido. Pide a la clínica que te envíe uno nuevo.',
  ya_enviada: 'Esta ficha ya fue enviada. ¡Gracias! No necesitas hacer nada más.',
  vencida: 'Este enlace venció. Pide a la clínica que te envíe uno nuevo.',
};

const campo = 'w-full rounded-xl border border-lilac-soft bg-white px-3.5 py-3 text-base text-ink placeholder:text-lilac-muted/60 focus:outline-none focus:ring-2 focus:ring-aurora-violet/50';
const etiqueta = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-lilac-muted';

/** Página pública (sin sesión): el paciente llena su ficha de ingreso desde el teléfono. */
export const FichaIngresoPublica: React.FC = () => {
  const { codigo = '' } = useParams<{ codigo: string }>();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [paso, setPaso] = useState(0);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [fechaNac, setFechaNac] = useState('');
  const [genero, setGenero] = useState('');
  const [estatura, setEstatura] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [alergias, setAlergias] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [antecedentes, setAntecedentes] = useState('');
  const [motivo, setMotivo] = useState('');
  const [longevidad, setLongevidad] = useState<DatosLongevidad>({});
  const [veracidad, setVeracidad] = useState(false);
  const [privacidad, setPrivacidad] = useState(false);

  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  useEffect(() => {
    let vigente = true;
    fichaObtener(codigo)
      .then((r) => {
        if (!vigente) return;
        setEstado(r.ok
          ? { tipo: 'formulario', nombre: r.nombre ?? null, longevidad: !!r.incluye_longevidad }
          : { tipo: 'invalida', motivo: r.motivo ?? 'no_existe' });
      })
      .catch(() => { if (vigente) setEstado({ tipo: 'error' }); });
    return () => { vigente = false; };
  }, [codigo]);

  const conLongevidad = estado.tipo === 'formulario' && estado.longevidad;
  // Paso 0: datos y antecedentes · pasos siguientes: una sección de longevidad cada uno
  const totalPasos = useMemo(() => 1 + (conLongevidad ? SECCIONES_LONGEVIDAD.length : 0), [conLongevidad]);
  const esUltimo = paso === totalPasos - 1;
  const seccionActual = conLongevidad && paso > 0 ? SECCIONES_LONGEVIDAD[paso - 1] : null;

  const subir = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const siguiente = () => {
    setError('');
    if (paso === 0 && (!nombre.trim() || !apellido.trim())) { setError('Escribe tu nombre y apellido.'); return; }
    setPaso((p) => Math.min(p + 1, totalPasos - 1));
    subir();
  };
  const atras = () => { setError(''); setPaso((p) => Math.max(p - 1, 0)); subir(); };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!esUltimo) { siguiente(); return; }
    setError('');
    if (!nombre.trim() || !apellido.trim()) { setError('Escribe tu nombre y apellido.'); setPaso(0); return; }
    if (!veracidad || !privacidad) { setError('Debes aceptar las dos declaraciones para enviar la ficha.'); return; }
    setEnviando(true);
    try {
      const datos: Record<string, unknown> = {
        nombre, apellido, cedula, telefono, email,
        fecha_nacimiento: fechaNac || null,
        genero: genero || null,
        estatura_cm: estatura || null,
        patologias, alergias, medicamentos, antecedentes, motivo,
        veracidad: String(veracidad), privacidad: String(privacidad),
      };
      if (conLongevidad) datos.longevidad = limpiarLongevidad(longevidad);
      const r = await fichaEnviar(codigo, datos);
      if (r.ok) { setEstado({ tipo: 'enviada' }); subir(); }
      else if (r.motivo === 'falta_nombre' || r.motivo === 'falta_aceptacion') setError('Revisa los datos obligatorios e intenta de nuevo.');
      else setEstado({ tipo: 'invalida', motivo: r.motivo ?? 'no_existe' });
    } catch {
      setError('No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-lilac-pearl text-ink">
      <header className="border-b border-lilac-soft bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 py-3">
          <span className="font-fraunces text-base text-lilac-deep">Clínica Dra. Mayela González</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6">
        {estado.tipo === 'cargando' && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-lilac-soft bg-white p-10 text-lilac-muted">
            <Loader2 className="animate-spin" /> Cargando…
          </div>
        )}

        {estado.tipo === 'error' && (
          <div className="rounded-3xl border border-lilac-soft bg-white p-8 text-center text-sm text-lilac-muted">
            No se pudo abrir la ficha. Revisa tu conexión e intenta de nuevo.
          </div>
        )}

        {estado.tipo === 'invalida' && (
          <div role="alert" className="rounded-3xl border border-lilac-soft bg-white p-8 text-center">
            <ShieldX className="mx-auto mb-3 text-lilac-muted" size={40} />
            <p className="text-sm text-lilac-muted">{MOTIVOS[estado.motivo] ?? MOTIVOS.no_existe}</p>
          </div>
        )}

        {estado.tipo === 'enviada' && (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-emerald-600" size={44} />
            <h1 className="mb-2 font-fraunces text-2xl text-lilac-dark">¡Ficha enviada!</h1>
            <p className="text-sm text-lilac-muted">La Dra. Mayela González revisará tu información antes de tu consulta. Ya puedes cerrar esta página.</p>
          </div>
        )}

        {estado.tipo === 'formulario' && (
          <form onSubmit={enviar} className="space-y-5">
            <div>
              <h1 className="font-fraunces text-3xl leading-tight text-lilac-dark">
                {estado.nombre ? `Hola ${estado.nombre},` : conLongevidad ? 'Historia clínica' : 'Ficha de ingreso'}
              </h1>
              <p className="mt-1 text-sm text-lilac-muted">
                {estado.nombre ? 'completa tu ficha.' : 'Completa tus datos antes de tu consulta.'}{' '}
                Solo la verá la Dra. Mayela González.{conLongevidad ? ' Puedes saltar lo que no sepas.' : ''}
              </p>
              {totalPasos > 1 && (
                <div className="mt-3" aria-label={`Paso ${paso + 1} de ${totalPasos}`}>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-lilac-soft">
                    <div className="h-full rounded-full bg-lilac-deep transition-all" style={{ width: `${((paso + 1) / totalPasos) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-lilac-muted">Paso {paso + 1} de {totalPasos}</p>
                </div>
              )}
            </div>

            {paso === 0 && (
              <>
                <section className="space-y-3 rounded-2xl border border-lilac-soft bg-white p-4">
                  <h2 className="font-fraunces text-lg text-lilac-deep">Tus datos</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div><label className={etiqueta}>Nombre *</label><input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="given-name" /></div>
                    <div><label className={etiqueta}>Apellido *</label><input className={campo} value={apellido} onChange={(e) => setApellido(e.target.value)} autoComplete="family-name" /></div>
                    <div><label className={etiqueta}>Cédula</label><input className={campo} value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="V-12345678" /></div>
                    <div><label className={etiqueta}>Teléfono</label><input className={campo} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="0414-0000000" type="tel" autoComplete="tel" /></div>
                    <div className="sm:col-span-2"><label className={etiqueta}>Correo electrónico</label><input className={campo} value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" /></div>
                    <div><label className={etiqueta}>Fecha de nacimiento</label><input className={campo} value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} type="date" /></div>
                    <div>
                      <label className={etiqueta}>Sexo</label>
                      <select className={campo} value={genero} onChange={(e) => setGenero(e.target.value)}>
                        <option value="">Prefiero no indicar</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div><label className={etiqueta}>Estatura (cm)</label><input className={campo} value={estatura} onChange={(e) => setEstatura(e.target.value)} type="number" inputMode="decimal" min={50} max={250} step="0.5" placeholder="165" /></div>
                  </div>
                </section>

                <section className="space-y-3 rounded-2xl border border-lilac-soft bg-white p-4">
                  <h2 className="font-fraunces text-lg text-lilac-deep">Antecedentes de salud</h2>
                  <p className="text-xs text-lilac-muted">Marca todo lo que aplique o haya aplicado en tu vida. Si dudas, déjalo y coméntalo en la consulta.</p>
                  <PatologiasSelector value={patologias} onChange={setPatologias} />
                  <div><label className={etiqueta}>Alergias (medicamentos, alimentos, látex…)</label><input className={campo} value={alergias} onChange={(e) => setAlergias(e.target.value)} placeholder="Ninguna conocida" /></div>
                  <div><label className={etiqueta}>Medicamentos que tomas actualmente</label><textarea className={campo} rows={2} value={medicamentos} onChange={(e) => setMedicamentos(e.target.value)} placeholder="Nombre y dosis, si los recuerdas" /></div>
                  <div><label className={etiqueta}>Cirugías o enfermedades importantes</label><textarea className={campo} rows={2} value={antecedentes} onChange={(e) => setAntecedentes(e.target.value)} /></div>
                  <div><label className={etiqueta}>¿Qué te gustaría tratar o mejorar?</label><textarea className={campo} rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} /></div>
                </section>
              </>
            )}

            {seccionActual && (
              <section className="space-y-3 rounded-2xl border border-lilac-soft bg-white p-4">
                <h2 className="font-fraunces text-lg text-lilac-deep">{seccionActual.titulo}</h2>
                <LongevidadSeccion
                  seccion={seccionActual}
                  valor={longevidad[seccionActual.id]}
                  onChange={(parche) => setLongevidad((prev) => ({ ...prev, [seccionActual.id]: { ...prev[seccionActual.id], ...parche } }))}
                />
              </section>
            )}

            {esUltimo && (
              <section className="space-y-3 rounded-2xl border border-lilac-soft bg-white p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                  <input type="checkbox" checked={veracidad} onChange={(e) => setVeracidad(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#A891AA]" />
                  <span>Declaro que la información que he proporcionado es verdadera y completa, y que no he omitido patologías, alergias ni medicamentos.</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                  <input type="checkbox" checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#A891AA]" />
                  <span>
                    Autorizo el tratamiento de mis datos de salud para mi atención en la clínica, según el{' '}
                    <a href="/privacidad" target="_blank" rel="noreferrer" className="font-semibold text-lilac-deep underline">Aviso de privacidad</a>.
                  </span>
                </label>
              </section>
            )}

            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="flex gap-3 pb-2">
              {paso > 0 && (
                <button type="button" onClick={atras} className="flex items-center justify-center gap-2 rounded-2xl border border-lilac-soft bg-white px-5 py-4 text-sm font-bold uppercase tracking-wider text-lilac-deep">
                  <ArrowLeft size={15} /> Atrás
                </button>
              )}
              {esUltimo ? (
                <button type="submit" disabled={enviando} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lilac-deep px-5 py-4 text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60">
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />} Enviar ficha
                </button>
              ) : (
                <button type="button" onClick={siguiente} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-lilac-deep px-5 py-4 text-sm font-bold uppercase tracking-wider text-white">
                  Siguiente <ArrowRight size={15} />
                </button>
              )}
            </div>
            <p className="pb-6 text-center text-[11px] text-lilac-muted">Este enlace es personal y solo puede usarse una vez.</p>
          </form>
        )}
      </main>
    </div>
  );
};
