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
        // **TEMPORAL**: Sistema de autenticación simulado para la presentación
        const simUser = localStorage.getItem('currentUser');
        if (simUser) {
          setCurrentUser(JSON.parse(simUser));
          setLoading(false);
          return;
        }

        // Obtener usuario autenticado (sistema real)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // **TEMPORAL**: Si no hay usuario autenticado, crear uno de prueba
          console.log('No hay usuario autenticado, usando usuario temporal para presentación');
          const tempUser: CurrentUser = {
            id: 'temp-squad-lead-001',
            name: 'Squad Lead Demo',
            email: 'squadlead@demo.com',
            role: 'squad_lead',
            squadName: 'Demo Squad'
          };
          setCurrentUser(tempUser);
          localStorage.setItem('currentUser', JSON.stringify(tempUser));
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
          const userData: CurrentUser = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            squadName: profile.squad_name,
            employeeCode: profile.employee_code
          };
          setCurrentUser(userData);
          localStorage.setItem('currentUser', JSON.stringify(userData));
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