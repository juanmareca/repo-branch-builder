import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowLeft, Mail, MapPin, Hash, Clock, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  nombre: string;
  categoria: string;
  mail_empresa: string;
  oficina: string;
  num_pers: string;
  capacidades: any[];
  utilizacion: number;
}

interface TeamStats {
  miembros: number;
  asignacionesActivas: number;
  proyectosCompletados: number;
  totalCapacidades: number;
}

const MiEquipo = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    miembros: 0,
    asignacionesActivas: 0,
    proyectosCompletados: 0,
    totalCapacidades: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock Squad Lead name - en producción vendría del contexto de autenticación
  const squadLeadName = "REVILLA MAILLO, JUAN MANUEL";

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // Obtener miembros del equipo (simulado con una consulta a persons)
      const { data: persons, error: personsError } = await supabase
        .from('persons')
        .select('*')
        .limit(5); // Simulamos que son los primeros 5 como equipo

      if (personsError) throw personsError;

      // Obtener capacidades para estos miembros
      const { data: capacities, error: capacitiesError } = await supabase
        .from('capacities')
        .select('*')
        .in('person_name', persons?.map(p => p.nombre) || []);

      if (capacitiesError) throw capacitiesError;

      // Combinar datos
      const teamMembersData: TeamMember[] = persons?.map(person => {
        const memberCapacities = capacities?.filter(cap => cap.person_name === person.nombre) || [];
        return {
          id: person.id,
          nombre: person.nombre,
          categoria: person.categoria,
          mail_empresa: person.mail_empresa,
          oficina: person.oficina,
          num_pers: person.num_pers,
          capacidades: memberCapacities,
          utilizacion: Math.floor(Math.random() * 100) // Mock utilization
        };
      }) || [];

      setTeamMembers(teamMembersData);

      // Calcular estadísticas
      const totalCapacidades = capacities?.length || 0;
      setStats({
        miembros: teamMembersData.length,
        asignacionesActivas: 0, // Mock data
        proyectosCompletados: 0, // Mock data  
        totalCapacidades
      });

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUtilizacionColor = (utilizacion: number) => {
    if (utilizacion === 0) return 'text-gray-500';
    if (utilizacion < 50) return 'text-green-600';
    if (utilizacion < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

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
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mi Equipo - {squadLeadName}</h1>
                <p className="text-sm text-gray-600">Gestiona los miembros de tu squad</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-blue-900">{stats.miembros}</h3>
              <p className="text-sm text-blue-700">Miembros</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-green-900">{stats.asignacionesActivas}</h3>
              <p className="text-sm text-green-700">Asignaciones Activas</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-purple-900">{stats.proyectosCompletados}</h3>
              <p className="text-sm text-purple-700">Proyectos Completados</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-orange-900">{stats.totalCapacidades}</h3>
              <p className="text-sm text-orange-700">Capacidades</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Miembros del Equipo</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando miembros del equipo...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{member.nombre}</CardTitle>
                        <Badge variant="outline" className="mt-1">{member.categoria}</Badge>
                      </div>
                    </div>
                    <div className={`text-right ${getUtilizacionColor(member.utilizacion)}`}>
                      <div className="text-2xl font-bold">{member.utilizacion}%</div>
                      <div className="text-xs text-gray-500">Utilización</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{member.mail_empresa}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{member.oficina}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Hash className="h-4 w-4" />
                      <span>{member.num_pers}</span>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Skills:</h4>
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-gray-700">Capacidades:</h5>
                      {member.capacidades.length > 0 ? (
                        <div className="space-y-1">
                          {member.capacidades.slice(0, 3).map((cap, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs mr-1 mb-1 bg-green-100 text-green-800"
                            >
                              {cap.skill} ({cap.level})
                            </Badge>
                          ))}
                          {member.capacidades.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.capacidades.length - 3} más
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No hay capacidades registradas</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {teamMembers.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay miembros en el equipo</h3>
              <p className="text-gray-600">Los miembros del equipo aparecerán aquí una vez asignados.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MiEquipo;