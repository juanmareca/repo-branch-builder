import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import spainCompleteMap from '../assets/spain-complete-map.png';
import melillaMap from '../assets/melilla-map.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, MapPin, Download, FileText, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Mapeo de comunidades autónomas con códigos e imágenes (ordenado alfabéticamente)
const REGIONS_DATA = {
  'Andalucía': { 
    code: 'AN', 
    apiCode: 'ES-AN',
    image: '/lovable-uploads/310be605-60a2-4f59-98a8-c110a9eb9ee9.png'
  },
  'Aragón': { 
    code: 'AR', 
    apiCode: 'ES-AR', 
    image: '/lovable-uploads/3e1f7e1f-f12b-484d-954a-06311df0f9b2.png'
  },
  'Asturias': { 
    code: 'AS', 
    apiCode: 'ES-AS',
    image: '/lovable-uploads/4cb208f1-f6e5-44e5-8bac-a01e74b4dcad.png'
  },
  'Baleares': { 
    code: 'IB', 
    apiCode: 'ES-IB',
    image: '/lovable-uploads/f5931f0a-2aae-4a3e-838a-c0007b2ed8c5.png'
  },
  'Canarias': { 
    code: 'CN', 
    apiCode: 'ES-CN',
    image: '/lovable-uploads/45f15320-667d-4ab9-b502-e7871b4aa798.png'
  },
  'Cantabria': { 
    code: 'CB', 
    apiCode: 'ES-CB',
    image: '/lovable-uploads/d7fcf4b2-cf30-45e9-8579-051f16c92596.png'
  },
  'Castilla-La Mancha': { 
    code: 'CM', 
    apiCode: 'ES-CM',
    image: '/lovable-uploads/56d4b070-28a9-4bf9-82b5-ac486ae8230f.png'
  },
  'Castilla y León': { 
    code: 'CL', 
    apiCode: 'ES-CL',
    image: '/lovable-uploads/f5e7b7f0-c358-428e-aaf8-f1e9850d6569.png'
  },
  'Cataluña': { 
    code: 'CT', 
    apiCode: 'ES-CT',
    image: '/lovable-uploads/186aa1d4-67f9-49eb-bd76-2a9ba5ad53f9.png'
  },
  'Ceuta': { 
    code: 'CE', 
    apiCode: 'ES-CE',
    image: '/lovable-uploads/4fdde556-e261-40b5-b29b-837ba5e9f580.png'
  },
  'Comunidad Valenciana': { 
    code: 'VC', 
    apiCode: 'ES-VC',
    image: '/lovable-uploads/6520a74d-7e6a-4118-82e9-b4b6b5d25f2e.png'
  },
  'Extremadura': { 
    code: 'EX', 
    apiCode: 'ES-EX',
    image: '/lovable-uploads/56ab5837-860f-4258-b028-2f368322e0bd.png'
  },
  'Galicia': { 
    code: 'GA', 
    apiCode: 'ES-GA',
    image: '/lovable-uploads/9248ae02-50fd-4e04-bedf-d317fe99cc29.png'
  },
  'La Rioja': { 
    code: 'RI', 
    apiCode: 'ES-RI',
    image: '/lovable-uploads/f81a073b-dc6b-4f0f-b008-4647345dd28c.png'
  },
  'Madrid': { 
    code: 'MD', 
    apiCode: 'ES-MD',
    image: '/lovable-uploads/accb8fc7-f554-4ddf-a697-a3614ca17891.png'
  },
  'Melilla': { 
    code: 'ML', 
    apiCode: 'ES-ML',
    image: melillaMap
  },
  'Murcia': {
    code: 'MC', 
    apiCode: 'ES-MC',
    image: '/lovable-uploads/d3755b2f-015a-46f1-9c1d-f1f7f590363a.png'
  },
  'Navarra': { 
    code: 'NC', 
    apiCode: 'ES-NC',
    image: '/lovable-uploads/71852a14-27c0-4b58-847b-b8567deb52cf.png'
  },
  'País Vasco': { 
    code: 'PV', 
    apiCode: 'ES-PV',
    image: '/lovable-uploads/fef2faae-f1af-4150-996e-224409e1b154.png'
  },
  'España': { 
    code: 'ES', 
    apiCode: 'ES',
    image: spainCompleteMap
  }
};

