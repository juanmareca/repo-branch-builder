import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FolderOpen, 
  Zap, 
  Calendar,
  Upload,
  Download,
  Database,
  FileText,
  Settings,
  BarChart3,
  Loader2,
  LogOut
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import HolidaysUpload from '@/components/FileUpload/HolidaysUpload';
import ResourcesUpload from '@/components/FileUpload/ResourcesUpload';
import ProjectsUpload from '@/components/FileUpload/ProjectsUpload';
import CapacitiesUpload from '@/components/FileUpload/CapacitiesUpload';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { stats, loading, error } = useAdminStats();
  const navigate = useNavigate();

  const handleLogout = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando panel de administración...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
                <p className="text-muted-foreground">Gestión Avanzada del Sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Sistema Activo
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Recursos */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">RECURSOS</CardTitle>
              <Users className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.recursos}</div>
              <p className="text-xs text-muted-foreground">Clic para gestionar</p>
              <div className="w-full bg-blue-100 rounded-full h-1 mt-2">
                <div className="bg-blue-600 h-1 rounded-full w-3/4"></div>
              </div>
            </CardContent>
          </Card>

          {/* Proyectos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">PROYECTOS</CardTitle>
              <FolderOpen className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.proyectos}</div>
              <p className="text-xs text-muted-foreground">Total proyectos</p>
              <div className="w-full bg-purple-100 rounded-full h-1 mt-2">
                <div className="bg-purple-600 h-1 rounded-full w-2/3"></div>
              </div>
            </CardContent>
          </Card>

          {/* Capacidades */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/capacities')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CAPACIDADES</CardTitle>
              <Zap className="h-5 w-5 text-cyan-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.capacidades}</div>
              <p className="text-xs text-muted-foreground">Clic para gestionar</p>
              <div className="w-full bg-cyan-100 rounded-full h-1 mt-2">
                <div className="bg-cyan-600 h-1 rounded-full w-1/2"></div>
              </div>
            </CardContent>
          </Card>

          {/* Festivos */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate('/holidays')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">FESTIVOS</CardTitle>
              <Calendar className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.festivos}</div>
              <p className="text-xs text-muted-foreground">Clic para gestionar</p>
              <div className="w-full bg-orange-100 rounded-full h-1 mt-2">
                <div className="bg-orange-600 h-1 rounded-full w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subida Masiva de Archivos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ResourcesUpload />
          <ProjectsUpload />
          <CapacitiesUpload />
          <HolidaysUpload />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Backups */}
          <Card className="hover:shadow-lg transition-all group border-gray-200 hover:border-gray-300 cursor-pointer" onClick={() => navigate('/backups')}>
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-600 rounded-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-800">Backups</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Último backup</p>
                    <p className="text-xs text-gray-500">Hace 2 horas</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Completo
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Crear Backup Manual
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Backups
                  </Button>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <span className="font-semibold">⚠️ Programación:</span> Backups automáticos cada 6 horas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs de Auditoría */}
          <Card className="hover:shadow-lg transition-all group border-blue-200 hover:border-blue-300 cursor-pointer" onClick={() => navigate('/audit-logs')}>
            <CardHeader className="bg-blue-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-blue-800">Logs de Auditoría</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Última actividad</p>
                    <p className="text-xs text-blue-500">Hace 5 minutos</p>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Activo
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Logs Recientes
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </Button>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">✅ Estado:</span> Sistema de auditoría funcionando correctamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;