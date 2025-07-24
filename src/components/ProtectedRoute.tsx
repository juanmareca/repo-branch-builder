import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'squad_lead' | 'operations';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { currentUser, loading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 ProtectedRoute - loading:', loading, 'currentUser:', currentUser);
    
    if (!loading) {
      if (!currentUser) {
        console.log('🔒 No hay usuario autenticado, redirigiendo a /auth');
        navigate('/auth');
        return;
      }

      if (requiredRole && currentUser.role !== requiredRole) {
        console.log(`🚫 Usuario ${currentUser.name} no tiene rol ${requiredRole}, tiene ${currentUser.role}`);
        // Redirigir según el rol actual
        if (currentUser.role === 'admin') {
          navigate('/admin');
        } else if (currentUser.role === 'squad_lead') {
          navigate('/squad-dashboard');
        } else {
          navigate('/');
        }
        return;
      }
    }
  }, [currentUser, loading, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acceso denegado</h1>
          <p className="text-muted-foreground">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acceso denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};