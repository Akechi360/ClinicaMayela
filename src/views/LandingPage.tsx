import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import {
  ShieldCheck,
  ArrowRight,
  Calculator,
  LogIn,
  CheckCircle2,
  Award,
  Layers,
  MessageCircle,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { NumberTicker } from '../components/motion/NumberTicker';

gsap.registerPlugin(ScrollTrigger);

// Easing limpio para hover/tap de botones — sin resorte, sin rebote.
const tapTransition = { duration: 0.2, ease: 'easeOut' as const };

// Resorte reservado solo para la barra de la jeringa (no es una interacción de botón).
const springConfig = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 1,
};

// Datos de los 4 Pilares Terapéuticos
const PILARES = [
  {
    num: "01",
    tag: "Medicina Celular & Regeneración",
    title: "Péptidos Bioactivos & Longevidad",
    desc: "Protocolos terapéuticos con moléculas de señalización celular de alta pureza. Estimulación de hormona de crecimiento, regeneración tisular, salud mitocondrial y modulación metabólica avanzada.",
    highlights: ["BPC-157 & TB-500", "Semaglutida & Tirzepatida", "CJC-1295 / Ipamorelin", "GHK-Cu (Péptido de Cobre)", "NAD+ Intracelular"],
  },
  {
    num: "02",
    tag: "Escultura Médica & Precisión",
    title: "Armonización Facial Inteligente",
    desc: "Abordaje tridimensional del envejecimiento facial respetando las proporciones áureas y la dinámica muscular natural. Resultados indetectables con técnicas de mínima invasión.",
    highlights: ["Toxina Botulínica Preventiva y Correctiva", "Ácido Hialurónico de Alta Cohesión", "Técnica Rinomodelación 4 Puntos", "Perfilado Mandibular & Mentón", "Lip Flip & Tratamientos Labiales"],
  },
  {
    num: "03",
    tag: "Inducción Autóloga de Colágeno",
    title: "Bioestimulación & Exosomas",
    desc: "Reactivación biológica de los fibroblastos para una dermis densa, elástica y luminosa. Terapia vesicular avanzada para regeneración cutánea profunda y bioestimulación capilar.",
    highlights: ["Radiesse (Hidroxiapatita de Calcio)", "Ellansé (Bioestimulador duradero)", "Vesículas Extracelulares (Exosomas)", "Polinucleótidos & Mesoheal", "Peelings Médicos de Rejuvenecimiento"],
  },
  {
    num: "04",
    tag: "Optimización Biológica Global",
    title: "Medicina Metabólica & Corporal",
    desc: "Evaluación integral de la composición corporal (masa grasa, masa magra, IMC y retención) asociada a programas de salud metabólica, sueroterapia détox y antienvejecimiento sistémico.",
    highlights: ["Composición Corporal Bioeléctrica", "Sueroterapia Ortomolecular IV", "Radiofrecuencia & Modelado Tisular", "Carboxiterapia Subcutánea", "Controles de Laboratorio Específicos"],
  }
];

const PEPTIDE_PRESETS = [
  { id: 'bpc157', label: 'BPC-157 (5 mg)' },
  { id: 'semaglutide', label: 'Semaglutida (5 mg)' },
  { id: 'tirzepatide', label: 'Tirzepatida (10 mg)' },
  { id: 'ghkcu', label: 'GHK-Cu (50 mg)' },
] as const;

