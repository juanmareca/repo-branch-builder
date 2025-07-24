import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoading, setShowLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Verificar si hay usuario guardado
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setShowSplash(false);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    
    // Redirigir desde /auth a la raíz
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

    if (currentUser.role === 'admin') {
      return <AdminDashboard />;
    } else if (currentUser.role === 'squad_lead') {
      return <SquadLeadDashboard />;
    } else {
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
            <Route path="/" element={renderCurrentPage()} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/holidays" element={<HolidaysManagement />} />
            <Route path="/backups" element={<BackupsManagement />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/capacities" element={<CapacitiesManagement />} />
            <Route path="/resources" element={<ResourcesManagement />} />
            <Route path="/projects" element={<ProjectsManagement />} />
            <Route path="/configuration" element={<ConfigurationManagement />} />
            <Route path="/squad-dashboard" element={<SquadLeadDashboard />} />
            <Route path="/squad-assignments" element={<SquadAssignments />} />
            <Route path="/squad-team" element={<Index />} />
            <Route path="/squad-projects" element={<ProjectsManagement />} />
            <Route path="/squad-capacities" element={<CapacitiesManagement />} />
            <Route path="/squad-holidays" element={<SquadLeadHolidaysManagement />} />
            <Route path="/squad-availability" element={<Index />} />
            <Route path="/squad-reports" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;