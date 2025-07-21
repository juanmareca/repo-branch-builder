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
        {/* Mapa SVG de España realista */}
        <div className="flex-1">
          <div className="relative">
            <svg 
              viewBox="0 0 1000 700" 
              className="w-full h-96 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            >
              {/* Fondo del mar */}
              <defs>
                <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bfdbfe" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              <rect width="1000" height="700" fill="url(#seaGradient)" />
              
              {/* Comunidades Autónomas con formas reales */}
              {Object.entries(communityMapping).map(([community, id]) => {
                const communityHolidays = getHolidaysForCommunity(community);
                const hasHolidays = communityHolidays.length > 0;
                const baseColor = hasHolidays ? "#059669" : "#d1d5db";
                
                return (
                  <g key={community}>
                    {/* Galicia */}
                    {id === 'galicia' && (
                      <>
                        <path
                          d="M60 150 Q50 140 45 155 L40 165 Q35 175 45 185 L55 195 Q60 205 70 200 L85 195 Q95 190 105 195 L120 200 Q130 205 140 195 L150 185 Q155 175 150 165 L145 155 Q140 145 130 150 L120 155 Q110 160 100 155 L90 150 Q80 145 70 150 L60 150 Z"
                          fill={hasHolidays ? "#e11d48" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="95" y="175" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Galicia
                        </text>
                      </>
                    )}
                    
                    {/* Asturias */}
                    {id === 'asturias' && (
                      <>
                        <path
                          d="M170 140 L240 140 Q250 145 245 155 L240 165 Q235 175 225 170 L210 165 Q200 160 190 165 L180 170 Q170 175 165 165 L160 155 Q165 145 170 140 Z"
                          fill={hasHolidays ? "#7c3aed" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="205" y="160" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Asturias
                        </text>
                      </>
                    )}
                    
                    {/* Cantabria */}
                    {id === 'cantabria' && (
                      <>
                        <path
                          d="M270 140 L340 140 Q350 145 345 155 L340 165 Q335 175 325 170 L310 165 Q300 160 290 165 L280 170 Q270 175 265 165 L260 155 Q265 145 270 140 Z"
                          fill={hasHolidays ? "#0891b2" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="305" y="160" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Cantabria
                        </text>
                      </>
                    )}
                    
                    {/* País Vasco */}
                    {id === 'pais-vasco' && (
                      <>
                        <path
                          d="M370 140 L420 140 Q430 145 425 155 L420 165 Q415 175 405 170 L395 165 Q385 160 375 165 L370 170 Q365 175 360 165 L355 155 Q360 145 370 140 Z"
                          fill={hasHolidays ? "#be123c" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="390" y="160" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          País Vasco
                        </text>
                      </>
                    )}
                    
                    {/* Navarra */}
                    {id === 'navarra' && (
                      <>
                        <path
                          d="M430 150 L480 150 Q490 155 485 165 L480 175 Q475 185 465 180 L455 175 Q445 170 435 175 L430 180 Q425 185 420 175 L415 165 Q420 155 430 150 Z"
                          fill={hasHolidays ? "#f59e0b" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="450" y="170" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Navarra
                        </text>
                      </>
                    )}
                    
                    {/* La Rioja */}
                    {id === 'rioja' && (
                      <>
                        <path
                          d="M380 190 L430 190 Q440 195 435 205 L430 215 Q425 225 415 220 L405 215 Q395 210 385 215 L380 220 Q375 225 370 215 L365 205 Q370 195 380 190 Z"
                          fill={hasHolidays ? "#dc2626" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="400" y="210" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          La Rioja
                        </text>
                      </>
                    )}
                    
                    {/* Cataluña */}
                    {id === 'cataluna' && (
                      <>
                        <path
                          d="M500 160 Q520 155 540 165 L560 175 Q580 185 575 205 L570 225 Q565 245 545 250 L525 255 Q505 260 490 250 L480 240 Q470 230 475 210 L480 190 Q485 170 500 160 Z"
                          fill={hasHolidays ? "#7c3aed" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="520" y="210" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Cataluña
                        </text>
                      </>
                    )}
                    
                    {/* Aragón */}
                    {id === 'aragon' && (
                      <>
                        <path
                          d="M440 200 Q460 195 480 205 L500 215 Q520 225 515 245 L510 265 Q505 285 485 290 L465 295 Q445 300 430 290 L420 280 Q410 270 415 250 L420 230 Q425 210 440 200 Z"
                          fill={hasHolidays ? "#16a34a" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="460" y="250" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Aragón
                        </text>
                      </>
                    )}
                    
                    {/* Castilla y León */}
                    {id === 'castilla-leon' && (
                      <>
                        <path
                          d="M160 190 Q200 185 240 195 L280 205 Q320 215 315 255 L310 295 Q305 335 265 340 L225 345 Q185 350 150 340 L120 330 Q90 320 95 280 L100 240 Q105 200 160 190 Z"
                          fill={hasHolidays ? "#0ea5e9" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="205" y="270" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Castilla y León
                        </text>
                      </>
                    )}
                    
                    {/* Madrid */}
                    {id === 'madrid' && (
                      <>
                        <circle
                          cx="320"
                          cy="320"
                          r="25"
                          fill={hasHolidays ? "#dc2626" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="320" y="325" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Madrid
                        </text>
                      </>
                    )}
                    
                    {/* Castilla-La Mancha */}
                    {id === 'castilla-mancha' && (
                      <>
                        <path
                          d="M250 360 Q290 355 330 365 L370 375 Q410 385 405 425 L400 465 Q395 505 355 510 L315 515 Q275 520 240 510 L200 500 Q160 490 165 450 L170 410 Q175 370 250 360 Z"
                          fill={hasHolidays ? "#a855f7" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="285" y="440" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Castilla-La Mancha
                        </text>
                      </>
                    )}
                    
                    {/* Extremadura */}
                    {id === 'extremadura' && (
                      <>
                        <path
                          d="M120 360 Q160 355 200 365 L240 375 Q280 385 275 425 L270 465 Q265 505 225 510 L185 515 Q145 520 110 510 L70 500 Q30 490 35 450 L40 410 Q45 370 120 360 Z"
                          fill={hasHolidays ? "#059669" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="155" y="440" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Extremadura
                        </text>
                      </>
                    )}
                    
                    {/* Comunidad Valenciana */}
                    {id === 'valencia' && (
                      <>
                        <path
                          d="M480 280 Q500 275 520 285 L540 295 Q560 305 555 345 L550 385 Q545 425 505 430 L485 435 Q465 440 450 430 L440 420 Q430 410 435 370 L440 330 Q445 290 480 280 Z"
                          fill={hasHolidays ? "#ea580c" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="495" y="360" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          C. Valenciana
                        </text>
                      </>
                    )}
                    
                    {/* Murcia */}
                    {id === 'murcia' && (
                      <>
                        <path
                          d="M440 450 Q480 445 520 455 L560 465 Q600 475 595 515 L590 555 Q585 595 545 600 L505 605 Q465 610 430 600 L390 590 Q350 580 355 540 L360 500 Q365 460 440 450 Z"
                          fill={hasHolidays ? "#f59e0b" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="475" y="530" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Murcia
                        </text>
                      </>
                    )}
                    
                    {/* Andalucía */}
                    {id === 'andalucia' && (
                      <>
                        <path
                          d="M80 530 Q160 525 240 535 L320 545 Q400 555 395 595 L390 635 Q385 675 305 680 L225 685 Q145 690 60 680 L20 670 Q-20 660 -15 620 L-10 580 Q-5 540 80 530 Z"
                          fill={hasHolidays ? "#0891b2" : "#d1d5db"}
                          stroke="#374151"
                          strokeWidth="2"
                          filter="url(#shadow)"
                          className="cursor-pointer transition-all duration-300 hover:brightness-110"
                          onMouseEnter={() => setHoveredCommunity(community)}
                          onMouseLeave={() => setHoveredCommunity(null)}
                        />
                        <text x="190" y="610" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                          Andalucía
                        </text>
                      </>
                    )}
                    
                    {/* Baleares */}
                    {id === 'baleares' && (
                      <>
                        <g>
                          <circle cx="620" cy="350" r="12" fill={hasHolidays ? "#7c3aed" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="640" cy="370" r="10" fill={hasHolidays ? "#7c3aed" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="660" cy="360" r="8" fill={hasHolidays ? "#7c3aed" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <text x="640" y="400" textAnchor="middle" className="text-xs font-bold fill-gray-700 pointer-events-none">
                            Baleares
                          </text>
                        </g>
                      </>
                    )}
                    
                    {/* Canarias */}
                    {id === 'canarias' && (
                      <>
                        <rect x="50" y="550" width="250" height="120" fill="none" stroke="#374151" strokeWidth="2" rx="8" />
                        <text x="60" y="570" className="text-xs font-bold fill-gray-700">Islas Canarias</text>
                        <g>
                          <circle cx="80" cy="600" r="8" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="110" cy="590" r="10" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="140" cy="610" r="12" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="170" cy="595" r="9" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="200" cy="605" r="11" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="230" cy="590" r="7" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                          <circle cx="260" cy="600" r="8" fill={hasHolidays ? "#f59e0b" : "#d1d5db"} stroke="#374151" strokeWidth="2" filter="url(#shadow)" className="cursor-pointer transition-all duration-300 hover:brightness-110" onMouseEnter={() => setHoveredCommunity(community)} onMouseLeave={() => setHoveredCommunity(null)} />
                        </g>
                      </>
                    )}
                  </g>
                );
              })}
              
              {/* Ceuta y Melilla */}
              <circle cx="220" cy="680" r="4" fill="#6b7280" stroke="#374151" strokeWidth="1" />
              <text x="235" y="685" className="text-xs fill-gray-700">Ceuta</text>
              <circle cx="280" cy="680" r="4" fill="#6b7280" stroke="#374151" strokeWidth="1" />
              <text x="295" y="685" className="text-xs fill-gray-700">Melilla</text>
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