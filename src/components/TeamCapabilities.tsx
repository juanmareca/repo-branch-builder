import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, Award, Loader2, Users } from 'lucide-react';

interface Capacity {
  id: string;
  person_name: string;
  skill: string;
  level: string;
  certification?: string;
  comments?: string;
  evaluation_date?: string;
}

interface TeamCapabilitiesProps {
  teamMembers: string[];
}

const TeamCapabilities: React.FC<TeamCapabilitiesProps> = ({ teamMembers }) => {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        setLoading(true);
        
        if (teamMembers.length === 0) {
          setCapacities([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('capacities')
          .select('*')
          .in('person_name', teamMembers)
          .order('person_name')
          .order('skill');

        if (error) throw error;
        setCapacities(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching capacities');
      } finally {
        setLoading(false);
      }
    };

    fetchCapacities();
  }, [teamMembers]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'básico':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'intermedio':
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'avanzado':
      case 'alto':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'experto':
      case 'expert':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
      case 'nulo':
      case 'no':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'sí':
      case 'si':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSkillIcon = (skill: string) => {
    if (skill.toLowerCase().includes('idioma')) {
      return <Star className="h-4 w-4" />;
    }
    if (skill.toLowerCase().includes('certificación') || skill.toLowerCase().includes('certification')) {
      return <Award className="h-4 w-4" />;
    }
    return <Brain className="h-4 w-4" />;
  };

  const groupCapacitiesByPerson = () => {
    const grouped: { [key: string]: { [category: string]: Capacity[] } } = {};
    
    capacities.forEach(capacity => {
      if (!grouped[capacity.person_name]) {
        grouped[capacity.person_name] = {};
      }
      
      let category = 'Otras Capacidades';
      
      if (capacity.skill.toLowerCase().includes('módulo sap') || capacity.skill.toLowerCase().includes('sap')) {
        category = 'Módulos SAP e Implantaciones';
      } else if (capacity.skill.toLowerCase().includes('idioma')) {
        category = 'Idiomas';
      } else if (capacity.skill.toLowerCase().includes('industria') || capacity.skill.toLowerCase().includes('sector')) {
        category = 'Industrias';
      }
      
      if (!grouped[capacity.person_name][category]) {
        grouped[capacity.person_name][category] = [];
      }
      grouped[capacity.person_name][category].push(capacity);
    });
    
    return grouped;
  };

  const sortPersons = (persons: string[]) => {
    // Buscar el squad lead en la lista de miembros del equipo
    const squadLead = teamMembers.find(member => 
      persons.includes(member) && member.includes('SQUAD LEAD') // Asumiendo que viene marcado así
    ) || teamMembers[0]; // Si no encontramos uno marcado, tomar el primero
    
    // Separar squad lead del resto
    const otherMembers = persons.filter(person => person !== squadLead).sort();
    
    // Retornar squad lead primero, luego el resto alfabéticamente
    return squadLead ? [squadLead, ...otherMembers] : otherMembers;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando capacidades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-2">Error al cargar capacidades</div>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (capacities.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay capacidades registradas para este equipo</p>
      </div>
    );
  }

  const groupedByPerson = groupCapacitiesByPerson();
  const sortedPersons = sortPersons(Object.keys(groupedByPerson));

  return (
    <div className="space-y-8">
      {sortedPersons.map((personName) => {
        const personCapacities = groupedByPerson[personName];
        const isSquadLead = personName === sortedPersons[0]; // El primero es el squad lead
        
        return (
          <div key={personName} className="space-y-4">
            {/* Header de la persona */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 ${
              isSquadLead 
                ? 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10' 
                : 'border-l-green-500 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10'
            }`}>
              <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${
                isSquadLead 
                  ? 'bg-blue-100 dark:bg-blue-900/50' 
                  : 'bg-green-100 dark:bg-green-900/50'
              }`}>
                <Users className={`w-6 h-6 ${
                  isSquadLead 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  isSquadLead 
                    ? 'text-blue-800 dark:text-blue-300' 
                    : 'text-green-800 dark:text-green-300'
                }`}>
                  {personName}
                  {isSquadLead && <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">(Squad Lead)</span>}
                </h2>
                <p className={`text-sm ${
                  isSquadLead 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {Object.values(personCapacities).flat().length} capacidades registradas
                </p>
              </div>
            </div>

            {/* Categorías de capacidades para esta persona */}
            <div className="grid gap-4 ml-4">
              {['Módulos SAP e Implantaciones', 'Idiomas', 'Industrias', 'Otras Capacidades'].map(category => {
                const categoryCapacities = personCapacities[category];
                
                if (!categoryCapacities || categoryCapacities.length === 0) {
                  return null;
                }

                return (
                  <Card key={category} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/80 py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getSkillIcon(category)}
                        {category}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {categoryCapacities.length} capacidades
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid gap-2" style={{ 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                      }}>
                        {categoryCapacities.map((capacity) => (
                          <div
                            key={capacity.id}
                            className="p-3 border rounded-lg hover:shadow-sm transition-shadow group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                                  {capacity.skill.replace('Módulo SAP - ', '')}
                                </h4>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-1 ${getLevelColor(capacity.level)}`}
                              >
                                {capacity.level}
                              </Badge>
                            </div>
                            
                            {capacity.certification && (
                              <div className="flex items-center gap-1 mt-2">
                                <Award className="h-3 w-3 text-amber-500" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {capacity.certification}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamCapabilities;