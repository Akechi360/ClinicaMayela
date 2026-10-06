import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const LINKS = [
  { href: '#pilares', label: 'Terapias' },
  { href: '#peptidos', label: 'Péptidos' },
  { href: '#dra-mayela', label: 'Dra. Mayela' },
];

const EASE = [0.16, 1, 0.3, 1] as const;

interface Props {
  onLogoClick: () => void;
  onPortal: () => void;
  onSchedule: () => void;
}

/** Barra de navegación estilo Apple: transparente arriba, vidrio esmerilado al hacer scroll, menú a pantalla completa en móvil. */
export const LandingNav: React.FC<Props> = ({ onLogoClick, onPortal, onSchedule }) => {
  const reduce = useReducedMotion() ?? false;
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > 8);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menú abierto: Escape lo cierra y se bloquea el scroll de la página
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const mq = window.matchMedia('(min-width: 1024px)');
    const onMq = () => {
      if (mq.matches) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  const glass = scrolled || open;

  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-50 text-[#5E4760] transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        glass
          ? 'bg-[#FBF7FA]/72 backdrop-blur-xl backdrop-saturate-150 shadow-[0_0.5px_0_0_rgba(94,71,96,0.16)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-12 max-w-[1080px] items-center justify-between gap-4 px-5">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onLogoClick();
          }}
          aria-label="Ir al inicio"
          className="flex min-w-0 cursor-pointer items-center gap-2.5 text-left"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#5E4760]/55">
            <span className="font-fraunces text-[11px] font-medium italic leading-none">M</span>
          </span>
          <span className="text-[12px] font-medium leading-[1.15] tracking-[-0.01em] sm:text-[13px]">Clínica Dra. Mayela González</span>
        </button>

        <nav aria-label="Principal" className="hidden items-center gap-8 text-[12px] lg:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="whitespace-nowrap text-[#5E4760]/70 transition-colors hover:text-[#5E4760]">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-4">
          <button
            type="button"
            onClick={onSchedule}
            className="hidden cursor-pointer whitespace-nowrap text-[12px] text-[#5E4760]/70 transition-colors hover:text-[#5E4760] lg:block"
          >
            Agendar cita
          </button>
          <button
            type="button"
            onClick={onPortal}
            title="Acceso médico exclusivo"
            className="hidden h-7 cursor-pointer items-center whitespace-nowrap rounded-full bg-[#5E4760] px-3.5 text-[12px] text-white transition-[background-color,transform] duration-200 hover:bg-[#4a3750] active:scale-[0.97] sm:flex"
          >
            Acceso portal
          </button>

          {/* Hamburguesa → X */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="relative -mr-2 flex h-11 w-11 cursor-pointer items-center justify-center lg:hidden"
          >
            <span
              className={`absolute h-[1.5px] w-[18px] rounded-full bg-[#5E4760] transition-transform duration-300 ${open ? 'rotate-45' : '-translate-y-[3.5px]'}`}
            />
            <span
              className={`absolute h-[1.5px] w-[18px] rounded-full bg-[#5E4760] transition-transform duration-300 ${open ? '-rotate-45' : 'translate-y-[3.5px]'}`}
            />
          </button>
        </div>
      </div>
    </header>

      {/* Menú móvil a pantalla completa: fuera del <header>, porque su backdrop-filter
          convertiría al header en el bloque contenedor de este elemento fixed */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="landing-menu"
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a,button')) setOpen(false);
            }}
            className="fixed inset-x-0 bottom-0 top-12 overflow-y-auto z-40 bg-[#FBF7FA]/90 backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
          >
            <nav aria-label="Menú móvil" className="flex flex-col px-6 pb-10 pt-4">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={reduce ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : 0.05 + i * 0.05, ease: EASE }}
                  className="border-b border-[#A891AA]/20 py-4 text-[26px] leading-tight tracking-tight text-[#5E4760]"
                >
                  {l.label}
                </motion.a>
              ))}

              <motion.div
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: reduce ? 0 : 0.3, ease: EASE }}
                className="mt-8 flex flex-col gap-3"
              >
                <button
                  type="button"
                  onClick={onSchedule}
                  className="h-12 cursor-pointer rounded-full border border-[#A891AA]/50 text-[15px] text-[#5E4760] transition-colors hover:bg-[#EADAE3]/60"
                >
                  Agendar cita
                </button>
                <button
                  type="button"
                  onClick={onPortal}
                  className="h-12 cursor-pointer rounded-full bg-[#5E4760] text-[15px] text-white transition-colors hover:bg-[#4a3750]"
                >
                  Acceso portal
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
