import { useState, useEffect } from 'react';

interface CurrentUser {
  name: string;
  role: 'admin' | 'squad_lead';
  squadName?: string;
}

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulamos el usuario actual basado en la URL o localStorage
    // En una implementación real, esto vendría de un contexto de autenticación
    const getUserFromContext = () => {
      const path = window.location.pathname;
      
      if (path.includes('/squad-') || path === '/squad-dashboard') {
        // Limpiar cualquier dato incorrecto del localStorage
        const savedSquadLead = localStorage.getItem('current-squad-lead');
        
        // Si hay un valor guardado pero no es REVILLA MAILLO, JUAN MANUEL, lo limpiamos
        if (savedSquadLead && savedSquadLead !== 'REVILLA MAILLO, JUAN MANUEL') {
          localStorage.removeItem('current-squad-lead');
        }
        
        // Establecer siempre REVILLA MAILLO, JUAN MANUEL como el usuario actual
        localStorage.setItem('current-squad-lead', 'REVILLA MAILLO, JUAN MANUEL');
        
        return {
          name: 'REVILLA MAILLO, JUAN MANUEL',
          role: 'squad_lead' as const,
          squadName: 'Squad de REVILLA MAILLO, JUAN MANUEL'
        };
      } else {
        // Usuario Administrador
        return {
          name: 'Admin',
          role: 'admin' as const
        };
      }
    };

    const user = getUserFromContext();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  return { currentUser, loading };
};