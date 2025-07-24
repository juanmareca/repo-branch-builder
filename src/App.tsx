import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Ruta de autenticación - pública */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Rutas protegidas - requieren login */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes - solo administradores */}
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
            
            {/* Squad Lead Routes - solo squad leads */}
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
            
            {/* Catch-all - 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;