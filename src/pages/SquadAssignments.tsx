import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import AssignmentSummary from '@/components/AssignmentSummary';

interface Assignment {
  id: string;
  person_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  hours_allocated: number;
  project_name?: string;
  project_color?: string;
}

interface Holiday {
  date: string;
  festivo: string;
  comunidad_autonoma: string;
}

interface Person {
  id: string;
  nombre: string;
  oficina: string;
}

interface Project {
  id: string;
  denominacion: string;
  codigo_inicial: string;
}

const PROJECT_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500'
];

export default function SquadAssignments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('100');
  
  const [persons, setPersons] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  
  const currentDate = new Date();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(currentDate, i));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch persons
      const { data: personsData } = await supabase
        .from('persons')
        .select('id, nombre, oficina');
      
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, denominacion, codigo_inicial');
      
      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*');
      
      // Fetch holidays
      const { data: holidaysData } = await supabase
        .from('holidays')
        .select('*');
      
      if (personsData) {
        setPersons(personsData);
        const uniqueOffices = [...new Set(personsData.map(p => p.oficina))];
        setOffices(uniqueOffices);
      }
      
      if (projectsData) setProjects(projectsData);
      if (assignmentsData) {
        const assignmentsWithColors = assignmentsData.map((assignment, index) => ({
          ...assignment,
          project_color: PROJECT_COLORS[index % PROJECT_COLORS.length]
        }));
        setAssignments(assignmentsWithColors);
      }
      if (holidaysData) setHolidays(holidaysData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive"
      });
    }
  };

  const handleAssign = async () => {
    if (!selectedPerson || !selectedProject || !startDate || !endDate || !percentage) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const percentageNum = parseInt(percentage);
    if (percentageNum <= 0 || percentageNum > 100) {
      toast({
        title: "Error",
        description: "El porcentaje debe estar entre 1 y 100",
        variant: "destructive"
      });
      return;
    }

    // Check if total percentage for any day exceeds 100%
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const days = eachDayOfInterval({ start: startDateObj, end: endDateObj });
    
    for (const day of days) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const existingAssignments = assignments.filter(a => 
        a.person_id === selectedPerson &&
        dayStr >= a.start_date && 
        dayStr <= a.end_date
      );
      
      const totalPercentage = existingAssignments.reduce((sum, a) => sum + a.hours_allocated, 0) + percentageNum;
      
      if (totalPercentage > 100) {
        toast({
          title: "Error",
          description: `El ${format(day, 'dd/MM/yyyy')} excedería el 100% de capacidad`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          person_id: selectedPerson,
          project_id: selectedProject,
          start_date: startDate,
          end_date: endDate,
          hours_allocated: percentageNum,
          type: 'project'
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Asignación creada correctamente"
      });

      // Reset form
      setSelectedProject('');
      setStartDate('');
      setEndDate('');
      setPercentage('100');
      
      // Refresh assignments
      fetchData();
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Error al crear la asignación",
        variant: "destructive"
      });
    }
  };

  const getPersonAssignments = (personId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments.filter(a => 
      a.person_id === personId &&
      dateStr >= a.start_date && 
      dateStr <= a.end_date
    );
  };

  const isHoliday = (date: Date, office: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.some(h => 
      h.date === dateStr && 
      (h.comunidad_autonoma === office || h.comunidad_autonoma === '')
    );
  };

  const getHolidayName = (date: Date, office: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => 
      h.date === dateStr && 
      (h.comunidad_autonoma === office || h.comunidad_autonoma === '')
    );
    return holiday?.festivo || '';
  };

  const renderCalendar = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get Monday as start of week (getDay returns 0 for Sunday, 1 for Monday, etc.)
    const startPadding = Array.from({ length: (getDay(monthStart) + 6) % 7 }, (_, i) => null);
    
    const selectedPersonData = persons.find(p => p.id === selectedPerson);
    const personOffice = (selectedOffice && selectedOffice !== 'default') ? selectedOffice : selectedPersonData?.oficina || '';

    return (
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-center mb-4">
          {format(month, 'MMMM yyyy', { locale: es })}
        </h3>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
              {day}
            </div>
          ))}
          
          {/* Empty cells for padding */}
          {startPadding.map((_, i) => (
            <div key={`pad-${i}`} className="p-1"></div>
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, month);
            const isWeekendDay = isWeekend(day);
            const isHolidayDay = isHoliday(day, personOffice);
            const dayAssignments = selectedPerson ? getPersonAssignments(selectedPerson, day) : [];
            const totalPercentage = dayAssignments.reduce((sum, a) => sum + a.hours_allocated, 0);
            
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={cn(
                  "min-h-8 p-1 text-xs border rounded text-center relative",
                  !isCurrentMonth && "text-muted-foreground bg-muted/50",
                  isWeekendDay && isCurrentMonth && "bg-yellow-100",
                  isHolidayDay && isCurrentMonth && "bg-red-100",
                  dayAssignments.length > 0 && "font-semibold"
                )}
              >
                <div className="relative">
                  {format(day, 'd')}
                  {dayAssignments.length > 0 && (
                    <div className="text-xs mt-1">
                      {dayAssignments.map((assignment, index) => (
                        <div
                          key={assignment.id}
                          className={cn(
                            "text-white rounded px-1 mb-1",
                            assignment.project_color
                          )}
                        >
                          {assignment.hours_allocated}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedPersonData = persons.find(p => p.id === selectedPerson);
  const personOffice = (selectedOffice && selectedOffice !== 'default') ? selectedOffice : selectedPersonData?.oficina || '';
  
  // Get holidays for legend
  const currentMonthHolidays = holidays.filter(h => {
    const holidayDate = new Date(h.date);
    return months.some(month => isSameMonth(holidayDate, month)) &&
           (h.comunidad_autonoma === personOffice || h.comunidad_autonoma === '') &&
           !isWeekend(holidayDate);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/squad-dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Panel Principal
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Asignaciones Avanzadas - Squad Lead</h1>
            <p className="text-muted-foreground">
              Miembros del equipo: {persons.length} personas | Proyectos activos: {projects.length} proyectos | 
              Festivos configurados: {holidays.length} días
            </p>
          </div>
        </div>

        {/* Assignment Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Nueva Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="person">Seleccionar Miembro del Equipo</Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {persons.map(person => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.nombre} - {person.oficina}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="office">Oficina/Comunidad</Label>
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Usar oficina por defecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Por defecto</SelectItem>
                    {offices.map(office => (
                      <SelectItem key={office} value={office}>
                        {office}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">Fecha Desde</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date">Fecha Hasta</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="percentage">Porcentaje (10-100%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="project">Proyecto</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.codigo_inicial} - {project.denominacion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Button onClick={handleAssign} className="gap-2">
                <Plus className="h-4 w-4" />
                Asignar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Section */}
        {selectedPerson && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Calendario de {selectedPersonData?.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {months.map(month => renderCalendar(month))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Leyenda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
                    <span className="text-sm">Fin de semana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border rounded"></div>
                    <span className="text-sm">Festivo</span>
                  </div>
                  {assignments
                    .filter(a => a.person_id === selectedPerson)
                    .map((assignment, index) => {
                      const project = projects.find(p => p.id === assignment.project_id);
                      return (
                        <div key={assignment.id} className="flex items-center gap-2">
                          <div className={cn("w-4 h-4 rounded", assignment.project_color)}></div>
                          <span className="text-sm">{project?.codigo_inicial}</span>
                        </div>
                      );
                    })}
                </div>

                {currentMonthHolidays.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Festivos en {personOffice}:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {currentMonthHolidays.map(holiday => (
                        <div key={holiday.date} className="text-sm">
                          {format(new Date(holiday.date), 'dd/MM/yyyy')} - {holiday.festivo}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Summary */}
            <AssignmentSummary
              personId={selectedPerson}
              personName={selectedPersonData?.nombre || ''}
              personOffice={personOffice}
              assignments={assignments}
              holidays={holidays}
              projects={projects}
            />
          </>
        )}
      </div>
    </div>
  );
}