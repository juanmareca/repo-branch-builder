import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Eye } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';

interface StaffingReportProps {
  squadLeadName: string;
  squadPersons: any[];
}

interface StaffingData {
  personId: string;
  personCode: string;
  personName: string;
  categoria: string;
  grupo: string;
  oficina: string;
  squadLead: string;
  weeklyData: {
    [weekKey: string]: {
      jornadasFacturablesProyecto: number;
      jornadasSTRProductos: number;
      jornadasNoFacturablesAvailability: number;
      jornadasNoFacturablesManagement: number;
      jornadasNoFacturablesSAM: number;
      jornadasFacturablesOtros: number;
      jornadasNoDisponibles: number;
      totalDiasLaborables: number;
    };
  };
}

const StaffingReport: React.FC<StaffingReportProps> = ({ squadLeadName, squadPersons }) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [staffingData, setStaffingData] = useState<StaffingData[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePersonToggle = (personId: string) => {
    setSelectedPersons(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const selectAllPersons = () => {
    setSelectedPersons(squadPersons.map(p => p.id));
  };

  const clearAllPersons = () => {
    setSelectedPersons([]);
  };

  const generateReport = async () => {
    if (!startDate || !endDate || selectedPersons.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar fechas y al menos un miembro del equipo",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Obtener asignaciones y proyectos
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          *,
          projects:project_id (
            denominacion,
            codigo_inicial,
            tipologia,
            tipologia_2
          ),
          persons:person_id (
            nombre,
            categoria,
            grupo,
            oficina,
            squad_lead,
            num_pers,
            cex
          )
        `)
        .in('person_id', selectedPersons)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('end_date', format(endDate, 'yyyy-MM-dd'));

      // Obtener festivos
      const { data: holidays } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      // Generar semanas del período
      const weeks = eachWeekOfInterval(
        { start: startDate, end: endDate },
        { weekStartsOn: 1 }
      );

      const reportData: StaffingData[] = selectedPersons.map(personId => {
        const person = squadPersons.find(p => p.id === personId);
        const personAssignments = assignments?.filter(a => a.person_id === personId) || [];

        const weeklyData: { [weekKey: string]: any } = {};

        weeks.forEach((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekKey = `SEMANA${String(index + 1).padStart(2, '0')}`;
          
          // Calcular días laborables de la semana (excluyendo fines de semana y festivos)
          let totalDiasLaborables = 0;
          let jornadasFacturablesProyecto = 0;
          let jornadasSTRProductos = 0;
          let jornadasNoFacturablesAvailability = 0;
          let jornadasNoFacturablesManagement = 0;
          let jornadasNoFacturablesSAM = 0;
          let jornadasFacturablesOtros = 0;
          let jornadasNoDisponibles = 0;

          for (let d = weekStart; d <= weekEnd; d = addDays(d, 1)) {
            if (!isWeekend(d)) {
              const dateStr = format(d, 'yyyy-MM-dd');
              const isHoliday = holidays?.some(h => h.date === dateStr);
              
              if (!isHoliday) {
                totalDiasLaborables++;
                
                // Buscar asignación para este día
                const dayAssignment = personAssignments.find(a => 
                  a.start_date <= dateStr && (a.end_date >= dateStr || !a.end_date)
                );

                if (dayAssignment) {
                  const project = dayAssignment.projects;
                  const tipologia = project?.tipologia?.toLowerCase() || '';
                  const tipologia2 = project?.tipologia_2?.toLowerCase() || '';
                  
                  // Clasificar según tipología del proyecto
                  if (tipologia.includes('facturable') || tipologia.includes('cliente')) {
                    jornadasFacturablesProyecto++;
                  } else if (tipologia.includes('producto') || tipologia.includes('str')) {
                    jornadasSTRProductos++;
                  } else if (tipologia.includes('management') || tipologia.includes('gestión')) {
                    jornadasNoFacturablesManagement++;
                  } else if (tipologia.includes('sam') || tipologia.includes('soporte')) {
                    jornadasNoFacturablesSAM++;
                  } else if (tipologia.includes('otros') || tipologia.includes('interno')) {
                    jornadasFacturablesOtros++;
                  } else {
                    jornadasNoFacturablesAvailability++;
                  }
                } else {
                  jornadasNoFacturablesAvailability++;
                }
              } else {
                jornadasNoDisponibles++;
              }
            }
          }

          weeklyData[weekKey] = {
            jornadasFacturablesProyecto,
            jornadasSTRProductos,
            jornadasNoFacturablesAvailability,
            jornadasNoFacturablesManagement,
            jornadasNoFacturablesSAM,
            jornadasFacturablesOtros,
            jornadasNoDisponibles,
            totalDiasLaborables
          };
        });

        return {
          personId,
          personCode: person?.num_pers || person?.cex || '',
          personName: person?.nombre || '',
          categoria: person?.categoria || '',
          grupo: person?.grupo || '',
          oficina: person?.oficina || '',
          squadLead: person?.squad_lead || squadLeadName,
          weeklyData
        };
      });

      setStaffingData(reportData);
      setShowReport(true);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Error al generar el informe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (staffingData.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Informe Staffing');

    const weeks = Object.keys(staffingData[0].weeklyData);
    
    // =================== TÍTULOS Y METADATOS ===================
    
    const titleText = `INFORME DE STAFFING - ${squadLeadName.toUpperCase()}`;
    const periodText = `Período: ${format(startDate!, 'dd/MM/yyyy')} - ${format(endDate!, 'dd/MM/yyyy')}`;
    const generatedText = `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
    
    worksheet.addRow([titleText]);
    worksheet.addRow([periodText]);
    worksheet.addRow([generatedText]);
    worksheet.addRow([]);

    // =================== PRIMERA FILA DE HEADERS ===================
    
    const headerRow1 = ['', '', '', '', '', ''];
    weeks.forEach((week, index) => {
      const weekNumber = String(index + 1).padStart(2, '0');
      
      // Calcular fechas de la semana
      const weekIntervals = eachWeekOfInterval(
        { start: startDate!, end: endDate! },
        { weekStartsOn: 1 }
      );
      const weekStart = weekIntervals[index];
      let actualWeekStart = weekStart;
      
      if (weekStart < startDate!) {
        actualWeekStart = startDate!;
      }
      
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      let actualWeekEnd = weekEnd;
      
      if (weekEnd > endDate!) {
        actualWeekEnd = endDate!;
      }
      
      const dateRange = `(${format(actualWeekStart, 'dd/MM/yyyy')} - ${format(actualWeekEnd, 'dd/MM/yyyy')})`;
      
      headerRow1.push(`SEMANA ${weekNumber} ${dateRange}`);
      // Agregar 7 celdas vacías para el merge
      for (let i = 0; i < 7; i++) {
        headerRow1.push('');
      }
    });

    const row1 = worksheet.addRow(headerRow1);
    
    // Estilo para la primera fila de semanas
    let colIndex = 7;
    weeks.forEach(() => {
      const cell = row1.getCell(colIndex);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // azul
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Merge de la semana (8 columnas)
      worksheet.mergeCells(row1.number, colIndex, row1.number, colIndex + 7);
      colIndex += 8;
    });

    // =================== SEGUNDA FILA DE HEADERS ===================
    
    const headerRow2 = ['Código', 'Nombre Persona', 'Categoría', 'Grupo', 'Oficina', 'Squad Lead'];
    weeks.forEach(() => {
      headerRow2.push(
        'Jornadas Facturables Proyecto',
        'Jornadas STR Productos', 
        'Jornadas No Fact. Availability',
        'Jornadas No Fact. Management',
        'Jornadas No Fact. SAM',
        'Jornadas Fact. Otros (Internal)',
        'Jornadas No Disponibles',
        'Total Días Lab.'
      );
    });

    const row2 = worksheet.addRow(headerRow2);
    
    // Estilos para info personal (azul oscuro)
    for (let i = 1; i <= 6; i++) {
      const cell = row2.getCell(i);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // azul oscuro
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
    
    // Estilos para jornadas con colores diferenciados
    colIndex = 7;
    weeks.forEach(() => {
      // Verde para facturables (2 columnas)
      for (let i = 0; i < 2; i++) {
        const cell = row2.getCell(colIndex + i);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF059669' } // verde
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      
      // Naranja claro para no facturables (3 columnas)
      for (let i = 2; i < 5; i++) {
        const cell = row2.getCell(colIndex + i);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFCD34D' } // naranja claro
        };
        cell.font = { bold: true, color: { argb: 'FF374151' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
      
      // Verde claro para otros (1 columna)
      const cellOtros = row2.getCell(colIndex + 5);
      cellOtros.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF86EFAC' } // verde claro
      };
      cellOtros.font = { bold: true, color: { argb: 'FF374151' } };
      cellOtros.alignment = { horizontal: 'center', vertical: 'middle' };
      cellOtros.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Rojo para no disponibles (1 columna)
      const cellNoDisp = row2.getCell(colIndex + 6);
      cellNoDisp.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEF4444' } // rojo
      };
      cellNoDisp.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cellNoDisp.alignment = { horizontal: 'center', vertical: 'middle' };
      cellNoDisp.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Azul para total días (1 columna)
      const cellTotal = row2.getCell(colIndex + 7);
      cellTotal.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF60A5FA' } // azul claro
      };
      cellTotal.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cellTotal.alignment = { horizontal: 'center', vertical: 'middle' };
      cellTotal.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      colIndex += 8;
    });

    // =================== DATOS DE PERSONAS ===================
    
    staffingData.forEach(person => {
      const rowData = [
        person.personCode,
        person.personName,
        person.categoria,
        person.grupo,
        person.oficina,
        person.squadLead
      ];
      
      weeks.forEach(week => {
        const weekData = person.weeklyData[week];
        rowData.push(
          weekData.jornadasFacturablesProyecto.toFixed(2),
          weekData.jornadasSTRProductos.toFixed(2),
          weekData.jornadasNoFacturablesAvailability.toFixed(2),
          weekData.jornadasNoFacturablesManagement.toFixed(2),
          weekData.jornadasNoFacturablesSAM.toFixed(2),
          weekData.jornadasFacturablesOtros.toFixed(2),
          weekData.jornadasNoDisponibles.toFixed(2),
          weekData.totalDiasLaborables.toFixed(2)
        );
      });
      
      const dataRow = worksheet.addRow(rowData);
      
      // Aplicar fondo gris a las primeras 5 columnas (sin Squad Lead)
      for (let i = 1; i <= 5; i++) {
        const cell = dataRow.getCell(i);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7EB' } // gris claro
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // Squad Lead y datos numéricos con borde normal
      for (let i = 6; i <= rowData.length; i++) {
        const cell = dataRow.getCell(i);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    // =================== AJUSTAR ANCHOS DE COLUMNA ===================
    
    worksheet.getColumn(1).width = 12; // Código
    worksheet.getColumn(2).width = 35; // Nombre
    worksheet.getColumn(3).width = 20; // Categoría
    worksheet.getColumn(4).width = 15; // Grupo
    worksheet.getColumn(5).width = 12; // Oficina
    worksheet.getColumn(6).width = 25; // Squad Lead
    
    // Columnas de jornadas
    for (let i = 7; i <= 6 + weeks.length * 8; i++) {
      worksheet.getColumn(i).width = 12;
    }

    // =================== FREEZE PANES ===================
    
    worksheet.views = [
      { state: 'frozen', xSplit: 6, ySplit: 6 }
    ];

    // =================== EXPORTAR ===================
    
    const fileName = `staffing_${squadLeadName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${format(startDate!, 'yyyyMMdd')}_${format(endDate!, 'yyyyMMdd')}.xlsx`;
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Excel profesional generado",
      description: `Con formato completo: ${fileName}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generador de Informe de Staffing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Selección de miembros del equipo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Miembros del Equipo</Label>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={selectAllPersons}>
                  Seleccionar Todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllPersons}>
                  Limpiar
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-4">
              {squadPersons.map(person => (
                <div key={person.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={person.id}
                    checked={selectedPersons.includes(person.id)}
                    onCheckedChange={() => handlePersonToggle(person.id)}
                  />
                  <Label htmlFor={person.id} className="text-sm">
                    {person.nombre}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-4">
            <Button onClick={generateReport} disabled={loading} className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              {loading ? 'Generando...' : 'Generar Informe'}
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToExcel} 
              disabled={!showReport || staffingData.length === 0}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mostrar informe */}
      {showReport && staffingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Informe de Staffing - {format(startDate!, 'dd/MM/yyyy')} a {format(endDate!, 'dd/MM/yyyy')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Squad lead: {squadLeadName}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border text-xs">
                <thead>
                  {/* PRIMERA CABECERA: Celdas vacías para info personal + Nombres de semanas */}
                  <tr>
                    {/* Celdas vacías SIN fondo, SIN bordes, SIN texto para info personal */}
                    <th className="min-w-[80px]"></th>
                    <th className="min-w-[200px]"></th>
                    <th className="min-w-[120px]"></th>
                    <th className="min-w-[80px]"></th>
                    <th className="min-w-[80px]"></th>
                    <th className="min-w-[150px]"></th>
                    {/* Nombres de semanas con fechas y estilo */}
                    {Object.keys(staffingData[0].weeklyData).map((week, index) => {
                      // Calcular las fechas de cada semana - debe empezar máximo en startDate
                      const weeks = eachWeekOfInterval(
                        { start: startDate!, end: endDate! },
                        { weekStartsOn: 1 }
                      );
                      const weekStart = weeks[index];
                      let actualWeekStart = weekStart;
                      
                      // Si el inicio de la semana es anterior al periodo seleccionado, usar startDate
                      if (weekStart < startDate!) {
                        actualWeekStart = startDate!;
                      }
                      
                      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                      let actualWeekEnd = weekEnd;
                      
                      // Si el final de la semana es posterior al periodo seleccionado, usar endDate
                      if (weekEnd > endDate!) {
                        actualWeekEnd = endDate!;
                      }
                      
                      const weekNumber = String(index + 1).padStart(2, '0');
                      const dateRange = `(${format(actualWeekStart, 'dd/MM/yyyy')} - ${format(actualWeekEnd, 'dd/MM/yyyy')})`;
                      
                      return (
                        <th key={week} className="border p-2 text-center font-bold min-w-[720px] bg-blue-500 text-white" colSpan={8}>
                          SEMANA {weekNumber}<br/>
                          <span className="text-xs font-normal">{dateRange}</span>
                        </th>
                      );
                    })}
                  </tr>
                  
                  {/* SEGUNDA CABECERA: Info personal + Detalles de jornadas */}
                  <tr>
                    {/* AZUL OSCURO para info personal */}
                    <th className="border p-3 text-center font-bold min-w-[80px] bg-blue-800 text-white">Código</th>
                    <th className="border p-3 text-center font-bold min-w-[200px] bg-blue-800 text-white">Nombre Persona</th>
                    <th className="border p-3 text-center font-bold min-w-[120px] bg-blue-800 text-white">Categoría</th>
                    <th className="border p-3 text-center font-bold min-w-[80px] bg-blue-800 text-white">Grupo</th>
                    <th className="border p-3 text-center font-bold min-w-[80px] bg-blue-800 text-white">Oficina</th>
                    <th className="border p-3 text-center font-bold min-w-[150px] bg-blue-800 text-white">Squad Lead</th>
                    {/* Detalles de jornadas con colores diferenciados */}
                    {Object.keys(staffingData[0].weeklyData).map(week => [
                        <th key={`${week}-facturables-proyecto`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-green-600 text-white">
                          Jornadas<br/>Facturables<br/>Proyecto
                        </th>,
                        <th key={`${week}-str-productos`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-green-600 text-white">
                          Jornadas<br/>STR<br/>Productos
                        </th>,
                        <th key={`${week}-availability`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-orange-300 text-gray-800">
                          Jornadas<br/>No Facturables<br/>Availability
                        </th>,
                        <th key={`${week}-management`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-orange-300 text-gray-800">
                          Jornadas<br/>No Facturables<br/>Management
                        </th>,
                        <th key={`${week}-sam`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-orange-300 text-gray-800">
                          Jornadas<br/>No Facturables<br/>SAM
                        </th>,
                        <th key={`${week}-otros`} className="border p-1 text-center font-bold min-w-[110px] text-xs bg-green-300 text-gray-800">
                          Jornadas<br/>Facturables<br/>Otros<br/>(Internal Activities)
                        </th>,
                        <th key={`${week}-no-disponibles`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-red-500 text-white">
                          Jornadas<br/>No<br/>Disponibles
                        </th>,
                        <th key={`${week}-total-dias`} className="border p-1 text-center font-bold min-w-[90px] text-xs bg-blue-400 text-white">
                          Total Días<br/>Laborables
                        </th>
                    ].flat())}
                  </tr>
                </thead>
                <tbody>
                  {staffingData.map(person => (
                    <tr key={person.personId}>
                      <td className="border border-white p-2 text-center bg-gray-200">{person.personCode}</td>
                      <td className="border border-white p-2 text-left bg-gray-200">{person.personName}</td>
                      <td className="border border-white p-2 text-center bg-gray-200">{person.categoria}</td>
                      <td className="border border-white p-2 text-center bg-gray-200">{person.grupo}</td>
                      <td className="border border-white p-2 text-center bg-gray-200">{person.oficina}</td>
                      <td className="border p-2 text-center">{person.squadLead}</td>
                      {Object.keys(person.weeklyData).map((weekKey) => {
                        const weekData = person.weeklyData[weekKey];
                        return (
                          <React.Fragment key={weekKey}>
                            <td className="border p-1 text-center">{weekData.jornadasFacturablesProyecto.toFixed(2)}</td>
                            <td className="border p-1 text-center">{weekData.jornadasSTRProductos.toFixed(2)}</td>
                            <td className="border p-1 text-center">{weekData.jornadasNoFacturablesAvailability.toFixed(2)}</td>
                            <td className="border p-1 text-center">{weekData.jornadasNoFacturablesManagement.toFixed(2)}</td>
                            <td className="border p-1 text-center">{weekData.jornadasNoFacturablesSAM.toFixed(2)}</td>
                            <td className="border p-1 text-center">{weekData.jornadasFacturablesOtros.toFixed(2)}</td>
                            <td className="border p-1 text-center">{weekData.jornadasNoDisponibles.toFixed(2)}</td>
                            <td className="border p-1 text-center font-bold">{weekData.totalDiasLaborables.toFixed(2)}</td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffingReport;