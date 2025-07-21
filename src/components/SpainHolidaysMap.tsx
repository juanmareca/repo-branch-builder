import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mapeo de comunidades autónomas con colores exactos de la imagen
const REGIONS_MAP = {
  'Galicia': { code: 'GA', color: '#5eaf6e' },
  'Asturias': { code: 'AS', color: '#7bc142' },
  'Cantabria': { code: 'CB', color: '#f4a024' },
  'País Vasco': { code: 'PV', color: '#6b9bd2' },
  'Navarra': { code: 'NC', color: '#8bc34a' },
  'La Rioja': { code: 'RI', color: '#d84315' },
  'Cataluña': { code: 'CT', color: '#fdd835' },
  'Aragón': { code: 'AR', color: '#42a5f5' },
  'Castilla y León': { code: 'CL', color: '#5eaf6e' },
  'Madrid': { code: 'MD', color: '#d32f2f' },
  'Castilla-La Mancha': { code: 'CM', color: '#ff9800' },
  'Extremadura': { code: 'EX', color: '#78909c' },
  'Comunidad Valenciana': { code: 'VC', color: '#ff9800' },
  'Murcia': { code: 'MC', color: '#bf360c' },
  'Andalucía': { code: 'AN', color: '#c2514e' },
  'Canarias': { code: 'CN', color: '#546e7a' },
  'Baleares': { code: 'IB', color: '#9c27b0' },
  'Ceuta': { code: 'CE', color: '#7986cb' },
  'Melilla': { code: 'ML', color: '#7986cb' }
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
      const textPos = getRegionTextPosition(name);
      
      return `
        <g class="region-group cursor-pointer transition-all duration-300" data-region="${name}">
          <path
            d="${coords}"
            fill="${config.color}"
            stroke="#ffffff"
            stroke-width="3"
            opacity="0.9"
            class="region-path hover:opacity-100 hover:brightness-110"
          />
          <text
            x="${textPos.x}"
            y="${textPos.y}"
            text-anchor="middle"
            class="text-sm font-bold fill-white pointer-events-none select-none"
            style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7); font-family: 'Segoe UI', sans-serif;"
          >
            ${name === 'Castilla y León' ? 'Castilla y L.' : 
              name === 'Castilla-La Mancha' ? 'Castilla-L.M.' :
              name === 'Comunidad Valenciana' ? 'Comunidad V.' :
              name === 'Principado de Asturias' ? 'Asturias' : name}
          </text>
        </g>
      `;
    }).join('');

    return `
      <svg width="100%" height="100%" viewBox="0 0 800 600" class="spain-map bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl">
        <defs>
          <linearGradient id="seaBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#bfdbfe" />
            <stop offset="100%" stop-color="#93c5fd" />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <rect width="800" height="600" fill="url(#seaBg)" rx="12" />
        ${paths}
      </svg>
    `;
  };

  const getRegionCoordinates = (regionName: string) => {
    // Coordenadas exactas basadas en la imagen moderna que me mostraste
    const coordinates: Record<string, string> = {
      'Galicia': 'M 80 180 L 160 170 L 170 200 L 160 230 L 120 240 L 80 230 L 70 200 Z',
      'Asturias': 'M 170 170 L 240 165 L 250 185 L 240 205 L 200 210 L 170 200 Z',
      'Cantabria': 'M 250 165 L 320 160 L 330 180 L 320 200 L 280 205 L 250 185 Z',
      'País Vasco': 'M 330 160 L 400 155 L 415 175 L 405 195 L 365 200 L 330 180 Z',
      'Navarra': 'M 365 200 L 420 195 L 435 225 L 425 255 L 385 260 L 365 230 Z',
      'La Rioja': 'M 315 250 L 365 245 L 375 265 L 365 285 L 325 290 L 315 270 Z',
      'Cataluña': 'M 435 200 L 520 190 L 540 230 L 535 290 L 510 320 L 470 315 L 450 275 L 445 235 Z',
      'Aragón': 'M 375 285 L 450 275 L 470 315 L 465 365 L 430 385 L 380 380 L 365 340 L 370 310 Z',
      'Castilla y León': 'M 160 230 L 315 220 L 370 240 L 365 310 L 330 340 L 250 350 L 180 345 L 150 315 L 155 275 Z',
      'Madrid': 'M 300 340 L 350 335 L 365 355 L 355 375 L 315 380 L 300 360 Z',
      'Castilla-La Mancha': 'M 250 350 L 380 340 L 430 360 L 435 420 L 410 450 L 350 455 L 280 460 L 240 440 L 235 395 Z',
      'Extremadura': 'M 150 345 L 240 340 L 250 380 L 245 430 L 215 460 L 165 465 L 135 445 L 130 395 L 140 370 Z',
      'Comunidad Valenciana': 'M 470 315 L 530 310 L 545 350 L 540 410 L 515 445 L 480 450 L 455 415 L 460 375 L 465 340 Z',
      'Murcia': 'M 435 420 L 480 415 L 495 435 L 490 455 L 465 465 L 435 460 L 425 440 Z',
      'Andalucía': 'M 165 465 L 350 455 L 465 460 L 480 490 L 460 540 L 400 570 L 280 575 L 180 570 L 140 540 L 145 505 Z',
      'Canarias': 'M 50 520 L 120 515 L 130 535 L 125 555 L 95 565 L 50 560 L 40 540 Z',
      'Baleares': 'M 570 370 L 620 365 L 635 385 L 630 405 L 605 415 L 570 410 L 560 390 Z',
      'Ceuta': 'M 220 580 L 245 575 L 250 590 L 240 600 L 220 605 L 210 590 Z',
      'Melilla': 'M 280 580 L 305 575 L 310 590 L 300 600 L 280 605 L 270 590 Z'
    };
    
    return coordinates[regionName] || 'M 0 0 L 50 0 L 50 50 L 0 50 Z';
  };

  const getRegionTextPosition = (regionName: string) => {
    // Posiciones exactas del texto basadas en la imagen
    const positions: Record<string, {x: number, y: number}> = {
      'Galicia': { x: 120, y: 205 },
      'Asturias': { x: 205, y: 190 },
      'Cantabria': { x: 285, y: 185 },
      'País Vasco': { x: 365, y: 180 },
      'Navarra': { x: 395, y: 230 },
      'La Rioja': { x: 340, y: 270 },
      'Cataluña': { x: 485, y: 255 },
      'Aragón': { x: 415, y: 330 },
      'Castilla y León': { x: 265, y: 285 },
      'Madrid': { x: 330, y: 360 },
      'Castilla-La Mancha': { x: 340, y: 405 },
      'Extremadura': { x: 190, y: 405 },
      'Comunidad Valenciana': { x: 505, y: 380 },
      'Murcia': { x: 460, y: 445 },
      'Andalucía': { x: 315, y: 515 },
      'Canarias': { x: 85, y: 540 },
      'Baleares': { x: 600, y: 390 },
      'Ceuta': { x: 230, y: 590 },
      'Melilla': { x: 290, y: 590 }
    };
    
    return positions[regionName] || { x: 100, y: 100 };
  };

  const processSVGRegions = () => {
    if (!mapContainerRef.current) return;
    
    const regionGroups = mapContainerRef.current.querySelectorAll('.region-group');
    
    regionGroups.forEach(group => {
      const regionName = group.getAttribute('data-region');
      if (!regionName) return;
      
      const regionPath = group.querySelector('.region-path');
      if (!regionPath) return;
      
      group.addEventListener('click', () => handleRegionClick(regionName));
      
      group.addEventListener('mouseenter', () => {
        regionPath.setAttribute('opacity', '1');
        regionPath.setAttribute('stroke-width', '4');
        regionPath.setAttribute('stroke', '#2c3e50');
        (regionPath as SVGElement).style.filter = 'brightness(1.1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
      });
      
      group.addEventListener('mouseleave', () => {
        if (selectedRegion !== regionName) {
          regionPath.setAttribute('opacity', '0.9');
          regionPath.setAttribute('stroke-width', '3');
          regionPath.setAttribute('stroke', '#ffffff');
          (regionPath as SVGElement).style.filter = 'none';
        }
      });
    });

    // Actualizar región seleccionada
    if (selectedRegion) {
      const selectedGroup = mapContainerRef.current.querySelector(`g[data-region="${selectedRegion}"]`);
      if (selectedGroup) {
        const selectedPath = selectedGroup.querySelector('.region-path');
        if (selectedPath) {
          selectedPath.setAttribute('opacity', '1');
          selectedPath.setAttribute('stroke-width', '5');
          selectedPath.setAttribute('stroke', '#e74c3c');
          (selectedPath as SVGElement).style.filter = 'brightness(1.2) drop-shadow(0 6px 12px rgba(0,0,0,0.3))';
        }
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