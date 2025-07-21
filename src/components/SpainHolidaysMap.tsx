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

const SpainHolidaysMap: React.FC<SpainHolidaysMapProps> = ({ holidays }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);

  // Obtener años únicos de los festivos
  const availableYears = useMemo(() => {
    const years = holidays
      .map(holiday => new Date(holiday.date).getFullYear())
      .filter(year => !isNaN(year));
    return [...new Set(years)].sort((a, b) => b - a);
  }, [holidays]);

  // Filtrar festivos por año y comunidad autónoma
  const getHolidaysForCommunity = (community: string) => {
    return holidays
      .filter(holiday => {
        const holidayYear = new Date(holiday.date).getFullYear();
        return holidayYear.toString() === selectedYear && 
               holiday.pais === 'España' &&
               holiday.comunidad_autonoma === community;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Coordenadas aproximadas de las comunidades autónomas para el SVG
  const communityPositions = {
    'NACIONAL': { x: 400, y: 200, width: 0, height: 0 }, // No mostrar en mapa
    'Andalucía': { x: 200, y: 380, width: 180, height: 80 },
    'Aragón': { x: 380, y: 200, width: 100, height: 80 },
    'Asturias': { x: 150, y: 120, width: 80, height: 40 },
    'Baleares': { x: 480, y: 300, width: 60, height: 40 },
    'Canarias': { x: 80, y: 480, width: 120, height: 60 },
    'Cantabria': { x: 200, y: 120, width: 70, height: 40 },
    'Castilla y León': { x: 200, y: 180, width: 160, height: 120 },
    'Castilla-La Mancha': { x: 280, y: 280, width: 140, height: 100 },
    'Cataluña': { x: 420, y: 200, width: 80, height: 100 },
    'Comunidad Valenciana': { x: 380, y: 280, width: 60, height: 120 },
    'Extremadura': { x: 160, y: 280, width: 100, height: 100 },
    'Galicia': { x: 80, y: 120, width: 80, height: 80 },
    'La Rioja': { x: 320, y: 160, width: 50, height: 40 },
    'Madrid': { x: 280, y: 240, width: 40, height: 40 },
    'Murcia': { x: 380, y: 360, width: 60, height: 50 },
    'Navarra': { x: 320, y: 140, width: 60, height: 50 },
    'País Vasco': { x: 240, y: 140, width: 80, height: 40 }
  };

  return (
    <div className="space-y-6">
      {/* Selector de año */}
      <div className="flex items-center gap-4">
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

      <div className="flex gap-6">
        {/* Mapa SVG de España */}
        <div className="flex-1">
          <svg 
            viewBox="0 0 600 600" 
            className="w-full h-96 border border-gray-200 rounded-lg bg-blue-50"
          >
            {Object.entries(communityPositions).map(([community, pos]) => {
              if (community === 'NACIONAL' || pos.width === 0) return null;
              
              const communityHolidays = getHolidaysForCommunity(community);
              const hasHolidays = communityHolidays.length > 0;
              
              return (
                <rect
                  key={community}
                  x={pos.x}
                  y={pos.y}
                  width={pos.width}
                  height={pos.height}
                  fill={hasHolidays ? "#3b82f6" : "#e5e7eb"}
                  stroke="#1f2937"
                  strokeWidth="2"
                  className={`cursor-pointer transition-all duration-200 ${
                    hasHolidays ? 'hover:fill-blue-600' : 'hover:fill-gray-400'
                  }`}
                  onMouseEnter={() => setHoveredCommunity(community)}
                  onMouseLeave={() => setHoveredCommunity(null)}
                />
              );
            })}
            
            {/* Etiquetas de las comunidades */}
            {Object.entries(communityPositions).map(([community, pos]) => {
              if (community === 'NACIONAL' || pos.width === 0) return null;
              
              return (
                <text
                  key={`${community}-label`}
                  x={pos.x + pos.width / 2}
                  y={pos.y + pos.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-white pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  {community.length > 10 ? community.substring(0, 8) + '...' : community}
                </text>
              );
            })}
          </svg>
          
          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 border border-gray-700"></div>
              <span>Con festivos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 border border-gray-700"></div>
              <span>Sin festivos</span>
            </div>
          </div>
        </div>

        {/* Panel de información */}
        <div className="w-80">
          {hoveredCommunity ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold text-lg mb-3 text-blue-600">
                {hoveredCommunity}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Festivos en {selectedYear}:
              </p>
              
              {(() => {
                const communityHolidays = getHolidaysForCommunity(hoveredCommunity);
                
                if (communityHolidays.length === 0) {
                  return (
                    <p className="text-gray-500 italic">
                      No hay festivos registrados para esta comunidad en {selectedYear}
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {communityHolidays.map((holiday, index) => (
                      <div 
                        key={holiday.id} 
                        className="flex flex-col gap-1 p-2 bg-blue-50 rounded border-l-4 border-blue-500"
                      >
                        <div className="font-medium text-sm text-blue-800">
                          {holiday.festivo}
                        </div>
                        <div className="text-xs text-blue-600">
                          {format(new Date(holiday.date), 'dd/MM/yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-center">
                Pasa el ratón sobre una comunidad autónoma para ver sus festivos en {selectedYear}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpainHolidaysMap;