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
            squad_lead
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
    
    // Crear headers
    const headers = [
      'Código empleado',
      'Nombre Persona',
      'Categoría',
      'Grupo',
      'Oficina',
      'Squad Lead'
    ];

    weeks.forEach(week => {
      headers.push(
        `${week} - Jornadas Facturables Proyecto`,
        `${week} - Jornadas STR Productos`,
        `${week} - Jornadas No Facturables Availability`,
        `${week} - Jornadas No Facturables Management`,
        `${week} - Jornadas No Facturables SAM`,
        `${week} - Jornadas Facturables Otros`,
        `${week} - Jornadas No Disponibles`,
        `${week} - Total Días Laborables`
      );
    });

    // Crear datos
    const data = staffingData.map(person => {
      const row = [
        person.personId.substring(0, 8),
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

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Agregar información del período
    const periodInfo = [
      [`Período considerado: ${format(startDate!, 'dd/MM/yyyy')} - ${format(endDate!, 'dd/MM/yyyy')}`],
      [`Squad lead: ${squadLeadName}`],
      []
    ];
    
    XLSX.utils.sheet_add_aoa(ws, periodInfo, { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(ws, [headers, ...data], { origin: 'A4' });
    
    XLSX.utils.book_append_sheet(wb, ws, 'Informe Staffing');
    
    const fileName = `informe_staffing_${format(startDate!, 'yyyyMMdd')}_${format(endDate!, 'yyyyMMdd')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Éxito",
      description: "Informe exportado correctamente",
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
                      <td className="border p-2">{person.personId.substring(0, 8)}</td>
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