const MONTHS_OPTIONS = [
  { value: 'all', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

const YEARS_RANGE = Array.from({ length: 8 }, (_, i) => 2023 + i);

interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  counties?: string[];
  global: boolean;
}

export default function SpainHolidaysMap() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const { toast } = useToast();

  // Consulta a la API externa de festivos
  const { data: holidays, isLoading, error } = useQuery({
    queryKey: ['external-holidays', selectedYear],
    queryFn: async () => {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/ES`);
      if (!response.ok) {
        throw new Error('Error al obtener festivos de la API externa');
      }
      return response.json() as Promise<Holiday[]>;
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
  });

  // Filtrar festivos por región y mes
  const filteredHolidays = useMemo(() => {
    if (!holidays || !selectedRegion) return { national: [], regional: [], groupedRegional: new Map() };

    const regionData = REGIONS_DATA[selectedRegion as keyof typeof REGIONS_DATA];
    if (!regionData) return { national: [], regional: [], groupedRegional: new Map() };

    const filtered = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayMonth = holidayDate.getMonth() + 1;
      const matchesMonth = selectedMonth === 'all' || holidayMonth.toString() === selectedMonth;
      return matchesMonth;
    });

    const national = filtered.filter(holiday => holiday.global || !holiday.counties);
    
    // Si se selecciona "España", mostrar todos los festivos regionales
    let regional;
    if (selectedRegion === 'España') {
      regional = filtered.filter(holiday => holiday.counties && holiday.counties.length > 0);
    } else {
      regional = filtered.filter(holiday => 
        holiday.counties && holiday.counties.includes(regionData.apiCode)
      );
    }

    // Agrupar festivos regionales por fecha cuando es España
    const groupedRegional = new Map();
    if (selectedRegion === 'España') {
      regional.forEach(holiday => {
        const dateKey = holiday.date;
        if (!groupedRegional.has(dateKey)) {
          groupedRegional.set(dateKey, {
            ...holiday,
            regions: []
          });
        }
        
        // Obtener nombres de regiones para este festivo
        if (holiday.counties) {
          holiday.counties.forEach(county => {
            const regionName = Object.keys(REGIONS_DATA).find(
              key => REGIONS_DATA[key as keyof typeof REGIONS_DATA].apiCode === county
            );
            if (regionName && !groupedRegional.get(dateKey).regions.includes(regionName)) {
              groupedRegional.get(dateKey).regions.push(regionName);
            }
          });
        }
      });
    }

    return { national, regional, groupedRegional };
  }, [holidays, selectedRegion, selectedMonth]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHolidayOneLine = (holiday: Holiday) => {
    const formattedDate = formatDate(holiday.date);
    return { name: holiday.localName, date: formattedDate };
  };

  const handleRegionClick = useCallback((regionName: string) => {
    setSelectedRegion(regionName);
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (!selectedRegion || (!filteredHolidays.national.length && !filteredHolidays.regional.length)) {
      toast({
        title: "Sin datos",
        description: "No hay festivos para exportar",
        variant: "destructive",
      });
      return;
    }

    let csvData: any[] = [];

    // Agregar festivos nacionales
    const nationalData = filteredHolidays.national.map(h => ({
      'Fecha': formatDate(h.date),
      'Festivo': h.localName,
      'Tipo': 'Nacional',
      'Región': selectedRegion
    }));

    // Agregar festivos regionales
    let regionalData: any[] = [];
    if (selectedRegion === 'España') {
      // Para España, crear un registro por cada combinación festivo-región
      filteredHolidays.regional.forEach(holiday => {
        if (holiday.counties) {
          holiday.counties.forEach(county => {
            const regionName = Object.keys(REGIONS_DATA).find(
              key => REGIONS_DATA[key as keyof typeof REGIONS_DATA].apiCode === county
            );
            if (regionName) {
              regionalData.push({
                'Fecha': formatDate(holiday.date),
                'Festivo': holiday.localName,
                'Tipo': 'Regional',
                'Región': regionName
              });
            }
          });
        }
      });
    } else {
      regionalData = filteredHolidays.regional.map(h => ({
        'Fecha': formatDate(h.date),
        'Festivo': h.localName,
        'Tipo': 'Regional',
        'Región': selectedRegion
      }));
    }

    csvData = [...nationalData, ...regionalData];

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Festivos');
    XLSX.writeFile(wb, `festivos_${selectedRegion}_${selectedYear}.csv`);

    toast({
      title: "Descarga completada",
      description: "Archivo CSV descargado correctamente",
    });
  }, [selectedRegion, filteredHolidays, selectedYear, toast]);

  const handlePrintPDF = useCallback(() => {
    if (!selectedRegion || (!filteredHolidays.national.length && !filteredHolidays.regional.length)) {
      toast({
        title: "Sin datos",
        description: "No hay festivos para imprimir",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text(`Festivos ${selectedRegion} - ${selectedYear}`, 20, 30);
    
    let yPosition = 50;
    
    // Festivos nacionales
    if (filteredHolidays.national.length > 0) {
      doc.setFontSize(14);
      doc.text('Festivos Nacionales:', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      filteredHolidays.national.forEach(holiday => {
        doc.text(`• ${formatDate(holiday.date)} - ${holiday.localName}`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }
    
    // Festivos regionales
    if (filteredHolidays.regional.length > 0) {
      doc.setFontSize(14);
      const regionTitle = selectedRegion === 'España' ? 'Festivos Regionales:' : `Festivos de ${selectedRegion}:`;
      doc.text(regionTitle, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      if (selectedRegion === 'España') {
        // Para España, mostrar por región
        filteredHolidays.regional.forEach(holiday => {
          if (holiday.counties) {
            holiday.counties.forEach(county => {
              const regionName = Object.keys(REGIONS_DATA).find(
                key => REGIONS_DATA[key as keyof typeof REGIONS_DATA].apiCode === county
              );
              if (regionName) {
                doc.text(`• ${formatDate(holiday.date)} - ${holiday.localName} (${regionName})`, 25, yPosition);
                yPosition += 8;
              }
            });
          }
        });
      } else {
        filteredHolidays.regional.forEach(holiday => {
          doc.text(`• ${formatDate(holiday.date)} - ${holiday.localName}`, 25, yPosition);
          yPosition += 8;
        });
      }
    }
    
    doc.save(`festivos_${selectedRegion}_${selectedYear}.pdf`);

    toast({
      title: "PDF generado",
      description: "Archivo PDF descargado correctamente",
    });
  }, [selectedRegion, filteredHolidays, selectedYear, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando festivos oficiales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-destructive">
          <p className="text-lg font-semibold mb-2">Error al cargar los festivos</p>
          <p className="text-sm">Verifique su conexión a internet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Festivos Oficiales de España
        </h1>
        <p className="text-center text-muted-foreground">
          Consulta los festivos nacionales y autonómicos por comunidad y período
        </p>
      </div>

      {/* Controles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Seleccionar Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Año:</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS_RANGE.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Mes:</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_OPTIONS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRegion && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Acciones:</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintPDF}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-h-[500px]">
        {/* Mapa de España */}
        <div className="xl:col-span-1 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Comunidades Autónomas
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(REGIONS_DATA).map(([regionName, regionData]) => (
                    <div
                      key={regionName}
                      className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-200 hover:z-10 rounded-lg overflow-hidden border-2 ${
                        selectedRegion === regionName 
                          ? 'border-yellow-400 ring-2 ring-yellow-300 scale-105' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleRegionClick(regionName)}
                      onMouseEnter={() => setHoveredRegion(regionName)}
                      onMouseLeave={() => setHoveredRegion(null)}
                    >
                      {regionData.image ? (
                        <img
                          src={regionData.image}
                          alt={regionName}
                          className="w-full h-20 object-cover"
                        />
                      ) : (
                        <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500 text-center px-1">
                            {regionName}
                          </span>
                        </div>
                      )}
                      
                      {/* Overlay con nombre */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1">
                        <p className="text-xs font-medium text-center truncate">
                          {regionName}
                        </p>
                      </div>

                      {/* Indicador de selección */}
                      {selectedRegion === regionName && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white"></div>
                      )}

                      {/* Efecto hover */}
                      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                        hoveredRegion === regionName ? 'bg-opacity-20' : 'bg-opacity-0'
                      }`}></div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Haz clic en una comunidad autónoma para ver sus festivos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de resultados */}
        <div className="h-full flex flex-col">
          {selectedRegion ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Festivos en {selectedRegion}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {selectedYear}
                  </Badge>
                  <Badge variant="outline">
                    {selectedMonth === 'all' ? 'Todo el año' : MONTHS_OPTIONS.find(m => m.value === selectedMonth)?.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden">
                {/* Festivos Nacionales */}
                <div className="flex flex-col min-h-0 mb-2">
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 flex-shrink-0">
                    <Badge variant="default" className="bg-blue-500">
                      Nacional
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({filteredHolidays.national.length})
                    </span>
                  </h4>
                   <div className="space-y-2 overflow-y-auto max-h-32">
                    {filteredHolidays.national.length > 0 ? (
                       filteredHolidays.national.map((holiday, index) => {
                         const formattedHoliday = formatHolidayOneLine(holiday);
                         return (
                          <div key={index} className="p-2 bg-blue-50 border-blue-200 border rounded-lg">
                            <div className="text-blue-900 text-sm">
                              <span className="font-medium">{formattedHoliday.name}</span>
                              <span className="font-normal text-xs"> - {formattedHoliday.date}</span>
                            </div>
                          </div>
                        );
                       })
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No hay festivos nacionales para este período
                      </p>
                    )}
                  </div>
                </div>

                {/* Festivos Regionales */}
                <div className="flex flex-col flex-1 min-h-0">
                   <h4 className="font-semibold text-lg mb-3 flex items-center gap-2 flex-shrink-0">
                     <Badge variant="outline" className="border-orange-500 text-orange-700">
                       {selectedRegion === 'España' ? 'Todas las Comunidades' : selectedRegion}
                     </Badge>
                     <span className="text-sm text-muted-foreground">
                       ({selectedRegion === 'España' ? filteredHolidays.groupedRegional.size : filteredHolidays.regional.length})
                     </span>
                   </h4>
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {selectedRegion === 'España' ? (
                      // Mostrar festivos agrupados por fecha para España
                      filteredHolidays.groupedRegional.size > 0 ? (
                        Array.from(filteredHolidays.groupedRegional.values())
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((holiday, index) => {
                            const formattedHoliday = formatHolidayOneLine(holiday);
                            return (
                              <div key={index} className="p-3 bg-orange-50 border-orange-200 border rounded-lg">
                                <div className="text-orange-900">
                                  <div className="font-medium text-sm mb-1">{formattedHoliday.name}</div>
                                  <div className="font-normal text-xs mb-2">{formattedHoliday.date}</div>
                                  <div className="flex flex-wrap gap-1">
                                    {holiday.regions.map((region: string, regionIndex: number) => (
                                      <Badge key={regionIndex} variant="secondary" className="text-xs">
                                        {region}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No hay festivos regionales para este período
                        </p>
                      )
                    ) : (
                      // Mostrar festivos normales para regiones específicas
                      filteredHolidays.regional.length > 0 ? (
                         filteredHolidays.regional.map((holiday, index) => {
                           const formattedHoliday = formatHolidayOneLine(holiday);
                           return (
                            <div key={index} className="p-2 bg-orange-50 border-orange-200 border rounded-lg">
                              <div className="text-orange-900 text-sm">
                                <span className="font-medium">{formattedHoliday.name}</span>
                                <span className="font-normal text-xs"> - {formattedHoliday.date}</span>
                              </div>
                            </div>
                          );
                         })
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No hay festivos regionales para este período
                        </p>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-full text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecciona una comunidad</h3>
                <p className="text-muted-foreground">
                  Haz clic en el mapa para ver los festivos oficiales de cualquier comunidad autónoma
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}