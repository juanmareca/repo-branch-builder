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

// Mapeo de comunidades autónomas con códigos y coordenadas para el SVG
const REGIONS_DATA = {
  'Andalucía': { 
    code: 'AN', 
    color: '#FF6B6B',
    apiCode: 'ES-AN',
    path: 'M 100 320 L 220 320 L 220 380 L 180 400 L 120 400 L 100 380 Z'
  },
  'Aragón': { 
    code: 'AR', 
    color: '#4ECDC4',
    apiCode: 'ES-AR', 
    path: 'M 180 180 L 240 180 L 240 220 L 200 240 L 180 220 Z'
  },
  'Asturias': { 
    code: 'AS', 
    color: '#45B7D1',
    apiCode: 'ES-AS',
    path: 'M 80 120 L 140 120 L 140 160 L 80 160 Z'
  },
  'Baleares': { 
    code: 'IB', 
    color: '#96CEB4',
    apiCode: 'ES-IB',
    path: 'M 320 280 L 360 280 L 360 320 L 320 320 Z'
  },
  'Canarias': { 
    code: 'CN', 
    color: '#FFEAA7',
    apiCode: 'ES-CN',
    path: 'M 20 450 L 120 450 L 120 490 L 20 490 Z'
  },
  'Cantabria': { 
    code: 'CB', 
    color: '#DDA0DD',
    apiCode: 'ES-CB',
    path: 'M 140 120 L 180 120 L 180 160 L 140 160 Z'
  },
  'Castilla-La Mancha': { 
    code: 'CM', 
    color: '#F39C12',
    apiCode: 'ES-CM',
    path: 'M 140 220 L 200 220 L 200 280 L 140 280 Z'
  },
  'Castilla y León': { 
    code: 'CL', 
    color: '#E74C3C',
    apiCode: 'ES-CL',
    path: 'M 80 160 L 180 160 L 180 220 L 80 220 Z'
  },
  'Cataluña': { 
    code: 'CT', 
    color: '#9B59B6',
    apiCode: 'ES-CT',
    path: 'M 240 140 L 300 140 L 300 200 L 240 200 Z'
  },
  'Ceuta': { 
    code: 'CE', 
    color: '#1ABC9C',
    apiCode: 'ES-CE',
    path: 'M 140 420 L 160 420 L 160 440 L 140 440 Z'
  },
  'Comunidad Valenciana': { 
    code: 'VC', 
    color: '#3498DB',
    apiCode: 'ES-VC',
    path: 'M 200 240 L 260 240 L 260 320 L 200 320 Z'
  },
  'Extremadura': { 
    code: 'EX', 
    color: '#2ECC71',
    apiCode: 'ES-EX',
    path: 'M 80 240 L 140 240 L 140 320 L 80 320 Z'
  },
  'Galicia': { 
    code: 'GA', 
    color: '#E67E22',
    apiCode: 'ES-GA',
    path: 'M 20 120 L 80 120 L 80 200 L 20 200 Z'
  },
  'La Rioja': { 
    code: 'RI', 
    color: '#8E44AD',
    apiCode: 'ES-RI',
    path: 'M 160 160 L 200 160 L 200 180 L 160 180 Z'
  },
  'Madrid': { 
    code: 'MD', 
    color: '#E91E63',
    apiCode: 'ES-MD',
    path: 'M 160 200 L 200 200 L 200 240 L 160 240 Z'
  },
  'Melilla': { 
    code: 'ML', 
    color: '#FF9800',
    apiCode: 'ES-ML',
    path: 'M 180 420 L 200 420 L 200 440 L 180 440 Z'
  },
  'Murcia': { 
    code: 'MC', 
    color: '#795548',
    apiCode: 'ES-MC',
    path: 'M 200 280 L 240 280 L 240 320 L 200 320 Z'
  },
  'Navarra': { 
    code: 'NC', 
    color: '#607D8B',
    apiCode: 'ES-NC',
    path: 'M 180 140 L 220 140 L 220 180 L 180 180 Z'
  },
  'País Vasco': { 
    code: 'PV', 
    color: '#009688',
    apiCode: 'ES-PV',
    path: 'M 140 140 L 180 140 L 180 180 L 140 180 Z'
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
                <svg
                  viewBox="0 0 400 520"
                  className="w-full h-auto max-h-96"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
                >
                  {Object.entries(REGIONS_DATA).map(([regionName, regionData]) => (
                    <g key={regionName}>
                      <path
                        d={regionData.path}
                        fill={selectedRegion === regionName ? '#FFD700' : regionData.color}
                        stroke="#fff"
                        strokeWidth="2"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        style={{
                          filter: hoveredRegion === regionName ? 'brightness(1.2)' : 'none',
                          transform: selectedRegion === regionName ? 'scale(1.05)' : 'scale(1)',
                          transformOrigin: 'center'
                        }}
                        onClick={() => handleRegionClick(regionName)}
                        onMouseEnter={() => setHoveredRegion(regionName)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                      {/* Tooltip */}
                      {hoveredRegion === regionName && (
                        <text
                          x="200"
                          y="30"
                          textAnchor="middle"
                          className="fill-gray-800 text-sm font-semibold"
                          style={{ pointerEvents: 'none' }}
                        >
                          {regionName}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
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
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: REGIONS_DATA[selectedRegion as keyof typeof REGIONS_DATA]?.color,
                        color: REGIONS_DATA[selectedRegion as keyof typeof REGIONS_DATA]?.color
                      }}
                    >
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
                          className="p-3" 
                          style={{ 
                            backgroundColor: `${REGIONS_DATA[selectedRegion as keyof typeof REGIONS_DATA]?.color}20`,
                            borderColor: REGIONS_DATA[selectedRegion as keyof typeof REGIONS_DATA]?.color 
                          }}
                        >
                          <div className="font-medium text-gray-900">{holiday.localName}</div>
                          <div className="text-sm text-gray-700">{formatDate(holiday.date)}</div>
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