// Palabra individual con máscara overflow-hidden: la unidad mínima del reveal del titular.
const Word: React.FC<{ children: string; className?: string }> = ({ children, className = '' }) => (
  <span className="word-mask inline-block overflow-hidden align-top">
    <span className={`word-inner inline-block ${className}`} style={{ transform: 'translateY(110%)' }}>
      {children}
    </span>
  </span>
);

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const blobCursorRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  // Estados interactivos para la Mini-Calculadora Teaser
  const [calcPeptido, setCalcPeptido] = useState<'bpc157' | 'semaglutide' | 'tirzepatide' | 'ghkcu'>('bpc157');
  const [vialMg, setVialMg] = useState<number>(5);
  const [dilucionMl, setDilucionMl] = useState<number>(2);
  const [dosisMcg, setDosisMcg] = useState<number>(250);

  // Cálculo en tiempo real:
  const concMcgMl = (vialMg * 1000) / (dilucionMl || 1);
  const mcgPorUi = concMcgMl / 100;
  const unidadesJeringa = mcgPorUi > 0 ? (dosisMcg / mcgPorUi) : 0;
  const dosisTotales = (vialMg * 1000) / (dosisMcg || 1);

  const handleSelectPeptidePreset = (key: 'bpc157' | 'semaglutide' | 'tirzepatide' | 'ghkcu') => {
    setCalcPeptido(key);
    if (key === 'bpc157') {
      setVialMg(5);
      setDilucionMl(2);
      setDosisMcg(250);
    } else if (key === 'semaglutide') {
      setVialMg(5);
      setDilucionMl(2);
      setDosisMcg(250); // 0.25 mg
    } else if (key === 'tirzepatide') {
      setVialMg(10);
      setDilucionMl(2);
      setDosisMcg(2500); // 2.5 mg
    } else if (key === 'ghkcu') {
      setVialMg(50);
      setDilucionMl(3);
      setDosisMcg(2000); // 2 mg
    }
  };

  const handleOpenWhatsApp = (mensaje: string) => {
    const tel = "584120000000";
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Toda la coreografía de movimiento vive aquí, aislada por useGSAP (cleanup automático).
  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lenis + GSAP ticker: el patrón estándar, en vez del rAF manual suelto.
    let lenis: Lenis | undefined;
    let raf: ((time: number) => void) | undefined;
    let cleanupCursor: (() => void) | undefined;
    if (!reduced) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenisRef.current = lenis;
      raf = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis.on('scroll', ScrollTrigger.update);
    }

    // Los enlaces ancla deben pasar por Lenis — un salto nativo del navegador
    // desincroniza su posición interna y ScrollTrigger deja de disparar.
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -72 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };
    pageRef.current?.addEventListener('click', handleAnchorClick);

    // Reveal del titular, palabra por palabra. El overflow-hidden de cada
    // palabra es solo la máscara de la animación — se quita al terminar,
    // si no las descendentes (la cola de la "g", la "y"...) quedan recortadas para siempre.
    if (reduced) {
      gsap.set('.word-inner, .hero-reveal', { clearProps: 'all' });
      gsap.set('.word-mask', { overflow: 'visible' });
    } else {
      const tl = gsap.timeline({ delay: 0.15 });
      tl.to('.hero-eyebrow', { opacity: 1, duration: 0.6, ease: 'power2.out' })
        .to('.word-inner', {
          y: '0%', duration: 1.1, stagger: 0.045, ease: 'power4.out',
          onComplete: () => gsap.set('.word-mask', { overflow: 'visible' }),
        }, 0.1)
        .to('.hero-lede', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.6')
        .to('.hero-cta', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.55');
    }

    if (!reduced) {
      // Parallax de los 3 blobs, a velocidades distintas.
      gsap.utils.toArray<HTMLElement>('.blob-parallax').forEach((el) => {
        const speed = parseFloat(el.dataset.speed || '0');
        gsap.to(el, {
          y: () => window.innerHeight * speed,
          ease: 'none',
          scrollTrigger: { trigger: pageRef.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
        });
      });

      // El blob principal se inclina sutilmente hacia el cursor.
      if (window.matchMedia('(pointer: fine)').matches && blobCursorRef.current) {
        const blobX = gsap.quickTo(blobCursorRef.current, 'x', { duration: 1.4, ease: 'power2.out' });
        const blobY = gsap.quickTo(blobCursorRef.current, 'y', { duration: 1.4, ease: 'power2.out' });
        const onMove = (e: MouseEvent) => {
          blobX((e.clientX / window.innerWidth - 0.5) * 60);
          blobY((e.clientY / window.innerHeight - 0.5) * 40);
        };
        window.addEventListener('mousemove', onMove);
        cleanupCursor = () => window.removeEventListener('mousemove', onMove);
      }
    }

    // Reveal escalonado de los pilares al entrar en viewport.
    gsap.from('.pilar-col', {
      y: reduced ? 0 : 32,
      opacity: reduced ? 1 : 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: '.pilares-grid', start: 'top 85%' },
    });

    return () => {
      pageRef.current?.removeEventListener('click', handleAnchorClick);
      if (raf) gsap.ticker.remove(raf);
      cleanupCursor?.();
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="min-h-screen bg-lilac-pearl text-ink font-sans relative selection:bg-aurora-rose/40 selection:text-ink overflow-x-hidden">

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER — glass sutil, pills magnéticas
      ───────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-lilac-pearl/65 backdrop-saturate-150 border-b border-ink/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => lenisRef.current ? lenisRef.current.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-aurora-deep via-aurora-violet to-aurora-rose p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-lilac-pearl rounded-full flex items-center justify-center">
                <span className="font-fraunces italic font-medium text-xs text-ink">M</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-fraunces italic text-sm tracking-wide font-medium text-ink">
                Mayela
              </span>
              <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider text-lilac-muted/80 font-mono">
                · Medicina & Longevidad
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-[12px] font-normal tracking-tight text-ink/75">
            <a href="#pilares" className="hover:text-ink transition-colors whitespace-nowrap">Terapias</a>
            <a href="#peptidos" className="hover:text-ink transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <span>Péptidos</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8.5px] bg-aurora-violet/15 text-aurora-deep font-medium">cGMP</span>
            </a>
            <a href="#calculadora" className="hover:text-ink transition-colors whitespace-nowrap">Calculadora</a>
            <a href="#dra-mayela" className="hover:text-ink transition-colors whitespace-nowrap">Dra. Mayela</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-1 rounded-full text-[11px] font-medium text-ink/80 hover:text-ink hover:bg-ink/[0.04] transition-colors cursor-pointer border border-ink/10 whitespace-nowrap"
              title="Acceso médico exclusivo"
            >
              Portal
            </button>

            <motion.button
              onClick={() => handleOpenWhatsApp("Hola Dra. Mayela, quisiera solicitar una evaluación médica personalizada.")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={tapTransition}
              className="px-4 py-1 rounded-full text-[11px] font-medium text-white bg-ink hover:bg-lilac-deep transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Agendar Cita</span>
              <ChevronRight size={12} className="text-aurora-rose" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO — fondo aurora (sin 3D), titular por palabras
      ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Fondo aurora: 3 manchas con deriva ambiental + parallax de scroll */}
        <div className="absolute -inset-[10%] z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 aurora-drift-1">
            <div className="blob-parallax absolute inset-0" data-speed="0.08">
              <div
                ref={blobCursorRef}
                className="absolute rounded-full blur-[90px] opacity-[0.65] w-[52vw] h-[52vw] -left-[14%] -top-[18%]"
                style={{ background: 'radial-gradient(circle at 35% 35%, #8F6FA8, #B79BC7 60%, transparent 75%)' }}
              />
            </div>
          </div>
          <div className="absolute inset-0 aurora-drift-2">
            <div className="blob-parallax absolute inset-0" data-speed="-0.14">
              <div
                className="absolute rounded-full blur-[90px] opacity-[0.65] w-[46vw] h-[46vw] -right-[12%] top-[8%]"
                style={{ background: 'radial-gradient(circle at 60% 40%, #F0C2D4, #FBDDE8 60%, transparent 75%)' }}
              />
            </div>
          </div>
          <div className="absolute inset-0 aurora-drift-3">
            <div className="blob-parallax absolute inset-0" data-speed="0.18">
              <div
                className="absolute rounded-full blur-[90px] opacity-[0.55] w-[38vw] h-[38vw] left-[18%] -bottom-[20%]"
                style={{ background: 'radial-gradient(circle at 50% 50%, #B79BC7, #F4EAF1 65%, transparent 78%)' }}
              />
            </div>
          </div>
        </div>
        <div className="absolute inset-0 z-[1] opacity-[0.05] aurora-grain pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 max-w-5xl mx-auto w-full pt-28 pb-16">
          <div className="hero-eyebrow opacity-0 flex items-center gap-2 text-[11px] font-semibold text-lilac-muted tracking-[0.18em] uppercase mb-6">
            <span className="w-[22px] h-px bg-gold-thread" />
            <span>Medicina Regenerativa · Péptidos de Alta Pureza · Armonización Inteligente</span>
          </div>

          <h1 className="font-fraunces text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-ink leading-[1.04] mb-6 max-w-4xl">
            <Word>La</Word> <Word>Ciencia</Word> <Word>de</Word> <Word>la</Word>{' '}
            <Word className="italic font-light text-aurora-deep">Longevidad</Word> <Word>&</Word> <Word>la</Word>{' '}
            <Word>Escultura</Word> <Word>Facial</Word> <Word>Inteligente</Word>
          </h1>

          <p className="hero-lede opacity-0 text-sm sm:text-base text-lilac-muted leading-relaxed max-w-2xl mb-9 font-normal">
            Bajo el liderazgo de la <strong>Dra. Mayela González</strong>, integramos biotecnología celular, péptidos de grado clínico y bioestimulación autóloga para una armonización facial y bienestar sistémico con rigor médico inquebrantable.
          </p>

          <div className="hero-cta opacity-0 flex flex-wrap items-center gap-4">
            <motion.a
              href="#pilares"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={tapTransition}
              className="px-6 py-3 rounded-2xl bg-ink hover:bg-lilac-deep text-white text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer"
            >
              <span>Explorar los 4 Pilares</span>
              <ArrowRight size={14} className="text-aurora-rose" />
            </motion.a>

            <motion.a
              href="#calculadora"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={tapTransition}
              className="px-6 py-3 rounded-2xl bg-white/70 hover:bg-white text-aurora-deep border border-ink/10 text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <Calculator size={14} className="text-aurora-violet" />
              <span>Calculadora de Reconstitución</span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. MÉTRICAS — franja sin cajas, solo líneas finas
      ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 border-t border-ink/10">
        {[
          { isNumber: true, value: 1200, prefix: "+", suffix: "", label: "Procedimientos Realizados", sub: "Casos clínicos documentados" },
          { isNumber: true, value: 100, prefix: "", suffix: "%", label: "Protocolos Personalizados", sub: "Evaluación metabólica individual" },
          { isNumber: false, displayValue: "cGMP", label: "Péptidos & Exosomas", sub: "Trazabilidad de lotes y pureza" },
          { isNumber: false, displayValue: "MPPS / COL", label: "Respaldo Médico Oficial", sub: "Colegio de Médicos certificado" },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-6 sm:p-7 text-center sm:text-left ${idx > 0 ? 'border-l border-ink/10' : ''} ${idx === 2 ? 'border-t sm:border-t-0 border-ink/10' : ''} ${idx === 3 ? 'border-t sm:border-t-0 border-ink/10' : ''}`}
          >
            <div className="font-fraunces text-2xl sm:text-3xl font-medium text-aurora-deep mb-1">
              {item.isNumber ? (
                <NumberTicker value={item.value!} prefix={item.prefix} suffix={item.suffix} delay={0.15 * idx} />
              ) : (
                item.displayValue
              )}
            </div>
            <div className="text-xs font-semibold text-ink mb-0.5">{item.label}</div>
            <div className="text-[10px] text-lilac-muted leading-tight">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. LOS 4 PILARES — columnas sin bordes, solo línea fina
      ───────────────────────────────────────────────────────────── */}
      <section id="pilares" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 border-b border-ink/10 pb-6">
          <div>
            <div className="text-[10px] font-bold text-aurora-deep uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
              <Layers size={13} />
              <span>Arquitectura Terapéutica</span>
            </div>
            <h2 className="font-fraunces text-3xl sm:text-5xl text-ink font-normal">
              Cuatro Pilares · Un Estándar Clínico
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-lilac-muted max-w-md mt-3 md:mt-0 leading-relaxed">
            Cada procedimiento y tratamiento está diseñado bajo el criterio celular y la farmacología regenerativa de la Dra. Mayela González.
          </p>
        </div>

        <div className="pilares-grid grid grid-cols-1 md:grid-cols-4 gap-0">
          {PILARES.map((pilar, idx) => (
            <div
              key={pilar.num}
              className={`pilar-col px-0 md:px-6 py-8 md:py-0 ${idx > 0 ? 'md:border-l border-t md:border-t-0 border-ink/10' : ''} transition-transform duration-500 hover:-translate-y-1`}
            >
              <div className="font-fraunces italic font-light text-4xl text-aurora-violet/80 mb-4 leading-none">
                {pilar.num}
              </div>
              <span className="inline-block text-[9px] font-semibold uppercase tracking-wider text-aurora-deep mb-3">
                {pilar.tag}
              </span>
              <h3 className="font-fraunces text-xl text-ink font-medium mb-3 leading-snug">
                {pilar.title}
              </h3>
              <p className="text-xs text-lilac-muted leading-relaxed mb-5">
                {pilar.desc}
              </p>
              <div className="text-[11px] text-ink/70 leading-[1.9]">
                {pilar.highlights.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CALCULADORA DE PÉPTIDOS INTERACTIVA
      ───────────────────────────────────────────────────────────── */}
      <section id="calculadora" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
        <div className="rounded-3xl bg-white/60 border border-ink/10 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-aurora-rose/20 blur-3xl pointer-events-none" />

          <div className="max-w-2xl mb-10 relative">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold text-aurora-deep uppercase tracking-wider mb-3">
              <Calculator size={12} className="text-aurora-violet" />
              <span>Herramienta Clínica Abierta</span>
            </div>
            <h2 className="font-fraunces text-3xl sm:text-4xl text-ink font-medium mb-3">
              Calculadora de Reconstitución & Dosificación
            </h2>
            <p className="text-xs sm:text-sm text-lilac-muted leading-relaxed">
              En terapia con péptidos, la exactitud milimétrica es vital. Selecciona un preset inteligente o ajusta los parámetros del vial para calcular la graduación exacta en jeringa de insulina (U-100).
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 relative">
            {PEPTIDE_PRESETS.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={tapTransition}
                onClick={() => handleSelectPeptidePreset(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  calcPeptido === p.id
                    ? 'bg-ink text-white'
                    : 'bg-white/80 text-aurora-deep border border-ink/10 hover:bg-white'
                }`}
              >
                {p.label}
              </motion.button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative">
            <div className="space-y-4 lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/70 border border-ink/10">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-lilac-muted block mb-1">
                    Cantidad Vial
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={vialMg}
                      onChange={(e) => setVialMg(Math.max(0.1, Number(e.target.value)))}
                      className="w-full text-lg font-bold text-ink bg-transparent focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-lilac-muted">mg</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-ink/10">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-lilac-muted block mb-1">
                    Agua Bacteriostática
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={dilucionMl}
                      onChange={(e) => setDilucionMl(Math.max(0.1, Number(e.target.value)))}
                      className="w-full text-lg font-bold text-ink bg-transparent focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-lilac-muted">ml</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/70 border border-ink/10">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-lilac-muted block mb-1">
                    Dosis Deseada
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="50"
                      min="10"
                      value={dosisMcg}
                      onChange={(e) => setDosisMcg(Math.max(1, Number(e.target.value)))}
                      className="w-full text-lg font-bold text-ink bg-transparent focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-lilac-muted">mcg</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 border border-ink/10">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="font-semibold text-aurora-deep">
                    Graduación en Jeringa U-100 (100 Unidades = 1 ml)
                  </span>
                  <span className="font-bold text-ink">
                    {unidadesJeringa.toFixed(1)} UI ({((unidadesJeringa / 100)).toFixed(2)} ml)
                  </span>
                </div>
                <div className="w-full h-5 rounded-lg bg-lilac-pearl border border-ink/10 relative overflow-hidden flex items-center">
                  <motion.div
                    className="h-full bg-gradient-to-r from-aurora-violet to-aurora-rose"
                    animate={{ width: `${Math.min(100, Math.max(0, unidadesJeringa))}%` }}
                    transition={springConfig}
                  />
                  <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-40">
                    {[0, 20, 40, 60, 80, 100].map((tick) => (
                      <div key={tick} className="h-full w-[1px] bg-lilac-muted" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-ink text-white flex flex-col justify-between h-full">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-aurora-rose block mb-1">
                  Resultado de Aspiración
                </span>
                <div className="font-fraunces text-4xl sm:text-5xl font-medium mb-1 text-white">
                  {unidadesJeringa.toFixed(1)} <span className="text-xl font-normal text-aurora-rose">UI</span>
                </div>
                <p className="text-[11px] text-white/70 mb-5">
                  Aspirar hasta la raya <strong>{Math.round(unidadesJeringa)}</strong> en jeringa U-100.
                </p>

                <div className="space-y-2 border-t border-white/10 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Concentración:</span>
                    <span className="font-semibold text-white">{concMcgMl.toFixed(0)} mcg/ml</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Concentración por UI:</span>
                    <span className="font-semibold text-white">{mcgPorUi.toFixed(1)} mcg / UI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Dosis totales en vial:</span>
                    <span className="font-semibold text-white">{Math.floor(dosisTotales)} aplicaciones</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full mt-6 py-2.5 rounded-xl bg-gradient-to-r from-aurora-violet to-aurora-rose hover:brightness-95 text-ink font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Generar Protocolo Completo en el Portal</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. AUTORIDAD MÉDICA — DRA. MAYELA GONZÁLEZ
      ───────────────────────────────────────────────────────────── */}
      <section id="dra-mayela" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl p-3 border border-ink/10">
              <div className="w-full aspect-[4/5] rounded-2xl bg-gradient-to-br from-lilac-pearl via-aurora-rose/25 to-aurora-violet/25 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-aurora-deep to-aurora-rose p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-ink flex items-center justify-center">
                    <span className="font-fraunces text-3xl font-light text-aurora-rose">MG</span>
                  </div>
                </div>
                <h4 className="font-fraunces text-2xl font-medium text-ink mb-1">
                  Dra. Mayela González
                </h4>
                <p className="text-xs text-lilac-muted font-medium mb-4">
                  Medicina Estética, Antienvejecimiento & Longevidad
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-ink/10 text-[10px] font-semibold text-aurora-deep">
                  <Award size={12} className="text-aurora-violet" />
                  <span>MPPS-98765 · COL-12345</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="text-[10px] font-bold text-aurora-deep uppercase tracking-[0.25em] flex items-center gap-2">
              <ShieldCheck size={14} />
              <span>Dirección Médica & Rigor Científico</span>
            </div>

            <h2 className="font-fraunces text-3xl sm:text-5xl text-ink font-normal leading-tight">
              "Cada rostro y cada metabolismo tienen una firma biológica única."
            </h2>

            <p className="text-sm text-lilac-muted leading-relaxed">
              La medicina estética contemporánea no debe perseguir la estandarización ni la sobrecorrección. Nuestro compromiso es la <strong>armonización inteligente</strong>: potenciar la arquitectura natural del paciente a través de inductores de colágeno, precisión anatómica y terapias regenerativas que restauran la juventud desde el nivel celular.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-aurora-deep shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-ink">Evaluación Integral</h5>
                  <p className="text-[11px] text-lilac-muted">Antecedentes, análisis metabólico y estudio de simetría facial antes de intervenir.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-aurora-deep shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-ink">Productos de Alta Cohesión</h5>
                  <p className="text-[11px] text-lilac-muted">Marcas premium mundiales con trazabilidad y número de lote registrado en tu expediente.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-aurora-deep shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-ink">Seguimiento Post-Tratamiento</h5>
                  <p className="text-[11px] text-lilac-muted">Acompañamiento clínico directo y recordatorios de evolución a las 24h, 72h y 15 días.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-aurora-deep shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-ink">Consentimiento Informado</h5>
                  <p className="text-[11px] text-lilac-muted">Respaldo deontológico, explicación transparente y disponibilidad de antídotos (hialuronidasa).</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={tapTransition}
                onClick={() => handleOpenWhatsApp("Hola Dra. Mayela, deseo coordinar una consulta de valoración con usted.")}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-aurora-violet to-aurora-rose hover:brightness-95 text-ink font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Solicitar Consulta de Valoración</span>
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10 bg-white/50 backdrop-blur-md pt-16 pb-12 px-4 sm:px-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-aurora-deep to-aurora-rose flex items-center justify-center font-fraunces font-bold text-white">
                M
              </div>
              <span className="font-fraunces text-xl font-medium tracking-wide text-ink">
                Clínica Mayela
              </span>
            </div>
            <p className="text-xs text-lilac-muted max-w-sm leading-relaxed">
              Centro especializado en Medicina Estética, Longevidad Celular, Armonización Facial y Terapias con Péptidos Bioactivos.
            </p>
            <div className="text-[11px] text-lilac-muted flex items-center gap-2">
              <MapPin size={13} className="text-aurora-deep" />
              <span>Av. Principal de las Mercedes · Caracas, Venezuela</span>
            </div>
          </div>

          <div>
            <h6 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              Terapias & Pilares
            </h6>
            <ul className="space-y-2 text-xs text-lilac-muted">
              <li><a href="#pilares" className="hover:text-aurora-deep">Péptidos & Longevidad</a></li>
              <li><a href="#pilares" className="hover:text-aurora-deep">Armonización Facial 3D</a></li>
              <li><a href="#pilares" className="hover:text-aurora-deep">Bioestimuladores & Exosomas</a></li>
              <li><a href="#pilares" className="hover:text-aurora-deep">Composición Corporal & IMC</a></li>
              <li><a href="#calculadora" className="hover:text-aurora-deep">Calculadora de Dilución</a></li>
            </ul>
          </div>

          <div>
            <h6 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              Atención Clínica
            </h6>
            <ul className="space-y-2 text-xs text-lilac-muted">
              <li><span className="flex items-center gap-1.5"><Clock size={12} /> Lunes a Viernes 9:00 - 18:30</span></li>
              <li>
                <button
                  onClick={() => handleOpenWhatsApp("Hola, deseo información sobre citas disponibles.")}
                  className="hover:text-aurora-deep text-left cursor-pointer flex items-center gap-1"
                >
                  <MessageCircle size={12} />
                  <span>WhatsApp de Citas</span>
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 rounded-lg bg-ink text-white font-semibold text-[11px] hover:bg-lilac-deep transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn size={11} />
                  <span>Acceso Personal Médico</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-ink/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-lilac-muted">
          <div>
            © {new Date().getFullYear()} Clínica Mayela. Todos los derechos reservados.
          </div>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <span>Aviso de Privacidad Sanitaria</span>
            <span>·</span>
            <span>Consentimiento Informado Ley Médica</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
