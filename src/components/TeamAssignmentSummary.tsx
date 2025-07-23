import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, BarChart3 } from 'lucide-react';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

interface Assignment {
  id: string;
  person_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  hours_allocated: number;
  project_name?: string;
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

interface TeamSummaryProps {
  squadLeadName: string;
  teamMembers: Person[];
  assignments: Assignment[];
  holidays: Holiday[];
  projects: { id: string; denominacion: string; codigo_inicial: string; }[];
}

interface TeamSummaryData {
  totalDays: number;
  weekendDays: number;
  totalHolidayDays: number;
  workDays: number;
  memberHolidays: { [personId: string]: { name: string; holidayDays: number; } };
  projectDays: { [projectId: string]: { days: number; percentage: number; name: string; } };
  unassignedDays: number;
  availableCapacity: number;
}

export default function TeamAssignmentSummary({ 
  squadLeadName,
  teamMembers,
  assignments, 
  holidays, 
  projects 
}: TeamSummaryProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState<TeamSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const calculateTeamSummary = () => {
    if (!startDate || !endDate || teamMembers.length === 0) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    const allDays = eachDayOfInterval({ start, end });
    const totalDays = allDays.length;
    
    // Calculate weekends (same for all members)
    const weekendDays = allDays.filter(day => isWeekend(day)).length;
    
    // Calculate holidays per member and total
    const memberHolidays: { [personId: string]: { name: string; holidayDays: number; } } = {};
    let totalHolidayDays = 0;
    
    teamMembers.forEach(member => {
      const memberHolidayDays = allDays.filter(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const isHoliday = holidays.some(h => 
          h.date === dayStr && 
          (h.comunidad_autonoma === member.oficina || h.comunidad_autonoma === '')
        );
        return isHoliday && !isWeekend(day);
      }).length;
      
      memberHolidays[member.id] = {
        name: member.nombre,
        holidayDays: memberHolidayDays
      };
      
      totalHolidayDays += memberHolidayDays;
    });
    
    const workDays = totalDays - weekendDays;
    
    // Calculate project assignments for all team members
    const projectDays: { [projectId: string]: { days: number; percentage: number; name: string; } } = {};
    let totalAssignedWorkdays = 0;
    
    teamMembers.forEach(member => {
      assignments
        .filter(a => a.person_id === member.id)
        .forEach(assignment => {
          const assignmentStart = new Date(Math.max(new Date(assignment.start_date).getTime(), start.getTime()));
          const assignmentEnd = new Date(Math.min(new Date(assignment.end_date).getTime(), end.getTime()));
          
          if (assignmentStart <= assignmentEnd) {
            const assignmentDays = eachDayOfInterval({ start: assignmentStart, end: assignmentEnd });
            
            // Count only work days (exclude weekends and holidays for this member)
            const assignmentWorkDays = assignmentDays.filter(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isWeekendDay = isWeekend(day);
              const isHolidayDay = holidays.some(h => 
                h.date === dayStr && 
                (h.comunidad_autonoma === member.oficina || h.comunidad_autonoma === '')
              );
              return !isWeekendDay && !isHolidayDay;
            }).length;
            
            const project = projects.find(p => p.id === assignment.project_id);
            const projectName = project ? `${project.codigo_inicial} - ${project.denominacion}` : 'Proyecto desconocido';
            
            // Calculate effective days based on percentage
            const effectiveDays = (assignmentWorkDays * assignment.hours_allocated) / 100;
            
            if (!projectDays[assignment.project_id]) {
              projectDays[assignment.project_id] = {
                days: 0,
                percentage: assignment.hours_allocated,
                name: projectName
              };
            }
            
            projectDays[assignment.project_id].days += effectiveDays;
            totalAssignedWorkdays += effectiveDays;
          }
        });
    });
    
    // Calculate team work capacity (total work days for all members minus their individual holidays)
    const totalTeamWorkDays = teamMembers.reduce((total, member) => {
      const memberWorkDays = workDays - memberHolidays[member.id].holidayDays;
      return total + memberWorkDays;
    }, 0);
    
    const unassignedDays = Math.max(0, totalTeamWorkDays - totalAssignedWorkdays);
    const availableCapacity = totalTeamWorkDays > 0 ? ((totalTeamWorkDays - totalAssignedWorkdays) / totalTeamWorkDays) * 100 : 0;
    
    setSummary({
      totalDays,
      weekendDays,
      totalHolidayDays,
      workDays,
      memberHolidays,
      projectDays,
      unassignedDays,
      availableCapacity: Math.max(0, availableCapacity)
    });
    
    setShowSummary(true);
  };

  const resetSummary = () => {
    setSummary(null);
    setShowSummary(false);
    setStartDate('');
    setEndDate('');
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Resumen de Asignaciones del Equipo de {squadLeadName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showSummary ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Selecciona un período para ver el resumen de asignaciones del equipo completo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="team-summary-start">Fecha Desde</Label>
                <Input
                  id="team-summary-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="team-summary-end">Fecha Hasta</Label>
                <Input
                  id="team-summary-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={calculateTeamSummary} className="w-full gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Generar Resumen
                </Button>
              </div>
            </div>
          </div>
        ) : (
          summary && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Resumen del {format(new Date(startDate), 'dd/MM/yyyy')} al {format(new Date(endDate), 'dd/MM/yyyy')}
                </h3>
                <Button variant="outline" onClick={resetSummary}>
                  Nuevo Resumen
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{summary.totalDays}</div>
                      <div className="text-sm text-muted-foreground">Días naturales</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{summary.weekendDays}</div>
                      <div className="text-sm text-muted-foreground">
                        Fines de semana ({((summary.weekendDays / summary.totalDays) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{summary.totalHolidayDays}</div>
                      <div className="text-sm text-muted-foreground">
                        Festivos laborables (suma del equipo)
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {Object.values(summary.memberHolidays).map((member, index) => (
                          <div key={index}>
                            {member.name}: {member.holidayDays} días
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{summary.workDays}</div>
                      <div className="text-sm text-muted-foreground">
                        Días laborables ({((summary.workDays / summary.totalDays) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Project Assignments */}
              <div>
                <h4 className="font-medium mb-3">Asignaciones por Proyecto del Equipo:</h4>
                <div className="space-y-3">
                  {Object.entries(summary.projectDays).map(([projectId, data]) => (
                    <div key={projectId} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Asignaciones del equipo
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{data.days.toFixed(1)} días</div>
                        <div className="text-sm text-muted-foreground">
                          (Total del equipo)
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {summary.unassignedDays > 0 && (
                    <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div>
                        <div className="font-medium text-orange-800">Sin asignar</div>
                        <div className="text-sm text-orange-600">Capacidad disponible del equipo</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-800">{summary.unassignedDays.toFixed(1)} días</div>
                        <div className="text-sm text-orange-600">
                          ({summary.availableCapacity.toFixed(1)}% capacidad disponible)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Capacity Alert */}
              <div className={`p-4 rounded-lg border ${
                summary.availableCapacity > 50 ? 'bg-green-50 border-green-200' :
                summary.availableCapacity > 20 ? 'bg-yellow-50 border-yellow-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className={`font-medium ${
                  summary.availableCapacity > 50 ? 'text-green-800' :
                  summary.availableCapacity > 20 ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  ⚠️ Aviso de Capacidad del Equipo
                </div>
                <div className={`text-sm mt-1 ${
                  summary.availableCapacity > 50 ? 'text-green-700' :
                  summary.availableCapacity > 20 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  En el período considerado, el equipo tiene <strong>{summary.availableCapacity.toFixed(1)}%</strong> de capacidad disponible.
                </div>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}