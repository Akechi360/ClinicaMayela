import React, { useEffect, useState } from 'react';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ArrowLeft, ArrowRight, Dna, Snowflake, Thermometer, FlaskConical } from 'lucide-react';

interface Metric {
  label: string;
  /** Si hay valor numérico se anima como contador; si no, se muestra `text`. */
  value?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  text?: string;
  note?: string;
}

interface VialItem {
  id: string;
  index: string;
  name: string;
  category: string;
  subtitle: string;
  formula: string;
  purity: Metric;
  storage: string;
  mechanism: string;
  desc: string;
  image: string;
  clinicalApplication: string;
}

const VIALS: VialItem[] = [
  {
    id: 'glow',
    index: '01',
    name: 'GLOW Complex',
    category: 'Regeneración Tisular & Longevidad',
    subtitle: 'Trifecta Celular Avanzada',
    formula: 'BPC-157 (10mg) · GHK-Cu (50mg) · TB-500 (10mg)',
    purity: { label: 'Pureza analítica', value: 99.4, decimals: 1, prefix: '> ', suffix: '%', note: 'HPLC certificada' },
    storage: 'Liofilizado / Grado clínico',
    mechanism: 'Angiogénesis acelerada y síntesis de colágeno Tipo I y III',
    desc: 'Complejo bioactivo sinérgico formulado para revertir el microdaño tisular, optimizar la densidad dérmica profunda y modular la respuesta inflamatoria.',
    image: '/peptides/GLOW-1.jpg',
    clinicalApplication: 'Rejuvenecimiento facial estructural y cicatrización celular.',
  },
  {
    id: 'exo-elite',
    index: '02',
    name: 'ExoElite 70',
    category: 'Biotecnología de Exosomas',
    subtitle: 'Vesículas de Señalización Pura',
    formula: '70 Billion Lyophilized Exosomes',
    purity: { label: 'Ultracentrifugación', value: 100, suffix: 'K × g', note: 'Aislamiento de vesículas' },
    storage: '-80°C Cryo-Preserved / Vial liofilizado',
    mechanism: 'Transferencia paracrina de microARN y factores bioactivos',
    desc: 'Nano-vesículas celulares purificadas que reprograman el microambiente dérmico senescente, restaurando la capacidad regenerativa celular.',
    image: '/peptides/ExoElite70.webp',
    clinicalApplication: 'Terapia regenerativa celular profunda y bioestimulación.',
  },
  {
    id: 'muse-cells',
    index: '03',
    name: 'MUSE Cells 20M',
    category: 'Células Madre Multipotentes',
    subtitle: 'Reparación de Estrés Tisular',
    formula: '20 × 10⁶ CTM Cells / Vial',
    purity: { label: 'Pureza de linaje', text: 'Certificada' },
    storage: 'Nitrógeno líquido criogénico',
    mechanism: 'Homing celular hacia tejidos con daño o inflamación crónica',
    desc: 'Células pluripotentes no tumorigénicas aisladas bajo estrictos estándares biotecnológicos para medicina regenerativa de precisión.',
    image: '/peptides/Cellgenic-MSC-50-millions-1.png',
    clinicalApplication: 'Regeneración articular, sistémica y bio-remodelación.',
  },
  {
    id: 'semaglutide',
    index: '04',
    name: 'Semaglutide Pure',
    category: 'Modulación Metabólica',
    subtitle: 'Optimización del Eje GLP-1',
    formula: 'Semaglutide 10 mg · Research Grade',
    purity: { label: 'Pureza sintética', value: 99.2, decimals: 1, prefix: '> ', suffix: '%' },
    storage: '2°C – 8°C Control termoestatizado',
    mechanism: 'Activación sostenida de receptores GLP-1 pancreáticos y cerebrales',
    desc: 'Péptido agonista para la recomposición corporal avanzada, reducción de grasa visceral y modulación metabólica integral.',
    image: '/peptides/SEMAGLUTIDE-2.jpg',
    clinicalApplication: 'Protocolos metabólicos y control de composición corporal.',
  },
  {
    id: 'cjc-1295',
    index: '05',
    name: 'CJC-1295 / Ipamorelin',
    category: 'Eje Somatotrópico',
    subtitle: 'Bio-Secretagogo Natural',
    formula: 'CJC-1295 (5mg) · DAC-Free',
    purity: { label: 'Espectrometría de masas', value: 99.6, decimals: 1, prefix: '> ', suffix: '%' },
    storage: 'Liofilizado estéril',
    mechanism: 'Liberación pulsátil y fisiológica de hormona del crecimiento',
    desc: 'Estimulación del eje somatotropo sin alteración del cortisol ni de la prolactina. Promueve masa magra, lipólisis y reparación del sueño profundo.',
    image: '/peptides/cjc-1295-1.jpg',
    clinicalApplication: 'Anti-aging, masa muscular magra y recuperación profunda.',
  },
  {
    id: 'aod-9604',
    index: '06',
    name: 'AOD-9604',
    category: 'Lipólisis Focalizada',
    subtitle: 'Fragmento C-Terminal hGH',
    formula: 'AOD-9604 10 mg Pure Vial',
    purity: { label: 'Bio-identidad', value: 99.1, decimals: 1, prefix: '> ', suffix: '%' },
    storage: 'Liofilizado estable',
    mechanism: 'Activación de la cascada beta-3 adrenérgica lipolítica',
    desc: 'Péptido diseñado para movilizar depósitos lipídicos obstinados sin generar impacto en los niveles de glucosa sérica o IGF-1.',
    image: '/peptides/AOD-9604.jpg',
    clinicalApplication: 'Remodelación corporal metabólica y lipólisis no invasiva.',
  },
  {
    id: 'vip',
    index: '07',
    name: 'VIP Peptide',
    category: 'Regeneración & Longevidad',
    subtitle: 'Péptido Intestinal Vasoactivo',
    formula: 'VIP 10 mg Pure Vial',
    purity: { label: 'Presentación', text: '10 mg' },
    storage: 'Vial de 10 mg',
    mechanism: 'Modulación antiinflamatoria sistémica, protección neuronal y regulación vascular',
    desc: 'Péptido Intestinal Vasoactivo. Potente modulador antiinflamatorio sistémico, protector neuronal y regulador vascular.',
    image: '/peptides/VIP-1.jpg',
    clinicalApplication: 'Inmunomodulación, salud circulatoria y neuroprotección.',
  },
];

