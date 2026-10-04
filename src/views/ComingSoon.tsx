import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ArrowLeft, Sparkles } from 'lucide-react';

interface ComingSoonProps {
  moduleName?: string;
  progress?: number;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  moduleName = 'Este módulo',
  progress = 65,
}) => {
  const navigate = useNavigate();
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => setAnimatedProgress(progress), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [progress]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex flex-col items-center justify-center transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: '#FAF7F5' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/coming-soon-bg.jpg')", opacity: 0.92 }}
      />
      <div className="absolute inset-0 bg-white/20" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm w-full text-center">

        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#E0A2A2]/40 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#E0A2A2] animate-pulse" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#3A434D]/70">
            En implementación
          </span>
          <Wrench size={10} className="text-[#E0A2A2]" />
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-light text-[#3A434D] tracking-wide">
            {moduleName}
          </h1>
          <p className="text-xs text-[#3A434D]/55 font-sans leading-relaxed">
            Este componente está siendo desarrollado.<br />
            Pronto estará disponible.
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center px-0.5">
            <span className="text-[9px] uppercase tracking-widest text-[#3A434D]/40 font-bold font-sans">Progreso</span>
            <span className="text-[9px] font-bold text-[#E0A2A2] font-sans">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-white/60 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${animatedProgress}%`,
                background: 'linear-gradient(90deg, #E0A2A2 0%, #EEC4C4 100%)',
                boxShadow: '0 0 10px rgba(224,162,162,0.5)',
              }}
            />
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap justify-center gap-2">
          {['Diseño UI ✓', 'Lógica de negocio', 'Integración BD'].map((step, i) => (
            <span
              key={step}
              className={`px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border font-sans ${
                i === 0
                  ? 'bg-[#E0A2A2]/20 border-[#E0A2A2]/40 text-[#E0A2A2]'
                  : 'bg-white/40 border-white/50 text-[#3A434D]/50'
              }`}
            >
              {step}
            </span>
          ))}
        </div>

        {/* Botón volver */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] font-sans transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #E0A2A2 0%, #EEC4C4 100%)',
            color: '#3A434D',
            boxShadow: '0 8px 25px -5px rgba(224,162,162,0.4)',
          }}
        >
          <ArrowLeft size={13} />
          Volver al Panel
        </button>

        {/* Firma — actualizada */}
        <div className="flex items-center gap-1.5 mt-2 opacity-40">
          <Sparkles size={10} className="text-[#E0A2A2]" />
          <span className="text-[8px] uppercase tracking-[0.2em] text-[#3A434D] font-sans">
            En desarrollo por Ing. Manuel López
          </span>
        </div>
      </div>
    </div>
  );
};
