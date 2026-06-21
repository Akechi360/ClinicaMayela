import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

const LoginFace3D = lazy(() =>
  import('../components/LoginFace3D').then(m => ({ default: m.LoginFace3D }))
);

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

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

      if (error) throw error;

      toast.dismiss(toastId);
      toast.success('Sesión iniciada con éxito.');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Error de login:', err);

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
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#F7F8FA] relative overflow-hidden select-none font-sans">
      {/* Dot pattern background */}
      <div className="bg-grid-overlay"></div>

      {/* Split Card */}
      <div className="w-full max-w-5xl h-auto md:h-[620px] rounded-[1.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.10)] flex flex-col md:flex-row z-10 animate-fadeIn">

        {/* ── PANEL IZQUIERDO: 3D Face showcase ── */}
        <div className="hidden md:flex w-1/2 relative overflow-hidden flex-col justify-between"
          style={{ background: 'linear-gradient(160deg, #FDFAF8 0%, #F9F3EE 40%, #F3EBE3 100%)' }}>

          {/* Decorative orbs */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(224,186,168,0.15) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(226,204,163,0.12) 0%, transparent 70%)' }} />

          {/* Geometric rings */}
          <div className="absolute top-8 right-8 w-24 h-24 rounded-full border border-rosa-petalo/[0.08] pointer-events-none" />
          <div className="absolute top-14 right-14 w-14 h-14 rounded-full border border-rosa-petalo/[0.06] pointer-events-none" />
          <div className="absolute bottom-32 left-6 w-12 h-12 rounded-full border border-satin-copper-light/[0.08] pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 p-8 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rosa-petalo to-satin-copper-light flex items-center justify-center shadow-[0_2px_10px_rgba(224,186,168,0.25)]">
              <span className="material-symbols-outlined text-white text-base">spa</span>
            </div>
            <div>
              <h1 className="text-sm font-display font-medium text-slate-dark tracking-[0.12em] uppercase leading-none">Rejuvenece</h1>
              <p className="text-[7px] uppercase tracking-[0.1em] text-rosa-petalo font-medium mt-0.5">Clínica Mayela</p>
            </div>
          </div>

          {/* 3D Face Canvas */}
          <div className="flex-1 relative z-10">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rosa-petalo/20 to-satin-copper-light/15 flex items-center justify-center animate-pulse">
                  <span className="material-symbols-outlined text-rosa-petalo text-lg">spa</span>
                </div>
              </div>
            }>
              <LoginFace3D />
            </Suspense>
          </div>

          {/* Bottom content */}
          <div className="p-8 relative z-10">
            <h2 className="text-xl font-display font-light text-slate-dark leading-tight tracking-wide">
              Tu belleza natural, <br />
              <span className="italic text-rosa-petalo">potenciada por la ciencia</span>
            </h2>
            <p className="text-[10px] text-slate-medium leading-relaxed mt-2 max-w-[260px]">
              Plataforma clínica especializada en tratamientos estéticos faciales y medicina de bienestar.
            </p>

            {/* Treatment pills */}
            <div className="flex gap-1.5 mt-4 flex-wrap">
              {['Bótox', 'Hialurónico', 'Mesoterapia', 'Peeling'].map(t => (
                <span key={t} className="px-2.5 py-1 rounded-full text-[8px] font-medium text-slate-medium bg-white/60 backdrop-blur-sm border border-rosa-petalo/[0.10]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── PANEL DERECHO: Form con glass effect ── */}
        <div className="w-full md:w-1/2 relative overflow-hidden">
          {/* Base background - dark gradient matching hero banner */}
          <div className="absolute inset-0 glass-panel-dark" />
          {/* Glass layer */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[1px]" />
          {/* Glows */}
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(224,186,168,0.10) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(160,170,190,0.06) 0%, transparent 70%)' }} />
          {/* Top light border */}
          <div className="absolute top-0 left-8 right-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

          <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-full text-white">

            {/* Mobile logo */}
            <div className="flex md:hidden items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rosa-petalo to-satin-copper-light flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-base">spa</span>
              </div>
              <div>
                <h1 className="text-sm font-display font-medium text-white tracking-[0.12em] uppercase">Rejuvenece</h1>
                <p className="text-[7px] uppercase tracking-[0.1em] text-rosa-petalo font-medium mt-0.5">Clínica Mayela</p>
              </div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-[8px] font-medium text-rosa-petalo uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 rounded-full bg-rosa-petalo/60"></span>
                Iniciar Sesión
              </span>
              <h3 className="text-2xl font-display font-light text-white leading-snug">
                Bienvenida de nuevo
              </h3>
              <p className="text-[11px] text-[#7A8494] font-sans font-light tracking-wide">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">

              <div className="flex flex-col space-y-1.5">
                <label className="text-[8px] uppercase tracking-[0.12em] text-[#7A8494] font-medium font-sans">Correo electrónico</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 text-rosa-petalo/40" size={13} />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] focus:border-rosa-petalo/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-sans font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[8px] uppercase tracking-[0.12em] text-[#7A8494] font-medium font-sans">Contraseña</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 text-rosa-petalo/40" size={13} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] focus:border-rosa-petalo/40 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none transition-all font-sans font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-white/15 hover:text-white/40 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-sans font-medium text-[#5A6374] pt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer hover:text-[#7A8494] transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-rosa-petalo focus:ring-rosa-petalo border-white/10 bg-white/[0.04] w-3.5 h-3.5 cursor-pointer"
                  />
                  Recordarme
                </label>
                <button
                  onClick={handleForgotPassword}
                  className="text-rosa-petalo hover:text-rosa-petalo-hover transition-colors font-medium border-none bg-transparent cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rosa-button text-[10px] font-semibold uppercase tracking-[0.12em] py-3 rounded-xl transition-all cursor-pointer mt-4 hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>

              <div className="flex items-center gap-3 text-[8px] text-[#3A4254] uppercase tracking-[0.12em] my-4 font-sans font-medium select-none">
                <div className="h-px flex-grow" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span>o continúa con</span>
                <div className="h-px flex-grow" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div className="w-full py-2.5 border border-white/[0.06] rounded-xl text-[10px] font-medium uppercase tracking-wider text-[#5A6374] bg-white/[0.02] backdrop-blur-sm flex items-center justify-center gap-2 cursor-not-allowed select-none relative font-sans">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9.1z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5H1.2v3.2C3.2 21.8 7.3 24 12 24z" />
                  <path fill="#FBBC05" d="M5.2 14.2c-.3-.7-.4-1.5-.4-2.2s.1-1.5.4-2.2V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4-3.2z" />
                  <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.1 0 12 0 7.3 0 3.2 2.2 1.2 6.6l4 3.2c1-2.9 3.6-5 6.8-5z" />
                </svg>
                Continuar con Google
                <span className="absolute -top-2 -right-1.5 bg-rosa-petalo/[0.12] border border-rosa-petalo/25 text-rosa-petalo font-sans text-[6px] font-medium px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Próximamente
                </span>
              </div>

              <div className="text-center text-[10px] text-[#4A5264] mt-6 select-none font-sans font-medium">
                ¿No tienes una cuenta?{' '}
                <span className="text-rosa-petalo hover:text-rosa-petalo-hover transition-colors cursor-pointer ml-1">
                  Contáctanos
                </span>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
