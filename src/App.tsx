import React, { useState } from "react";
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
import SquadLeadDashboard from "./pages/SquadLeadDashboard";
import SquadAssignments from "./pages/SquadAssignments";
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
            <Route path="/" element={
              userRole === 'admin' ? <Navigate to="/admin" replace /> : 
              userRole === 'squad_lead' ? <Navigate to="/squad-dashboard" replace /> :
              <Index />
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
            <Route path="/holidays" element={userRole === 'admin' ? <HolidaysManagement /> : <Navigate to="/" replace />} />
            <Route path="/backups" element={userRole === 'admin' ? <BackupsManagement /> : <Navigate to="/" replace />} />
            <Route path="/audit-logs" element={userRole === 'admin' ? <AuditLogs /> : <Navigate to="/" replace />} />
            <Route path="/capacities" element={userRole === 'admin' ? <CapacitiesManagement /> : <Navigate to="/" replace />} />
            <Route path="/resources" element={userRole === 'admin' ? <ResourcesManagement /> : <Navigate to="/" replace />} />
            <Route path="/projects" element={userRole === 'admin' ? <ProjectsManagement /> : <Navigate to="/" replace />} />
            
            {/* Squad Lead Routes */}
            <Route path="/squad-dashboard" element={userRole === 'squad_lead' ? <SquadLeadDashboard /> : <Navigate to="/" replace />} />
            <Route path="/squad-assignments" element={userRole === 'squad_lead' ? <SquadAssignments /> : <Navigate to="/" replace />} />
            <Route path="/squad-team" element={userRole === 'squad_lead' ? <Index userRole={userRole} userData={userData} /> : <Navigate to="/" replace />} />
            <Route path="/squad-projects" element={userRole === 'squad_lead' ? <ProjectsManagement /> : <Navigate to="/" replace />} />
            <Route path="/squad-capacities" element={userRole === 'squad_lead' ? <CapacitiesManagement /> : <Navigate to="/" replace />} />
            <Route path="/squad-availability" element={userRole === 'squad_lead' ? <Index /> : <Navigate to="/" replace />} />
            <Route path="/squad-reports" element={userRole === 'squad_lead' ? <Index /> : <Navigate to="/" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;