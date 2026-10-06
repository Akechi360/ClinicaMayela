import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../services/supabase';
import {
  CLAVE_ACTIVIDAD, CLAVE_SESION_EXPIRADA, LIMITE_INACTIVIDAD_MS, estadoInactividad,
} from '../lib/inactividad';

const EVENTOS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;

/** Cierra la sesión tras 20 min sin actividad (con aviso el último minuto). Sincroniza varias pestañas por localStorage. */
export const InactivityGuard: React.FC = () => {
  const [restante, setRestante] = useState<number | null>(null);
  const ultima = useRef(0); // se inicializa al montar (en el efecto), no durante el render
  const escrito = useRef(0);
  const enAviso = useRef(false);

  const guardar = useCallback((t: number) => {
    ultima.current = t;
    escrito.current = t;
    try { localStorage.setItem(CLAVE_ACTIVIDAD, String(t)); } catch { /* sin localStorage: queda solo en memoria */ }
  }, []);

  const mantener = useCallback(() => {
    enAviso.current = false;
    setRestante(null);
    guardar(Date.now());
  }, [guardar]);

  const cerrar = useCallback(async () => {
    try { sessionStorage.setItem(CLAVE_SESION_EXPIRADA, '1'); } catch { /* ignorar */ }
    try { await supabase.auth.signOut(); } catch { /* aun así se recarga */ }
    window.location.assign('/login'); // recarga completa: borra de memoria los datos del paciente
  }, []);

  useEffect(() => {
    guardar(Date.now());

    const alActividad = () => {
      if (enAviso.current) return; // en el aviso solo cuenta el botón
      const ahora = Date.now();
      if (ahora - escrito.current > 5000) guardar(ahora);
      else ultima.current = ahora;
    };
    const alStorage = (e: StorageEvent) => {
      if (e.key === CLAVE_ACTIVIDAD && e.newValue) {
        ultima.current = Number(e.newValue);
        if (enAviso.current && estadoInactividad(ultima.current, Date.now()) === 'activo') {
          enAviso.current = false;
          setRestante(null);
        }
      }
    };
    EVENTOS.forEach((ev) => window.addEventListener(ev, alActividad, { passive: true }));
    window.addEventListener('storage', alStorage);

    const timer = window.setInterval(() => {
      const ahora = Date.now();
      const estado = estadoInactividad(ultima.current, ahora);
      if (estado === 'expirado') { window.clearInterval(timer); void cerrar(); return; }
      if (estado === 'aviso') {
        enAviso.current = true;
        setRestante(Math.max(0, Math.ceil((LIMITE_INACTIVIDAD_MS - (ahora - ultima.current)) / 1000)));
      }
    }, 1000);

    return () => {
      EVENTOS.forEach((ev) => window.removeEventListener(ev, alActividad));
      window.removeEventListener('storage', alStorage);
      window.clearInterval(timer);
    };
  }, [guardar, cerrar]);

  if (restante === null) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-dark/50 backdrop-blur-sm p-4" role="alertdialog" aria-modal="true" aria-labelledby="inact-titulo">
      <div className="glass-panel w-full max-w-sm rounded-2xl border border-pure-white/50 shadow-luxury p-6 text-center space-y-4">
        <Clock className="mx-auto text-satin-copper" size={34} />
        <h3 id="inact-titulo" className="font-display text-lg text-slate-dark">¿Sigues ahí?</h3>
        <p className="text-xs text-slate-medium leading-relaxed">
          Por seguridad de los datos de tus pacientes, la sesión se cerrará en <b>{restante} s</b> por inactividad.
        </p>
        <div className="flex gap-2.5 justify-center">
          <button type="button" onClick={mantener} autoFocus className="px-4 py-2 bg-satin-copper hover:bg-satin-copper-hover text-pure-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">Seguir conectada</button>
          <button type="button" onClick={() => void cerrar()} className="px-4 py-2 border border-slate-medium/20 text-slate-medium hover:bg-slate-medium/5 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer">Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
};