const SPRING = { type: 'spring', stiffness: 300, damping: 30 } as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Contador con números tabulares. Se reinicia al montarse (la ficha se re-monta por vial). */
const CountUp: React.FC<{ metric: Metric; reduce: boolean }> = ({ metric, reduce }) => {
  const { value = 0, decimals = 0, prefix = '', suffix = '' } = metric;
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    const controls = animate(mv, value, { duration: reduce ? 0 : 1, ease: EASE_OUT });
    return () => controls.stop();
  }, [mv, value, reduce]);

  return <motion.span className="tabular-nums">{text}</motion.span>;
};

/** Título que entra palabra por palabra con máscara, estilo editorial. */
const RevealTitle: React.FC<{ text: string; reduce: boolean }> = ({ text, reduce }) => (
  <h3 aria-label={text} className="text-3xl md:text-5xl font-normal text-[#5E4760] mt-1 leading-[1.05]">
    {text.split(' ').map((w, i) => (
      <span key={`${w}-${i}`} aria-hidden="true" className="inline-block overflow-hidden align-top pr-[0.25em]">
        <motion.span
          className="inline-block"
          initial={reduce ? false : { y: '105%' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: reduce ? 0 : 0.05 * i, ease: EASE_OUT }}
        >
          {w}
        </motion.span>
      </span>
    ))}
  </h3>
);

