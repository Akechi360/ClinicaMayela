import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { PageLoadSkeleton } from './PageLoadSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (active) {
          setSession(session);
        }
      } catch (err) {
        console.error('Error getting session:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (active) {
        setSession(currentSession);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <PageLoadSkeleton />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validar que el email pertenezca al dominio de la clínica
  // ESCALABILIDAD: cuando se implementen roles de paciente, agregar aquí
  // la verificación de user_profiles.role para redirigir al portal correspondiente
  const email = session.user?.email ?? '';
  if (!email.endsWith('@clinicamayela.com')) {
    supabase.auth.signOut();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
