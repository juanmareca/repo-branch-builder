import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  // Limpiar estado al cargar la aplicación para asegurar que siempre comience desde el splash
  useEffect(() => {
    // Limpiar cualquier estado previo
    setIsAuthenticated(false);
    setIsLoading(false);
    setUserRole('');
    setUserData(null);
    
    // Limpiar localStorage si hay configuraciones persistentes
    localStorage.removeItem('user-session');
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-authenticated');
  }, []);

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
    // No forzar navegación - el router manejará la navegación automáticamente
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    setUserData(null);
  };

  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'userRole:', userRole);

  if (!isAuthenticated && !isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SplashScreen onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoadingScreen onComplete={handleLoadingComplete} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Cuando está autenticado, mostrar la aplicación con routing normal

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={userRole === 'admin' ? <AdminDashboard /> : <Index />} />
            <Route path="/admin" element={userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
            <Route path="/holidays" element={userRole === 'admin' ? <HolidaysManagement /> : <Navigate to="/" replace />} />
            <Route path="/backups" element={userRole === 'admin' ? <BackupsManagement /> : <Navigate to="/" replace />} />
            <Route path="/audit-logs" element={userRole === 'admin' ? <AuditLogs /> : <Navigate to="/" replace />} />
            <Route path="/capacities" element={userRole === 'admin' ? <CapacitiesManagement /> : <Navigate to="/" replace />} />
            <Route path="/resources" element={userRole === 'admin' ? <ResourcesManagement /> : <Navigate to="/" replace />} />
            <Route path="/projects" element={userRole === 'admin' ? <ProjectsManagement /> : <Navigate to="/" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;