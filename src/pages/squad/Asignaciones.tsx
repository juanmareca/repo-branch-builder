import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, ArrowLeft, Users, FolderOpen, CalendarDays, Plus, Info, Grid3X3, Calendar as CalendarIcon, Zap, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, addDays, startOfWeek, endOfWeek } from 'date-fns';
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
  color?: string;
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

interface Holiday {
  date: string;
  festivo: string;
  comunidad_autonoma: string;
  pais: string;
}

// Colores para proyectos
const PROJECT_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#EF4444', // Rojo
  '#8B5CF6', // Morado
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#84CC16', // Lima
  '#EC4899', // Rosa
  '#6B7280', // Gris
];

const Asignaciones = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Squad Lead name - en producción vendría del contexto de autenticación
  const squadLeadName = "REVILLA MAILLO, JUAN MANUEL";
  
  // Estado del formulario
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('100');
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  // Estado del resumen
  const [summaryStartDate, setSummaryStartDate] = useState<string>('');
  const [summaryEndDate, setSummaryEndDate] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  
  // Estado para vista spreadsheet
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [editingCell, setEditingCell] = useState<{personId: string, date: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Estado para templates
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // Datos
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
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

      // Obtener festivos con toda la información
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('holidays')
        .select('date, festivo, comunidad_autonoma, pais');

      if (holidaysError) throw holidaysError;

      // Obtener asignaciones existentes
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*');

      if (!assignmentsError && assignmentsData) {
        setAssignments(assignmentsData);
      }

      // Obtener oficinas únicas
      const uniqueOffices = [...new Set(persons?.map(p => p.oficina).filter(Boolean))] as string[];
      setOffices(uniqueOffices);

      setTeamMembers(persons || []);
      
      // Asignar colores a proyectos
      const projectsWithColors = projectsData?.map((project, index) => ({
        ...project,
        color: PROJECT_COLORS[index % PROJECT_COLORS.length]
      })) || [];
      setProjects(projectsWithColors);
      
      // Guardar festivos como objetos Holiday
      setHolidays(holidaysData || []);

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

  const validatePercentageOverlap = async (personId: string, startDate: string, endDate: string, percentage: number) => {
    // Obtener asignaciones existentes que se superponen con las fechas dadas
    const overlappingAssignments = assignments.filter(assignment => {
      if (assignment.person_id !== personId) return false;
      
      const assignmentStart = new Date(assignment.start_date);
      const assignmentEnd = new Date(assignment.end_date);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      
      // Verificar si hay superposición de fechas
      return (newStart <= assignmentEnd && newEnd >= assignmentStart);
    });
    
    // Calcular el porcentaje total para cada día
    const daysToCheck = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
    
    for (const day of daysToCheck) {
      let totalPercentage = 0;
      
      for (const assignment of overlappingAssignments) {
        const assignmentStart = new Date(assignment.start_date);
        const assignmentEnd = new Date(assignment.end_date);
        
        if (isWithinInterval(day, { start: assignmentStart, end: assignmentEnd })) {
          totalPercentage += assignment.hours_allocated;
        }
      }
      
      // Añadir el nuevo porcentaje
      totalPercentage += percentage;
      
      if (totalPercentage > 100) {
        return {
          isValid: false,
          message: `El ${format(day, 'dd/MM/yyyy')} supera el 100% (${totalPercentage}%)`
        };
      }
    }
    
    return { isValid: true, message: '' };
  };

  const handleAssign = async () => {
    if (!selectedMember || !selectedProject || !startDate || !endDate || !selectedOffice) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios incluyendo la oficina",
        variant: "destructive",
      });
      return;
    }

    // Validar que el porcentaje no supere el 100%
    const percentageNumber = parseInt(percentage);
    const validation = await validatePercentageOverlap(selectedMember, startDate, endDate, percentageNumber);
    
    if (!validation.isValid) {
      toast({
        title: "Error de asignación",
        description: validation.message,
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
          hours_allocated: percentageNumber,
          type: 'project_assignment',
          status: 'assigned',
          notes: `Asignado por ${squadLeadName} - Oficina: ${selectedOffice}`
        });

      if (error) throw error;

      toast({
        title: "✅ Asignación exitosa",
        description: "El proyecto ha sido asignado correctamente",
      });

      // Limpiar formulario
      setSelectedMember('');
      setSelectedOffice('');
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
    if (!selectedOffice) return false;
    
    return holidays.some(holiday => {
      const holidayDate = new Date(holiday.date);
      return (
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear() &&
        (holiday.comunidad_autonoma === selectedOffice || holiday.pais === 'España')
      );
    });
  };

  const getFilteredHolidays = () => {
    if (!selectedOffice) return [];
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      // Solo festivos que no sean fin de semana
      const isWeekendDay = holidayDate.getDay() === 0 || holidayDate.getDay() === 6;
      
      return !isWeekendDay && 
             (holiday.comunidad_autonoma === selectedOffice || holiday.pais === 'España') &&
             // Filtrar solo festivos dentro de los próximos 6 meses
             holidayDate >= startOfMonth(currentDate) && 
             holidayDate <= endOfMonth(addMonths(currentDate, 5));
    });
  };

  const getAssignmentColor = (date: Date) => {
    if (!selectedMember) return null;
    
    const assignment = assignments.find(assignment => {
      if (assignment.person_id !== selectedMember) return false;
      
      const assignmentStart = new Date(assignment.start_date);
      const assignmentEnd = new Date(assignment.end_date);
      
      return isWithinInterval(date, { start: assignmentStart, end: assignmentEnd });
    });
    
    if (!assignment) return null;
    
    const project = projects.find(p => p.id === assignment.project_id);
    return project?.color || '#6B7280';
  };

  const getSelectedMemberName = () => {
    const member = teamMembers.find(m => m.id === selectedMember);
    return member ? member.nombre : 'Seleccionar miembro';
  };

  const generateSummary = () => {
    if (!selectedMember || !summaryStartDate || !summaryEndDate) return null;

    const startSummary = new Date(summaryStartDate);
    const endSummary = new Date(summaryEndDate);
    const selectedMemberOffice = teamMembers.find(m => m.id === selectedMember)?.oficina;

    // Obtener todos los días del período
    const allDays = eachDayOfInterval({ start: startSummary, end: endSummary });
    const totalDays = allDays.length;

    // Contar días de fin de semana
    const weekendDays = allDays.filter(day => isWeekend(day)).length;
    const weekendPercentage = ((weekendDays / totalDays) * 100).toFixed(1);

    // Contar días festivos (que no sean fin de semana)
    const holidayDays = allDays.filter(day => {
      if (isWeekend(day)) return false;
      return holidays.some(holiday => {
        const holidayDate = new Date(holiday.date);
        return (
          holidayDate.getDate() === day.getDate() &&
          holidayDate.getMonth() === day.getMonth() &&
          holidayDate.getFullYear() === day.getFullYear() &&
          (holiday.comunidad_autonoma === selectedMemberOffice || holiday.pais === 'España')
        );
      });
    }).length;

    // Obtener asignaciones del miembro en el período
    const memberAssignments = assignments.filter(assignment => {
      if (assignment.person_id !== selectedMember) return false;
      
      const assignmentStart = new Date(assignment.start_date);
      const assignmentEnd = new Date(assignment.end_date);
      
      // Verificar si hay superposición con el período de resumen
      return (startSummary <= assignmentEnd && endSummary >= assignmentStart);
    });

    // Calcular días por proyecto
    const projectSummary: { [key: string]: { days: number; percentage: number; name: string } } = {};
    let totalAssignedPercentage = 0;

    allDays.forEach(day => {
      let dayTotalPercentage = 0;
      
      memberAssignments.forEach(assignment => {
        const assignmentStart = new Date(assignment.start_date);
        const assignmentEnd = new Date(assignment.end_date);
        
        if (isWithinInterval(day, { start: assignmentStart, end: assignmentEnd })) {
          const project = projects.find(p => p.id === assignment.project_id);
          const projectKey = project?.codigo_inicial || assignment.project_id;
          const projectName = project?.denominacion || 'Proyecto desconocido';
          
          if (!projectSummary[projectKey]) {
            projectSummary[projectKey] = { days: 0, percentage: 0, name: projectName };
          }
          
          // Calcular días efectivos considerando el porcentaje
          const effectiveDays = assignment.hours_allocated / 100;
          projectSummary[projectKey].days += effectiveDays;
          projectSummary[projectKey].percentage = assignment.hours_allocated;
          
          dayTotalPercentage += assignment.hours_allocated;
        }
      });
      
      totalAssignedPercentage += dayTotalPercentage;
    });

    // Calcular capacidad disponible
    const workableDays = totalDays - weekendDays - holidayDays;
    const maxCapacity = workableDays * 100; // 100% por cada día laborable
    const assignedCapacity = totalAssignedPercentage;
    const availableCapacity = ((maxCapacity - assignedCapacity) / maxCapacity * 100).toFixed(1);

    // Días sin asignar (días laborables menos días asignados)
    const totalAssignedDays = Object.values(projectSummary).reduce((sum, project) => sum + project.days, 0);
    const unassignedDays = Math.max(0, workableDays - totalAssignedDays);

    return {
      totalDays,
      weekendDays,
      weekendPercentage,
      holidayDays,
      workableDays,
      projectSummary,
      unassignedDays,
      availableCapacity,
      memberName: getSelectedMemberName()
    };
  };

  const handleGenerateSummary = () => {
    if (!selectedMember || !summaryStartDate || !summaryEndDate) {
      toast({
        title: "Error",
        description: "Por favor selecciona un miembro y las fechas para el resumen",
        variant: "destructive",
      });
      return;
    }

    if (new Date(summaryStartDate) > new Date(summaryEndDate)) {
      toast({
        title: "Error",
        description: "La fecha de inicio debe ser anterior a la fecha de fin",
        variant: "destructive",
      });
      return;
    }

    setShowSummary(true);
  };

  // Funciones para vista spreadsheet
  const getWeekDays = () => {
    const startOfCurrentWeek = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  };

  const getCellAssignments = (personId: string, date: Date) => {
    return assignments.filter(assignment => {
      if (assignment.person_id !== personId) return false;
      
      const assignmentStart = new Date(assignment.start_date);
      const assignmentEnd = new Date(assignment.end_date);
      
      return isWithinInterval(date, { start: assignmentStart, end: assignmentEnd });
    });
  };

  const getCellPercentage = (personId: string, date: Date) => {
    const cellAssignments = getCellAssignments(personId, date);
    return cellAssignments.reduce((total, assignment) => total + assignment.hours_allocated, 0);
  };

  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (e: React.DragEvent, personId: string, date: Date) => {
    e.preventDefault();
    
    if (!draggedProject) return;
    
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check if there's already 100% allocation
    const currentPercentage = getCellPercentage(personId, date);
    if (currentPercentage >= 100) {
      toast({
        title: "Error",
        description: "Este día ya tiene 100% de asignación",
        variant: "destructive",
      });
      setDraggedProject(null);
      return;
    }
    
    const availablePercentage = 100 - currentPercentage;
    const assignPercentage = Math.min(availablePercentage, 100);
    
    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          person_id: personId,
          project_id: draggedProject.id,
          start_date: dateString,
          end_date: dateString,
          hours_allocated: assignPercentage,
          type: 'project_assignment',
          status: 'assigned',
          notes: `Asignado por drag & drop - ${squadLeadName}`
        });

      if (error) throw error;

      toast({
        title: "✅ Asignación exitosa",
        description: `${draggedProject.codigo_inicial} asignado al ${assignPercentage}%`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar la asignación",
        variant: "destructive",
      });
    }
    
    setDraggedProject(null);
  };

  const handleCellDoubleClick = (personId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    setEditingCell({ personId, date: dateString });
    setEditValue(getCellPercentage(personId, date).toString());
  };

  const handleCellEdit = async () => {
    if (!editingCell || !editValue) return;
    
    const percentage = parseInt(editValue);
    if (percentage < 0 || percentage > 100) {
      toast({
        title: "Error",
        description: "El porcentaje debe estar entre 0 y 100",
        variant: "destructive",
      });
      return;
    }
    
    // For simplicity, we'll just show a message - in real implementation you'd update specific assignments
    toast({
      title: "Función en desarrollo",
      description: "Edición directa de celdas estará disponible próximamente",
    });
    
    setEditingCell(null);
    setEditValue('');
  };

  const applyTemplate = async (templateType: string) => {
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Selecciona un miembro primero",
        variant: "destructive",
      });
      return;
    }

    // Template examples
    const templates: { [key: string]: any } = {
      'full-time': { percentage: 100, pattern: 'weekdays' },
      'part-time': { percentage: 50, pattern: 'weekdays' },
      'consultant': { percentage: 30, pattern: 'specific-days' }
    };

    const template = templates[templateType];
    if (!template) return;

    toast({
      title: "Template aplicado",
      description: `Plantilla ${templateType} aplicada correctamente`,
    });
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

        {/* Selector de Miembro Principal */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Seleccionar Miembro del Squad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="member">Miembro del Equipo</Label>
                <Select value={selectedMember} onValueChange={(value) => {
                  setSelectedMember(value);
                  const member = teamMembers.find(m => m.id === value);
                  if (member && member.oficina) {
                    setSelectedOffice(member.oficina);
                  }
                }}>
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
              <div>
                <Label htmlFor="office">Oficina/Comunidad</Label>
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Seleccionar oficina..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {offices.map((office) => (
                      <SelectItem key={office} value={office}>
                        {office}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interfaz Principal con Tabs */}
        {selectedMember && (
          <TooltipProvider>
            <Tabs defaultValue="spreadsheet" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="spreadsheet" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Vista Spreadsheet
                </TabsTrigger>
                <TabsTrigger value="form" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Asignación Rápida
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Vista Calendario
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Resumen
                </TabsTrigger>
              </TabsList>

              {/* Vista Spreadsheet */}
              <TabsContent value="spreadsheet" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5 text-indigo-600" />
                      Vista Spreadsheet - {getSelectedMemberName()}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                        size="sm"
                      >
                        ← Semana Anterior
                      </Button>
                      <span className="text-sm font-medium">
                        Semana del {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM/yyyy')}
                      </span>
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                        size="sm"
                      >
                        Siguiente Semana →
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Proyectos disponibles para drag & drop */}
                    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-900 mb-3">
                        🎯 Proyectos Disponibles (Arrastra a una fecha)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {projects.slice(0, 8).map((project) => (
                          <div
                            key={project.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, project)}
                            className="px-3 py-2 bg-white border-2 border-dashed border-purple-300 rounded-lg cursor-move hover:border-purple-500 hover:bg-purple-50 transition-all animate-pulse"
                            style={{ borderColor: project.color + '50', backgroundColor: project.color + '10' }}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: project.color }}
                              ></div>
                              <span className="text-sm font-medium">{project.codigo_inicial}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tabla Spreadsheet */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3 text-left font-semibold">
                              Empleado
                            </th>
                            {getWeekDays().map((day) => (
                              <th key={day.toISOString()} className="border border-gray-300 p-2 text-center min-w-32">
                                <div className="text-sm font-semibold">
                                  {format(day, 'EEE', { locale: es })}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {format(day, 'dd/MM')}
                                </div>
                                {isWeekend(day) && (
                                  <div className="text-xs text-yellow-600 font-medium">FDS</div>
                                )}
                                {isHoliday(day) && (
                                  <div className="text-xs text-pink-600 font-medium">FEST</div>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3 bg-blue-50">
                              <div className="font-medium text-blue-900">
                                {getSelectedMemberName().split(',')[0]}
                              </div>
                              <div className="text-xs text-blue-700">
                                {teamMembers.find(m => m.id === selectedMember)?.categoria}
                              </div>
                            </td>
                            {getWeekDays().map((day) => {
                              const cellPercentage = getCellPercentage(selectedMember, day);
                              const cellAssignments = getCellAssignments(selectedMember, day);
                              const isWeekendDay = isWeekend(day);
                              const isHolidayDay = isHoliday(day);
                              
                              return (
                                <td
                                  key={day.toISOString()}
                                  className={`border border-gray-300 p-1 text-center cursor-pointer hover:bg-blue-50 ${
                                    isWeekendDay ? 'bg-yellow-50' : isHolidayDay ? 'bg-pink-50' : 'bg-white'
                                  }`}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, selectedMember, day)}
                                  onDoubleClick={() => handleCellDoubleClick(selectedMember, day)}
                                >
                                  {editingCell?.personId === selectedMember && editingCell?.date === format(day, 'yyyy-MM-dd') ? (
                                    <div className="flex flex-col gap-1">
                                      <Input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="h-6 text-xs"
                                        onBlur={handleCellEdit}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCellEdit()}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {cellAssignments.map((assignment, idx) => {
                                        const project = projects.find(p => p.id === assignment.project_id);
                                        return (
                                          <Tooltip key={idx}>
                                            <TooltipTrigger>
                                              <div
                                                className="text-xs px-1 py-0.5 rounded text-white font-medium"
                                                style={{ backgroundColor: project?.color || '#6B7280' }}
                                              >
                                                {project?.codigo_inicial} ({assignment.hours_allocated}%)
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{project?.denominacion || 'Proyecto desconocido'}</p>
                                              <p>{assignment.hours_allocated}% del día</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })}
                                      {cellPercentage === 0 && !isWeekendDay && !isHolidayDay && (
                                        <div className="text-xs text-gray-400 border border-dashed border-gray-300 rounded p-1">
                                          Arrastrar proyecto
                                        </div>
                                      )}
                                      {cellPercentage > 0 && (
                                        <div className={`text-xs font-bold ${cellPercentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                                          Total: {cellPercentage}%
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Instrucciones */}
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700 space-y-1">
                          <p><strong>🎯 Cómo usar la Vista Spreadsheet:</strong></p>
                          <ul className="list-disc list-inside space-y-1 ml-4">
                            <li><strong>Drag & Drop:</strong> Arrastra proyectos desde arriba a las celdas de fechas</li>
                            <li><strong>Doble clic:</strong> Haz doble clic en una celda para editar porcentajes (próximamente)</li>
                            <li><strong>Colores:</strong> Cada proyecto tiene un color único para fácil identificación</li>
                            <li><strong>Validación:</strong> El sistema evita asignaciones que superen 100% por día</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Asignación Rápida con Templates */}
              <TabsContent value="form" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      Asignación Rápida con Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Templates predefinidos */}
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="text-sm font-medium text-yellow-900 mb-3">
                        ⚡ Templates de Asignación Rápida
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => applyTemplate('full-time')}
                          className="border-yellow-300 hover:bg-yellow-50"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Tiempo Completo (100%)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => applyTemplate('part-time')}
                          className="border-yellow-300 hover:bg-yellow-50"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Medio Tiempo (50%)
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => applyTemplate('consultant')}
                          className="border-yellow-300 hover:bg-yellow-50"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Consultor (30%)
                        </Button>
                      </div>
                    </div>

                    {/* Formulario tradicional mejorado */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                      <div>
                        <Label htmlFor="startDate">Fecha Desde</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Fecha Hasta</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="percentage">Porcentaje</Label>
                        <Input
                          type="number"
                          min="10"
                          max="100"
                          value={percentage}
                          onChange={(e) => setPercentage(e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="project">Proyecto</Label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Seleccionar proyecto..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-50 max-h-60">
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  ></div>
                                  {project.codigo_inicial} - {project.denominacion}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Button 
                          onClick={handleAssign}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Asignar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vista Calendario Original */}
              <TabsContent value="calendar" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                      Vista Calendario - {getSelectedMemberName()}
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
                               weekStartsOn={1}
                               className="pointer-events-auto"
                               modifiers={{
                                 weekend: isWeekend,
                                 holiday: isHoliday,
                               }}
                               modifiersStyles={{
                                 weekend: { 
                                   backgroundColor: '#fef3c7',
                                   color: '#92400e'
                                 },
                                 holiday: { 
                                   backgroundColor: '#fce7f3',
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

                    {/* Leyenda del calendario */}
                    <div className="mt-8 space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">Leyenda del Calendario</h4>
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-200 border rounded"></div>
                          <span>Fin de semana</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-pink-200 border rounded"></div>
                          <span>Festivo</span>
                        </div>
                        {projects.slice(0, 5).map((project) => (
                          <div key={project.id} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 border rounded" 
                              style={{ backgroundColor: project.color }}
                            ></div>
                            <span className="text-xs">{project.codigo_inicial}</span>
                          </div>
                        ))}
                      </div>

                      {selectedOffice && getFilteredHolidays().length > 0 && (
                        <div className="mt-6">
                          <h5 className="font-medium text-gray-800 mb-3">
                            Festivos para {selectedOffice} (próximos 6 meses):
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {getFilteredHolidays().map((holiday, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs p-2 bg-pink-50 border-pink-200 text-pink-800"
                              >
                                <CalendarDays className="h-3 w-3 mr-1" />
                                {format(new Date(holiday.date), 'dd/MM/yyyy')} - {holiday.festivo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Resumen Mejorado */}
              <TabsContent value="summary" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-green-600" />
                      Resumen de Asignaciones - {getSelectedMemberName()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label htmlFor="summaryStartDate">Fecha Desde</Label>
                          <Input
                            type="date"
                            value={summaryStartDate}
                            onChange={(e) => setSummaryStartDate(e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="summaryEndDate">Fecha Hasta</Label>
                          <Input
                            type="date"
                            value={summaryEndDate}
                            onChange={(e) => setSummaryEndDate(e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button 
                            onClick={handleGenerateSummary}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CalendarDays className="h-4 w-4 mr-2" />
                            Generar Resumen
                          </Button>
                        </div>
                      </div>
                    </div>

                    {showSummary && (() => {
                      const summary = generateSummary();
                      if (!summary) return null;

                      return (
                        <div className="space-y-6 animate-fade-in">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">
                              📊 Resumen de Asignaciones - {summary.memberName}
                            </h3>
                            <p className="text-sm text-blue-800 mb-4">
                              Período: {format(new Date(summaryStartDate), 'dd/MM/yyyy')} - {format(new Date(summaryEndDate), 'dd/MM/yyyy')}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="bg-white p-4 rounded-lg border hover-scale">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-gray-900">{summary.totalDays}</div>
                                  <div className="text-sm text-gray-600">Días naturales</div>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg border hover-scale">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-yellow-600">{summary.weekendDays}</div>
                                  <div className="text-sm text-gray-600">Fines de semana ({summary.weekendPercentage}%)</div>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg border hover-scale">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-pink-600">{summary.holidayDays}</div>
                                  <div className="text-sm text-gray-600">Días festivos</div>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg border hover-scale">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">{summary.workableDays}</div>
                                  <div className="text-sm text-gray-600">Días laborables</div>
                                </div>
                              </div>
                            </div>

                            <div className="mb-6">
                              <h4 className="text-md font-semibold text-gray-900 mb-3">📋 Asignaciones por Proyecto:</h4>
                              {Object.keys(summary.projectSummary).length > 0 ? (
                                <div className="space-y-2">
                                  {Object.entries(summary.projectSummary).map(([projectCode, projectData]) => (
                                    <div key={projectCode} className="bg-white p-3 rounded-lg border flex justify-between items-center hover-scale">
                                      <div>
                                        <span className="font-medium text-gray-900">{projectCode}</span>
                                        <span className="text-sm text-gray-600 ml-2">- {projectData.name}</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-blue-600">{projectData.days.toFixed(1)} días</div>
                                        <div className="text-sm text-gray-600">al {projectData.percentage}%</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                                  No hay asignaciones en este período
                                </div>
                              )}
                            </div>

                            <div className="mb-6">
                              <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">📅 Días sin asignar:</span>
                                  <span className="text-lg font-bold text-orange-600">{summary.unassignedDays.toFixed(1)} días</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                                <div>
                                  <p className="font-medium text-orange-900">⚠️ Aviso de Capacidad</p>
                                  <p className="text-sm text-orange-800 mt-1">
                                    En el período considerado, este recurso tiene un <strong>{summary.availableCapacity}%</strong> de capacidad disponible.
                                  </p>
                                  {parseFloat(summary.availableCapacity) < 20 && (
                                    <p className="text-sm text-red-600 mt-2 font-medium">
                                      🚨 Recurso sobrecargado - Considere redistribuir asignaciones
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TooltipProvider>
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