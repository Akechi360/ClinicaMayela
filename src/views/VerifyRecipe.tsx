import React, { useEffect, useState } from 'react';
import logoNombre from '../assets/brand/nombre.png';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldX, ShieldAlert, Clock, ArrowRight, Loader2, MapPin, Phone } from 'lucide-react';
import { verificarRecipe } from '../services/db';
import type { RecipeVerificado } from '../types/database.types';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; r: RecipeVerificado };

const fechaLarga = (d?: string | null) => {
  if (!d) return '';
  const f = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00') : new Date(d);
  return f.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** "1. Amoxicilina — 500 mg — cada 8 horas" -> { titulo: "Amoxicilina", detalle: "500 mg · cada 8 horas" } */
const parsearItems = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const limpio = l.replace(/^\d+\s*[.)-]\s*/, '');
      const [titulo, ...resto] = limpio.split(/\s+—\s+/);
      return { titulo, detalle: resto.join(' · ') };
    });

const Etiqueta: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lilac-muted/80">{children}</p>
);

/** Página pública (sin sesión) a la que apunta el QR del récipe: la farmacia ve si es auténtico y el documento original. */
export const VerifyRecipe: React.FC = () => {
  const { codigo = '' } = useParams<{ codigo: string }>();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  // Página de uso privado (el enlace llega por QR/WhatsApp): que no la indexen los buscadores
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  useEffect(() => {
    let vigente = true;
    const cargar: Promise<RecipeVerificado> =
      import.meta.env.DEV && codigo.startsWith('demo')
        ? import('../lib/recipeDemo').then((m) => m.recipeDemo(codigo))
        : verificarRecipe(codigo);
    cargar
      .then((r) => { if (vigente) setEstado({ tipo: 'ok', r }); })
      .catch(() => { if (vigente) setEstado({ tipo: 'error' }); });
    return () => { vigente = false; };
  }, [codigo]);

  const r = estado.tipo === 'ok' ? estado.r : null;
  const anuladoSinContenido = !!r?.valido && r.estado === 'anulado' && !r.vigente_codigo;
  const expirado = !!r?.valido && !!r.vigente_codigo;
  const dispensado = !!r?.valido && r.estado === 'dispensado';
  const mostrarReceta = !!r?.valido && !anuladoSinContenido;
  const items = r?.medicamentos ? parsearItems(r.medicamentos) : [];

  let badge: { texto: string; clase: string } | null = null;
  if (expirado) badge = { texto: 'Versión expirada', clase: 'bg-amber-100 text-amber-800 border-amber-300' };
  else if (anuladoSinContenido) badge = { texto: 'Anulado', clase: 'bg-red-100 text-red-700 border-red-300' };
  else if (dispensado) badge = { texto: 'Ya dispensado', clase: 'bg-amber-100 text-amber-800 border-amber-300' };
  else if (r?.valido) badge = { texto: 'Verificado', clase: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
  else if (r && !r.valido) badge = { texto: 'Inválido', clase: 'bg-red-100 text-red-700 border-red-300' };

  return (
    <div className="min-h-screen bg-lilac-pearl text-ink">
      <header className="border-b border-lilac-soft bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <img src={logoNombre} alt="Clínica Dra. Mayela González" className="h-9 w-auto" />
          {badge && <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${badge.clase}`}>{badge.texto}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        {estado.tipo === 'cargando' && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-lilac-soft bg-white p-10 text-lilac-muted">
            <Loader2 className="animate-spin" /> Verificando autenticidad…
          </div>
        )}

        {estado.tipo === 'error' && (
          <div className="rounded-3xl border border-lilac-soft bg-white p-8 text-center text-sm text-lilac-muted">
            No se pudo completar la verificación. Revisa tu conexión e intenta de nuevo.
          </div>
        )}

        {r && !r.valido && (
          <div role="alert" className="rounded-3xl border-2 border-red-300 bg-white p-8 text-center">
            <ShieldX className="mx-auto mb-3 text-red-600" size={44} />
            <h1 className="mb-2 font-fraunces text-2xl text-red-700">Récipe inválido</h1>
            <p className="text-sm text-lilac-muted">Este código no corresponde a un récipe emitido por la clínica, o el documento fue alterado. No lo despaches.</p>
          </div>
        )}

        {anuladoSinContenido && (
          <div role="alert" className="rounded-3xl border-2 border-red-300 bg-white p-8 text-center">
            <ShieldX className="mx-auto mb-3 text-red-600" size={44} />
            <h1 className="mb-2 font-fraunces text-2xl text-red-700">Récipe anulado</h1>
            <p className="text-sm text-lilac-muted">
              El documento es auténtico, pero {r?.doctor_nombre} lo anuló{r?.estado_at ? ` el ${fechaLarga(r.estado_at)}` : ''}. No lo despaches.
            </p>
          </div>
        )}

        {expirado && r && (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Clock className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Este récipe fue actualizado por la médica</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                {r.doctor_nombre} lo corrigió{r.estado_at ? ` el ${fechaLarga(r.estado_at)}` : ''}. El contenido que ves abajo es la versión original impresa, pero ya no es la vigente.
              </p>
              <Link to={`/v/${r.vigente_codigo}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline">
                Ver versión vigente <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        {dispensado && (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Récipe auténtico · ya dispensado</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Fue marcado como dispensado{r?.estado_at ? ` el ${fechaLarga(r.estado_at)}` : ''}. Confirma con el paciente antes de entregar de nuevo.
              </p>
            </div>
          </div>
        )}

        {mostrarReceta && r && (
          <>
            <div className="border-l-4 border-aurora-deep pl-4">
              <h1 className="font-fraunces text-3xl leading-tight text-lilac-dark">Récipe médico verificado</h1>
              <p className="mt-1 text-sm text-lilac-muted">
                Esta es la versión canónica registrada por la especialista emisora. Compárala con el papel impreso para confirmar que no fue alterado.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-lilac-soft bg-white p-5">
                <Etiqueta>Médico</Etiqueta>
                <p className="mt-2 font-fraunces text-lg text-lilac-dark">{r.doctor_nombre}</p>
                {r.especialidad && (
                  <span className="mt-1 inline-block rounded-full bg-lilac-blush px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lilac-deep">{r.especialidad}</span>
                )}
                <p className="mt-2 text-xs text-lilac-muted">
                  MPPS {r.doctor_mpps ?? '—'} · CM {r.doctor_col ?? '—'}
                </p>
                {(r.consultorio_nombre || r.consultorio_direccion || r.telefono) && (
                  <div className="mt-3 space-y-1 border-t border-lilac-soft pt-3 text-xs text-lilac-muted">
                    {r.consultorio_nombre && <p className="font-semibold text-lilac-deep">{r.consultorio_nombre}</p>}
                    {r.consultorio_direccion && <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" />{r.consultorio_direccion}</p>}
                    {r.telefono && <p className="flex items-center gap-1.5"><Phone size={12} className="shrink-0" />{r.telefono}</p>}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-lilac-soft bg-white p-5">
                <Etiqueta>Paciente</Etiqueta>
                <p className="mt-2 font-fraunces text-lg text-lilac-dark">{r.paciente}</p>
                {r.paciente_cedula && <p className="mt-1 text-xs font-mono text-lilac-muted">{r.paciente_cedula}</p>}
                <p className="mt-3 border-t border-lilac-soft pt-3 text-xs leading-relaxed text-lilac-muted">
                  Confirma que el nombre y los últimos dígitos de la cédula coincidan con quien tienes delante antes de dispensar.
                </p>
              </section>
            </div>

            <section className="rounded-2xl border border-lilac-soft bg-white">
              <div className="flex items-center justify-between border-b border-lilac-soft px-5 py-3">
                <Etiqueta>Medicamentos prescritos</Etiqueta>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-lilac-muted/80">
                  Prescritos el <span className="text-lilac-deep">{fechaLarga(r.fecha)}</span>
                </p>
              </div>
              <ol className="divide-y divide-lilac-soft">
                {items.map((it, i) => (
                  <li key={i} className="flex gap-4 px-5 py-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lilac-blush text-xs font-bold text-lilac-deep">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-lilac-dark">{it.titulo}</p>
                      {it.detalle && <p className="mt-0.5 text-sm text-lilac-muted">{it.detalle}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              {r.indicaciones && (
                <div className="border-t border-lilac-soft px-5 py-4">
                  <Etiqueta>Indicaciones</Etiqueta>
                  <p className="mt-1 whitespace-pre-line text-sm italic text-lilac-muted">{r.indicaciones}</p>
                </div>
              )}
              {(r.firma || r.sello) && (
                <div className="flex items-end justify-center gap-6 border-t border-lilac-soft px-5 py-4">
                  {r.firma && <img src={r.firma} alt="Firma de la médica" className="h-14 object-contain" />}
                  {r.sello && <img src={r.sello} alt="Sello de la médica" className="h-16 object-contain" />}
                </div>
              )}
            </section>

            <p className="rounded-xl bg-lilac-blush/60 px-4 py-3 text-xs leading-relaxed text-lilac-deep">
              Si los medicamentos en el papel no coinciden con los listados arriba, no despaches y contacta a la médica emisora.
            </p>
            <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-lilac-muted">
              <ShieldCheck size={13} className="text-emerald-600" />
              Plataforma de verificación de Clínica Dra. Mayela González · Corregir un récipe invalida automáticamente su código.
            </p>
          </>
        )}
      </main>
    </div>
  );
};