/** Foto del vial mezclada con el fondo perla; si el archivo no existe muestra un marcador. */
const VialPhoto: React.FC<{ src: string; alt: string; iconSize: number }> = ({ src, alt, iconSize }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[#A891AA]" role="img" aria-label={alt}>
        <Dna size={iconSize} strokeWidth={1.1} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover [filter:brightness(1.1)_contrast(1.03)] [mask-image:radial-gradient(ellipse_closest-side_at_center,#000_48%,transparent_100%)]"
    />
  );
};

export const CellgenicEditorialShowcase: React.FC = () => {
  const reduce = useReducedMotion() ?? false;
  const [activeIdx, setActiveIdx] = useState(0);
  const total = VIALS.length;
  const active = VIALS[activeIdx];
  const prev = VIALS[(activeIdx - 1 + total) % total];
  const next = VIALS[(activeIdx + 1) % total];

  const goNext = () => setActiveIdx((i) => (i + 1) % total);
  const goPrev = () => setActiveIdx((i) => (i - 1 + total) % total);

  const slots: { vial: VialItem; role: 'prev' | 'active' | 'next' }[] = [
    { vial: prev, role: 'prev' },
    { vial: active, role: 'active' },
    { vial: next, role: 'next' },
  ];

  const layoutTransition = reduce ? { duration: 0 } : SPRING;

  return (
    <section
      id="peptidos"
      className="relative py-24 sm:py-32 px-4 sm:px-8 md:px-16 bg-[#FBF7FA] text-[#5E4760] overflow-hidden font-sans"
    >
      {/* Atmósfera: resplandor lila que respira muy despacio */}
      <motion.div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[min(900px,140%)] h-[600px] bg-[radial-gradient(circle_at_center,rgba(234,218,227,0.85)_0%,rgba(208,175,198,0.2)_45%,transparent_70%)] pointer-events-none"
        animate={reduce ? undefined : { opacity: [0.8, 1, 0.8], scale: [1, 1.04, 1] }}
        transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="max-w-7xl mx-auto relative">
        {/* Encabezado editorial */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#A891AA]/20 pb-8 mb-12 sm:mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-mono tracking-[0.18em] text-[#A891AA] uppercase mb-4">
              <Snowflake size={12} aria-hidden="true" />
              <span className="tabular-nums whitespace-nowrap">
                {active.index} / {String(total).padStart(2, '0')}
              </span>
              <span aria-hidden="true">—</span>
              <span>Fórmulas de alta pureza · Cellgenic Biotechs</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-normal tracking-tight text-[#5E4760] leading-[1.05] max-w-3xl">
              Moléculas que reprograman la longevidad celular.
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Vial anterior"
              className="w-11 h-11 rounded-full border border-[#A891AA]/30 hover:border-[#5E4760] bg-white/60 hover:bg-[#5E4760] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Vial siguiente"
              className="w-11 h-11 rounded-full border border-[#A891AA]/30 hover:border-[#5E4760] bg-white/60 hover:bg-[#5E4760] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Carrusel expansivo: miniaturas difuminadas + vial activo (layoutId = vuelo compartido) */}
        <div
          role="group"
          aria-roledescription="carrusel"
          aria-label="Archivo de péptidos Cellgenic"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
          }}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[#A891AA]/50 rounded-3xl"
        >
          <LayoutGroup id="cellgenic-carousel">
            <motion.div
              onPanEnd={(_, info) => {
                if (info.offset.x < -50 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) goNext();
                else if (info.offset.x > 50 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) goPrev();
              }}
              className="relative flex items-center justify-center gap-0 md:gap-6 py-4 touch-pan-y"
            >
              {slots.map(({ vial, role }) => {
                const isActive = role === 'active';
                return (
                  <motion.button
                    key={vial.id}
                    type="button"
                    layout
                    layoutId={`vial-${vial.id}`}
                    transition={layoutTransition}
                    onClick={() => {
                      if (role === 'prev') goPrev();
                      if (role === 'next') goNext();
                    }}
                    aria-label={isActive ? vial.name : `Ver ${vial.name}`}
                    aria-current={isActive ? 'true' : undefined}
                    tabIndex={isActive ? -1 : 0}
                    className={`relative shrink-0 mix-blend-multiply ${
                      isActive
                        ? 'z-20 h-[270px] w-[180px] sm:h-[340px] sm:w-[230px] md:h-[440px] md:w-[300px] cursor-default'
                        : 'z-10 h-[150px] w-[96px] sm:h-[200px] sm:w-[120px] md:h-[260px] md:w-[170px] -mx-5 md:mx-0 opacity-50 blur-[2px] hover:opacity-80 hover:blur-[1px] cursor-pointer'
                    } transition-[opacity,filter] duration-500`}
                  >
                    {/* Halo difuso lila detrás del vial activo */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(208,175,198,0.45)_0%,transparent_65%)] pointer-events-none"
                      />
                    )}
                    <span className="relative block h-full w-full">
                      <VialPhoto src={vial.image} alt={vial.name} iconSize={isActive ? 72 : 36} />
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </LayoutGroup>
        </div>

        {/* Selector rápido */}
        <div className="flex items-center justify-start sm:justify-center gap-2.5 mt-8 overflow-x-auto no-scrollbar px-1 pb-2" role="tablist" aria-label="Seleccionar vial">
          {VIALS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={activeIdx === i}
              onClick={() => setActiveIdx(i)}
              className={`px-3.5 py-2 rounded-full text-[11px] font-mono tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                activeIdx === i
                  ? 'bg-[#5E4760] text-white font-semibold'
                  : 'bg-white/60 text-[#5E4760]/70 border border-[#A891AA]/20 hover:border-[#5E4760]/40'
              }`}
            >
              <span className="tabular-nums">{v.index}</span> · {v.name}
            </button>
          ))}
        </div>

        {/* Ficha técnica dinámica */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="contents"
            >
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <span className="text-[11px] font-mono tracking-[0.18em] text-[#A891AA] uppercase">{active.category}</span>
                  <RevealTitle text={active.name} reduce={reduce} />
                  <p className="text-xs font-mono text-[#A891AA] mt-2">{active.subtitle}</p>
                </div>
                <p className="text-sm md:text-base text-[#5E4760]/80 leading-relaxed max-w-xl">{active.desc}</p>
                <p className="text-[11px] font-mono text-[#5E4760]/70 border-l-2 border-[#A891AA]/40 pl-3">{active.formula}</p>
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white/60 border border-[#A891AA]/15">
                  <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#A891AA] flex items-center gap-1.5">
                    <FlaskConical size={11} /> {active.purity.label}
                  </span>
                  <strong className="block text-2xl font-normal text-[#5E4760] mt-1">
                    {active.purity.value !== undefined ? <CountUp metric={active.purity} reduce={reduce} /> : active.purity.text}
                  </strong>
                  {active.purity.note && <span className="text-[10px] font-mono text-[#5E4760]/60">{active.purity.note}</span>}
                </div>

                <div className="p-4 rounded-2xl bg-white/60 border border-[#A891AA]/15">
                  <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#A891AA] flex items-center gap-1.5">
                    <Thermometer size={11} /> Preservación
                  </span>
                  <strong className="block text-sm font-medium text-[#5E4760] mt-1.5 leading-snug">{active.storage}</strong>
                </div>

                <div className="sm:col-span-2 p-4 rounded-2xl bg-[#EADAE3]/35 border border-[#A891AA]/20">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#5E4760] flex items-center gap-1.5 font-semibold">
                    <Dna size={12} className="text-[#A891AA]" /> Mecanismo biológico
                  </span>
                  <p className="text-xs sm:text-[13px] text-[#5E4760]/80 mt-1.5 leading-snug">{active.mechanism}</p>
                  <p className="text-[11px] text-[#5E4760]/60 mt-2.5 pt-2.5 border-t border-[#A891AA]/15">
                    <span className="font-mono uppercase tracking-wider text-[#A891AA]">Aplicación clínica · </span>
                    {active.clinicalApplication}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
