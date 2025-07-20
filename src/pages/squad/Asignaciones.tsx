import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft } from 'lucide-react';

const Asignaciones = () => {
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
              <div className="p-2 bg-orange-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Asignaciones</h1>
                <p className="text-sm text-gray-600">Asignar proyectos a miembros del squad</p>
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
              <Clock className="h-5 w-5 text-orange-600" />
              ⭐ Asignaciones - ¡LA FUNCIONALIDAD ESTRELLA!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              <strong>Esta será la funcionalidad más valorada por los usuarios.</strong>
              Aquí los Squad Leads podrán asignar proyectos específicos a miembros de su equipo.
            </p>
            <div className="text-sm text-gray-500">
              Funcionalidades que incluirá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>🎯 Asignar proyectos específicos a miembros del equipo</li>
                <li>⏱️ Gestionar cargas de trabajo y horas estimadas</li>
                <li>📊 Hacer seguimiento del progreso de asignaciones</li>
                <li>⚖️ Optimizar la distribución de recursos</li>
                <li>📅 Definir fechas de inicio y finalización</li>
                <li>📝 Añadir notas y comentarios del squad lead</li>
                <li>🔄 Reasignar proyectos entre miembros</li>
              </ul>
            </div>
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 font-medium">
                🚀 ¡Empezaremos a desarrollar esta funcionalidad una vez completemos la estructura básica!
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Asignaciones;