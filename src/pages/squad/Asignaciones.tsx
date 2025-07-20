import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Clock, ArrowLeft, Users, FolderOpen, CalendarDays, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface TeamMember {
  id: string;
  nombre: string;
  categoria: string;
  oficina: string;
}

interface Project {
  id: string;
  codigo_inicial: string;
  denominacion: string;
}

interface Assignment {
  id: string;
  project_id: string;
  person_id: string;
  start_date: string;
  end_date: string;
  hours_allocated: number;
  notes: string;
}

const Asignaciones = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Squad Lead name - en producción vendría del contexto de autenticación
  const squadLeadName = "REVILLA MAILLO, JUAN MANUEL";
  
  // Estado del formulario
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('100');
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  // Datos
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estadísticas
  const [stats, setStats] = useState({
    miembros: 0,
    proyectosActivos: 0,
    festivosConfigurados: 0
  });

  // Generar 6 meses desde el mes actual
  const currentDate = new Date();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(currentDate, i));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener miembros del equipo (simulado)
      const { data: persons, error: personsError } = await supabase
        .from('persons')
        .select('id, nombre, categoria, oficina')
        .limit(5);

      if (personsError) throw personsError;

      // Obtener proyectos
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, codigo_inicial, denominacion')
        .limit(50);

      if (projectsError) throw projectsError;

      // Obtener festivos
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('holidays')
        .select('date');

      if (holidaysError) throw holidaysError;

      // Obtener asignaciones existentes
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');

      if (!assignmentsError && assignmentsData) {
        setAssignments(assignmentsData);
      }

      setTeamMembers(persons || []);
      setProjects(projectsData || []);
      
      // Convertir fechas de festivos
      const holidayDates = holidaysData?.map(h => new Date(h.date)) || [];
      setHolidays(holidayDates);

      // Calcular estadísticas
      setStats({
        miembros: persons?.length || 0,
        proyectosActivos: assignmentsData?.length || 0,
        festivosConfigurados: holidaysData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember || !selectedProject || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          person_id: selectedMember,
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
          hours_allocated: parseInt(percentage),
          type: 'project_assignment',
          status: 'assigned',
          notes: `Asignado por ${squadLeadName}`
        });

      if (error) throw error;

      toast({
        title: "✅ Asignación exitosa",
        description: "El proyecto ha sido asignado correctamente",
      });

      // Limpiar formulario
      setSelectedMember('');
      setSelectedProject('');
      setStartDate('');
      setEndDate('');
      setPercentage('100');

      // Recargar asignaciones
      fetchData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar la asignación",
        variant: "destructive",
      });
    }
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Domingo o Sábado
  };

  const isHoliday = (date: Date) => {
    return holidays.some(holiday => 
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    );
  };

  const getSelectedMemberName = () => {
    const member = teamMembers.find(m => m.id === selectedMember);
    return member ? member.nombre : 'Seleccionar miembro';
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
              <div className="p-2 bg-orange-600 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Asignaciones Avanzadas - Squad Lead: {squadLeadName}
                </h1>
                <p className="text-sm text-gray-600">Asignar proyectos a miembros del squad</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Miembros del equipo:</span>
              <span className="text-blue-700">{stats.miembros} personas</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Proyectos activos:</span>
              <span className="text-blue-700">{stats.proyectosActivos} proyectos</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Festivos configurados:</span>
              <span className="text-blue-700">{stats.festivosConfigurados} días</span>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-600" />
              Nueva Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              {/* Seleccionar Miembro */}
              <div>
                <Label htmlFor="member">Seleccionar Miembro del Equipo</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar miembro..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nombre} ({member.categoria}) - {member.oficina}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha Desde */}
              <div>
                <Label htmlFor="startDate">Fecha Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <Label htmlFor="endDate">Fecha Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* Porcentaje */}
              <div>
                <Label htmlFor="percentage">Porcentaje (10-100%)</Label>
                <Input
                  type="number"
                  min="10"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="bg-white"
                />
              </div>

              {/* Proyecto */}
              <div>
                <Label htmlFor="project">Proyecto</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar proyecto..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50 max-h-60">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.codigo_inicial} - {project.denominacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botón Asignar */}
              <div>
                <Button 
                  onClick={handleAssign}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Section */}
        {selectedMember && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Calendario de {getSelectedMemberName()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {months.map((month) => (
                  <div key={month.toISOString()} className="space-y-2">
                    <h3 className="text-center font-semibold text-gray-900 capitalize">
                      {format(month, 'MMMM \'de\' yyyy', { locale: es })}
                    </h3>
                    <div className="border rounded-lg p-2 bg-white">
                      <Calendar
                        mode="single"
                        month={month}
                        locale={es}
                        weekStartsOn={1} // Lunes = 1
                        className="pointer-events-auto"
                        modifiers={{
                          weekend: isWeekend,
                          holiday: isHoliday,
                        }}
                        modifiersStyles={{
                          weekend: { 
                            backgroundColor: '#fef3c7', // Amarillo claro para fines de semana
                            color: '#92400e'
                          },
                          holiday: { 
                            backgroundColor: '#fce7f3', // Rosa claro para festivos
                            color: '#be185d'
                          },
                        }}
                        showOutsideDays={false}
                        fixedWeeks={true}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Leyenda */}
              <div className="mt-6 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border rounded"></div>
                  <span>Fin de semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-200 border rounded"></div>
                  <span>Festivo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de asignaciones...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Asignaciones;