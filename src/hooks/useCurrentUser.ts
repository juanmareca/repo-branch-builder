import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'squad_lead' | 'operations';
  squadName?: string;
  employeeCode?: string;
}

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        // Verificar si hay usuario en localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('✅ Usuario cargado desde localStorage:', userData);
          setCurrentUser(userData);
          setLoading(false);
          return;
        }

        console.log('❌ No hay usuario en localStorage');
        setCurrentUser(null);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error loading current user:', error);
        setCurrentUser(null);
        setLoading(false);
      }
    };

    loadCurrentUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadCurrentUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { currentUser, loading };
};