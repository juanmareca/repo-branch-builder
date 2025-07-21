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
import * as XLSX from 'xlsx';

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
          personName: person?.nombre || '',
          personCode: person?.num_pers || person?.cex || '',
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

  const exportToExcel = () => {
    if (staffingData.length === 0) return;

    const weeks = Object.keys(staffingData[0].weeklyData);
    
    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);

    // Headers principales (información personal)
    const mainHeaders = [
      'Código\nem', 'Nombre\nPersona', 'Categoría', 'Grupo', 'Oficina', 'Squad\nLead'
    ];

    // Crear estructura de headers compleja como en la imagen
    const row1: string[] = [...mainHeaders];
    const row2: string[] = new Array(mainHeaders.length).fill('');

    weeks.forEach((week, index) => {
      // Primera fila: nombre de la semana repetido para todas las columnas de esa semana
      for (let i = 0; i < 8; i++) {
        row1.push(week);
      }
      
      // Segunda fila: detalles específicos de cada columna
      row2.push(
        'Jornadas\nFacturables\nProyecto',
        'Jornadas\nSTR\nProductos', 
        'Jornadas\nNo\nFacturables\nAvailability',
        'Jornadas\nNo\nFacturables\nManagement',
        'Jornadas\nNo\nFacturables\nSAM',
        'Jornadas\nFacturables\nOtros\n(Internal\nActivities,\netc.)',
        'Jornadas\nNo\nDisponibles',
        'Total Días\nLaborables'
      );
    });

    // Crear datos
    const data = staffingData.map(person => {
      const row = [
        person.personCode,
        person.personName,
        person.categoria,
        person.grupo,
        person.oficina,
        person.squadLead
      ];

      weeks.forEach(week => {
        const weekData = person.weeklyData[week];
        row.push(
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

      return row;
    });

    // Información del período
    const periodInfo = [
      [`Informe de Staffing - ${format(startDate!, 'dd/MM/yyyy')} a ${format(endDate!, 'dd/MM/yyyy')}`],
      [`Squad lead: ${squadLeadName.toUpperCase()}`],
      []
    ];

    // Agregar contenido al worksheet
    XLSX.utils.sheet_add_aoa(ws, periodInfo, { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [row1], { origin: 'A4' });
    XLSX.utils.sheet_add_aoa(ws, [row2], { origin: 'A5' });
    XLSX.utils.sheet_add_aoa(ws, data, { origin: 'A6' });

    // Configurar anchos de columna
    const colWidths = [
      { wch: 8 },   // Código empleado
      { wch: 20 },  // Nombre Persona
      { wch: 12 },  // Categoría
      { wch: 10 },  // Grupo
      { wch: 10 },  // Oficina
      { wch: 15 },  // Squad Lead
    ];

    // Agregar anchos para columnas de semanas (más estrechas)
    weeks.forEach(() => {
      for (let i = 0; i < 8; i++) {
        colWidths.push({ wch: 8 });
      }
    });

    ws['!cols'] = colWidths;

    // Estilos mejorados
    const titleStyle = {
      font: { bold: true, color: { rgb: "000000" }, size: 14, name: "Calibri" },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const subtitleStyle = {
      font: { bold: false, color: { rgb: "666666" }, size: 11, name: "Calibri" },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const headerMainStyle = {
      font: { bold: true, color: { rgb: "000000" }, size: 10, name: "Calibri" },
      fill: { fgColor: { rgb: "D9D9D9" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const headerWeekStyle = {
      font: { bold: true, color: { rgb: "000000" }, size: 9, name: "Calibri" },
      fill: { fgColor: { rgb: "E6E6E6" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const headerDetailStyle = {
      font: { bold: true, color: { rgb: "000000" }, size: 8, name: "Calibri" },
      fill: { fgColor: { rgb: "F2F2F2" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const dataPersonalStyle = {
      font: { size: 9, name: "Calibri" },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    const dataNumericStyle = {
      font: { size: 9, name: "Calibri" },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    // Aplicar estilos al título y subtítulo
    if (ws['A1']) ws['A1'].s = titleStyle;
    if (ws['A2']) ws['A2'].s = subtitleStyle;

    // Aplicar estilos a headers principales (fila 4)
    for (let col = 0; col < mainHeaders.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: col });
      if (ws[cellRef]) ws[cellRef].s = headerMainStyle;
    }

    // Aplicar estilos a headers de semanas (fila 4, columnas de semanas)
    for (let col = mainHeaders.length; col < row1.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: col });
      if (ws[cellRef]) ws[cellRef].s = headerWeekStyle;
    }

    // Aplicar estilos a headers de detalle (fila 5)
    for (let col = 0; col < row2.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: col });
      if (ws[cellRef]) {
        if (col < mainHeaders.length) {
          ws[cellRef].s = headerMainStyle;
        } else {
          ws[cellRef].s = headerDetailStyle;
        }
      }
    }

    // Aplicar estilos a datos
    for (let row = 5; row < 5 + data.length; row++) {
      for (let col = 0; col < row1.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (ws[cellRef]) {
          if (col < mainHeaders.length) {
            ws[cellRef].s = dataPersonalStyle;
          } else {
            // Colores sutiles para diferentes tipos de jornadas
            const colIndex = (col - mainHeaders.length) % 8;
            let fillColor = "FFFFFF";
            
            switch(colIndex) {
              case 0: fillColor = "E8F5E8"; break; // Facturables Proyecto - verde claro
              case 1: fillColor = "E8F0FF"; break; // STR Productos - azul claro
              case 2: fillColor = "FFF8E8"; break; // Availability - amarillo claro
              case 3: fillColor = "F0E8FF"; break; // Management - morado claro
              case 4: fillColor = "FFE8E8"; break; // SAM - rojo claro
              case 5: fillColor = "E8FFF8"; break; // Otros - verde menta
              case 6: fillColor = "F5F5F5"; break; // No Disponibles - gris
              case 7: fillColor = "E0E0E0"; break; // Total - gris oscuro
            }
            
            ws[cellRef].s = {
              ...dataNumericStyle,
              fill: { fgColor: { rgb: fillColor } },
              font: colIndex === 7 ? 
                { bold: true, size: 9, name: "Calibri" } : 
                { size: 9, name: "Calibri" }
            };
          }
        }
      }
    }

    // Merge cells para agrupar semanas
    const merges = [];
    
    // Merge del título
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(row1.length - 1, 15) } });

    // Merge de los headers de semanas
    let currentCol = mainHeaders.length;
    weeks.forEach(() => {
      merges.push({ s: { r: 3, c: currentCol }, e: { r: 3, c: currentCol + 7 } });
      currentCol += 8;
    });

    ws['!merges'] = merges;

    // Congelar paneles
    ws['!freeze'] = { xSplit: mainHeaders.length, ySplit: 5 };

    // Filtros automáticos
    ws['!autofilter'] = { ref: `A5:${XLSX.utils.encode_cell({ r: 4 + data.length, c: row1.length - 1 })}` };

    XLSX.utils.book_append_sheet(wb, ws, 'Informe Staffing');
    
    const fileName = `informe_staffing_${squadLeadName.toLowerCase().replace(/\s+/g, '_')}_${format(startDate!, 'yyyyMMdd')}_${format(endDate!, 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "🎨 Excel de lujo generado!",
      description: `Archivo: ${fileName}`,
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
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Código</th>
                    <th className="border p-2 text-left">Nombre Persona</th>
                    <th className="border p-2 text-left">Categoría</th>
                    <th className="border p-2 text-left">Grupo</th>
                    <th className="border p-2 text-left">Oficina</th>
                    <th className="border p-2 text-left">Squad Lead</th>
                    {Object.keys(staffingData[0].weeklyData).map(week => (
                      <React.Fragment key={week}>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>Facturables<br/>Proyecto</th>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>STR<br/>Productos</th>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>No<br/>Facturables<br/>Availability</th>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>No<br/>Facturables<br/>Management</th>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>No<br/>Facturables<br/>SAM</th>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>Facturables<br/>Otros<br/>(Internal<br/>Activities, etc.)</th>
                        <th className="border p-1 text-center">{week}<br/>Jornadas<br/>No<br/>Disponibles</th>
                        <th className="border p-1 text-center">{week}<br/>Total Días<br/>Laborables</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffingData.map(person => (
                    <tr key={person.personId}>
                      <td className="border p-2">{person.personCode}</td>
                      <td className="border p-2">{person.personName}</td>
                      <td className="border p-2">{person.categoria}</td>
                      <td className="border p-2">{person.grupo}</td>
                      <td className="border p-2">{person.oficina}</td>
                      <td className="border p-2">{person.squadLead}</td>
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
                            <td className="border p-1 text-center">{weekData.totalDiasLaborables.toFixed(2)}</td>
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