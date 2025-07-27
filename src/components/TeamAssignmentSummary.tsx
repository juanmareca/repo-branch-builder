import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, BarChart3, X, ChevronDown, ChevronRight, FileDown, AlertTriangle } from 'lucide-react';
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
          (h.comunidad_autonoma === 'NACIONAL' || 
           h.comunidad_autonoma === '' || 
           h.comunidad_autonoma.toLowerCase() === member.oficina.toLowerCase())
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
                (h.comunidad_autonoma === 'NACIONAL' || 
                 h.comunidad_autonoma === '' || 
                 h.comunidad_autonoma.toLowerCase() === member.oficina.toLowerCase())
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
    
    // Crear gráfico de capacidad profesional
    const createCapacityChart = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      const centerX = 150;
      const centerY = 150;
      const radius = 80;
      const innerRadius = 40;
      
      const assignedPercentage = 100 - summary.availableCapacity;
      const assignedAngle = (assignedPercentage / 100) * 2 * Math.PI;
      
      // Fondo limpio
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Anillo exterior sutil
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      
      // Capacidad asignada (azul elegante)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + assignedAngle);
      ctx.arc(centerX, centerY, innerRadius, -Math.PI / 2 + assignedAngle, -Math.PI / 2, true);
      ctx.closePath();
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      
      // Gradiente sutil para profundidad
      const gradientAssigned = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
      gradientAssigned.addColorStop(0, '#3b82f6');
      gradientAssigned.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = gradientAssigned;
      ctx.fill();
      
      // Capacidad disponible (verde elegante)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2 + assignedAngle, -Math.PI / 2 + 2 * Math.PI);
      ctx.arc(centerX, centerY, innerRadius, -Math.PI / 2 + 2 * Math.PI, -Math.PI / 2 + assignedAngle, true);
      ctx.closePath();
      const gradientAvailable = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius);
      gradientAvailable.addColorStop(0, '#10b981');
      gradientAvailable.addColorStop(1, '#059669');
      ctx.fillStyle = gradientAvailable;
      ctx.fill();
      
      // Texto central
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Capacidad', centerX, centerY - 5);
      ctx.fillText('del Equipo', centerX, centerY + 15);
      
      // Leyenda moderna
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Análisis de Capacidad', 320, 50);
      
      // Indicadores con círculos
      ctx.beginPath();
      ctx.arc(330, 80, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.fillText(`Asignado: ${assignedPercentage.toFixed(1)}%`, 350, 85);
      
      ctx.beginPath();
      ctx.arc(330, 110, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.fillText(`Disponible: ${summary.availableCapacity.toFixed(1)}%`, 350, 115);
      
      return canvas.toDataURL('image/png');
    };
    
    const capacityChartImage = createCapacityChart();
    
    // Header profesional con fondo tecnológico
    pdf.setFillColor(15, 23, 42); // Azul tecnológico oscuro
    pdf.rect(0, 0, pageWidth, 55, 'F');
    
    // Líneas tecnológicas sutiles
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    for (let i = 0; i < 5; i++) {
      pdf.line(20 + i * 40, 10, 30 + i * 40, 20);
      pdf.line(30 + i * 40, 35, 40 + i * 40, 45);
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.text('STRATESYS', 20, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Leaders in SAP Technology', 20, 40);
    pdf.text('Resumen de Asignaciones del Equipo', 20, 48);
    
    // Info del squad lead
    pdf.setFontSize(10);
    pdf.text(`Squad Lead: ${squadLeadName}`, pageWidth - 80, 25);
    pdf.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} - ${format(new Date(endDate), 'dd/MM/yyyy')}`, pageWidth - 80, 35);
    pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - 80, 45);
    
    let yPosition = 70;
    
    // Métricas principales con diseño limpio
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Resumen Ejecutivo', 20, yPosition);
    yPosition += 15;
    
    // TÍTULO RESUMEN EJECUTIVO
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Resumen Ejecutivo', 20, yPosition);
    yPosition += 25;

    // TARJETAS EXACTAS COMO LA WEB (4 tarjetas en grid 2x2)
    const cardWidth = 85;
    const cardHeight = 60;
    const spacing = 15;
    
    const webMetrics = [
      { 
        label: 'Días Naturales', 
        value: summary.totalDays.toString(), 
        color: [59, 130, 246], // Azul
        borderColor: [59, 130, 246]
      },
      { 
        label: 'Fines de Semana', 
        value: `${summary.weekendDays} (${((summary.weekendDays / summary.totalDays) * 100).toFixed(1)}%)`, 
        color: [16, 185, 129], // Verde
        borderColor: [16, 185, 129]
      },
      { 
        label: 'Festivos Laborables', 
        value: summary.totalHolidayDays.toString(), 
        color: [168, 85, 247], // Púrpura
        borderColor: [168, 85, 247]
      },
      { 
        label: 'Días Laborables', 
        value: `${summary.workDays} (${((summary.workDays / summary.totalDays) * 100).toFixed(1)}%)`, 
        color: [249, 115, 22], // Naranja
        borderColor: [249, 115, 22]
      }
    ];

    // Grid 2x2 exacto de la web
    webMetrics.forEach((metric, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 30 + col * (cardWidth + spacing);
      const y = yPosition + row * (cardHeight + spacing);
      
      // Fondo blanco de tarjeta
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'F');
      
      // Borde izquierdo de color (marca distintiva de la web)
      pdf.setFillColor(metric.borderColor[0], metric.borderColor[1], metric.borderColor[2]);
      pdf.roundedRect(x, y, 4, cardHeight, 4, 4, 'F');
      
      // Borde sutil
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 8, 8, 'S');
      
      // VALOR PRINCIPAL - GRANDE Y BOLD (como la web)
      pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.text(metric.value, x + 10, y + 22);
      
      // ETIQUETA - Pequeña y gris (como la web)
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(metric.label, x + 10, y + 40);
      
      // Línea sutil debajo
      pdf.setDrawColor(metric.color[0], metric.color[1], metric.color[2], 0.2);
      pdf.setLineWidth(0.5);
      pdf.line(x + 10, y + 45, x + cardWidth - 10, y + 45);
    });
    
    yPosition += 150; // Espacio para las tarjetas

    // ANÁLISIS DE CAPACIDAD - Simplificado y limpio como la web
    if (yPosition > pageHeight - 140) {
      pdf.addPage();
      yPosition = 30;
    }
    
    // Título
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Análisis de Capacidad', 20, yPosition);
    yPosition += 30;

    // Layout simple: Gráfico + Panel (como la web)
    const chartSize = 100;
    const chartX = 40;
    const panelX = chartX + chartSize + 40;
    
    // 1. GRÁFICO DE DONUT
    if (capacityChartImage) {
      pdf.addImage(capacityChartImage, 'PNG', chartX, yPosition, chartSize, chartSize);
    }

    // 2. PANEL DE INFORMACIÓN (como la tarjeta de la web)
    const assignedPercentage = ((summary.workDays * teamMembers.length - summary.unassignedDays) / (summary.workDays * teamMembers.length)) * 100;
    
    // Contenedor del panel limpio
    const panelWidth = 120;
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(panelX, yPosition, panelWidth, 100, 8, 8, 'F');
    
    // Borde elegante
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(1);
    pdf.roundedRect(panelX, yPosition, panelWidth, 100, 8, 8, 'S');
    
    // Header del panel
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(panelX, yPosition, panelWidth, 20, 8, 8, 'F');
    pdf.rect(panelX, yPosition + 10, panelWidth, 10, 'F');
    
    // Título "Análisis de Capacidad"
    pdf.setTextColor(55, 65, 81);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Análisis de Capacidad', panelX + panelWidth/2, yPosition + 13, { align: 'center' });
    
    // Porcentaje principal GRANDE
    pdf.setTextColor(59, 130, 246);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text(`${summary.availableCapacity.toFixed(1)}%`, panelX + panelWidth/2, yPosition + 40, { align: 'center' });
    
    // "Disponible"
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text('Capacidad Disponible', panelX + panelWidth/2, yPosition + 55, { align: 'center' });
    
    // Detalles
    pdf.setTextColor(75, 85, 99);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`${summary.unassignedDays.toFixed(1)} días sin asignar`, panelX + 8, yPosition + 70);
    
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(8);
    pdf.text(`de ${(summary.workDays * teamMembers.length).toFixed(1)} días totales`, panelX + 8, yPosition + 85);

    // 3. LEYENDA debajo del gráfico (como la web)
    const legendY = yPosition + chartSize + 15;
    
    // Círculo azul
    pdf.setFillColor(59, 130, 246);
    pdf.circle(chartX + 20, legendY, 4, 'F');
    pdf.setTextColor(75, 85, 99);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Asignado (${assignedPercentage.toFixed(1)}%)`, chartX + 30, legendY + 2);

    // Círculo verde
    pdf.setFillColor(16, 185, 129);
    pdf.circle(chartX + 20, legendY + 12, 4, 'F');
    pdf.text(`Disponible (${summary.availableCapacity.toFixed(1)}%)`, chartX + 30, legendY + 14);
    
    yPosition += 150; // Espacio para toda la sección de análisis
    
    // ASIGNACIONES POR PROYECTO - Asegurar espacio para el título
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 30;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(31, 41, 55);
    pdf.text('Asignaciones por Proyecto del Equipo:', 20, yPosition);
    yPosition += 25;
    
    Object.entries(summary.projectDays).forEach(([projectId, data]) => {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Header del proyecto estilo web
      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, yPosition - 5, pageWidth - 40, 18, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(20, yPosition - 5, pageWidth - 40, 18, 'S');
      
      // Proyecto y código (solo la parte después del guión)
      const project = projects.find(p => p.id === projectId);
      const projectCode = project?.codigo_inicial || '';
      const projectName = project?.denominacion || data.name;
      const displayName = projectCode ? projectCode.split(' - ').slice(1).join(' - ') || projectName : projectName;
      
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(displayName, 25, yPosition + 7);
      
      // Días alineados a la derecha
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${data.days.toFixed(1)} días`, pageWidth - 25, yPosition + 7, { align: 'right' });
      
      yPosition += 22;
      
      // Miembros del equipo
      Object.values(data.memberBreakdown).forEach((member) => {
        pdf.setTextColor(71, 85, 105);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(`• ${member.name}`, 30, yPosition);
        pdf.text(`${member.days.toFixed(1)} días`, pageWidth - 25, yPosition, { align: 'right' });
        yPosition += 5;
      });
      
      yPosition += 5;
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
                      <div className="text-xs text-muted-foreground mt-2 text-left max-h-20 overflow-y-auto">
                        {Object.values(summary.memberHolidays)
                          .filter(member => member.holidayDays > 0)
                          .map((member, index) => (
                          <div key={index}>
                            {member.name}: {member.holidayDays} días
                          </div>
                        ))}
                        {Object.values(summary.memberHolidays).every(member => member.holidayDays === 0) && (
                          <div className="text-green-600">Sin festivos en el período</div>
                        )}
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
              
              {/* Gráfico de Capacidad Mejorado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Análisis de Capacidad</h4>
                  <div className="relative">
                    <div className="w-48 h-48 mx-auto relative">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Fondo del círculo */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#f1f5f9"
                          strokeWidth="8"
                        />
                        {/* Capacidad asignada */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="8"
                          strokeDasharray={`${(100 - summary.availableCapacity) * 2.51} 251.2`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                        {/* Capacidad disponible */}
                        <circle
                          cx="50"
                          cy="50"
                          r="30"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeDasharray={`${summary.availableCapacity * 1.88} 188.4`}
                          strokeDashoffset={`${-(100 - summary.availableCapacity) * 1.88}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {summary.availableCapacity.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Disponible</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center mt-4 space-x-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Asignado ({(100 - summary.availableCapacity).toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Disponible ({summary.availableCapacity.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Métricas del Período</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Días sin asignar</span>
                      <span className="font-semibold">{summary.unassignedDays.toFixed(1)} días</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Total días laborables</span>
                      <span className="font-semibold">{(summary.workDays * teamMembers.length).toFixed(1)} días</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Miembros del equipo</span>
                      <span className="font-semibold">{teamMembers.length} personas</span>
                    </div>
                    {summary.totalVacationDays > 0 && (
                      <div className="flex justify-between items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <span className="text-sm font-medium text-purple-800">Días de vacaciones</span>
                        <span className="font-semibold text-purple-800">{summary.totalVacationDays.toFixed(1)} días</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Assignments */}
              <div>
                <h4 className="font-medium mb-3">Asignaciones por Proyecto del Equipo:</h4>
                <div className="space-y-3">
                  {Object.entries(summary.projectDays).map(([projectId, data]) => {
                    const project = projects.find(p => p.id === projectId);
                    const projectCode = project?.codigo_inicial || '';
                    const projectName = project?.denominacion || data.name;
                    
                    return (
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
                                  <div className="font-medium">
                                    {projectCode ? projectCode.split(' - ').slice(1).join(' - ') || projectName : projectName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Asignaciones del equipo</div>
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
                                  <span className="font-medium">{member.days.toFixed(1)} días</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                  
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