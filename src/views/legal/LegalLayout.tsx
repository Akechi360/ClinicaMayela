import React, { useEffect } from 'react';
import logoNombre from '../../assets/brand/nombre.png';
import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ACTUALIZADO, PAGINAS_LEGALES } from './datos';

/** Marco común de las páginas legales públicas de la landing. */
export const LegalLayout: React.FC<{ titulo: string; resumen: string; children: React.ReactNode }> = ({ titulo, resumen, children }) => {
  useEffect(() => {
    document.title = `${titulo} — Clínica Dra. Mayela González`;
    window.scrollTo(0, 0);
  }, [titulo]);

  return (
    <div className="min-h-screen bg-lilac-pearl text-ink">
      <header className="border-b border-ink/10 bg-white/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-xs font-semibold text-lilac-deep hover:text-ink">
            <ArrowLeft size={14} /> Volver al sitio
          </Link>
          <img src={logoNombre} alt="Clínica Dra. Mayela González" className="h-9 w-auto hidden sm:block" />
        </div>
        <nav aria-label="Documentos legales" className="max-w-4xl mx-auto px-4 sm:px-8 pb-3 flex gap-2 overflow-x-auto">
          {PAGINAS_LEGALES.map((p) => (
            <NavLink
              key={p.to}
              to={p.to}
              className={({ isActive }) =>
                `whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                  isActive ? 'bg-ink text-white border-ink' : 'bg-white/70 text-lilac-deep border-ink/10 hover:border-aurora-deep'
                }`}
            >
              {p.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-aurora-deep mb-3">
          <ShieldCheck size={14} /> Transparencia y confianza
        </div>
        <h1 className="font-fraunces text-3xl sm:text-5xl leading-tight mb-3">{titulo}</h1>
        <p className="text-sm text-lilac-muted max-w-2xl leading-relaxed">{resumen}</p>
        <p className="text-[11px] text-lilac-muted mt-3">Última actualización: {ACTUALIZADO}</p>
        <div className="mt-10 space-y-9 text-sm leading-relaxed text-ink/90">{children}</div>

        <div className="mt-14 pt-6 border-t border-ink/10 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-lilac-muted">
          {PAGINAS_LEGALES.map((p) => (
            <Link key={p.to} to={p.to} className="hover:text-aurora-deep underline-offset-2 hover:underline">{p.label}</Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export const Seccion: React.FC<{ titulo: string; children: React.ReactNode }> = ({ titulo, children }) => (
  <section className="space-y-3">
    <h2 className="font-fraunces text-xl sm:text-2xl text-ink">{titulo}</h2>
    {children}
  </section>
);

export const Lista: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="list-disc pl-5 space-y-1.5 marker:text-aurora-deep">
    {items.map((it, i) => <li key={i}>{it}</li>)}
  </ul>
);

export const Aviso: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-xl border border-aurora-violet/40 bg-white/70 px-4 py-3 text-[13px] text-lilac-deep">{children}</p>
);
