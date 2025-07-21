import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mapeo de comunidades autónomas con colores naturales del mapa real
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
      <svg width="100%" height="100%" viewBox="0 0 850 950" class="spain-map bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl">
        <defs>
          <linearGradient id="seaBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#bfdbfe" />
            <stop offset="100%" stop-color="#93c5fd" />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <rect width="850" height="950" fill="url(#seaBg)" rx="12" />
        ${paths}
      </svg>
    `;
  };

  const getRegionCoordinates = (regionName: string) => {
    // Coordenadas REALES basadas en la geografía real de España (segunda imagen)
    const coordinates: Record<string, string> = {
      'Galicia': 'M 50 100 Q 30 90 20 110 L 15 130 Q 10 150 25 170 L 40 185 Q 60 200 85 195 L 110 190 Q 135 185 140 165 L 145 145 Q 150 125 135 110 L 120 95 Q 100 85 80 90 L 60 95 Q 50 100 50 100 Z',
      'Asturias': 'M 150 95 Q 170 90 190 95 L 210 100 Q 230 105 235 125 L 240 145 Q 245 165 225 170 L 205 175 Q 185 180 165 175 L 145 170 Q 140 165 145 145 L 150 125 Q 155 105 150 95 Z',
      'Cantabria': 'M 245 100 Q 265 95 285 100 L 305 105 Q 320 110 325 125 L 330 140 Q 335 155 320 160 L 300 165 Q 280 170 260 165 L 240 160 Q 235 155 240 140 L 245 125 Q 250 110 245 100 Z',
      'País Vasco': 'M 335 105 Q 355 100 375 105 L 390 110 Q 405 115 410 130 L 415 145 Q 420 160 405 165 L 390 170 Q 375 175 360 170 L 345 165 Q 330 160 335 145 L 340 130 Q 345 115 335 105 Z',
      'Navarra': 'M 380 170 Q 400 165 420 170 L 440 175 Q 455 180 460 200 L 465 220 Q 470 240 450 245 L 430 250 Q 410 255 390 250 L 370 245 Q 355 240 360 220 L 365 200 Q 370 180 380 170 Z',
      'La Rioja': 'M 340 200 Q 360 195 380 200 L 395 205 Q 410 210 415 225 L 420 240 Q 425 255 410 260 L 395 265 Q 380 270 365 265 L 350 260 Q 335 255 340 240 L 345 225 Q 350 210 340 200 Z',
      'Cataluña': 'M 470 150 Q 500 140 530 150 L 560 160 Q 590 170 600 200 L 610 230 Q 620 260 610 290 L 600 320 Q 590 350 560 355 L 530 360 Q 500 365 470 355 L 450 345 Q 430 335 435 305 L 440 275 Q 445 245 455 215 L 465 185 Q 470 155 470 150 Z',
      'Aragón': 'M 360 250 Q 390 240 420 250 L 450 260 Q 480 270 485 300 L 490 330 Q 495 360 480 390 L 465 420 Q 450 450 420 455 L 390 460 Q 360 465 340 455 L 320 445 Q 300 435 305 405 L 310 375 Q 315 345 325 315 L 335 285 Q 345 255 360 250 Z',
      'Castilla y León': 'M 150 180 Q 200 170 250 180 L 300 190 Q 350 200 355 240 L 360 280 Q 365 320 350 360 L 335 400 Q 320 440 280 445 L 240 450 Q 200 455 160 445 L 120 435 Q 80 425 85 385 L 90 345 Q 95 305 105 265 L 115 225 Q 125 185 150 180 Z',
      'Madrid': 'M 280 360 Q 300 355 320 360 L 340 365 Q 355 370 360 385 L 365 400 Q 370 415 355 420 L 340 425 Q 325 430 305 425 L 285 420 Q 270 415 275 400 L 280 385 Q 285 370 280 360 Z',
      'Castilla-La Mancha': 'M 160 450 Q 210 440 260 450 L 310 460 Q 360 470 480 460 L 520 455 Q 540 450 545 480 L 550 510 Q 555 540 540 570 L 525 600 Q 510 630 470 635 L 430 640 Q 390 645 350 640 L 310 635 Q 270 630 230 625 L 190 620 Q 150 615 155 585 L 160 555 Q 165 525 155 495 L 150 465 Q 155 455 160 450 Z',
      'Extremadura': 'M 85 430 Q 120 420 155 430 L 190 440 Q 225 450 230 480 L 235 510 Q 240 540 225 570 L 210 600 Q 195 630 165 635 L 135 640 Q 105 645 75 640 L 45 635 Q 20 630 25 600 L 30 570 Q 35 540 45 510 L 55 480 Q 65 450 85 430 Z',
      'Comunidad Valenciana': 'M 550 320 Q 580 310 610 320 L 635 330 Q 660 340 665 370 L 670 400 Q 675 430 665 460 L 655 490 Q 645 520 615 525 L 585 530 Q 555 535 530 525 L 505 515 Q 485 505 490 475 L 495 445 Q 500 415 510 385 L 520 355 Q 530 325 550 320 Z',
      'Murcia': 'M 490 520 Q 520 515 550 520 L 575 525 Q 600 530 605 550 L 610 570 Q 615 590 600 595 L 580 600 Q 560 605 535 600 L 510 595 Q 485 590 490 570 L 495 550 Q 500 530 490 520 Z',
      'Andalucía': 'M 75 640 Q 150 625 225 635 L 300 645 Q 375 655 450 645 L 525 635 Q 580 625 590 665 L 600 705 Q 610 745 580 780 L 550 815 Q 520 850 470 855 L 420 860 Q 370 865 320 860 L 270 855 Q 220 850 170 845 L 120 840 Q 70 835 45 805 L 20 775 Q 10 745 25 715 L 40 685 Q 55 655 75 640 Z',
      'Canarias': 'M 20 880 Q 40 875 60 880 L 80 885 Q 100 890 130 885 L 160 880 Q 180 875 185 895 L 190 915 Q 195 935 180 940 L 160 945 Q 140 950 120 945 L 100 940 Q 80 935 60 940 L 40 945 Q 20 950 15 930 L 10 910 Q 5 890 20 880 Z',
      'Baleares': 'M 720 420 Q 740 415 760 420 L 780 425 Q 800 430 805 445 L 810 460 Q 815 475 800 480 L 785 485 Q 770 490 750 485 L 730 480 Q 715 475 720 460 L 725 445 Q 730 430 720 420 Z',
      'Ceuta': 'M 340 860 Q 350 855 360 860 L 370 865 Q 380 870 385 880 L 390 890 Q 395 900 385 905 L 375 910 Q 365 915 355 910 L 345 905 Q 335 900 340 890 L 345 880 Q 350 870 340 860 Z',
      'Melilla': 'M 420 860 Q 430 855 440 860 L 450 865 Q 460 870 465 880 L 470 890 Q 475 900 465 905 L 455 910 Q 445 915 435 910 L 425 905 Q 415 900 420 890 L 425 880 Q 430 870 420 860 Z'
    };
    
    return coordinates[regionName] || 'M 0 0 L 50 0 L 50 50 L 0 50 Z';
  };

  const getRegionTextPosition = (regionName: string) => {
    // Posiciones de texto basadas en el centro geográfico real de cada región
    const positions: Record<string, {x: number, y: number}> = {
      'Galicia': { x: 95, y: 145 },
      'Asturias': { x: 190, y: 135 },
      'Cantabria': { x: 285, y: 130 },
      'País Vasco': { x: 375, y: 135 },
      'Navarra': { x: 415, y: 215 },
      'La Rioja': { x: 375, y: 230 },
      'Cataluña': { x: 530, y: 255 },
      'Aragón': { x: 415, y: 355 },
      'Castilla y León': { x: 255, y: 315 },
      'Madrid': { x: 320, y: 395 },
      'Castilla-La Mancha': { x: 355, y: 545 },
      'Extremadura': { x: 155, y: 535 },
      'Comunidad Valenciana': { x: 580, y: 425 },
      'Murcia': { x: 550, y: 560 },
      'Andalucía': { x: 315, y: 745 },
      'Canarias': { x: 105, y: 915 },
      'Baleares': { x: 760, y: 455 },
      'Ceuta': { x: 365, y: 885 },
      'Melilla': { x: 445, y: 885 }
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
          <div className={`w-96 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 transition-all duration-300 flex flex-col ${
            !sidebarOpen ? 'transform translate-x-full opacity-0 pointer-events-none' : ''
          }`} style={{ height: 'calc(100vh - 240px)' }}>
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
            <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {selectedRegion ? (
                <div className="space-y-4">
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
                        <div className="mb-4">
                          <h3 className="text-base font-semibold text-red-600 mb-2 pb-1 border-b border-red-200">
                            Festivos Nacionales
                          </h3>
                          <div className="space-y-1">
                            {filteredNationalHolidays.map((holiday, index) => (
                              <div key={index} className="p-2 bg-red-50 border-l-3 border-red-500 rounded text-xs hover:bg-red-100 transition-all">
                                <div className="font-medium text-gray-900 leading-tight">{formatDate(holiday.date)}</div>
                                <div className="text-gray-700 mt-0.5 leading-tight">{holiday.festivo}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Festivos Regionales */}
                      {filteredRegionalHolidays.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-base font-semibold text-blue-600 mb-2 pb-1 border-b border-blue-200">
                            Festivos de {selectedRegion}
                          </h3>
                          <div className="space-y-1">
                            {filteredRegionalHolidays.map((holiday, index) => (
                              <div key={index} className="p-2 bg-blue-50 border-l-3 border-blue-500 rounded text-xs hover:bg-blue-100 transition-all">
                                <div className="font-medium text-gray-900 leading-tight">{formatDate(holiday.date)}</div>
                                <div className="text-gray-700 mt-0.5 leading-tight">{holiday.festivo}</div>
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