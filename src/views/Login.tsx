import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirigir si ya hay una sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Por favor, rellene todos los campos.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Iniciando sesión...');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.dismiss(toastId);
      toast.success('Sesión iniciada con éxito.');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Error de login:', err);
      
      // Mostrar ConfirmDialog de severidad warning en caso de credenciales incorrectas
      await confirm({
        title: 'Error de Autenticación',
        message: err.message || 'Las credenciales ingresadas son incorrectas o el usuario no existe. Por favor, intente de nuevo.',
        confirmLabel: 'Entendido',
        cancelLabel: 'Cerrar',
        severity: 'warning'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    await confirm({
      title: 'Restablecer Contraseña',
      message: 'Por favor, contacte al administrador del sistema para restablecer su contraseña de acceso.',
      confirmLabel: 'Entendido',
      cancelLabel: 'Cerrar',
      severity: 'info'
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-app-app relative overflow-hidden select-none font-sans">
      <div className="bg-app-image"></div>
      <div className="bg-grid-overlay"></div>

      {/* Centered Premium Split Card */}
      <div className="w-full max-w-5xl h-auto md:h-[620px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row glass-panel border border-pure-white/40 z-10 animate-fadeIn">
        
        {/* PANEL IZQUIERDO: Estilo editorial, minimalista crema */}
        <div className="w-full md:w-1/2 bg-pure-white/90 p-10 md:p-14 flex flex-col justify-between relative overflow-hidden min-h-[350px] md:min-h-full">
          {/* Logo superior */}
          <div className="flex flex-col items-start relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rosa-petalo/15 border border-rosa-petalo/25 flex items-center justify-center">
                {/* Lotus outline SVG */}
                <svg className="w-5 h-5 text-rosa-petalo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2C12 2 9 6 9 10C9 14 12 18 12 18C12 18 15 14 15 10C15 6 12 2 12 2Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 6C10 9 6 11 6 14C6 17 9 19 12 19" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 6C14 9 18 11 18 14C18 17 15 19 12 19" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 10C11 12 8 13 8 15C8 17 10 18 12 18" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 10C13 12 16 13 16 15C16 17 14 18 12 18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-display font-light text-slate-dark tracking-[0.3em] uppercase leading-none">Clínica Mayela</h1>
                <p className="text-[8px] uppercase tracking-[0.2em] text-rosa-petalo font-bold mt-1">MEDICINA ESTÉTICA · BIENESTAR</p>
              </div>
            </div>
          </div>

          {/* Textos centrales */}
          <div className="my-10 md:my-0 space-y-4 max-w-sm relative z-10">
            <h2 className="text-2xl md:text-3.5xl font-display font-light text-slate-dark leading-tight tracking-wide">
              Tu belleza natural, <br />
              <span className="italic text-rosa-petalo font-normal">potenciada por la ciencia</span>
            </h2>
            <div className="flex items-center gap-3 w-1/3 py-1">
              <div className="h-[1px] bg-rosa-petalo/30 flex-1" />
              <span className="text-[10px] text-rosa-petalo/60 font-semibold">&#x2724;</span>
              <div className="h-[1px] bg-rosa-petalo/30 flex-1" />
            </div>
            <p className="text-xs text-slate-medium leading-relaxed font-sans font-light">
              Plataforma clínica especializada en tratamientos estéticos faciales, corporales y medicina de bienestar integral.
            </p>
          </div>

          {/* Ilustración botánica SVG - Esquina inferior izquierda */}
          <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none opacity-40 select-none">
            <svg className="w-full h-full text-rosa-petalo/30" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.8">
              {/* Abstract aesthetic botanical leaf design */}
              <path d="M10 200 C 30 140, 70 90, 150 40" />
              <path d="M150 40 C 120 70, 90 90, 10 200" />
              {/* Petal 1 */}
              <path d="M50 145 C 40 125, 45 100, 75 90 C 90 105, 80 125, 50 145 Z" />
              {/* Petal 2 */}
              <path d="M85 110 C 75 85, 85 65, 115 65 C 125 80, 115 100, 85 110 Z" />
              {/* Petal 3 */}
              <path d="M115 80 C 110 55, 125 35, 150 40 C 155 60, 140 75, 115 80 Z" />
              {/* Leaf lines */}
              <path d="M50 145 L 75 90" />
              <path d="M85 110 L 115 65" />
              <path d="M115 80 L 150 40" />
            </svg>
          </div>
        </div>

        {/* PANEL DERECHO: Formulario, oscuro #1E2330 */}
        <div className="w-full md:w-1/2 bg-[#1E2330] p-10 md:p-14 flex flex-col justify-center text-pure-white relative">
          
          {/* Logo integrado para dispositivos móviles (Oculto en PC >= md) */}
          <div className="flex md:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-full bg-rosa-petalo/10 border border-rosa-petalo/25 flex items-center justify-center text-rosa-petalo">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C12 2 9 6 9 10C9 14 12 18 12 18C12 18 15 14 15 10C15 6 12 2 12 2Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-display font-light text-pure-white tracking-[0.25em] uppercase">Clínica Mayela</h1>
              <p className="text-[7px] uppercase tracking-[0.2em] text-rosa-petalo font-bold mt-0.5">MEDICINA ESTÉTICA · BIENESTAR</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-rosa-petalo uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-rosa-petalo animate-pulse"></span>
              Iniciar Sesión
            </span>
            <h3 className="text-2xl font-display font-light text-pure-white leading-snug">
              Bienvenida de nuevo ♡
            </h3>
            <p className="text-[11px] text-slate-light font-sans font-light tracking-wide">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            
            {/* Correo Electrónico */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-300 font-bold font-sans">Correo electrónico</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-rosa-petalo-light/60" size={13} />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181C26] border border-slate-700/80 focus:border-rosa-petalo/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-pure-white placeholder-slate-500/80 focus:outline-none transition-all font-sans font-medium"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-slate-300 font-bold font-sans">Contraseña</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-rosa-petalo-light/60" size={13} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181C26] border border-slate-700/80 focus:border-rosa-petalo/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-pure-white placeholder-slate-500/80 focus:outline-none transition-all font-sans font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-pure-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Checkbox y Link recuperar */}
            <div className="flex justify-between items-center text-[10px] font-sans font-bold text-slate-400 pt-1.5 select-none">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-rosa-petalo focus:ring-rosa-petalo border-slate-700 bg-[#181C26] w-3.5 h-3.5 cursor-pointer"
                />
                Recordarme
              </label>
              <button 
                onClick={handleForgotPassword}
                className="text-rosa-petalo hover:text-rosa-petalo-hover transition-colors font-bold border-none bg-transparent cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Iniciar Sesión button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rosa-petalo hover:bg-rosa-petalo-hover text-pure-white text-[10px] font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md cursor-pointer mt-4 hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-3 text-[8px] text-slate-500 uppercase tracking-widest my-4 font-sans font-bold select-none">
              <div className="h-px bg-slate-700/60 flex-grow" />
              <span>o continúa con</span>
              <div className="h-px bg-slate-700/60 flex-grow" />
            </div>

            {/* Google deshabilitado */}
            <div className="w-full py-2.5 border border-slate-700/80 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-transparent flex items-center justify-center gap-2 cursor-not-allowed select-none relative font-sans">
              {/* Google Colored Icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9.1z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5H1.2v3.2C3.2 21.8 7.3 24 12 24z" />
                <path fill="#FBBC05" d="M5.2 14.2c-.3-.7-.4-1.5-.4-2.2s.1-1.5.4-2.2V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4-3.2z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.1 0 12 0 7.3 0 3.2 2.2 1.2 6.6l4 3.2c1-2.9 3.6-5 6.8-5z" />
              </svg>
              Continuar con Google
              <span className="absolute -top-2 -right-1.5 bg-rosa-petalo/15 border border-rosa-petalo/30 text-rosa-petalo font-sans text-[6px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                PRÓXIMAMENTE
              </span>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 mt-6 select-none font-sans font-bold">
              ¿No tienes una cuenta?{' '}
              <span className="text-rosa-petalo hover:text-rosa-petalo-hover transition-colors cursor-pointer ml-1">
                Contáctanos
              </span>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
