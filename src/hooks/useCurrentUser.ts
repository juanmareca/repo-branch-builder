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
        // Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // Obtener perfil del usuario
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setCurrentUser(null);
        } else {
          setCurrentUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            squadName: profile.squad_name,
            employeeCode: profile.employee_code
          });
        }
      } catch (error) {
        console.error('Error loading current user:', error);
        setCurrentUser(null);
      } finally {
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