import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { verificarRecipe } from '../services/db';
import type { RecipeVerificado } from '../types/database.types';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; r: RecipeVerificado };

/** Página pública (sin sesión) a la que apunta el QR del récipe: la farmacia ve si es auténtico y el documento original. */
export const VerifyRecipe: React.FC = () => {
  const [params] = useSearchParams();
  const id = params.get('id') ?? '';
  const hash = params.get('h') ?? '';
  const falta = !id || !hash;
  const [estado, setEstado] = useState<Estado>(falta ? { tipo: 'ok', r: { valido: false } } : { tipo: 'cargando' });

  useEffect(() => {
    if (falta) return;
    verificarRecipe(id, hash).then((r) => setEstado({ tipo: 'ok', r })).catch(() => setEstado({ tipo: 'error' }));
  }, [id, hash, falta]);

  const r = estado.tipo === 'ok' ? estado.r : null;
  const fecha = r?.fecha ? new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-lilac-pearl px-4 py-10 flex items-start justify-center">
      <div className="w-full max-w-lg">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.25em] text-aurora-deep mb-4">Clínica Dra. Mayela González · Verificación de récipe</p>

        {estado.tipo === 'cargando' && (
          <div className="bg-white rounded-3xl border border-ink/10 p-10 flex flex-col items-center gap-3 text-lilac-muted">
            <Loader2 className="animate-spin" /> Verificando autenticidad…
          </div>
        )}

        {estado.tipo === 'error' && (
          <div className="bg-white rounded-3xl border border-ink/10 p-8 text-center text-sm text-lilac-muted">
            No se pudo completar la verificación. Revise su conexión e intente de nuevo.
          </div>
        )}

        {r && !r.valido && (
          <div role="alert" className="bg-white rounded-3xl border-2 border-red-300 p-8 text-center">
            <ShieldX className="mx-auto text-red-600 mb-3" size={44} />
            <h1 className="font-fraunces text-2xl text-red-700 mb-2">Récipe inválido</h1>
            <p className="text-sm text-lilac-muted">Este código no corresponde a un récipe emitido por la clínica, o el documento fue alterado. No lo despache.</p>
          </div>
        )}

        {r?.valido && (
          <div className="bg-white rounded-3xl border border-ink/10 shadow-xl overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex items-center gap-3">
              <ShieldCheck className="text-emerald-600 shrink-0" size={30} />
              <div>
                <h1 className="font-fraunces text-xl text-emerald-800 leading-tight">Récipe válido</h1>
                <p className="text-xs text-emerald-700">Documento auténtico y sin alteraciones. Compare con el que le entregó el paciente.</p>
              </div>
            </div>
            <div className="p-6 space-y-5 text-sm text-ink">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><p className="text-[9px] uppercase tracking-wider font-bold text-lilac-muted">Paciente</p><p className="font-semibold">{r.paciente}</p></div>
                <div><p className="text-[9px] uppercase tracking-wider font-bold text-lilac-muted">Fecha de emisión</p><p className="font-semibold">{fecha}</p></div>
                <div><p className="text-[9px] uppercase tracking-wider font-bold text-lilac-muted">Médico</p><p className="font-semibold">{r.doctor_nombre}</p><p className="text-lilac-muted">{r.especialidad}</p></div>
                <div><p className="text-[9px] uppercase tracking-wider font-bold text-lilac-muted">Matrícula</p><p className="font-semibold">MPPS {r.doctor_mpps ?? '—'}</p><p className="font-semibold">COL {r.doctor_col ?? '—'}</p></div>
              </div>
              <div>
                <p className="font-fraunces text-base text-aurora-deep border-b border-ink/10 pb-1 mb-2">Rp. Prescripción médica</p>
                <p className="whitespace-pre-line leading-relaxed font-semibold">{r.medicamentos}</p>
              </div>
              {r.indicaciones && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-lilac-muted mb-1">Indicaciones</p>
                  <p className="whitespace-pre-line text-lilac-muted italic">{r.indicaciones}</p>
                </div>
              )}
              {(r.firma || r.sello) && (
                <div className="flex items-end justify-center gap-4 pt-2 border-t border-ink/10">
                  {r.firma && <img src={r.firma} alt="Firma del médico" className="h-14 object-contain" />}
                  {r.sello && <img src={r.sello} alt="Sello del médico" className="h-16 object-contain" />}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
