import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  Clock, 
  Zap, 
  Calendar, 
  FileText,
  LogOut,
  Home
} from 'lucide-react';

const SquadLeadDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    window.location.href = '/';
  };

  const menuItems = [
    {
      title: "Mi Equipo",
      description: "Gestionar miembros del squad",
      icon: Users,
      route: "/squad/mi-equipo",
      color: "bg-blue-500 hover:bg-blue-600",
      textColor: "text-blue-600"
    },
    {
      title: "Proyectos",
      description: "Ver proyectos asignados al squad",
      icon: FolderOpen,
      route: "/squad/proyectos",
      color: "bg-purple-500 hover:bg-purple-600",
      textColor: "text-purple-600"
    },
    {
      title: "Asignaciones",
      description: "Asignar proyectos a miembros",
      icon: Clock,
      route: "/squad/asignaciones",
      color: "bg-orange-500 hover:bg-orange-600",
      textColor: "text-orange-600"
    },
    {
      title: "Capacidades",
      description: "Habilidades del equipo",
      icon: Zap,
      route: "/squad/capacidades",
      color: "bg-cyan-500 hover:bg-cyan-600",
      textColor: "text-cyan-600"
    },
    {
      title: "Disponibilidad",
      description: "Horarios y disponibilidad",
      icon: Calendar,
      route: "/squad/disponibilidad",
      color: "bg-green-500 hover:bg-green-600",
      textColor: "text-green-600"
    },
    {
      title: "Reportes",
      description: "Informes y métricas",
      icon: FileText,
      route: "/squad/reportes",
      color: "bg-red-500 hover:bg-red-600",
      textColor: "text-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Panel Squad Lead</h1>
                <p className="text-sm text-gray-600">Gestiona tu equipo y proyectos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Panel de Admin
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido, Squad Lead</h2>
          <p className="text-gray-600">Selecciona una sección para comenzar</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card 
                key={item.title} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-200 hover:border-gray-300"
                onClick={() => navigate(item.route)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${item.textColor} group-hover:text-gray-900 transition-colors`}>
                        {item.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm group-hover:text-gray-700 transition-colors">
                    {item.description}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`${item.textColor} hover:bg-gray-100`}
                    >
                      Acceder →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Mi Equipo</h3>
              <p className="text-sm text-blue-700">5 miembros</p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <FolderOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Proyectos</h3>
              <p className="text-sm text-purple-700">12 activos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900">Asignaciones</h3>
              <p className="text-sm text-orange-700">8 pendientes</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Disponibilidad</h3>
              <p className="text-sm text-green-700">85% ocupado</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SquadLeadDashboard;