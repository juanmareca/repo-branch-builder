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

    // =================== ESTRUCTURA EXACTA COMO LA IMAGEN ===================
    
    // FILA 1: Título principal
    const titleRow = [`INFORME DE STAFFING - ${squadLeadName.toUpperCase()}`];
    
    // FILA 2: Período
    const periodRow = [`Período: ${format(startDate!, 'dd/MM/yyyy')} - ${format(endDate!, 'dd/MM/yyyy')}`];
    
    // FILA 3: Generado
    const generatedRow = [`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`];
    
    // FILA 4: Vacía
    const emptyRow = [''];
    
    // FILA 5: Headers principales (Código, Nombre, etc.) + SEMANA01, SEMANA01, etc.
    const headerRow1 = [
      'Código empleado', 'Nombre Persona', 'Categoría', 'Grupo', 'Oficina', 'Squad Lead'
    ];
    
    // FILA 6: Sub-headers (vacíos para info personal) + detalles de cada columna de semana
    const headerRow2 = [
      '', '', '', '', '', '' // Vacíos para las columnas de información personal
    ];
    
    // Agregar headers de semanas CORRECTAMENTE como en el ejemplo
    weeks.forEach(week => {
      // PRIMERA FILA: Solo el nombre de la semana UNA VEZ (se hará merge después)
      headerRow1.push(week, '', '', '', '', '', '', ''); // Una para la semana, 7 vacías para merge
      
      // SEGUNDA FILA: Los detalles específicos de cada columna
      headerRow2.push(
        'Facturables Proyecto',
        'STR Productos', 
        'No Fact. Availability',
        'No Fact. Management',
        'No Fact. SAM',
        'Fact. Otros (Internal)',
        'No Disponibles',
        'Total Días Lab.'
      );
    });

    // DATOS
    const dataRows = staffingData.map(person => {
      const row = [
        person.personCode || person.personId.substring(0, 8),
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

    // =================== AGREGAR TODO AL WORKSHEET ===================
    
    XLSX.utils.sheet_add_aoa(ws, [titleRow], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [periodRow], { origin: 'A2' });
    XLSX.utils.sheet_add_aoa(ws, [generatedRow], { origin: 'A3' });
    XLSX.utils.sheet_add_aoa(ws, [emptyRow], { origin: 'A4' });
    XLSX.utils.sheet_add_aoa(ws, [headerRow1], { origin: 'A5' });
    XLSX.utils.sheet_add_aoa(ws, [headerRow2], { origin: 'A6' });
    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A7' });

    // =================== ESTILOS PROFESIONALES Y HERMOSOS ===================
    
    // Configurar anchos de columna GENEROSOS
    const colWidths = [
      { wch: 12 },  // Código empleado
      { wch: 35 },  // Nombre Persona (MUY ANCHO)
      { wch: 20 },  // Categoría
      { wch: 15 },  // Grupo
      { wch: 12 },  // Oficina
      { wch: 25 },  // Squad Lead
    ];

    // Columnas de semanas ANCHAS para que se vea todo
    weeks.forEach(() => {
      for (let i = 0; i < 8; i++) {
        colWidths.push({ wch: 12 }); // Todas las semanas con buen ancho
      }
    });

    ws['!cols'] = colWidths;

    // =================== ESTILOS SÚPER PROFESIONALES Y HERMOSOS ===================
    
    // Título principal - IMPACTO MÁXIMO
    const titleStyle = {
      font: { 
        bold: true, 
        color: { rgb: "FFFFFF" }, 
        size: 18, 
        name: "Calibri" 
      },
      fill: { fgColor: { rgb: "1F4E79" } }, // Azul corporativo oscuro
      alignment: { 
        horizontal: "center", 
        vertical: "center" 
      },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } }
      }
    };

    // Subtítulos elegantes
    const subtitleStyle = {
      font: { 
        bold: true, 
        color: { rgb: "1F4E79" }, 
        size: 12, 
        name: "Calibri" 
      },
      fill: { fgColor: { rgb: "F2F2F2" } }, // Fondo gris muy claro
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    // Headers principales - SÚPER ELEGANTE
    const headerMainStyle = {
      font: { 
        bold: true, 
        color: { rgb: "FFFFFF" }, 
        size: 11, 
        name: "Calibri" 
      },
      fill: { fgColor: { rgb: "4472C4" } }, // Azul profesional brillante
      alignment: { 
        horizontal: "center", 
        vertical: "center", 
        wrapText: true 
      },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } }
      }
    };

    // Headers de semanas - DESTACADOS EN AZUL MEDIO
    const headerWeekStyle = {
      font: { 
        bold: true, 
        color: { rgb: "FFFFFF" }, 
        size: 11, 
        name: "Calibri" 
      },
      fill: { fgColor: { rgb: "5B9BD5" } }, // Azul medio vibrante
      alignment: { 
        horizontal: "center", 
        vertical: "center", 
        wrapText: true 
      },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } }
      }
    };

    // Sub-headers detallados - AZUL CLARO HERMOSO
    const headerDetailStyle = {
      font: { 
        bold: true, 
        color: { rgb: "1F4E79" }, 
        size: 10, 
        name: "Calibri" 
      },
      fill: { fgColor: { rgb: "B4C6E7" } }, // Azul claro elegante
      alignment: { 
        horizontal: "center", 
        vertical: "center", 
        wrapText: true 
      },
      border: {
        top: { style: "thin", color: { rgb: "1F4E79" } },
        bottom: { style: "thin", color: { rgb: "1F4E79" } },
        left: { style: "thin", color: { rgb: "1F4E79" } },
        right: { style: "thin", color: { rgb: "1F4E79" } }
      }
    };

    // Datos personales - PROFESIONAL Y ELEGANTE
    const dataPersonalStyle = {
      font: { 
        size: 10, 
        name: "Calibri",
        color: { rgb: "000000" }
      },
      fill: { fgColor: { rgb: "F8F9FA" } }, // Fondo gris muy suave
      alignment: { 
        horizontal: "left", 
        vertical: "center" 
      },
      border: {
        top: { style: "thin", color: { rgb: "D0D0D0" } },
        bottom: { style: "thin", color: { rgb: "D0D0D0" } },
        left: { style: "thin", color: { rgb: "D0D0D0" } },
        right: { style: "thin", color: { rgb: "D0D0D0" } }
      }
    };

    // =================== APLICAR ESTILOS A TODAS LAS CELDAS ===================
    
    // Título principal (fila 1)
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!ws[titleCell]) ws[titleCell] = { v: titleRow[0] };
    ws[titleCell].s = titleStyle;
    
    // Subtítulos (filas 2 y 3)
    const periodCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
    if (!ws[periodCell]) ws[periodCell] = { v: periodRow[0] };
    ws[periodCell].s = subtitleStyle;
    
    const generatedCell = XLSX.utils.encode_cell({ r: 2, c: 0 });
    if (!ws[generatedCell]) ws[generatedCell] = { v: generatedRow[0] };
    ws[generatedCell].s = subtitleStyle;

    // Headers principales (fila 5) - APLICAR ESTILOS PERFECTOS
    for (let col = 0; col < headerRow1.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: col });
      if (!ws[cellRef]) ws[cellRef] = { v: headerRow1[col] || '' };
      
      if (col < 6) {
        // Columnas de información personal
        ws[cellRef].s = headerMainStyle;
      } else {
        // Columnas de semanas
        ws[cellRef].s = headerWeekStyle;
      }
    }

    // Sub-headers (fila 6) - PERFECTOS Y HERMOSOS
    for (let col = 0; col < headerRow2.length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 5, c: col });
      if (!ws[cellRef]) ws[cellRef] = { v: headerRow2[col] || '' };
      
      if (col < 6) {
        // Columnas de información personal (vacías pero con estilo)
        ws[cellRef].s = headerMainStyle;
      } else {
        // Detalles de semanas
        ws[cellRef].s = headerDetailStyle;
      }
    }

    // Datos con colores temáticos ESPECTACULARES
    for (let row = 0; row < dataRows.length; row++) {
      for (let col = 0; col < headerRow1.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: 6 + row, c: col });
        const cellValue = dataRows[row][col];
        
        if (!ws[cellRef]) ws[cellRef] = { v: cellValue || '' };
        
        if (col < 6) {
          // Datos personales con fondo suave
          ws[cellRef].s = dataPersonalStyle;
        } else {
          // Datos numéricos con colores temáticos HERMOSOS
          const colIndex = (col - 6) % 8;
          let fillColor = "FFFFFF";
          let fontColor = "000000";
          let isBold = false;
          
          switch(colIndex) {
            case 0: // Facturables Proyecto
              fillColor = "D5E8D4"; // Verde elegante
              fontColor = "2E7D32";
              break;
            case 1: // STR Productos  
              fillColor = "BBDEFB"; // Azul suave
              fontColor = "1565C0";
              break;
            case 2: // Availability
              fillColor = "FFF9C4"; // Amarillo suave
              fontColor = "F57F17";
              break;
            case 3: // Management
              fillColor = "E1BEE7"; // Morado elegante
              fontColor = "7B1FA2";
              break;
            case 4: // SAM
              fillColor = "FFCDD2"; // Rojo suave
              fontColor = "C62828";
              break;
            case 5: // Otros
              fillColor = "C8E6C9"; // Verde menta
              fontColor = "388E3C";
              break;
            case 6: // No Disponibles
              fillColor = "F5F5F5"; // Gris neutro
              fontColor = "757575";
              break;
            case 7: // Total Días Laborables
              fillColor = "CFD8DC"; // Gris azulado
              fontColor = "37474F";
              isBold = true;
              break;
          }
          
          ws[cellRef].s = {
            font: { 
              size: 10, 
              name: "Calibri",
              bold: isBold,
              color: { rgb: fontColor }
            },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { 
              horizontal: "center", 
              vertical: "center" 
            },
            border: {
              top: { style: "thin", color: { rgb: "BDBDBD" } },
              bottom: { style: "thin", color: { rgb: "BDBDBD" } },
              left: { style: "thin", color: { rgb: "BDBDBD" } },
              right: { style: "thin", color: { rgb: "BDBDBD" } }
            }
          };
        }
      }
    }

    // =================== FUNCIONALIDADES AVANZADAS ===================
    
    // Merge cells para el título (que ocupe TODA la fila y se vea espectacular)
    const merges = [];
    merges.push({ 
      s: { r: 0, c: 0 }, 
      e: { r: 0, c: Math.min(headerRow1.length - 1, 25) } // Más ancho
    });

    // Merge cells para agrupar semanas visualmente (SIN PROBLEMAS)
    let currentCol = 6;
    weeks.forEach(() => {
      if (currentCol + 7 < headerRow1.length) { // Verificar que no se salga del rango
        merges.push({ 
          s: { r: 4, c: currentCol }, 
          e: { r: 4, c: currentCol + 7 } 
        });
      }
      currentCol += 8;
    });

    ws['!merges'] = merges;

    // Congelar paneles - SÚPER ÚTIL
    ws['!freeze'] = { xSplit: 6, ySplit: 6 };

    // ¡QUITAR los filtros automáticos que están haciendo que se vea horrible!
    // ws['!autofilter'] = { 
    //   ref: `A6:${XLSX.utils.encode_cell({ 
    //     r: 5 + dataRows.length, 
    //     c: headerRow1.length - 1 
    //   })}` 
    // };

    // Agregar al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Informe Staffing');
    
    // Nombre de archivo inteligente
    const fileName = `staffing_${squadLeadName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${format(startDate!, 'yyyyMMdd')}_${format(endDate!, 'yyyyMMdd')}.xlsx`;
    
    // Descargar
    XLSX.writeFile(wb, fileName);

    toast({
      title: "🎨 ¡OBRA MAESTRA CREADA!",
      description: `Excel profesional generado: ${fileName}`,
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
                    <th className="border p-3 text-center font-bold min-w-[80px]">Código</th>
                    <th className="border p-3 text-center font-bold min-w-[200px]">Nombre Persona</th>
                    <th className="border p-3 text-center font-bold min-w-[120px]">Categoría</th>
                    <th className="border p-3 text-center font-bold min-w-[80px]">Grupo</th>
                    <th className="border p-3 text-center font-bold min-w-[80px]">Oficina</th>
                    <th className="border p-3 text-center font-bold min-w-[150px]">Squad Lead</th>
                    {Object.keys(staffingData[0].weeklyData).map(week => (
                      <React.Fragment key={week}>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>Facturables<br/>Proyecto</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>STR<br/>Productos</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>No<br/>Facturables<br/>Availability</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>No<br/>Facturables<br/>Management</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>No<br/>Facturables<br/>SAM</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[110px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>Facturables<br/>Otros<br/>(Internal<br/>Activities, etc.)</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Jornadas<br/>No<br/>Disponibles</span>
                        </th>
                        <th className="border p-2 text-center font-bold min-w-[90px]">
                          {week}<br/>
                          <span className="text-xs font-normal">Total Días<br/>Laborables</span>
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffingData.map(person => (
                    <tr key={person.personId}>
                      <td className="border p-2 text-center">{person.personCode}</td>
                      <td className="border p-2 text-left">{person.personName}</td>
                      <td className="border p-2 text-center">{person.categoria}</td>
                      <td className="border p-2 text-center">{person.grupo}</td>
                      <td className="border p-2 text-center">{person.oficina}</td>
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