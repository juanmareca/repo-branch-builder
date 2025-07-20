import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, ArrowLeft } from 'lucide-react';

const SquadProyectos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/squad')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div className="p-2 bg-purple-600 rounded-lg">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Proyectos</h1>
                <p className="text-sm text-gray-600">Proyectos asignados al squad</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-600" />
              Proyectos del Squad - Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Esta sección mostrará todos los proyectos asignados a tu squad.
            </p>
            <div className="text-sm text-gray-500">
              Funcionalidades que incluirá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lista de proyectos del squad</li>
                <li>Estado y progreso de cada proyecto</li>
                <li>Fechas de inicio y finalización</li>
                <li>Miembros asignados por proyecto</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SquadProyectos;