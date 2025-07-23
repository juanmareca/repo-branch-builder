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
        // Para determinar el squad lead real, usaremos el localStorage o parámetros URL
        // Por ahora, permitir que se seleccione desde la UI
        const savedSquadLead = localStorage.getItem('current-squad-lead');
        
        if (savedSquadLead) {
          return {
            name: savedSquadLead,
            role: 'squad_lead' as const,
            squadName: `Squad de ${savedSquadLead}`
          };
        }
        
        // Si no hay squad lead guardado, usar REVILLA MAILLO, JUAN MANUEL por defecto
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