import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import {
  ShieldCheck,
  LogIn,
  CheckCircle2,
  Award,
  Layers,
  MessageCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { NumberTicker } from '../components/motion/NumberTicker';
import { MedicalPointCloud } from '../components/landing/MedicalPointCloud';
import { DOMWebGLErrorBoundary } from '../components/FaceCanvas/DOMWebGLErrorBoundary';
import { CellgenicEditorialShowcase } from '../components/landing/CellgenicEditorialShowcase';
import { LandingNav } from '../components/landing/LandingNav';
import { ResponsiveCamera } from '../components/landing/ResponsiveCamera';

gsap.registerPlugin(ScrollTrigger);

// Easing limpio para hover/tap de botones — sin resorte, sin rebote.
const tapTransition = { duration: 0.2, ease: 'easeOut' as const };

const MORPHING_MESSAGES = [
  'Ciencia Aplicada\na Tu Longevidad.',
  'Medicina Celular\ny Precisión Clínica.',
  'Decisiones Médicas\nBasadas en Evidencia.',
];

// Datos de los 4 Pilares Terapéuticos
const PILARES = [
  {
    num: "01",
    tag: "Medicina Celular & Regeneración",
    title: "Péptidos Bioactivos & Longevidad",
    desc: "Protocolos terapéuticos de longevidad con moléculas de señalización celular de alta pureza. Eje metabólico, hormona de crecimiento, regenerativos, inmunes,mitocondriales, neuropeptificos, eje reproductivo y cosmeceuticos.",
    highlights: ["BPC-157 & TB-500", "Semaglutida & Tirzepatida", "CJC-1295 / Ipamorelin", "GHK-Cu (Péptido de Cobre)", "NAD+ Intracelular"],
  },
  {
    num: "02",
    tag: "Escultura Médica & Precisión",
    title: "Armonización Facial Inteligente",
    desc: "Abordaje tridimensional del envejecimiento facial respetando las proporciones áureas y la dinámica muscular natural. Respetando las estructuras y la dinámica del rostro, técnicas mínimamente invasivas.",
    highlights: ["Toxina Botulínica Preventiva y Correctiva", "Ácido Hialurónico de Alta Cohesión", "Técnica Rinomodelación 4 Puntos", "Perfilado Mandibular & Mentón", "Lip Flip & Tratamientos Labiales"],
  },
  {
    num: "03",
    tag: "Inducción Autóloga de Colágeno",
    title: "Bioestimulación & Exosomas",
    desc: "Regeneración profunda de los tejidos para una dermis densa, elástica y luminosa. Terapia con exosomas, bioestimuladores de colageno, polirevitalizantes.",
    highlights: ["Certificación hilos aptos", "Regeneración capilar con tratamiento para la alopecia"],
  },
  {
    num: "04",
    tag: "Optimización Biológica Global",
    title: "Medicina Metabólica & Corporal",
    desc: "Evaluación integral de la composición corporal.",
    highlights: ["Suero terapia detox y de longevidad sistémica", "Depilación láser triple diodo", "Tratamientos corporales carboxiterapia, ultrasonido, ultracavitacion, láser diodo, rafiofrecuencia monopolar, tripolar, indiba, limpieza de cutis", "Carboxiterapia Subcutánea", "Controles de Laboratorio Específicos"],
  }
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  // Rendimiento del 3D: pausa fuera de pantalla y calidad adaptable según los fps
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [quality, setQuality] = useState(1);
  // Menos partículas en pantallas pequeñas para sostener los fps
  const [pointCount] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 160000 : 320000));

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setMsgIndex((prev) => (prev + 1) % MORPHING_MESSAGES.length), 4200);
    return () => clearInterval(timer);
  }, []);

  const handleOpenWhatsApp = (mensaje: string) => {
    const tel = "584120000000";
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };


  // Coreografía de movimiento: Lenis + reveal de pilares, aislado por useGSAP (cleanup automático).
  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lenis + GSAP ticker: el patrón estándar, en vez del rAF manual suelto.
    let lenis: Lenis | undefined;
    let raf: ((time: number) => void) | undefined;
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
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="landing-soria min-h-screen bg-lilac-pearl text-ink font-sans relative selection:bg-aurora-rose/40 selection:text-ink overflow-x-hidden">

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER — estilo Apple: transparente arriba, vidrio esmerilado al hacer scroll
      ───────────────────────────────────────────────────────────── */}
      <LandingNav
        onLogoClick={() => (lenisRef.current ? lenisRef.current.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
        onPortal={() => navigate('/login')}
        onSchedule={() => handleOpenWhatsApp("Hola Dra. Mayela, quisiera solicitar una evaluación médica personalizada.")}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. HERO — busto 3D de partículas (referencia: video Orvane)
      ───────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[640px] overflow-hidden bg-[#FBF7FA] text-[#5E4760] select-none">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_55%_42%,rgba(234,218,227,0.85)_0%,rgba(234,218,227,0.40)_45%,rgba(251,247,250,0)_75%)]" aria-hidden="true" />

        <div className="absolute inset-0 z-[1]">
          <DOMWebGLErrorBoundary fallback={null}>
            <Canvas camera={{ position: [-0.15, 0, 3.1], fov: 35 }} dpr={quality < 0.6 ? 1 : [1, 1.5]} frameloop={heroVisible ? 'always' : 'never'}>
                <PerformanceMonitor
                  onDecline={() => setQuality((q) => Math.max(0.25, q * 0.7))}
                  onIncline={() => setQuality((q) => Math.min(1, q * 1.25))}
                />
              <ResponsiveCamera baseZ={3.1} />
              <Suspense fallback={null}>
                <MedicalPointCloud pointCount={pointCount} quality={quality} />
              </Suspense>
            </Canvas>
          </DOMWebGLErrorBoundary>
        </div>

        {/* Cuadrícula HUD con cruces */}
        <div className="absolute inset-0 z-[2] pointer-events-none" aria-hidden="true">
          {[34, 66, 82].map((x) => (
            <div key={`v${x}`} className="absolute top-0 bottom-0 w-px bg-[#A891AA]/20" style={{ left: `${x}%` }} />
          ))}
          {[24, 78].map((y) => (
            <div key={`h${y}`} className="absolute left-0 right-0 h-px bg-[#A891AA]/20" style={{ top: `${y}%` }} />
          ))}
          {[34, 66, 82].flatMap((x) => [24, 78].map((y) => (
            <span key={`${x}-${y}`} className="absolute -translate-x-1/2 -translate-y-1/2 text-[#A891AA] text-[11px] leading-none" style={{ left: `${x}%`, top: `${y}%` }}>+</span>
          )))}
        </div>

        {/* Título */}
        <div className="absolute top-[17%] left-6 sm:left-8 md:left-10 z-10 max-w-xl pointer-events-none">
          <h1 className="text-4xl min-[400px]:text-5xl sm:text-6xl md:text-7xl font-normal leading-[1.02] tracking-tight text-[#5E4760]">
            Medicina Celular<br />& Longevidad
          </h1>
        </div>

        {/* Badges HUD */}
        <div className="absolute top-[26%] right-[12%] z-10 hidden sm:flex items-start gap-2.5 font-mono pointer-events-none">
          <span className="absolute top-[6px] right-full mr-2 w-20 h-px bg-gradient-to-l from-[#A891AA]/60 to-transparent" />
          <span className="mt-[3px] w-1.5 h-1.5 bg-[#A891AA]" />
          <div>
            <strong className="block text-[13px] font-medium text-[#5E4760]">24/7</strong>
            <small className="block text-[9px] text-[#5E4760]/75 tracking-[0.16em] uppercase">Monitoreo Clínico</small>
          </div>
        </div>
        <div className="absolute top-[54%] left-[71%] z-10 hidden md:flex items-start gap-2.5 font-mono pointer-events-none">
          <span className="absolute top-[6px] right-full mr-2 w-16 h-px bg-gradient-to-l from-[#A891AA]/60 to-transparent" />
          <span className="mt-[3px] w-1.5 h-1.5 bg-[#A891AA]" />
          <div>
            <strong className="block text-[13px] font-medium text-[#5E4760]">+18 Péptidos</strong>
            <small className="block text-[9px] text-[#5E4760]/75 tracking-[0.16em] uppercase">Fórmulas Certificadas</small>
          </div>
        </div>
        <div className="absolute top-[67%] left-[14%] z-10 hidden sm:flex items-start gap-2.5 font-mono pointer-events-none">
          <span className="absolute top-[6px] left-full ml-3 w-24 h-px bg-gradient-to-r from-[#A891AA]/60 to-transparent" />
          <span className="mt-[3px] w-1.5 h-1.5 bg-[#A891AA]" />
          <div>
            <strong className="block text-[13px] font-medium text-[#5E4760]">99.4%</strong>
            <small className="block text-[9px] text-[#5E4760]/75 tracking-[0.16em] uppercase">Adherencia Protocolar</small>
          </div>
        </div>

        {/* Pie izquierdo: crédito + microcopy */}
        <div className="absolute bottom-6 left-6 sm:left-8 md:left-10 z-10 max-w-[18rem] font-mono">
          <p className="text-[11px] leading-relaxed text-[#5E4760]">
            Desde biomarcadores tempranos hasta tratamientos de regeneración celular avanzada.
          </p>
        </div>

        {/* Texto dinámico (morphing) */}
        <div className="absolute bottom-28 sm:bottom-6 right-6 sm:right-8 md:right-10 z-10 text-right min-h-[96px] md:min-h-[130px] pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.h2
              key={msgIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-5xl font-normal leading-[1.05] text-[#5E4760] whitespace-pre-line tracking-tight"
            >
              {MORPHING_MESSAGES[msgIndex]}
            </motion.h2>
          </AnimatePresence>
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
          3b. PÉPTIDOS CELLGENIC — archivo editorial (ancla #peptidos)
      ───────────────────────────────────────────────────────────── */}
      <CellgenicEditorialShowcase />

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
          6. AUTORIDAD MÉDICA — DRA. MAYELA GONZÁLEZ
      ───────────────────────────────────────────────────────────── */}
      <section id="dra-mayela" className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl p-3 border border-ink/10">
              <div className="w-full aspect-[4/5] rounded-2xl relative overflow-hidden bg-lilac-pearl">
                <img
                  src="/dra-mayela.webp"
                  alt="Dra. Mayela González"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-[50%_18%]"
                />
                <div className="absolute inset-x-0 bottom-0 pt-24 pb-6 px-6 text-center bg-gradient-to-t from-ink/85 via-ink/50 to-transparent">
                  <h4 className="font-fraunces text-2xl font-medium text-white mb-1">
                    Dra. Mayela González
                  </h4>
                  <p className="text-xs text-white/80 font-medium mb-3">
                    Medicina Estética, Antienvejecimiento & Longevidad
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-ink/10 text-[10px] font-semibold text-aurora-deep">
                    <Award size={12} className="text-aurora-violet" />
                    <span>MPPS-652562 · COL-7645</span>
                  </div>
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
              La medicina estética de la nueva era. Potencia la arquitectura natural del rostro del paciente mediante la combinación de distintas técnicas y tratamientos incluso restaurando la juventud a nivel celular.
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
                Clínica Dra. Mayela González
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
            </ul>
          </div>

          <div>
            <h6 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              Atención Clínica
            </h6>
            <ul className="space-y-2 text-xs text-lilac-muted">
              <li><span className="flex items-center gap-1.5"><Clock size={12} /> Lunes a Viernes 10:00AM - 5:00PM Previa Cita</span></li>
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
            © {new Date().getFullYear()} Clínica Dra. Mayela González. Todos los derechos reservados.
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
