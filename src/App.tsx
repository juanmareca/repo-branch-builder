import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SplashScreen from "./pages/SplashScreen";
import LoadingScreen from "./pages/LoadingScreen";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import SquadLeadDashboard from "./pages/SquadLeadDashboard";
import SquadAssignments from "./pages/SquadAssignments";
import HolidaysManagement from "./pages/HolidaysManagement";
import SquadLeadHolidaysManagement from "./pages/SquadLeadHolidaysManagement";
import BackupsManagement from "./pages/BackupsManagement";
import AuditLogs from "./pages/AuditLogs";
import CapacitiesManagement from "./pages/CapacitiesManagement";
import ProjectsManagement from "./pages/ProjectsManagement";
import ResourcesManagement from "./pages/ResourcesManagement";
import ConfigurationManagement from "./pages/ConfigurationManagement";
import AuthPage from "./pages/AuthPage";

const queryClient = new QueryClient();

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Limpiar cualquier sesión anterior al iniciar
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setShowSplash(true);
    
    // Redirigir desde /auth a la raíz si es necesario
    if (window.location.pathname === '/auth') {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const handleLogin = (role: string, userData: any) => {
    setShowLoading(true);
    setShowSplash(false);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    // El usuario ya está guardado en localStorage desde SplashScreen
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  };

  const renderCurrentPage = () => {
    if (!currentUser) return null;

    console.log('🔍 App.tsx - renderCurrentPage - currentUser:', currentUser);
    
    if (currentUser.role === 'admin') {
      console.log('✅ Redirigiendo a AdminDashboard');
      return <AdminDashboard />;
    } else if (currentUser.role === 'squad_lead') {
      console.log('✅ Redirigiendo a SquadLeadDashboard');
      return <SquadLeadDashboard />;
    } else {
      console.log('✅ Redirigiendo a Index');
      return <Index />;
    }
  };

  if (showSplash) {
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
  
  if (showLoading) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={renderCurrentPage()} />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/holidays" element={
              <ProtectedRoute requiredRole="admin">
                <HolidaysManagement />
              </ProtectedRoute>
            } />
            <Route path="/backups" element={
              <ProtectedRoute requiredRole="admin">
                <BackupsManagement />
              </ProtectedRoute>
            } />
            <Route path="/audit-logs" element={
              <ProtectedRoute requiredRole="admin">
                <AuditLogs />
              </ProtectedRoute>
            } />
            <Route path="/capacities" element={
              <ProtectedRoute requiredRole="admin">
                <CapacitiesManagement />
              </ProtectedRoute>
            } />
            <Route path="/resources" element={
              <ProtectedRoute requiredRole="admin">
                <ResourcesManagement />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute requiredRole="admin">
                <ProjectsManagement />
              </ProtectedRoute>
            } />
            <Route path="/configuration" element={
              <ProtectedRoute requiredRole="admin">
                <ConfigurationManagement />
              </ProtectedRoute>
            } />
            <Route path="/squad-dashboard" element={
              <ProtectedRoute requiredRole="squad_lead">
                <SquadLeadDashboard />
              </ProtectedRoute>
            } />
            <Route path="/squad-assignments" element={
              <ProtectedRoute requiredRole="squad_lead">
                <SquadAssignments />
              </ProtectedRoute>
            } />
            <Route path="/squad-team" element={
              <ProtectedRoute requiredRole="squad_lead">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/squad-projects" element={
              <ProtectedRoute requiredRole="squad_lead">
                <ProjectsManagement />
              </ProtectedRoute>
            } />
            <Route path="/squad-capacities" element={
              <ProtectedRoute requiredRole="squad_lead">
                <CapacitiesManagement />
              </ProtectedRoute>
            } />
            <Route path="/squad-holidays" element={
              <ProtectedRoute requiredRole="squad_lead">
                <SquadLeadHolidaysManagement />
              </ProtectedRoute>
            } />
            <Route path="/squad-availability" element={
              <ProtectedRoute requiredRole="squad_lead">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/squad-reports" element={
              <ProtectedRoute requiredRole="squad_lead">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;