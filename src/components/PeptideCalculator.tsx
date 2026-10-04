import React from 'react';
import { motion } from 'framer-motion';
import { Syringe } from 'lucide-react';
import { usePeptideCalculator } from '../hooks/usePeptideCalculator';
import type { Peptide } from '../types/peptides';

interface Props {
  peptide: Peptide;
  onApply: (doseInNativeUnit: string) => void;
}

/** Calculadora visual de reconstitución, para un péptido con datos de vial/dilución conocidos. */
export const PeptideCalculator: React.FC<Props> = ({ peptide, onApply }) => {
  const r = peptide.reconstitution!;
  const calc = usePeptideCalculator({ vialMg: r.defaultVialMg, dilucionMl: r.defaultDilutionMl, dosisMcg: r.defaultDoseMcg });

  const handleApply = () => {
    const doseInNativeUnit = peptide.doses.unit === 'mg' ? (calc.dosisMcg / 1000).toString() : calc.dosisMcg.toString();
    onApply(doseInNativeUnit);
  };

  return (
    <div className="rounded-xl border border-rosa-petalo/20 bg-[#FAFBFC] p-3 space-y-3">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-rosa-petalo">
        <Syringe size={12} /> Calculadora de reconstitución
      </div>

      <div className="grid grid-cols-3 gap-2">
        {r.vialMgOptions.length > 1 ? (
          <div>
            <label className="text-[8px] text-slate-light font-medium uppercase tracking-wider">Vial</label>
            <select
              value={calc.vialMg}
              onChange={e => calc.setVialMg(Number(e.target.value))}
              className="w-full mt-0.5 px-2 py-1.5 rounded-lg border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
            >
              {r.vialMgOptions.map(mg => <option key={mg} value={mg}>{mg} mg</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="text-[8px] text-slate-light font-medium uppercase tracking-wider">Vial</label>
            <div className="mt-0.5 px-2 py-1.5 text-xs text-slate-dark">{calc.vialMg} mg</div>
          </div>
        )}
        <div>
          <label className="text-[8px] text-slate-light font-medium uppercase tracking-wider">Dilución</label>
          <div className="flex items-center gap-1 mt-0.5">
            <input
              type="number" step="0.5" min="0.5"
              value={calc.dilucionMl}
              onChange={e => calc.setDilucionMl(Math.max(0.1, Number(e.target.value)))}
              className="w-full px-2 py-1.5 rounded-lg border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
            />
            <span className="text-[9px] text-slate-light">ml</span>
          </div>
        </div>
        <div>
          <label className="text-[8px] text-slate-light font-medium uppercase tracking-wider">Dosis</label>
          <div className="flex items-center gap-1 mt-0.5">
            <input
              type="number" step="10" min="1"
              value={calc.dosisMcg}
              onChange={e => calc.setDosisMcg(Math.max(1, Number(e.target.value)))}
              className="w-full px-2 py-1.5 rounded-lg border border-[#EEEEF0] text-xs text-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-rosa-petalo/20"
            />
            <span className="text-[9px] text-slate-light">mcg</span>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-white border border-rosa-petalo/15">
        <div className="w-full h-3.5 rounded-full bg-[#F7F8FA] border border-rosa-petalo/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-rosa-petalo to-satin-copper-light"
            animate={{ width: `${Math.min(100, Math.max(0, calc.unidadesJeringa))}%` }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }}
          />
        </div>
        <div className="flex justify-between items-center mt-1.5 text-[10px]">
          <span className="text-slate-light">U-100 · {calc.dosisTotales > 0 ? Math.floor(calc.dosisTotales) : 0} aplicaciones por vial</span>
          <span className="font-bold text-slate-dark">{calc.unidadesJeringa.toFixed(1)} UI</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleApply}
        className="w-full py-1.5 rounded-lg bg-rosa-petalo text-white text-[10px] font-bold uppercase tracking-wider hover:bg-rosa-petalo-hover transition-colors cursor-pointer"
      >
        Usar {calc.dosisMcg} mcg como dosis personalizada
      </button>
    </div>
  );
};
