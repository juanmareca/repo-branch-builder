import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Plus, Search, X, Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

interface NewAssignmentCalendarProps {
  persons: Person[];
  projects: Project[];
  assignments: Assignment[];
  holidays: Holiday[];
  onAssignmentCreated: () => void;
}

const PROJECT_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-300', light: 'bg-blue-100' },
  { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-300', light: 'bg-green-100' },
  { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-300', light: 'bg-purple-100' },
  { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-300', light: 'bg-orange-100' },
  { bg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-300', light: 'bg-pink-100' },
  { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-300', light: 'bg-indigo-100' },
  { bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-300', light: 'bg-teal-100' },
  { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-300', light: 'bg-red-100' }
];

export default function NewAssignmentCalendar({
  persons,
  projects,
  assignments,
  holidays,
  onAssignmentCreated
}: NewAssignmentCalendarProps) {
  const { toast } = useToast();
  
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedHolidayCalendar, setSelectedHolidayCalendar] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('100');
  const [assignmentType, setAssignmentType] = useState<string>('Desarrollo');
  const [calendarView, setCalendarView] = useState<'3' | '6'>('3');
  const [showProjectSearch, setShowProjectSearch] = useState<boolean>(false);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  const currentDate = new Date();
  const monthsToShow = parseInt(calendarView);
  const months = Array.from({ length: monthsToShow }, (_, i) => addMonths(currentDate, i));
  
  // Create project color mapping
  const [projectColorMap, setProjectColorMap] = useState<Map<string, typeof PROJECT_COLORS[0]>>(new Map());
  
  useEffect(() => {
    const colorMap = new Map<string, typeof PROJECT_COLORS[0]>();
    let colorIndex = 0;
    
    assignments.forEach(assignment => {
      if (!colorMap.has(assignment.project_id)) {
        colorMap.set(assignment.project_id, PROJECT_COLORS[colorIndex % PROJECT_COLORS.length]);
        colorIndex++;
      }
    });
    
    setProjectColorMap(colorMap);
  }, [assignments]);

  // Get available holiday calendars from selected person's office
  const getHolidayCalendars = () => {
    const selectedPersonData = persons.find(p => p.id === selectedPerson);
    if (!selectedPersonData) return [];
    
    const uniqueCalendars = [...new Set(holidays.map(h => h.comunidad_autonoma))].filter(Boolean);
    return uniqueCalendars;
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.denominacion.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    project.codigo_inicial.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  const getPersonAssignments = (personId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments.filter(a => 
      a.person_id === personId &&
      dateStr >= a.start_date && 
      dateStr <= a.end_date
    );
  };

  const isHoliday = (date: Date, calendar: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.some(h => 
      h.date === dateStr && 
      (h.comunidad_autonoma === calendar || h.comunidad_autonoma === 'NACIONAL')
    );
  };

  const getHolidayName = (date: Date, calendar: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => 
      h.date === dateStr && 
      (h.comunidad_autonoma === calendar || h.comunidad_autonoma === 'NACIONAL')
    );
    return holiday?.festivo || '';
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

    // Check for conflicts and weekends
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const days = eachDayOfInterval({ start: startDateObj, end: endDateObj });
    
    for (const day of days) {
      // Check if it's a weekend
      if (isWeekend(day)) {
        toast({
          title: "Error",
          description: `No se puede asignar en fin de semana: ${format(day, 'dd/MM/yyyy')}`,
          variant: "destructive"
        });
        return;
      }

      // Check if total percentage would exceed 100%
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
          type: assignmentType
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Asignación creada correctamente"
      });

      resetForm();
      onAssignmentCreated();
      setIsOpen(false);
      
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
    setSelectedPerson('');
    setSelectedProject('');
    setSelectedHolidayCalendar('');
    setStartDate('');
    setEndDate('');
    setPercentage('100');
    setAssignmentType('Desarrollo');
    setProjectSearchTerm('');
  };

  const renderCalendar = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get Monday as start of week (getDay returns 0 for Sunday, 1 for Monday, etc.)
    const startPadding = Array.from({ length: (getDay(monthStart) + 6) % 7 }, (_, i) => null);
    
    return (
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-center mb-4 capitalize">
          {format(month, 'MMMM yyyy', { locale: es })}
        </h3>
        
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for padding */}
          {startPadding.map((_, i) => (
            <div key={`pad-start-${i}`} className="h-12"></div>
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, month);
            const isWeekendDay = isWeekend(day);
            const isHolidayDay = selectedHolidayCalendar ? isHoliday(day, selectedHolidayCalendar) : false;
            const dayAssignments = selectedPerson ? getPersonAssignments(selectedPerson, day) : [];
            const totalPercentage = dayAssignments.reduce((sum, a) => sum + a.hours_allocated, 0);
            
            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={cn(
                  "relative h-12 border border-gray-200 text-xs p-1 cursor-pointer transition-colors",
                  !isCurrentMonth && "text-gray-400 bg-gray-50",
                  isWeekendDay && "bg-yellow-100",
                  isHolidayDay && "bg-red-100",
                  totalPercentage > 0 && "border-l-4 border-l-blue-500"
                )}
                title={isHolidayDay ? getHolidayName(day, selectedHolidayCalendar) : ''}
              >
                <div className="font-medium">{format(day, 'd')}</div>
                
                {/* Show assignments */}
                {dayAssignments.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 text-[10px]">
                    {dayAssignments.map((assignment, idx) => {
                      const color = projectColorMap.get(assignment.project_id) || PROJECT_COLORS[0];
                      return (
                        <div
                          key={idx}
                          className={cn("px-1 text-white truncate", color.bg)}
                          style={{ fontSize: '8px' }}
                        >
                          {assignment.hours_allocated}%
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Show percentage indicator */}
                {totalPercentage > 0 && (
                  <div className="absolute top-0 right-0 text-[8px] font-bold text-blue-600">
                    {totalPercentage}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render calendars in rows of 3
  const renderCalendarsInRows = () => {
    const rows = [];
    for (let i = 0; i < months.length; i += 3) {
      const monthsInRow = months.slice(i, i + 3);
      rows.push(
        <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {monthsInRow.map(month => renderCalendar(month))}
        </div>
      );
    }
    return rows;
  };

  // Get unique projects from assignments for legend
  const getProjectsInView = () => {
    if (!selectedPerson) return [];
    
    const personAssignments = assignments.filter(a => a.person_id === selectedPerson);
    const uniqueProjects = [...new Set(personAssignments.map(a => a.project_id))];
    
    return uniqueProjects.map(projectId => {
      const project = projects.find(p => p.id === projectId);
      const color = projectColorMap.get(projectId) || PROJECT_COLORS[0];
      return { project, color };
    }).filter(item => item.project);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Nueva Asignación
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Nueva Asignación
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalles de la Asignación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Person Selection */}
                <div className="space-y-2">
                  <Label htmlFor="person">Seleccionar Miembro del Equipo</Label>
                  <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {persons.map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Holiday Calendar Selection */}
                <div className="space-y-2">
                  <Label htmlFor="holiday-calendar">Calendario de Festivos</Label>
                  <Select value={selectedHolidayCalendar} onValueChange={setSelectedHolidayCalendar}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar calendario..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getHolidayCalendars().map(calendar => (
                        <SelectItem key={calendar} value={calendar}>
                          {calendar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha Desde</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end-date">Fecha Hasta</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="project">Proyecto</Label>
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowProjectSearch(true)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {selectedProject ? 
                        projects.find(p => p.id === selectedProject)?.denominacion?.substring(0, 30) + '...' :
                        'Seleccionar proyecto...'
                      }
                    </Button>
                    {showProjectSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Buscar proyecto..."
                            value={projectSearchTerm}
                            onChange={(e) => setProjectSearchTerm(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {filteredProjects.map(project => (
                            <div
                              key={project.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedProject(project.id);
                                setShowProjectSearch(false);
                                setProjectSearchTerm('');
                              }}
                            >
                              <div className="font-medium text-sm">{project.codigo_inicial}</div>
                              <div className="text-xs text-gray-600 truncate">{project.denominacion}</div>
                            </div>
                          ))}
                        </div>
                        <div className="p-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowProjectSearch(false)}
                            className="w-full"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Percentage */}
                <div className="space-y-2">
                  <Label htmlFor="percentage">Porcentaje (1-100%)</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="1"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                  />
                </div>

                {/* Assignment Type */}
                <div className="space-y-2">
                  <Label htmlFor="assignment-type">Tipo de Asignación</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Desarrollo">Desarrollo</SelectItem>
                      <SelectItem value="Formación">Formación</SelectItem>
                      <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                      <SelectItem value="Bench">Bench</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAssign} className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  Asignar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Calendar View Options */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={calendarView === '3' ? 'default' : 'outline'}
                onClick={() => setCalendarView('3')}
                size="sm"
              >
                Ver 3 Meses
              </Button>
              <Button
                variant={calendarView === '6' ? 'default' : 'outline'}
                onClick={() => setCalendarView('6')}
                size="sm"
              >
                Ver 6 Meses
              </Button>
            </div>
          </div>

          {/* Calendar Display */}
          {selectedPerson && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Calendario de {persons.find(p => p.id === selectedPerson)?.nombre}
              </h3>
              {renderCalendarsInRows()}
            </div>
          )}

          {/* Legend */}
          {selectedPerson && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Leyenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border"></div>
                    <span>Fin de Semana</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border"></div>
                    <span>Festivo</span>
                  </div>
                </div>
                
                {getProjectsInView().length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Proyectos:</div>
                    <div className="space-y-1">
                      {getProjectsInView().map(({ project, color }, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className={cn("w-4 h-4 border", color.bg)}></div>
                          <span className="font-mono">{project?.codigo_inicial}</span>
                          <span className="truncate">{project?.denominacion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}