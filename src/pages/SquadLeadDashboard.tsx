import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderKanban, 
  Calendar, 
  Award, 
  TrendingUp, 
  FileText, 
  LogOut,
  CalendarDays
} from 'lucide-react';

export default function SquadLeadDashboard() {
  const navigate = useNavigate();

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel Squad Lead</h1>
            <p className="text-muted-foreground mt-2">Gestiona tu equipo y proyectos</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mi Equipo */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigation('/squad-team')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">Mi Equipo</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                Gestiona los miembros de tu squad y sus Capacidades
              </p>
            </CardContent>
          </Card>

          {/* Proyectos */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigation('/squad-projects')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <FolderKanban className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-lg">Proyectos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                Visualiza los proyectos activos de tu equipo
              </p>
            </CardContent>
          </Card>

          {/* Asignaciones */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigation('/squad-assignments')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-lg">Asignaciones</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                Gestiona asignaciones de proyectos y calendarios
              </p>
            </CardContent>
          </Card>

          {/* Gestión de Festivos */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigation('/squad-holidays')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-orange-600/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <CalendarDays className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Gestión de Festivos</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                Consulta los días festivos del calendario
              </p>
            </CardContent>
          </Card>

          {/* Disponibilidad */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigation('/squad-availability')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
              <CardTitle className="text-lg">Disponibilidad</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                Analiza la carga de trabajo del equipo
              </p>
            </CardContent>
          </Card>

          {/* Reportes */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigation('/squad-reports')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-lg">Reportes</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground text-sm">
                Genera informes de rendimiento del equipo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}