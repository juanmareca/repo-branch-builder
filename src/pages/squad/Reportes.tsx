import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';

const Reportes = () => {
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
              <div className="p-2 bg-red-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
                <p className="text-sm text-gray-600">Informes y métricas del squad</p>
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
              <FileText className="h-5 w-5 text-red-600" />
              Reportes del Squad - Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Esta sección generará informes y métricas sobre el rendimiento del squad.
            </p>
            <div className="text-sm text-gray-500">
              Funcionalidades que incluirá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reportes de productividad del equipo</li>
                <li>Métricas de proyectos completados</li>
                <li>Análisis de tiempos de entrega</li>
                <li>Gráficos de carga de trabajo</li>
                <li>Exportación de reportes en Excel/PDF</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reportes;