import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, BarChart3, X, ChevronDown, ChevronRight, FileDown } from 'lucide-react';
import { format, eachDayOfInterval, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import jsPDF from 'jspdf';
import techBackground from '@/assets/tech-background.jpg';

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
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

interface TeamSummaryData {
  totalDays: number;
  weekendDays: number;
  totalHolidayDays: number;
  totalVacationDays: number;
  workDays: number;
  memberHolidays: { [personId: string]: { name: string; holidayDays: number; } };
  memberVacations: { [personId: string]: { name: string; vacationDays: number; } };
  projectDays: { [projectId: string]: { 
    days: number; 
    percentage: number; 
    name: string;
    memberBreakdown: { [personId: string]: { name: string; days: number; } };
  } };
  unassignedDays: number;
  availableCapacity: number;
  unassignedMemberBreakdown: { [personId: string]: { name: string; days: number; } };
}

export default function TeamAssignmentSummary({ 
  squadLeadName,
  teamMembers,
  assignments, 
  holidays, 
  projects,
  isExpanded,
  onToggleExpanded
}: TeamSummaryProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState<TeamSummaryData | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<{ [projectId: string]: boolean }>({});
  const [expandedUnassigned, setExpandedUnassigned] = useState(false);
  const [expandedCapacity, setExpandedCapacity] = useState(false);

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
    
    console.log('Total holiday days calculated:', totalHolidayDays);
    console.log('Member holidays:', memberHolidays);
    
    // Calculate vacation days (assignments to Holiday projects)
    const memberVacations: { [personId: string]: { name: string; vacationDays: number; } } = {};
    let totalVacationDays = 0;
    
    teamMembers.forEach(member => {
      const memberVacationDays = assignments
        .filter(a => a.person_id === member.id)
        .filter(a => {
          const project = projects.find(p => p.id === a.project_id);
          return project?.denominacion.toLowerCase().includes('holiday');
        })
        .reduce((total, assignment) => {
          const assignmentStart = new Date(Math.max(new Date(assignment.start_date).getTime(), start.getTime()));
          const assignmentEnd = new Date(Math.min(new Date(assignment.end_date).getTime(), end.getTime()));
          
          if (assignmentStart <= assignmentEnd) {
            const assignmentDays = eachDayOfInterval({ start: assignmentStart, end: assignmentEnd });
            const assignmentWorkDays = assignmentDays.filter(day => !isWeekend(day)).length;
            return total + (assignmentWorkDays * assignment.hours_allocated) / 100;
          }
          return total;
        }, 0);
      
      memberVacations[member.id] = {
        name: member.nombre,
        vacationDays: memberVacationDays
      };
      totalVacationDays += memberVacationDays;
    });
    
    const workDays = totalDays - weekendDays;
    
    // Calculate project assignments for all team members with member breakdown
    const projectDays: { [projectId: string]: { 
      days: number; 
      percentage: number; 
      name: string;
      memberBreakdown: { [personId: string]: { name: string; days: number; } };
    } } = {};
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
                name: projectName,
                memberBreakdown: {}
              };
            }
            
            if (!projectDays[assignment.project_id].memberBreakdown[member.id]) {
              projectDays[assignment.project_id].memberBreakdown[member.id] = {
                name: member.nombre,
                days: 0
              };
            }
            
            projectDays[assignment.project_id].days += effectiveDays;
            projectDays[assignment.project_id].memberBreakdown[member.id].days += effectiveDays;
            totalAssignedWorkdays += effectiveDays;
          }
        });
    });
    
    // Calculate team work capacity and unassigned breakdown
    const totalTeamWorkDays = teamMembers.reduce((total, member) => {
      const memberWorkDays = workDays - memberHolidays[member.id].holidayDays;
      return total + memberWorkDays;
    }, 0);
    
    const unassignedDays = Math.max(0, totalTeamWorkDays - totalAssignedWorkdays);
    const availableCapacity = totalTeamWorkDays > 0 ? ((totalTeamWorkDays - totalAssignedWorkdays) / totalTeamWorkDays) * 100 : 0;
    
    // Calculate unassigned days per member
    const unassignedMemberBreakdown: { [personId: string]: { name: string; days: number; } } = {};
    teamMembers.forEach(member => {
      const memberWorkDays = workDays - memberHolidays[member.id].holidayDays;
      const memberAssignedDays = assignments
        .filter(a => a.person_id === member.id)
        .reduce((total, assignment) => {
          const assignmentStart = new Date(Math.max(new Date(assignment.start_date).getTime(), start.getTime()));
          const assignmentEnd = new Date(Math.min(new Date(assignment.end_date).getTime(), end.getTime()));
          
          if (assignmentStart <= assignmentEnd) {
            const assignmentDays = eachDayOfInterval({ start: assignmentStart, end: assignmentEnd });
            const assignmentWorkDays = assignmentDays.filter(day => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isWeekendDay = isWeekend(day);
              const isHolidayDay = holidays.some(h => 
                h.date === dayStr && 
                (h.comunidad_autonoma === member.oficina || h.comunidad_autonoma === '')
              );
              return !isWeekendDay && !isHolidayDay;
            }).length;
            return total + (assignmentWorkDays * assignment.hours_allocated) / 100;
          }
          return total;
        }, 0);
      
      const memberUnassignedDays = Math.max(0, memberWorkDays - memberAssignedDays);
      if (memberUnassignedDays > 0) {
        unassignedMemberBreakdown[member.id] = {
          name: member.nombre,
          days: memberUnassignedDays
        };
      }
    });
    
    setSummary({
      totalDays,
      weekendDays,
      totalHolidayDays,
      totalVacationDays,
      workDays,
      memberHolidays,
      memberVacations,
      projectDays,
      unassignedDays,
      availableCapacity: Math.max(0, availableCapacity),
      unassignedMemberBreakdown
    });
    
    setShowSummary(true);
  };

  const resetSummary = () => {
    setSummary(null);
    setShowSummary(false);
    setStartDate('');
    setEndDate('');
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const generatePDF = async () => {
    if (!summary) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Crear gráfico de capacidad tipo quesito
    const createCapacityChart = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;
      
      const assignedPercentage = 100 - summary.availableCapacity;
      const assignedAngle = (assignedPercentage / 100) * 2 * Math.PI;
      
      // Fondo del gráfico
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Capacidad asignada (azul)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + assignedAngle);
      ctx.closePath();
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      
      // Capacidad disponible (verde)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2 + assignedAngle, -Math.PI / 2 + 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#10b981';
      ctx.fill();
      
      // Añadir leyenda
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Capacidad del Equipo', centerX - 70, 30);
      
      // Leyenda asignado
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(20, 250, 15, 15);
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText(`Asignado: ${assignedPercentage.toFixed(1)}%`, 45, 262);
      
      // Leyenda disponible
      ctx.fillStyle = '#10b981';
      ctx.fillRect(20, 270, 15, 15);
      ctx.fillStyle = '#374151';
      ctx.fillText(`Disponible: ${summary.availableCapacity.toFixed(1)}%`, 45, 282);
      
      return canvas.toDataURL('image/png');
    };
    
    const capacityChartImage = createCapacityChart();
    
    // Header mejorado
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('STRATESYS', 20, 25);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Resumen de Asignaciones del Equipo', 20, 35);
    pdf.text(`Squad Lead: ${squadLeadName}`, 20, 42);
    
    // Fecha en esquina superior derecha
    pdf.setFontSize(10);
    pdf.text(`${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`, pageWidth - 60, 42);
    
    let yPosition = 65;
    
    // Métricas principales en tarjetas
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Resumen Ejecutivo', 20, yPosition);
    yPosition += 15;
    
    // Grid de métricas con colores
    const metrics = [
      { label: 'Días Naturales', value: summary.totalDays, color: [59, 130, 246] },
      { label: 'Fines de Semana', value: summary.weekendDays, color: [245, 158, 11] },
      { label: 'Festivos', value: summary.totalHolidayDays, color: [239, 68, 68] },
      { label: 'Días Laborables', value: summary.workDays, color: [16, 185, 129] }
    ];
    
    metrics.forEach((metric, index) => {
      const x = 20 + (index % 2) * 85;
      const y = yPosition + Math.floor(index / 2) * 25;
      
      // Tarjeta con color
      pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
      pdf.rect(x, y - 5, 80, 20, 'F');
      
      // Texto en blanco
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(metric.value.toString(), x + 5, y + 3);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(metric.label, x + 5, y + 10);
    });
    
    yPosition += 55;
    
    // Añadir gráfico de capacidad
    if (capacityChartImage) {
      pdf.addImage(capacityChartImage, 'PNG', pageWidth - 80, yPosition - 20, 60, 60);
    }
    
    // Análisis de capacidad
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Análisis de Capacidad', 20, yPosition);
    yPosition += 10;
    
    const capacityColor = summary.availableCapacity > 50 ? [220, 252, 231] : 
                         summary.availableCapacity > 20 ? [254, 240, 138] : [254, 226, 226];
    pdf.setFillColor(capacityColor[0], capacityColor[1], capacityColor[2]);
    pdf.rect(20, yPosition - 5, pageWidth - 100, 25, 'F');
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Capacidad Disponible: ${summary.availableCapacity.toFixed(1)}%`, 25, yPosition + 5);
    pdf.text(`Días Sin Asignar: ${summary.unassignedDays.toFixed(1)}`, 25, yPosition + 12);
    
    yPosition += 35;
    
    // Asignaciones por proyecto con mejor formato
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Asignaciones por Proyecto', 20, yPosition);
    yPosition += 15;
    
    Object.entries(summary.projectDays).forEach(([projectId, data], index) => {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Header del proyecto con gradiente
      const colors = [
        [99, 102, 241], [168, 85, 247], [236, 72, 153], 
        [245, 101, 101], [59, 130, 246], [16, 185, 129]
      ];
      const color = colors[index % colors.length];
      
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(data.name, 25, yPosition + 3);
      pdf.text(`${data.days.toFixed(1)} días`, pageWidth - 60, yPosition + 3);
      
      yPosition += 18;
      
      // Miembros con mejor formato
      Object.values(data.memberBreakdown).forEach((member) => {
        pdf.setTextColor(60, 60, 60);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`• ${member.name}`, 30, yPosition);
        pdf.text(`${member.days.toFixed(1)} días`, pageWidth - 60, yPosition);
        yPosition += 5;
      });
      
      yPosition += 8;
    });
    
    // Footer profesional
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(1);
      pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, pageHeight - 15);
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth - 40, pageHeight - 15);
      pdf.text('© 2025 Stratesys', 20, pageHeight - 10);
    }
    
    const filename = `Resumen_Equipo_${squadLeadName}_${format(new Date(startDate), 'yyyyMMdd')}-${format(new Date(endDate), 'yyyyMMdd')}.pdf`;
    pdf.save(filename);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen de Asignaciones del Equipo de {squadLeadName}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggleExpanded}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
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
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    onClick={generatePDF}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <FileDown className="h-4 w-4" />
                    Generar PDF
                  </Button>
                  <Button variant="outline" onClick={resetSummary}>
                    Nuevo Resumen
                  </Button>
                </div>
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
                      <div className="text-xs text-muted-foreground mt-2 text-left">
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
                    <div key={projectId}>
                      <Collapsible
                        open={expandedProjects[projectId]}
                        onOpenChange={() => toggleProjectExpansion(projectId)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                            <div className="flex items-center gap-2">
                              {expandedProjects[projectId] ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                              }
                              <div>
                                <div className="font-medium">{data.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Asignaciones del equipo
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{data.days.toFixed(1)} días</div>
                              <div className="text-sm text-muted-foreground">
                                (Total del equipo)
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 ml-6">
                          <div className="space-y-2">
                            {Object.values(data.memberBreakdown).map((member, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-background rounded text-sm">
                                <span className="text-left">{member.name}</span>
                                <span>{member.days.toFixed(1)} días</span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                  
                  {summary.unassignedDays > 0 && (
                    <div>
                      <Collapsible
                        open={expandedUnassigned}
                        onOpenChange={setExpandedUnassigned}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex justify-between items-center p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100">
                            <div className="flex items-center gap-2">
                              {expandedUnassigned ? 
                                <ChevronDown className="h-4 w-4 text-orange-800" /> : 
                                <ChevronRight className="h-4 w-4 text-orange-800" />
                              }
                              <div>
                                <div className="font-medium text-orange-800">Sin asignar</div>
                                <div className="text-sm text-orange-600">Capacidad disponible del equipo</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-orange-800">{summary.unassignedDays.toFixed(1)} días</div>
                              <div className="text-sm text-orange-600">
                                ({summary.availableCapacity.toFixed(1)}% capacidad disponible)
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2 ml-6">
                          <div className="space-y-2">
                            {Object.values(summary.unassignedMemberBreakdown).map((member, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-background rounded text-sm">
                                <span className="text-left">{member.name}</span>
                                <span>{member.days.toFixed(1)} días</span>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Capacity Alert */}
              <Collapsible
                open={expandedCapacity}
                onOpenChange={setExpandedCapacity}
              >
                <CollapsibleTrigger asChild>
                  <div className={`p-4 rounded-lg border cursor-pointer ${
                    summary.availableCapacity > 50 ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                    summary.availableCapacity > 20 ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                    'bg-red-50 border-red-200 hover:bg-red-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      {expandedCapacity ? 
                        <ChevronDown className={`h-4 w-4 ${
                          summary.availableCapacity > 50 ? 'text-green-800' :
                          summary.availableCapacity > 20 ? 'text-yellow-800' :
                          'text-red-800'
                        }`} /> : 
                        <ChevronRight className={`h-4 w-4 ${
                          summary.availableCapacity > 50 ? 'text-green-800' :
                          summary.availableCapacity > 20 ? 'text-yellow-800' :
                          'text-red-800'
                        }`} />
                      }
                      <div className={`font-medium ${
                        summary.availableCapacity > 50 ? 'text-green-800' :
                        summary.availableCapacity > 20 ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        ⚠️ Aviso de Capacidad del Equipo
                      </div>
                    </div>
                    <div className={`text-sm mt-1 ${
                      summary.availableCapacity > 50 ? 'text-green-700' :
                      summary.availableCapacity > 20 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      En el período considerado, el equipo tiene <strong>{summary.availableCapacity.toFixed(1)}%</strong> de capacidad disponible.
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 ml-6">
                  <div className="space-y-2">
                    {Object.values(summary.unassignedMemberBreakdown).map((member, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-background rounded text-sm">
                        <span className="text-left">{member.name}</span>
                        <span>{member.days.toFixed(1)} días disponibles</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )
        )}
        </CardContent>
      )}
    </Card>
  );
}