import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mapeo de comunidades autónomas con códigos reales
const REGIONS_MAP = {
  'Andalucía': { code: 'AN', color: '#e74c3c' },
  'Aragón': { code: 'AR', color: '#3498db' },
  'Asturias': { code: 'AS', color: '#2ecc71' },
  'Cantabria': { code: 'CB', color: '#f39c12' },
  'Ceuta': { code: 'CE', color: '#9b59b6' },
  'Castilla y León': { code: 'CL', color: '#1abc9c' },
  'Castilla-La Mancha': { code: 'CM', color: '#e67e22' },
  'Canarias': { code: 'CN', color: '#34495e' },
  'Cataluña': { code: 'CT', color: '#f1c40f' },
  'Extremadura': { code: 'EX', color: '#95a5a6' },
  'Galicia': { code: 'GA', color: '#16a085' },
  'Baleares': { code: 'IB', color: '#8e44ad' },
  'Murcia': { code: 'MC', color: '#d35400' },
  'Madrid': { code: 'MD', color: '#c0392b' },
  'Melilla': { code: 'ML', color: '#7f8c8d' },
  'Navarra': { code: 'NC', color: '#27ae60' },
  'País Vasco': { code: 'PV', color: '#2980b9' },
  'La Rioja': { code: 'RI', color: '#e74c3c' },
  'Comunidad Valenciana': { code: 'VC', color: '#f39c12' }
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
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Filtrar festivos
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

  useEffect(() => {
    const loadSVGMap = async () => {
      if (!mapContainerRef.current) return;
      
      try {
        const svgContent = createSpainSVG();
        mapContainerRef.current.innerHTML = svgContent;
        processSVGRegions();
      } catch (error) {
        console.error('Error cargando el mapa:', error);
      }
    };

    loadSVGMap();
  }, []);

  const createSpainSVG = () => {
    const regions = Object.entries(REGIONS_MAP);
    const paths = regions.map(([name, config]) => {
      const coords = getRegionCoordinates(name);
      
      return `
        <path
          d="${coords}"
          fill="${config.color}"
          stroke="#fff"
          stroke-width="2"
          opacity="0.8"
          class="region cursor-pointer transition-all duration-300 hover:opacity-100 hover:stroke-4"
          data-region="${name}"
          data-name="${name}"
        />
        <text
          x="${getRegionTextPosition(name).x}"
          y="${getRegionTextPosition(name).y}"
          text-anchor="middle"
          class="text-xs font-bold fill-white pointer-events-none select-none"
          style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8); font-family: 'Segoe UI', sans-serif;"
        >
          ${name.length > 12 ? name.substring(0, 10) + '...' : name}
        </text>
      `;
    }).join('');

    return `
      <svg width="100%" height="100%" viewBox="0 0 800 600" class="spain-map">
        <defs>
          <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#bfdbfe" />
            <stop offset="100%" stop-color="#93c5fd" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="3" stdDeviation="4" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <rect width="800" height="600" fill="url(#seaGradient)" />
        ${paths}
      </svg>
    `;
  };

  const getRegionCoordinates = (regionName: string) => {
    const coordinates: Record<string, string> = {
      'Galicia': 'M 50 120 L 140 110 L 160 140 L 150 170 L 120 180 L 80 170 L 60 150 Z',
      'Asturias': 'M 160 110 L 240 105 L 260 130 L 240 150 L 200 155 L 160 140 Z',
      'Cantabria': 'M 260 105 L 320 100 L 340 125 L 320 145 L 280 150 L 260 130 Z',
      'País Vasco': 'M 340 100 L 400 95 L 420 120 L 400 140 L 360 145 L 340 125 Z',
      'Navarra': 'M 380 145 L 440 140 L 460 170 L 440 195 L 400 200 L 380 175 Z',
      'La Rioja': 'M 340 175 L 380 170 L 395 195 L 380 215 L 340 220 L 325 195 Z',
      'Cataluña': 'M 460 140 L 540 130 L 580 180 L 570 250 L 530 280 L 480 270 L 460 220 Z',
      'Aragón': 'M 400 200 L 480 190 L 520 240 L 500 310 L 450 330 L 400 320 L 380 260 Z',
      'Castilla y León': 'M 160 180 L 340 170 L 400 200 L 380 260 L 320 300 L 200 310 L 140 280 L 140 220 Z',
      'Madrid': 'M 320 300 L 380 290 L 400 320 L 380 350 L 320 360 L 300 330 Z',
      'Castilla-La Mancha': 'M 200 310 L 320 300 L 450 330 L 440 420 L 380 450 L 240 460 L 180 430 L 180 350 Z',
      'Extremadura': 'M 140 280 L 200 270 L 240 320 L 180 430 L 120 440 L 80 400 L 90 320 Z',
      'Comunidad Valenciana': 'M 500 310 L 570 280 L 590 350 L 580 420 L 540 450 L 480 440 L 460 370 Z',
      'Murcia': 'M 460 440 L 540 430 L 560 470 L 540 500 L 480 510 L 440 480 Z',
      'Andalucía': 'M 80 440 L 240 430 L 380 450 L 480 470 L 460 540 L 380 570 L 200 580 L 60 560 L 50 500 Z',
      'Canarias': 'M 20 520 L 120 510 L 140 540 L 120 570 L 20 580 Z',
      'Baleares': 'M 580 350 L 640 340 L 660 370 L 640 400 L 580 410 Z',
      'Ceuta': 'M 200 580 L 230 575 L 240 590 L 220 600 L 200 595 Z',
      'Melilla': 'M 250 580 L 280 575 L 290 590 L 270 600 L 250 595 Z'
    };
    
    return coordinates[regionName] || 'M 0 0 L 50 0 L 50 50 L 0 50 Z';
  };

  const getRegionTextPosition = (regionName: string) => {
    const positions: Record<string, {x: number, y: number}> = {
      'Galicia': { x: 105, y: 145 },
      'Asturias': { x: 200, y: 130 },
      'Cantabria': { x: 290, y: 125 },
      'País Vasco': { x: 370, y: 120 },
      'Navarra': { x: 410, y: 170 },
      'La Rioja': { x: 360, y: 195 },
      'Cataluña': { x: 520, y: 200 },
      'Aragón': { x: 440, y: 255 },
      'Castilla y León': { x: 270, y: 235 },
      'Madrid': { x: 350, y: 325 },
      'Castilla-La Mancha': { x: 320, y: 380 },
      'Extremadura': { x: 160, y: 360 },
      'Comunidad Valenciana': { x: 530, y: 375 },
      'Murcia': { x: 500, y: 470 },
      'Andalucía': { x: 270, y: 505 },
      'Canarias': { x: 80, y: 545 },
      'Baleares': { x: 610, y: 375 },
      'Ceuta': { x: 220, y: 585 },
      'Melilla': { x: 270, y: 585 }
    };
    
    return positions[regionName] || { x: 100, y: 100 };
  };

  const processSVGRegions = () => {
    if (!mapContainerRef.current) return;
    
    const regions = mapContainerRef.current.querySelectorAll('.region');
    
    regions.forEach(region => {
      const regionName = region.getAttribute('data-region');
      if (!regionName) return;
      
      region.addEventListener('click', () => handleRegionClick(regionName));
      
      region.addEventListener('mouseenter', () => {
        region.setAttribute('opacity', '1');
        region.setAttribute('stroke-width', '4');
        region.setAttribute('stroke', '#2c3e50');
      });
      
      region.addEventListener('mouseleave', () => {
        if (selectedRegion !== regionName) {
          region.setAttribute('opacity', '0.8');
          region.setAttribute('stroke-width', '2');
          region.setAttribute('stroke', '#fff');
        }
      });
    });

    // Actualizar región seleccionada
    if (selectedRegion) {
      const selectedPath = mapContainerRef.current.querySelector(`path[data-region="${selectedRegion}"]`);
      if (selectedPath) {
        selectedPath.setAttribute('opacity', '1');
        selectedPath.setAttribute('stroke-width', '4');
        selectedPath.setAttribute('stroke', '#e74c3c');
      }
    }
  };

  useEffect(() => {
    processSVGRegions();
  }, [selectedRegion]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-blue-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header con controles */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl border border-white/20">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Mapa Interactivo de España - Festivos
          </h1>
          
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Año</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32 bg-white border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-xl z-50">
                  {Array.from({length: YEARS_RANGE.end - YEARS_RANGE.start + 1}, (_, i) => YEARS_RANGE.start + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Mes</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40 bg-white border-2 border-gray-200 hover:border-blue-400 focus:border-blue-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-xl z-50">
                  {MONTHS_CHRONOLOGICAL.map(month => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex gap-6 h-[calc(100vh-220px)]">
          {/* Mapa */}
          <div className="flex-1 bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 overflow-hidden">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">
              Comunidades Autónomas de España
            </h3>
            <div 
              ref={mapContainerRef}
              className="w-full h-full flex justify-center items-center"
            />
            <p className="text-sm text-gray-600 text-center mt-4">
              <MapPin className="inline w-4 h-4 mr-1" />
              Selecciona con el ratón cualquier comunidad del mapa para ver sus festivos
            </p>
          </div>

          {/* Sidebar */}
          <div className={`w-96 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 transition-all duration-300 ${
            !sidebarOpen ? 'transform translate-x-full opacity-0 pointer-events-none' : ''
          }`}>
            {/* Header del sidebar */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {selectedRegion || 'Festivos'}
                </h2>
                {selectedRegion && (
                  <Badge variant="outline" className="mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {selectedMonth === 'all' ? selectedYear : `${MONTHS_CHRONOLOGICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                  </Badge>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeSidebar}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Contenido del sidebar */}
            <div className="p-6 h-full overflow-y-auto pb-24">
              {selectedRegion ? (
                <div className="space-y-6">
                  {isLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Cargando festivos...</p>
                    </div>
                  )}
                  
                  {error && (
                    <div className="text-center py-8">
                      <p className="text-red-500 text-sm">Error al cargar los festivos</p>
                    </div>
                  )}
                  
                  {holidays && holidays.length > 0 && (
                    <>
                      {/* Festivos Nacionales */}
                      {filteredNationalHolidays.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-red-600 mb-3 pb-2 border-b-2 border-red-200">
                            Festivos Nacionales
                          </h3>
                          <div className="space-y-2">
                            {filteredNationalHolidays.map((holiday, index) => (
                              <div key={index} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm hover:bg-red-100 transition-all hover:transform hover:translate-x-1">
                                <div className="font-semibold text-gray-900">{formatDate(holiday.date)}</div>
                                <div className="text-gray-700 mt-1">{holiday.festivo}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Festivos Regionales */}
                      {filteredRegionalHolidays.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600 mb-3 pb-2 border-b-2 border-blue-200">
                            Festivos de {selectedRegion}
                          </h3>
                          <div className="space-y-2">
                            {filteredRegionalHolidays.map((holiday, index) => (
                              <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-sm hover:bg-blue-100 transition-all hover:transform hover:translate-x-1">
                                <div className="font-semibold text-gray-900">{formatDate(holiday.date)}</div>
                                <div className="text-gray-700 mt-1">{holiday.festivo}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!isLoading && !error && holidays && (filteredNationalHolidays.length === 0 && filteredRegionalHolidays.length === 0) && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <Calendar className="w-16 h-16 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-sm italic">
                        {selectedMonth === 'all' 
                          ? 'No se encontraron festivos para este año.'
                          : 'No hay festivos en el mes seleccionado.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-gray-400 mb-4">
                    <MapPin className="w-16 h-16 mx-auto" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    Selecciona una comunidad autónoma
                  </h4>
                  <p className="text-sm text-gray-500">
                    Haz clic en cualquier región del mapa para ver sus festivos
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar móvil */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
        <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white transform transition-transform duration-300">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedRegion || 'Festivos'}
              </h2>
              {selectedRegion && (
                <Badge variant="outline" className="mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {selectedMonth === 'all' ? selectedYear : `${MONTHS_CHRONOLOGICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={closeSidebar}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="p-6 h-full overflow-y-auto pb-24">
            {/* Mismo contenido que el sidebar de escritorio */}
            {selectedRegion ? (
              <div className="space-y-6">
                {/* Contenido de festivos igual que arriba */}
                {isLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Cargando festivos...</p>
                  </div>
                )}
                
                {holidays && holidays.length > 0 && (
                  <>
                    {filteredNationalHolidays.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-red-600 mb-3 pb-2 border-b-2 border-red-200">
                          Festivos Nacionales
                        </h3>
                        <div className="space-y-2">
                          {filteredNationalHolidays.map((holiday, index) => (
                            <div key={index} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm hover:bg-red-100 transition-all">
                              <div className="font-semibold text-gray-900">{formatDate(holiday.date)}</div>
                              <div className="text-gray-700 mt-1">{holiday.festivo}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {filteredRegionalHolidays.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-blue-600 mb-3 pb-2 border-b-2 border-blue-200">
                          Festivos de {selectedRegion}
                        </h3>
                        <div className="space-y-2">
                          {filteredRegionalHolidays.map((holiday, index) => (
                            <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-sm hover:bg-blue-100 transition-all">
                              <div className="font-semibold text-gray-900">{formatDate(holiday.date)}</div>
                              <div className="text-gray-700 mt-1">{holiday.festivo}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">
                  Selecciona una comunidad autónoma
                </h4>
                <p className="text-sm text-gray-500">
                  Haz clic en cualquier región del mapa para ver sus festivos
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}