import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarIcon, ArrowLeft, Plus, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSquadData } from '@/hooks/useSquadData';
import AssignmentSummary from '@/components/AssignmentSummary';
import TeamAssignmentSummary from '@/components/TeamAssignmentSummary';
import StaffingReport from '@/components/StaffingReport';

interface Assignment {
  id: string;
  person_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  hours_allocated: number;
  type?: string;
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
  squad_lead?: string;
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

export default function SquadAssignments({ userRole, userData }: { userRole?: string; userData?: any }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { persons: allPersons, squadLeads } = useSquadData();
  
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('100');
  const [assignmentType, setAssignmentType] = useState<string>('development');
  const [showProjectSearch, setShowProjectSearch] = useState<boolean>(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [showConflictDialog, setShowConflictDialog] = useState<boolean>(false);
  const [conflictData, setConflictData] = useState<{
    conflictingAssignments: Assignment[];
    conflictDays: string[];
    newAssignmentData: any;
  } | null>(null);
  
  const [persons, setPersons] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [communities, setCommunities] = useState<string[]>([]);
  
  const currentDate = new Date();
  const months = Array.from({ length: 3 }, (_, i) => addMonths(currentDate, i));

  // Get current squad lead name
  const currentSquadLeadName = userData?.name;
  
  // Filter persons for current squad lead and include the squad lead themselves
  const squadPersons = allPersons.filter(person => 
    person.squad_lead === currentSquadLeadName || person.nombre === currentSquadLeadName
  );

  useEffect(() => {
    fetchData();
  }, [allPersons, userData]);

  useEffect(() => {
    if (allPersons.length > 0 && currentSquadLeadName) {
      const mappedPersons = squadPersons.map(p => ({
        id: p.id || '',
        nombre: p.nombre || '',
        oficina: p.oficina || '',
        squad_lead: p.squad_lead
      }));
      setPersons(mappedPersons);
      const uniqueOffices = [...new Set(mappedPersons.map(p => p.oficina))];
      setOffices(uniqueOffices);
    }
  }, [allPersons, squadPersons, currentSquadLeadName]);

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
      
      // The persons filtering is now handled in useEffect
      
      if (projectsData) {
        console.log('Proyectos cargados:', projectsData.length);
        setProjects(projectsData);
      }
      if (assignmentsData) {
        // Create a mapping of project IDs to colors for consistency
        const projectColorMap = new Map<string, string>();
        let colorIndex = 0;
        
        const assignmentsWithColors = assignmentsData.map((assignment) => {
          if (!projectColorMap.has(assignment.project_id)) {
            projectColorMap.set(assignment.project_id, PROJECT_COLORS[colorIndex % PROJECT_COLORS.length]);
            colorIndex++;
          }
          
          return {
            ...assignment,
            project_color: projectColorMap.get(assignment.project_id)
          };
        });
        
        setAssignments(assignmentsWithColors);
      }
      
      if (holidaysData) {
        setHolidays(holidaysData);
        
        // Extract countries and communities from holidays data
        const allLocations = [...new Set(holidaysData.map(h => h.comunidad_autonoma))];
        
        // Define Spanish communities
        const spanishCommunities = [
          'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria',
          'Castilla La Mancha', 'Castilla y Leon', 'Cataluña', 'Extremadura',
          'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco', 'Valencia',
          'A Coruña'
        ];
        
        // Separate countries (non-Spanish locations) and communities
        const countryList = allLocations
          .filter(loc => loc && loc !== 'NACIONAL' && !spanishCommunities.includes(loc))
          .sort();
        
        const communityList = allLocations
          .filter(loc => loc && spanishCommunities.includes(loc))
          .sort();
        
        setCountries(countryList);
        setCommunities(communityList);
      }
      
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
    if (!selectedPerson || !selectedProject || !startDate || !endDate || !percentage || !assignmentType) {
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

    // Check for existing assignments (conflicts)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const days = eachDayOfInterval({ start: startDateObj, end: endDateObj });
    
    const conflictingAssignments: Assignment[] = [];
    const conflictDays: string[] = [];
    
    for (const day of days) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const existingAssignments = assignments.filter(a => 
        a.person_id === selectedPerson &&
        dayStr >= a.start_date && 
        dayStr <= a.end_date
      );
      
      if (existingAssignments.length > 0) {
        conflictDays.push(dayStr);
        existingAssignments.forEach(assignment => {
          if (!conflictingAssignments.find(ca => ca.id === assignment.id)) {
            conflictingAssignments.push(assignment);
          }
        });
      }
    }

    const newAssignmentData = {
      person_id: selectedPerson,
      project_id: selectedProject,
      start_date: startDate,
      end_date: endDate,
      hours_allocated: percentageNum,
      type: assignmentType
    };

    // If there are conflicts, show dialog
    if (conflictingAssignments.length > 0) {
      setConflictData({
        conflictingAssignments,
        conflictDays,
        newAssignmentData
      });
      setShowConflictDialog(true);
      return;
    }

    // No conflicts, proceed normally
    await createAssignment(newAssignmentData);
  };

  const createAssignment = async (assignmentData: any) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .insert(assignmentData);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Asignación creada correctamente"
      });

      resetForm();
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

  const resetForm = () => {
    setSelectedProject('');
    setSelectedProjectName('');
    setStartDate('');
    setEndDate('');
    setPercentage('100');
    setAssignmentType('development');
  };

  const handleReplaceAssignments = async () => {
    if (!conflictData) return;

    try {
      const newStartDate = new Date(conflictData.newAssignmentData.start_date);
      const newEndDate = new Date(conflictData.newAssignmentData.end_date);

      // Process each conflicting assignment
      for (const assignment of conflictData.conflictingAssignments) {
        const existingStartDate = new Date(assignment.start_date);
        const existingEndDate = new Date(assignment.end_date);

        // Delete the original assignment
        const { error: deleteError } = await supabase
          .from('assignments')
          .delete()
          .eq('id', assignment.id);
        
        if (deleteError) throw deleteError;

        // Create new assignments for non-overlapping periods
        
        // Period before the new assignment (if exists)
        if (existingStartDate < newStartDate) {
          const beforeEndDate = new Date(newStartDate);
          beforeEndDate.setDate(beforeEndDate.getDate() - 1);
          
          const { error: beforeError } = await supabase
            .from('assignments')
            .insert({
              person_id: assignment.person_id,
              project_id: assignment.project_id,
              start_date: format(existingStartDate, 'yyyy-MM-dd'),
              end_date: format(beforeEndDate, 'yyyy-MM-dd'),
              hours_allocated: assignment.hours_allocated,
               type: assignment.type || 'development'
            });
          
          if (beforeError) throw beforeError;
        }

        // Period after the new assignment (if exists)
        if (existingEndDate > newEndDate) {
          const afterStartDate = new Date(newEndDate);
          afterStartDate.setDate(afterStartDate.getDate() + 1);
          
          const { error: afterError } = await supabase
            .from('assignments')
            .insert({
              person_id: assignment.person_id,
              project_id: assignment.project_id,
              start_date: format(afterStartDate, 'yyyy-MM-dd'),
              end_date: format(existingEndDate, 'yyyy-MM-dd'),
              hours_allocated: assignment.hours_allocated,
               type: assignment.type || 'development'
            });
          
          if (afterError) throw afterError;
        }
      }

      // Create the new assignment
      await createAssignment(conflictData.newAssignmentData);
      
      setShowConflictDialog(false);
      setConflictData(null);
      
      toast({
        title: "Éxito",
        description: "Asignaciones sustituidas correctamente para el período seleccionado"
      });
      
    } catch (error) {
      console.error('Error replacing assignments:', error);
      toast({
        title: "Error",
        description: "Error al sustituir las asignaciones",
        variant: "destructive"
      });
    }
  };

  const handleAddAssignment = async () => {
    if (!conflictData) return;

    // Check if total percentage would exceed 100%
    const startDateObj = new Date(conflictData.newAssignmentData.start_date);
    const endDateObj = new Date(conflictData.newAssignmentData.end_date);
    const days = eachDayOfInterval({ start: startDateObj, end: endDateObj });
    
    for (const day of days) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const existingAssignments = assignments.filter(a => 
        a.person_id === selectedPerson &&
        dayStr >= a.start_date && 
        dayStr <= a.end_date
      );
      
      const totalPercentage = existingAssignments.reduce((sum, a) => sum + a.hours_allocated, 0) + conflictData.newAssignmentData.hours_allocated;
      
      if (totalPercentage > 100) {
        toast({
          title: "Error",
          description: `El ${format(day, 'dd/MM/yyyy')} excedería el 100% de capacidad`,
          variant: "destructive"
        });
        return;
      }
    }

    // Proceed with adding assignment
    await createAssignment(conflictData.newAssignmentData);
    setShowConflictDialog(false);
    setConflictData(null);
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
            <div key={`pad-start-${i}`} className="p-1"></div>
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
                  {/* Solo mostrar asignaciones en días laborables */}
                  {dayAssignments.length > 0 && (
                    <div className="text-xs mt-1">
                      {/* Solo renderizar si NO es fin de semana Y NO es festivo */}
                      {!isWeekendDay && !isHolidayDay && dayAssignments.map((assignment, index) => (
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header con botones de navegación */}
        <div className="flex items-center justify-end gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/squad-dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Panel de Squad Lead
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
        
        {/* Título principal */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Asignaciones - REVILLA MAILLO, JUAN MANUEL
              </h1>
              <p className="text-muted-foreground">
                Gestiona asignaciones de proyectos y calendarios
              </p>
            </div>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Miembros del Equipo
              </CardTitle>
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-300">
                {persons.length}
              </div>
              <p className="text-xs italic text-blue-600 dark:text-blue-400 mt-1">
                Año {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Total Asignaciones
              </CardTitle>
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800 dark:text-green-300">
                {assignments.filter(a => {
                  const startYear = new Date(a.start_date).getFullYear();
                  const endYear = new Date(a.end_date).getFullYear();
                  const currentYear = new Date().getFullYear();
                  return startYear === currentYear || endYear === currentYear;
                }).length}
              </div>
              <p className="text-xs italic text-green-600 dark:text-green-400 mt-1">
                Año {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Festivos Asignados
              </CardTitle>
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800 dark:text-purple-300">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const holidayProject = projects.find(p => p.codigo_inicial === '100748.1.1 STR04');
                  if (!holidayProject) return 0;
                  
                  return assignments.filter(a => {
                    const startYear = new Date(a.start_date).getFullYear();
                    const endYear = new Date(a.end_date).getFullYear();
                    return a.project_id === holidayProject.id && (startYear === currentYear || endYear === currentYear);
                  }).reduce((total, assignment) => {
                    const startDate = new Date(assignment.start_date);
                    const endDate = new Date(assignment.end_date);
                    
                    // Calcular días en el año actual
                    const yearStart = new Date(currentYear, 0, 1);
                    const yearEnd = new Date(currentYear, 11, 31);
                    
                    const actualStart = startDate > yearStart ? startDate : yearStart;
                    const actualEnd = endDate < yearEnd ? endDate : yearEnd;
                    
                    if (actualStart <= actualEnd) {
                      const days = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return total + days;
                    }
                    return total;
                  }, 0);
                })()}
              </div>
              <p className="text-xs italic text-purple-600 dark:text-purple-400 mt-1">
                Año {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Oficinas
              </CardTitle>
              <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800 dark:text-orange-300">
                {offices.length}
              </div>
              <p className="text-xs italic text-orange-600 dark:text-orange-400 mt-1">
                Año {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Assignment Summary */}
        <TeamAssignmentSummary
          squadLeadName={currentSquadLeadName || ''}
          teamMembers={persons}
          assignments={assignments}
          holidays={holidays}
          projects={projects}
        />

        {/* Assignment Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Nueva Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Primera línea: Miembro, Calendario, Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-1">
                <Label htmlFor="person">Seleccionar Miembro del Equipo</Label>
                <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                  <SelectTrigger className="w-full">
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
                <Label htmlFor="office">Calendario de Festivos</Label>
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar calendario..." />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="default">Usar calendario por defecto</SelectItem>
                    {countries.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          PAÍSES
                        </div>
                        {countries.map(country => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {communities.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                          COMUNIDADES AUTÓNOMAS
                        </div>
                        {communities.map(community => (
                          <SelectItem key={community} value={community}>
                            {community}
                          </SelectItem>
                        ))}
                      </>
                    )}
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
            </div>

            {/* Segunda línea: Proyecto, Porcentaje, Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="project">Proyecto</Label>
                <Dialog open={showProjectSearch} onOpenChange={setShowProjectSearch}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <div className="truncate">
                        {selectedProjectName || "Seleccionar proyecto..."}
                      </div>
                      <Search className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Buscar Proyecto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Buscar por código o denominación..."
                        value={projectSearchTerm}
                        onChange={(e) => setProjectSearchTerm(e.target.value)}
                      />
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {projects
                          .filter(project => 
                            projectSearchTerm === '' ||
                            project.codigo_inicial.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
                            project.denominacion.toLowerCase().includes(projectSearchTerm.toLowerCase())
                          )
                          .slice(0, 50)
                          .map(project => (
                            <div
                              key={project.id}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                              onClick={() => {
                                setSelectedProject(project.id);
                                setSelectedProjectName(`${project.codigo_inicial} - ${project.denominacion}`);
                                setShowProjectSearch(false);
                                setProjectSearchTerm('');
                              }}
                            >
                              <div className="font-medium">{project.codigo_inicial}</div>
                              <div className="text-sm text-muted-foreground">{project.denominacion}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div>
                <Label htmlFor="percentage">Porcentaje (1-100%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="assignment-type">Tipo de Asignación</Label>
                <Select value={assignmentType} onValueChange={setAssignmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Desarrollo</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="analysis">Análisis</SelectItem>
                    <SelectItem value="management">Gestión</SelectItem>
                    <SelectItem value="support">Soporte</SelectItem>
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
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Calendario de {selectedPersonData?.nombre}
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedPerson('')}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cerrar
                  </Button>
                </div>
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
                {/* Primera línea: Fin de Semana y Festivos */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border rounded"></div>
                    <span className="text-sm">Fin de Semana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border rounded"></div>
                    <span className="text-sm">Festivo</span>
                  </div>
                </div>

                {/* Segunda sección: Proyectos de Stratesys - cada uno en su línea */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Proyectos Stratesys:</div>
                  <div className="space-y-2">
                    {assignments
                      .filter(a => a.person_id === selectedPerson)
                      .reduce((unique, assignment) => {
                        // Eliminar duplicados por project_id
                        if (!unique.find(u => u.project_id === assignment.project_id)) {
                          unique.push(assignment);
                        }
                        return unique;
                      }, [] as typeof assignments)
                      .map((assignment) => {
                        const project = projects.find(p => p.id === assignment.project_id);
                        return (
                          <div key={`legend-${assignment.project_id}`} className="flex items-center gap-2">
                            <div className={cn("w-4 h-4 rounded", assignment.project_color)}></div>
                            <span className="text-sm">{project?.denominacion || project?.codigo_inicial}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {currentMonthHolidays.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Festivos en {personOffice}:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {currentMonthHolidays.map((holiday, idx) => (
                        <div key={`${holiday.date}-${idx}`} className="text-sm">
                          {format(new Date(holiday.date), 'dd/MM/yyyy')} - {holiday.festivo}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Task List */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Lista de Tareas por Día</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const allDays = months.flatMap(month => {
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);
                    return eachDayOfInterval({ start: monthStart, end: monthEnd });
                  });

                  const daysWithTasks = allDays.filter(day => {
                    const dayAssignments = getPersonAssignments(selectedPerson, day);
                    const isHolidayDay = isHoliday(day, personOffice);
                    const isWeekendDay = isWeekend(day);
                    return dayAssignments.length > 0 || isHolidayDay || isWeekendDay;
                  });

                  if (daysWithTasks.length === 0) {
                    return (
                      <p className="text-muted-foreground text-center py-4">
                        No hay asignaciones para mostrar en el período seleccionado.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {daysWithTasks.map(day => {
                        const dayAssignments = getPersonAssignments(selectedPerson, day);
                        const isHolidayDay = isHoliday(day, personOffice);
                        const isWeekendDay = isWeekend(day);
                        const holidayName = getHolidayName(day, personOffice);

                        return (
                          <div key={`task-day-${format(day, 'yyyy-MM-dd')}`} className="border rounded-lg p-3 bg-muted/30">
                            <div className="font-medium text-sm mb-2">
                              {format(day, 'EEEE, dd/MM/yyyy', { locale: es })}
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              {isWeekendDay && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                                  <span className="text-yellow-700">Fin de semana</span>
                                </div>
                              )}
                              
                              {isHolidayDay && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-200 rounded"></div>
                                  <span className="text-red-700">
                                    Festivo: {holidayName} ({personOffice || 'Nacional'})
                                  </span>
                                </div>
                              )}
                              
                              {dayAssignments.map(assignment => {
                                const project = projects.find(p => p.id === assignment.project_id);
                                return (
                                  <div key={`day-assignment-${assignment.id}`} className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded", assignment.project_color)}></div>
                                    <span className="text-foreground">
                                      {project?.codigo_inicial} - {assignment.hours_allocated}% de dedicación
                                    </span>
                                  </div>
                                );
                              })}
                              
                              {!isWeekendDay && !isHolidayDay && dayAssignments.length === 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-200 rounded"></div>
                                  <span className="text-green-700">Día laborable disponible</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
      
      {/* Conflict Resolution Dialog */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conflicto de Asignaciones Detectado</AlertDialogTitle>
            <AlertDialogDescription>
              Ya existen asignaciones para algunos días en el período seleccionado. 
              ¿Cómo desea proceder?
              
              {conflictData && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">
                    Asignaciones afectadas en el período ({conflictData.newAssignmentData.start_date} a {conflictData.newAssignmentData.end_date}):
                  </div>
                  <div className="space-y-2 text-xs">
                    {conflictData.conflictingAssignments.map(assignment => {
                      const project = projects.find(p => p.id === assignment.project_id);
                      
                      // Calculate the overlapping period for this specific assignment
                      const newStart = new Date(conflictData.newAssignmentData.start_date);
                      const newEnd = new Date(conflictData.newAssignmentData.end_date);
                      const existingStart = new Date(assignment.start_date);
                      const existingEnd = new Date(assignment.end_date);
                      
                      const overlapStart = newStart > existingStart ? newStart : existingStart;
                      const overlapEnd = newEnd < existingEnd ? newEnd : existingEnd;
                      
                      return (
                        <div key={assignment.id} className="p-2 bg-background border rounded">
                          <div className="font-medium">
                            • {project?.codigo_inicial || 'Proyecto'} - {assignment.hours_allocated}%
                          </div>
                          <div className="text-muted-foreground mt-1">
                            Período afectado: {format(overlapStart, 'dd/MM/yyyy')} a {format(overlapEnd, 'dd/MM/yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            Asignación completa: {format(existingStart, 'dd/MM/yyyy')} a {format(existingEnd, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReplaceAssignments}
              className="bg-red-600 hover:bg-red-700"
            >
              Sustituir Asignaciones
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={handleAddAssignment}
              className="bg-green-600 hover:bg-green-700"
            >
              Añadir a las Existentes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Informe de Staffing */}
      <StaffingReport 
        squadLeadName={currentSquadLeadName || ''}
        squadPersons={squadPersons}
      />
    </div>
  );
}