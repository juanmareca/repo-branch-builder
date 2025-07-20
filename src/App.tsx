import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import pages with error boundary protection
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SplashScreen from "./pages/SplashScreen";
import LoadingScreen from "./pages/LoadingScreen";
import AdminDashboard from "./pages/AdminDashboard";
import HolidaysManagement from "./pages/HolidaysManagement";
import BackupsManagement from "./pages/BackupsManagement";
import AuditLogs from "./pages/AuditLogs";
import CapacitiesManagement from "./pages/CapacitiesManagement";
import ProjectsManagement from "./pages/ProjectsManagement";
import ResourcesManagement from "./pages/ResourcesManagement";
import SquadLeadDashboard from "./pages/SquadLeadDashboard";
import MiEquipo from "./pages/squad/MiEquipo";
import SquadProyectos from "./pages/squad/SquadProyectos";
import Asignaciones from "./pages/squad/Asignaciones";
import SquadCapacidades from "./pages/squad/SquadCapacidades";
import Disponibilidad from "./pages/squad/Disponibilidad";
import Reportes from "./pages/squad/Reportes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  const handleLogin = (role: string, userData?: any) => {
    console.log('App - handleLogin called with role:', role);
    setUserRole(role);
    setUserData(userData);
    setIsLoading(true);
  };

  const handleLoadingComplete = () => {
    console.log('App - Loading complete. UserRole is:', userRole);
    setIsLoading(false);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    setUserData(null);
  };

  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'userRole:', userRole);

  // Simple test render first
  if (!isAuthenticated && !isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground p-8">
            <h1 className="text-2xl font-bold mb-4">Sistema de Gestión</h1>
            <p className="mb-4">Aplicación funcionando correctamente</p>
            <button 
              onClick={() => handleLogin('admin')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Login como Admin (Test)
            </button>
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Cargando...</h2>
              <p>Preparando la aplicación</p>
              <button 
                onClick={handleLoadingComplete}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Completar Carga (Test)
              </button>
            </div>
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Authenticated state with working router
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto p-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">
                  {userRole === 'admin' ? 'Panel de Administración' : 'Dashboard Squad Lead'}
                </h1>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                >
                  Cerrar Sesión
                </button>
              </div>
              
              <Routes>
                <Route path="/" element={
                  userRole === 'admin' ? <Navigate to="/admin" replace /> : 
                  userRole === 'squad_lead' ? <Navigate to="/squad" replace /> :
                  <div>Página de inicio</div>
                } />
                
                {/* Simplified route for testing */}
                <Route path="/admin" element={
                  userRole === 'admin' ? (
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Administración</h2>
                      <p>Panel de administración funcionando</p>
                    </div>
                  ) : <Navigate to="/" replace />
                } />
                
                <Route path="*" element={<div>Página no encontrada</div>} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;