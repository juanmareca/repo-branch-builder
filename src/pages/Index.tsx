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
    
    // Si es la vista del squad lead, añadir al propio squad lead al equipo
    if (isSquadLeadView && userData?.name) {
      const squadLeadAsPerson: Person = {
        id: `squad-lead-${userData.name}`,
        nombre: userData.name,
        cex: 'SQUAD_LEAD',
        num_pers: 'SL001',
        fecha_incorporacion: '',
        mail_empresa: userData.email || '',
        grupo: 'Squad Lead',
        categoria: 'Squad Lead',
        oficina: '',
        squad_lead: userData.name,
        origen: 'Squad Lead',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return [squadLeadAsPerson, ...teamMembers];
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isSquadLeadView ? 'Mi Equipo' : 'Gestión de Asignaciones y Capacidades'}
          </h1>
          <p className="text-muted-foreground">
            {isSquadLeadView 
              ? 'Miembros de tu equipo de trabajo'
              : 'Sistema de gestión de recursos humanos y asignaciones de proyectos'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isSquadLeadView ? 'Mi Equipo' : 'Total Personas'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isSquadLeadView ? filteredPersons.length : persons.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Squad Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{squadLeads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtro Activo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPersons.length}</div>
              <p className="text-xs text-muted-foreground">personas mostradas</p>
            </CardContent>
          </Card>
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
