import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/constants';

interface CurrentUser {
  name: string;
  role: 'admin' | 'squad_lead';
  squadName?: string;
}

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener el usuario actual del localStorage donde se guarda desde SplashScreen
    const getUserFromContext = () => {
      const path = window.location.pathname;
      
      if (path.includes('/squad-') || path === '/squad-dashboard') {
        // Obtener el squad lead actual del localStorage
        const savedSquadLead = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_SQUAD_LEAD);
        console.log('useCurrentUser - savedSquadLead from localStorage:', savedSquadLead);
        
        if (savedSquadLead) {
          return {
            name: savedSquadLead,
            role: 'squad_lead' as const,
            squadName: `Squad de ${savedSquadLead}`
          };
        } else {
          // Si no hay squad lead guardado, redirigir al splash
          window.location.href = '/';
          return null;
        }
      } else {
        // Usuario Administrador
        return {
          name: 'Admin',
          role: 'admin' as const
        };
      }
    };

    const user = getUserFromContext();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  return { currentUser, loading };
};