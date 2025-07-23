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
      
      if (path.includes('/squad-projects')) {
        // Usuario Squad Lead - tomamos el primer squad lead disponible como ejemplo
        return {
          name: 'ACOSTA SERRANO, CARLOS ALBERTO',
          role: 'squad_lead' as const,
          squadName: 'Squad Alpha'
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