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

const MONTHS_ALPHABETICAL = [
  { value: 'all', label: 'Todos' },
  { value: '4', label: 'Abril' },
  { value: '8', label: 'Agosto' },
  { value: '12', label: 'Diciembre' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '7', label: 'Julio' },
  { value: '6', label: 'Junio' },
  { value: '3', label: 'Marzo' },
  { value: '5', label: 'Mayo' },
  { value: '11', label: 'Noviembre' },
  { value: '10', label: 'Octubre' },
  { value: '9', label: 'Septiembre' }
];

const SpainHolidaysMap: React.FC<SpainHolidaysMapProps> = ({ holidays }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);

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
              {MONTHS_ALPHABETICAL.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Mapa SVG de España */}
        <div className="flex-1">
          <div className="relative">
            <svg 
              viewBox="0 0 800 600" 
              className="w-full h-96 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            >
              {/* Fondo del mar */}
              <defs>
                <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              <rect width="800" height="600" fill="url(#seaGradient)" />
              
              {/* Comunidades Autónomas */}
              {Object.entries(communityMapping).map(([community, id]) => {
                const communityHolidays = getHolidaysForCommunity(community);
                const hasHolidays = communityHolidays.length > 0;
                
                return (
                  <g key={community}>
                    {/* Andalucía */}
                    {id === 'andalucia' && (
                      <path
                        d="M150 350 L350 350 L350 450 L150 450 Z"
                        fill={hasHolidays ? "#059669" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* Madrid */}
                    {id === 'madrid' && (
                      <circle
                        cx="300"
                        cy="280"
                        r="25"
                        fill={hasHolidays ? "#dc2626" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* Cataluña */}
                    {id === 'cataluna' && (
                      <path
                        d="M450 200 L550 200 L550 320 L450 320 Z"
                        fill={hasHolidays ? "#7c3aed" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* Comunidad Valenciana */}
                    {id === 'valencia' && (
                      <path
                        d="M400 280 L480 280 L480 400 L400 400 Z"
                        fill={hasHolidays ? "#ea580c" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* Galicia */}
                    {id === 'galicia' && (
                      <path
                        d="M80 120 L180 120 L180 200 L80 200 Z"
                        fill={hasHolidays ? "#0891b2" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* País Vasco */}
                    {id === 'pais-vasco' && (
                      <path
                        d="M240 140 L340 140 L340 180 L240 180 Z"
                        fill={hasHolidays ? "#be123c" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* Resto de comunidades con formas básicas */}
                    {!['andalucia', 'madrid', 'cataluna', 'valencia', 'galicia', 'pais-vasco'].includes(id) && (
                      <rect
                        x={Math.random() * 600 + 100}
                        y={Math.random() * 400 + 100}
                        width="80"
                        height="60"
                        fill={hasHolidays ? "#16a34a" : "#d1d5db"}
                        stroke="#374151"
                        strokeWidth="2"
                        filter="url(#shadow)"
                        className="cursor-pointer transition-all duration-300 hover:brightness-110"
                        onMouseEnter={() => setHoveredCommunity(community)}
                        onMouseLeave={() => setHoveredCommunity(null)}
                      />
                    )}
                    
                    {/* Etiquetas */}
                    <text
                      x={id === 'madrid' ? 300 : id === 'andalucia' ? 250 : id === 'cataluna' ? 500 : id === 'valencia' ? 440 : id === 'galicia' ? 130 : id === 'pais-vasco' ? 290 : Math.random() * 600 + 140}
                      y={id === 'madrid' ? 285 : id === 'andalucia' ? 400 : id === 'cataluna' ? 260 : id === 'valencia' ? 340 : id === 'galicia' ? 160 : id === 'pais-vasco' ? 165 : Math.random() * 400 + 130}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-bold fill-white pointer-events-none"
                      style={{ 
                        fontSize: '11px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {community.length > 12 ? community.substring(0, 10) + '...' : community}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Leyenda mejorada */}
          <div className="flex items-center gap-6 mt-4 p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 border border-gray-700 rounded"></div>
              <span className="text-sm font-medium">Con festivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 border border-gray-700 rounded"></div>
              <span className="text-sm font-medium">Sin festivos</span>
            </div>
            <div className="text-xs text-gray-500 ml-auto">
              * Incluye festivos nacionales y autonómicos
            </div>
          </div>
        </div>

        {/* Panel de información mejorado */}
        <div className="w-80">
          {hoveredCommunity ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-600 border-b pb-2">
                {hoveredCommunity}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Festivos en {selectedMonth === 'all' ? selectedYear : `${MONTHS_ALPHABETICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}:
              </p>
              
              {(() => {
                const communityHolidays = getHolidaysForCommunity(hoveredCommunity);
                
                if (communityHolidays.length === 0) {
                  return (
                    <p className="text-gray-500 italic">
                      No hay festivos registrados para esta comunidad en {selectedMonth === 'all' ? selectedYear : `${MONTHS_ALPHABETICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {communityHolidays.map((holiday, index) => (
                      <div 
                        key={holiday.id} 
                        className={`flex flex-col gap-1 p-3 rounded-lg border-l-4 ${
                          holiday.comunidad_autonoma === 'NACIONAL' 
                            ? 'bg-red-50 border-red-500' 
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className={`font-medium text-sm ${
                          holiday.comunidad_autonoma === 'NACIONAL' ? 'text-red-800' : 'text-blue-800'
                        }`}>
                          {holiday.festivo}
                          {holiday.comunidad_autonoma === 'NACIONAL' && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              NACIONAL
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${
                          holiday.comunidad_autonoma === 'NACIONAL' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {format(new Date(holiday.date), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-gray-600 font-medium mb-2">
                  Explora los festivos por comunidad
                </p>
                <p className="text-sm text-gray-500">
                  Pasa el ratón sobre una comunidad autónoma para ver sus festivos en {selectedMonth === 'all' ? selectedYear : `${MONTHS_ALPHABETICAL.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
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