import React, { useState, useEffect } from 'react';
import { useSquadData } from '../hooks/useSquadData';
import PersonTable from '../components/PersonTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Person } from '../types';

const Index = ({ userRole, userData }: { userRole?: string; userData?: any }) => {
  const { persons, squadLeads, loading, error } = useSquadData();
  const [selectedSquadLead, setSelectedSquadLead] = useState<string>('all');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detectar si estamos en la vista de Squad Lead
  const isSquadLeadView = location.pathname === '/squad-team' && userRole === 'squad_lead';
  
  useEffect(() => {
    // Si es Squad Lead, filtrar automáticamente por su equipo
    if (isSquadLeadView && userData?.name) {
      setSelectedSquadLead(userData.name);
    }
  }, [isSquadLeadView, userData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Función para incluir al squad lead en su propio equipo
  const getTeamMembers = () => {
    if (selectedSquadLead === 'all') {
      return persons;
    }
    
    const teamMembers = persons.filter(person => person.squad_lead === selectedSquadLead);
    
    // Si es la vista del squad lead, buscar al propio squad lead en la tabla persons
    if (isSquadLeadView && userData?.name) {
      const squadLeadPerson = persons.find(person => person.nombre === userData.name);
      
      if (squadLeadPerson) {
        // Crear una copia del squad lead marcado como tal
        const squadLeadWithFlag = {
          ...squadLeadPerson,
          origen: 'Squad Lead' // Para identificarlo visualmente
        };
        
        // Si no está ya en teamMembers, añadirlo al principio
        const isAlreadyInTeam = teamMembers.some(member => member.id === squadLeadPerson.id);
        if (!isAlreadyInTeam) {
          return [squadLeadWithFlag, ...teamMembers];
        } else {
          // Si ya está en el equipo, reemplazarlo con la versión marcada
          return teamMembers.map(member => 
            member.id === squadLeadPerson.id ? squadLeadWithFlag : member
          );
        }
      }
    }
    
    return teamMembers;
  };

  const filteredPersons = getTeamMembers();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header con botón de volver para Squad Leads */}
        {isSquadLeadView && (
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate('/squad-dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Panel Principal
            </Button>
          </div>
        )}
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isSquadLeadView ? `Mi Equipo - ${userData?.name}` : 'Gestión de Asignaciones y Capacidades'}
              </h1>
              <p className="text-muted-foreground">
                {isSquadLeadView 
                  ? 'Panel de gestión de tu equipo de trabajo'
                  : 'Sistema de gestión de recursos humanos y asignaciones de proyectos'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {isSquadLeadView ? 'Miembros' : 'Total Personas'}
              </CardTitle>
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                {isSquadLeadView ? filteredPersons.length : persons.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                {isSquadLeadView ? 'Asignaciones Activas' : 'Squad Leads'}
              </CardTitle>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800 dark:text-green-300">
                {isSquadLeadView ? 0 : squadLeads.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                {isSquadLeadView ? 'Proyectos Completados' : 'Filtro Activo'}
              </CardTitle>
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800 dark:text-purple-300">
                {isSquadLeadView ? 0 : filteredPersons.length}
              </div>
              {!isSquadLeadView && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">personas mostradas</p>
              )}
            </CardContent>
          </Card>

          {isSquadLeadView && (
            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                  Capacidades
                </CardTitle>
                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-800 dark:text-orange-300">34</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filtros - Solo mostrar para admins */}
        {!isSquadLeadView && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Filtra las personas por Squad Lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedSquadLead} onValueChange={setSelectedSquadLead}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Selecciona un Squad Lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Squad Leads</SelectItem>
                    {squadLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.name}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSquadLead !== 'all' && (
                  <Badge variant="secondary">
                    Filtrando por: {selectedSquadLead}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {isSquadLeadView ? 'Miembros del Equipo' : 'Personal Asignado'}
            </CardTitle>
            <CardDescription>
              {isSquadLeadView 
                ? 'Listado de los miembros de tu equipo'
                : selectedSquadLead === 'all' 
                  ? 'Listado completo de todas las personas'
                  : `Personas asignadas a ${selectedSquadLead}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <PersonTable persons={filteredPersons} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
