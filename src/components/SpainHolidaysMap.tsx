import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, MapPin, Download, FileText, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Mapeo de comunidades autónomas con códigos e imágenes
const REGIONS_DATA = {
  'Galicia': { 
    code: 'GA', 
    apiCode: 'ES-GA',
    image: '/lovable-uploads/9248ae02-50fd-4e04-bedf-d317fe99cc29.png'
  },
  'Andalucía': { 
    code: 'AN', 
    apiCode: 'ES-AN',
    image: '/lovable-uploads/acabfdf3-b391-4e0d-b764-82e6c102790e.png'
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
    image: '/lovable-uploads/bfdc98f8-7762-4f74-9d56-74de94379b37.png'
  },
  'Canarias': { 
    code: 'CN', 
    apiCode: 'ES-CN',
    image: null // Pendiente de imagen
  },
  'Cantabria': { 
    code: 'CB', 
    apiCode: 'ES-CB',
    image: '/lovable-uploads/d7fcf4b2-cf30-45e9-8579-051f16c92596.png'
  },
  'Castilla-La Mancha': { 
    code: 'CM', 
    apiCode: 'ES-CM',
    image: '/lovable-uploads/dce93539-da1c-4a81-9463-7dd483fd6e0b.png'
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
    image: '/lovable-uploads/e3a40e37-1407-4bff-88a4-da2404014924.png'
  },
  'Comunidad Valenciana': { 
    code: 'VC', 
    apiCode: 'ES-VC',
    image: null // Pendiente de imagen
  },
  'Extremadura': { 
    code: 'EX', 
    apiCode: 'ES-EX',
    image: '/lovable-uploads/56ab5837-860f-4258-b028-2f368322e0bd.png'
  },
  'La Rioja': { 
    code: 'RI', 
    apiCode: 'ES-RI',
    image: '/lovable-uploads/ba8ced52-2bfc-492b-9e12-a940338dd40b.png'
  },
  'Madrid': { 
    code: 'MD', 
    apiCode: 'ES-MD',
    image: '/lovable-uploads/accb8fc7-f554-4ddf-a697-a3614ca17891.png'
  },
  'Melilla': { 
    code: 'ML', 
    apiCode: 'ES-ML',
    image: null // Pendiente de imagen
  },
  'Murcia': {
    code: 'MC', 
    apiCode: 'ES-MC',
    image: null // Pendiente de imagen
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
    if (!holidays || !selectedRegion) return { national: [], regional: [] };

    const regionData = REGIONS_DATA[selectedRegion as keyof typeof REGIONS_DATA];
    if (!regionData) return { national: [], regional: [] };

    const filtered = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayMonth = holidayDate.getMonth() + 1;
      const matchesMonth = selectedMonth === 'all' || holidayMonth.toString() === selectedMonth;
      return matchesMonth;
    });

    const national = filtered.filter(holiday => holiday.global || !holiday.counties);
    const regional = filtered.filter(holiday => 
      holiday.counties && holiday.counties.includes(regionData.apiCode)
    );

    return { national, regional };
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

    const allHolidays = [
      ...filteredHolidays.national.map(h => ({ ...h, tipo: 'Nacional' })),
      ...filteredHolidays.regional.map(h => ({ ...h, tipo: 'Regional' }))
    ];

    const csvData = allHolidays.map(holiday => ({
      'Fecha': formatDate(holiday.date),
      'Festivo': holiday.localName,
      'Tipo': holiday.tipo,
      'Región': selectedRegion
    }));

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
      doc.text(`Festivos de ${selectedRegion}:`, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      filteredHolidays.regional.forEach(holiday => {
        doc.text(`• ${formatDate(holiday.date)} - ${holiday.localName}`, 25, yPosition);
        yPosition += 8;
      });
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapa de España */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Comunidades Autónomas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Object.entries(REGIONS_DATA).map(([regionName, regionData]) => (
                    <div
                      key={regionName}
                      className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-lg overflow-hidden border-2 ${
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
        <div>
          {selectedRegion ? (
            <Card>
              <CardHeader>
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
              <CardContent className="space-y-6">
                {/* Festivos Nacionales */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-500">
                      Nacional
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({filteredHolidays.national.length})
                    </span>
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {filteredHolidays.national.length > 0 ? (
                      filteredHolidays.national.map((holiday, index) => (
                        <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                          <div className="font-medium text-blue-900">{holiday.localName}</div>
                          <div className="text-sm text-blue-700">{formatDate(holiday.date)}</div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No hay festivos nacionales para este período
                      </p>
                    )}
                  </div>
                </div>

                {/* Festivos Regionales */}
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge variant="outline" className="border-orange-500 text-orange-700">
                      {selectedRegion}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ({filteredHolidays.regional.length})
                    </span>
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {filteredHolidays.regional.length > 0 ? (
                       filteredHolidays.regional.map((holiday, index) => (
                         <Card 
                           key={index} 
                           className="p-3 bg-orange-50 border-orange-200"
                         >
                           <div className="font-medium text-orange-900">{holiday.localName}</div>
                           <div className="text-sm text-orange-700">{formatDate(holiday.date)}</div>
                         </Card>
                       ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No hay festivos regionales para este período
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
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