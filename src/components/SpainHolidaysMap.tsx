import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

interface Holiday {
  id: string;
  date: string;
  festivo: string;
  pais: string;
  comunidad_autonoma: string;
  origen: string;
  created_at: string;
}

interface SpainHolidaysMapProps {
  holidays: Holiday[];
}

const MONTHS_CHRONOLOGICAL = [
  { value: 'all', label: 'Todos' },
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

const SpainHolidaysMap: React.FC<SpainHolidaysMapProps> = ({ holidays }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);

  // Obtener años únicos de los festivos
  const availableYears = useMemo(() => {
    const years = holidays
      .map(holiday => new Date(holiday.date).getFullYear())
      .filter(year => !isNaN(year));
    return [...new Set(years)].sort((a, b) => b - a);
  }, [holidays]);

  // Filtrar festivos por año, mes y comunidad autónoma (incluyendo NACIONALES)
  const getHolidaysForCommunity = (community: string) => {
    const communityHolidays = holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      const holidayYear = holidayDate.getFullYear();
      const holidayMonth = holidayDate.getMonth() + 1;
      
      const matchesYear = holidayYear.toString() === selectedYear;
      const matchesMonth = selectedMonth === 'all' || holidayMonth.toString() === selectedMonth;
      const matchesPais = holiday.pais === 'España';
      
      // Incluir festivos de la comunidad específica Y los nacionales
      const matchesCommunity = holiday.comunidad_autonoma === community || 
                              holiday.comunidad_autonoma === 'NACIONAL';
      
      return matchesYear && matchesMonth && matchesPais && matchesCommunity;
    });
    
    return communityHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Mapa de correspondencias entre nombres de comunidades y IDs del SVG
  const communityMapping: { [key: string]: string } = {
    'Andalucía': 'andalucia',
    'Aragón': 'aragon', 
    'Asturias': 'asturias',
    'Baleares': 'baleares',
    'Canarias': 'canarias',
    'Cantabria': 'cantabria',
    'Castilla y León': 'castilla-leon',
    'Castilla-La Mancha': 'castilla-mancha',
    'Cataluña': 'cataluna',
    'Comunidad Valenciana': 'valencia',
    'Extremadura': 'extremadura',
    'Galicia': 'galicia',
    'La Rioja': 'rioja',
    'Madrid': 'madrid',
    'Murcia': 'murcia',
    'Navarra': 'navarra',
    'País Vasco': 'pais-vasco'
  };

  return (
    <div className="space-y-6">
      {/* Selectores de año y mes */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Label htmlFor="year-select">Año:</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" id="year-select">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="month-select">Mes:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40" id="month-select">
              <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS_CHRONOLOGICAL.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Mapa SVG de España realista y grande */}
        <div className="flex-1">
          <div className="relative">
            <svg 
              viewBox="0 0 1200 800" 
              className="w-full h-[500px] border border-gray-200 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            >
              {/* Definiciones */}
              <defs>
                <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bfdbfe" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.4"/>
                </filter>
              </defs>
              
              <rect width="1200" height="800" fill="url(#seaGradient)" />
              
              {/* Comunidades Autónomas con formas reales */}
              {Object.entries(communityMapping).map(([community, id]) => {
                const communityHolidays = getHolidaysForCommunity(community);
                const hasHolidays = communityHolidays.length > 0;
                const isSelected = selectedCommunity === community;
                const baseColor = isSelected ? "#1d4ed8" : (hasHolidays ? "#059669" : "#d1d5db");
                
                return (
                  <g key={community}>
                    {/* Galicia */}
                    {id === 'galicia' && (
                      <>
                        <path
                          d="M80 180 Q70 170 65 185 L60 200 Q50 220 65 240 L80 260 Q100 275 125 270 L150 265 Q175 255 185 235 L195 215 Q200 195 185 180 L170 165 Q150 155 125 160 L100 165 Q85 170 80 180 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="140" y="215" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Galicia
                        </text>
                      </>
                    )}
                    
                    {/* Asturias */}
                    {id === 'asturias' && (
                      <>
                        <path
                          d="M220 165 L320 165 Q340 170 335 190 L330 210 Q320 230 300 225 L280 220 Q260 215 240 220 L220 225 Q200 230 195 210 L190 190 Q195 170 220 165 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="265" y="200" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Asturias
                        </text>
                      </>
                    )}
                    
                    {/* Cantabria */}
                    {id === 'cantabria' && (
                      <>
                        <path
                          d="M360 165 L430 165 Q450 170 445 190 L440 210 Q430 230 410 225 L390 220 Q370 215 365 195 L360 175 Q365 170 360 165 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="400" y="195" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Cantabria
                        </text>
                      </>
                    )}
                    
                    {/* País Vasco */}
                    {id === 'pais-vasco' && (
                      <>
                        <path
                          d="M470 165 L540 165 Q560 170 555 190 L550 210 Q540 230 520 225 L500 220 Q480 215 475 195 L470 175 Q475 170 470 165 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="510" y="195" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          País Vasco
                        </text>
                      </>
                    )}
                    
                    {/* Navarra */}
                    {id === 'navarra' && (
                      <>
                        <path
                          d="M520 240 L580 240 Q600 245 595 265 L590 285 Q580 305 560 300 L540 295 Q525 290 525 270 L520 250 Q525 245 520 240 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="555" y="270" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Navarra
                        </text>
                      </>
                    )}
                    
                    {/* La Rioja */}
                    {id === 'rioja' && (
                      <>
                        <path
                          d="M470 280 L520 280 Q540 285 535 305 L530 325 Q520 345 500 340 L480 335 Q465 330 465 310 L460 290 Q465 285 470 280 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="495" y="315" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          La Rioja
                        </text>
                      </>
                    )}
                    
                    {/* Cataluña */}
                    {id === 'cataluna' && (
                      <>
                        <path
                          d="M620 220 Q660 215 700 235 L740 255 Q780 275 775 315 L770 355 Q765 395 725 400 L685 405 Q645 410 620 390 L600 370 Q580 350 585 310 L590 270 Q595 230 620 220 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="680" y="315" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Cataluña
                        </text>
                      </>
                    )}
                    
                    {/* Aragón */}
                    {id === 'aragon' && (
                      <>
                        <path
                          d="M540 320 Q580 315 620 335 L660 355 Q700 375 695 415 L690 455 Q685 495 645 500 L605 505 Q565 510 540 490 L520 470 Q500 450 505 410 L510 370 Q515 330 540 320 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="600" y="415" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Aragón
                        </text>
                      </>
                    )}
                    
                    {/* Castilla y León */}
                    {id === 'castilla-leon' && (
                      <>
                        <path
                          d="M220 260 Q300 255 380 275 L460 295 Q540 315 535 375 L530 435 Q525 495 445 500 L365 505 Q285 510 220 490 L160 470 Q100 450 105 390 L110 330 Q115 270 220 260 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="320" y="380" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Castilla y León
                        </text>
                      </>
                    )}
                    
                    {/* Madrid */}
                    {id === 'madrid' && (
                      <>
                        <ellipse
                          cx="420"
                          cy="450"
                          rx="40"
                          ry="30"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="420" y="455" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Madrid
                        </text>
                      </>
                    )}
                    
                    {/* Castilla-La Mancha */}
                    {id === 'castilla-mancha' && (
                      <>
                        <path
                          d="M340 510 Q420 505 500 525 L580 545 Q660 565 655 625 L650 685 Q645 745 565 750 L485 755 Q405 760 340 740 L280 720 Q220 700 225 640 L230 580 Q235 520 340 510 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="440" y="630" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Castilla-La Mancha
                        </text>
                      </>
                    )}
                    
                    {/* Extremadura */}
                    {id === 'extremadura' && (
                      <>
                        <path
                          d="M140 510 Q220 505 300 525 L380 545 Q460 565 455 625 L450 685 Q445 745 365 750 L285 755 Q205 760 140 740 L80 720 Q20 700 25 640 L30 580 Q35 520 140 510 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="240" y="630" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Extremadura
                        </text>
                      </>
                    )}
                    
                    {/* Comunidad Valenciana */}
                    {id === 'valencia' && (
                      <>
                        <path
                          d="M680 420 Q720 415 760 435 L800 455 Q840 475 835 535 L830 595 Q825 655 785 660 L745 665 Q705 670 680 650 L660 630 Q640 610 645 550 L650 490 Q655 430 680 420 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="740" y="540" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          C. Valenciana
                        </text>
                      </>
                    )}
                    
                    {/* Murcia */}
                    {id === 'murcia' && (
                      <>
                        <path
                          d="M620 680 Q680 675 740 695 L800 715 Q860 735 855 795 L850 855 Q845 915 785 920 L725 925 Q665 930 620 910 L580 890 Q540 870 545 810 L550 750 Q555 690 620 680 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="700" y="810" textAnchor="middle" className="text-sm font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Murcia
                        </text>
                      </>
                    )}
                    
                    {/* Andalucía */}
                    {id === 'andalucia' && (
                      <>
                        <path
                          d="M100 760 Q220 755 340 775 L460 795 Q580 815 575 875 L570 935 Q565 995 445 1000 L325 1005 Q205 1010 100 990 L40 970 Q-20 950 -15 890 L-10 830 Q-5 770 100 760 Z"
                          fill={baseColor}
                          stroke="#1f2937"
                          strokeWidth="3"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onClick={() => setSelectedCommunity(community)}
                        />
                        <text x="280" y="880" textAnchor="middle" className="text-lg font-bold fill-white pointer-events-none" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                          Andalucía
                        </text>
                      </>
                    )}
                    
                    {/* Baleares */}
                    {id === 'baleares' && (
                      <>
                        <g>
                          <ellipse cx="900" cy="450" rx="20" ry="15" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="930" cy="470" rx="15" ry="12" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="960" cy="460" rx="12" ry="10" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <text x="930" y="510" textAnchor="middle" className="text-sm font-bold fill-gray-700 pointer-events-none">
                            Baleares
                          </text>
                        </g>
                      </>
                    )}
                    
                    {/* Canarias */}
                    {id === 'canarias' && (
                      <>
                        <rect x="80" y="650" width="300" height="120" fill="none" stroke="#1f2937" strokeWidth="3" rx="8" />
                        <text x="90" y="675" className="text-sm font-bold fill-gray-700">Islas Canarias</text>
                        <g>
                          <ellipse cx="120" cy="720" rx="12" ry="10" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="150" cy="710" rx="15" ry="12" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="180" cy="730" rx="18" ry="15" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="210" cy="715" rx="14" ry="11" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="240" cy="725" rx="16" ry="13" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="270" cy="705" rx="10" ry="8" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                          <ellipse cx="300" cy="720" rx="12" ry="10" fill={baseColor} stroke="#1f2937" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onClick={() => setSelectedCommunity(community)} />
                        </g>
                      </>
                    )}
                  </g>
                );
              })}
              
              {/* Ceuta y Melilla */}
              <circle cx="300" cy="1000" r="6" fill="#6b7280" stroke="#1f2937" strokeWidth="2" />
              <text x="315" y="1005" className="text-xs fill-gray-700">Ceuta</text>
              <circle cx="380" cy="1000" r="6" fill="#6b7280" stroke="#1f2937" strokeWidth="2" />
              <text x="395" y="1005" className="text-xs fill-gray-700">Melilla</text>
            </svg>
          </div>
          
          {/* Leyenda mejorada */}
          <div className="flex items-center gap-6 mt-4 p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 border border-gray-700 rounded"></div>
              <span className="text-sm font-medium">Seleccionada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 border border-gray-700 rounded"></div>
              <span className="text-sm font-medium">Con festivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 border border-gray-700 rounded"></div>
              <span className="text-sm font-medium">Sin festivos</span>
            </div>
            <div className="text-xs text-gray-500 ml-auto">
              * Haz click en una comunidad para ver sus festivos
            </div>
          </div>
        </div>

        {/* Panel de información mejorado y más grande */}
        <div className="w-96">
          {selectedCommunity ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg h-[500px] flex flex-col">
              <h3 className="font-semibold text-lg mb-3 text-blue-600 border-b pb-2">
                {selectedCommunity}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Festivos en {selectedMonth === 'all' ? selectedYear : `${MONTHS_CHRONOLOGICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}:
              </p>
              
              {(() => {
                const communityHolidays = getHolidaysForCommunity(selectedCommunity);
                
                if (communityHolidays.length === 0) {
                  return (
                    <p className="text-gray-500 italic">
                      No hay festivos registrados para esta comunidad en {selectedMonth === 'all' ? selectedYear : `${MONTHS_CHRONOLOGICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                    </p>
                  );
                }
                
                return (
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {communityHolidays.map((holiday, index) => (
                      <div 
                        key={holiday.id} 
                        className={`flex items-center justify-between p-2 rounded border-l-4 text-sm ${
                          holiday.comunidad_autonoma === 'NACIONAL' 
                            ? 'bg-red-50 border-red-500' 
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${
                            holiday.comunidad_autonoma === 'NACIONAL' ? 'text-red-800' : 'text-blue-800'
                          }`}>
                            {holiday.festivo}
                            {holiday.comunidad_autonoma === 'NACIONAL' && (
                              <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">
                                NAC
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs font-mono ml-2 ${
                          holiday.comunidad_autonoma === 'NACIONAL' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {format(new Date(holiday.date), 'dd/MM')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-600 font-medium mb-2">
                  Selecciona una comunidad autónoma
                </p>
                <p className="text-sm text-gray-500">
                  Haz click en cualquier comunidad del mapa para ver sus festivos en {selectedMonth === 'all' ? selectedYear : `${MONTHS_CHRONOLOGICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpainHolidaysMap;