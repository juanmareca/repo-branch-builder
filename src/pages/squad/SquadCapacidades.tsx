import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, ArrowLeft } from 'lucide-react';

const SquadCapacidades = () => {
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
              <div className="p-2 bg-cyan-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Capacidades</h1>
                <p className="text-sm text-gray-600">Habilidades y competencias del equipo</p>
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
              <Zap className="h-5 w-5 text-cyan-600" />
              Capacidades del Squad - Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Esta sección mostrará las habilidades y competencias de los miembros del squad.
            </p>
            <div className="text-sm text-gray-500">
              Funcionalidades que incluirá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Matriz de habilidades del equipo</li>
                <li>Niveles de competencia por tecnología</li>
                <li>Certificaciones y formación</li>
                <li>Identificar gaps de conocimiento</li>
                <li>Planificar formación del equipo</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SquadCapacidades;