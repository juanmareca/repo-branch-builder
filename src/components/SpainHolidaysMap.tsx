import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mapeo de comunidades autónomas con colores
const REGIONS_MAP = {
  'Galicia': { code: 'GA', color: '#d49ca9' },
  'Asturias': { code: 'AS', color: '#b8d4a8' },
  'Cantabria': { code: 'CB', color: '#a8c5e8' },
  'País Vasco': { code: 'PV', color: '#d4a8d4' },
  'Navarra': { code: 'NC', color: '#d4b8a8' },
  'La Rioja': { code: 'RI', color: '#e8a8c5' },
  'Cataluña': { code: 'CT', color: '#d4d4a8' },
  'Aragón': { code: 'AR', color: '#a8d4a8' },
  'Castilla y León': { code: 'CL', color: '#a8c5e8' },
  'Madrid': { code: 'MD', color: '#e8a8e8' },
  'Castilla-La Mancha': { code: 'CM', color: '#e8c5e8' },
  'Extremadura': { code: 'EX', color: '#c5a8e8' },
  'Comunidad Valenciana': { code: 'VC', color: '#d4a8a8' },
  'Murcia': { code: 'MC', color: '#a8e8a8' },
  'Andalucía': { code: 'AN', color: '#d4a8a8' },
  'Canarias': { code: 'CN', color: '#a8a8e8' },
  'Baleares': { code: 'IB', color: '#e8e8a8' },
  'Ceuta': { code: 'CE', color: '#a8e8e8' },
  'Melilla': { code: 'ML', color: '#e8a8a8' }
};

const MONTHS_CHRONOLOGICAL = [
  { value: 'all', label: 'TODOS' },
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

const YEARS_RANGE = { start: 2025, end: 2035 };

export default function SpainHolidaysMap() {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lista de regiones en orden alfabético
  const regions = [
    { name: 'Andalucía', color: '#d4a8a8' },
    { name: 'Aragón', color: '#a8d4a8' },
    { name: 'Asturias', color: '#b8d4a8' },
    { name: 'Baleares', color: '#e8e8a8' },
    { name: 'Canarias', color: '#a8a8e8' },
    { name: 'Cantabria', color: '#a8c5e8' },
    { name: 'Castilla-La Mancha', color: '#e8c5e8' },
    { name: 'Castilla y León', color: '#a8c5e8' },
    { name: 'Cataluña', color: '#d4d4a8' },
    { name: 'Ceuta', color: '#a8e8e8' },
    { name: 'Comunidad Valenciana', color: '#d4a8a8' },
    { name: 'Extremadura', color: '#c5a8e8' },
    { name: 'Galicia', color: '#d49ca9' },
    { name: 'La Rioja', color: '#e8a8c5' },
    { name: 'Madrid', color: '#e8a8e8' },
    { name: 'Melilla', color: '#e8a8a8' },
    { name: 'Murcia', color: '#a8e8a8' },
    { name: 'Navarra', color: '#d4b8a8' },
    { name: 'País Vasco', color: '#d4a8d4' }
  ];

  // Consulta para obtener festivos
  const { data: holidays, isLoading, error } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('pais', 'España')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .order('date');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filtrar festivos nacionales
  const filteredNationalHolidays = useMemo(() => {
    if (!holidays || !selectedRegion) return [];
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayMonth = holidayDate.getMonth() + 1;
      
      const matchesMonth = selectedMonth === 'all' || holidayMonth.toString() === selectedMonth;
      const isNational = holiday.comunidad_autonoma === 'NACIONAL' || holiday.comunidad_autonoma === '';
      
      return matchesMonth && isNational;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, selectedMonth, selectedRegion]);

  // Filtrar festivos regionales
  const filteredRegionalHolidays = useMemo(() => {
    if (!holidays || !selectedRegion) return [];
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayMonth = holidayDate.getMonth() + 1;
      
      const matchesMonth = selectedMonth === 'all' || holidayMonth.toString() === selectedMonth;
      const matchesRegion = holiday.comunidad_autonoma === selectedRegion;
      
      return matchesMonth && matchesRegion;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, selectedMonth, selectedRegion]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedRegion(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando festivos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error al cargar los festivos</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div className="flex gap-6 mb-6">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(
              { length: YEARS_RANGE.end - YEARS_RANGE.start + 1 },
              (_, i) => YEARS_RANGE.start + i
            ).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_CHRONOLOGICAL.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6 relative">
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl">
            <div className="w-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
                Comunidades Autónomas de España
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {regions.map((region) => (
                  <div
                    key={region.name}
                    onClick={() => handleRegionClick(region.name)}
                    className="cursor-pointer p-3 rounded-lg border-2 border-white/50 hover:border-white hover:scale-105 transition-all duration-300 text-center shadow-sm hover:shadow-md"
                    style={{ backgroundColor: region.color }}
                  >
                    <div className="text-sm font-semibold text-white drop-shadow-md">
                      {region.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedRegion && (
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Información de {selectedRegion}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Haz clic en la región para ver sus festivos en el panel lateral.
                </p>
                <Button onClick={() => handleRegionClick(selectedRegion)}>
                  Ver Festivos
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-xl transform transition-transform duration-300 z-50 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Festivos en {selectedRegion}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeSidebar}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Festivos Nacionales */}
              <div>
                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Nacional</Badge>
                  ({filteredNationalHolidays.length} festivos)
                </h4>
                <div className="space-y-3">
                  {filteredNationalHolidays.length > 0 ? (
                    filteredNationalHolidays.map((holiday, index) => (
                      <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                        <div className="font-medium text-blue-900">{holiday.festivo}</div>
                        <div className="text-sm text-blue-700">{formatDate(holiday.date)}</div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No hay festivos nacionales para el período seleccionado
                    </p>
                  )}
                </div>
              </div>

              {/* Festivos Regionales */}
              <div>
                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                  <Badge variant="outline" style={{ borderColor: REGIONS_MAP[selectedRegion as keyof typeof REGIONS_MAP]?.color }}>
                    {selectedRegion}
                  </Badge>
                  ({filteredRegionalHolidays.length} festivos)
                </h4>
                <div className="space-y-3">
                  {filteredRegionalHolidays.length > 0 ? (
                    filteredRegionalHolidays.map((holiday, index) => (
                      <Card 
                        key={index} 
                        className="p-3" 
                        style={{ 
                          backgroundColor: `${REGIONS_MAP[selectedRegion as keyof typeof REGIONS_MAP]?.color}20`,
                          borderColor: REGIONS_MAP[selectedRegion as keyof typeof REGIONS_MAP]?.color 
                        }}
                      >
                        <div className="font-medium text-gray-900">{holiday.festivo}</div>
                        <div className="text-sm text-gray-700">{formatDate(holiday.date)}</div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No hay festivos regionales para el período seleccionado
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSidebar}
          />
        )}
      </div>
    </div>
  );
}