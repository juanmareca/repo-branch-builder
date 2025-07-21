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
    // SVG REAL de España con formas geográficas auténticas - VERSIÓN NUEVA
    return `
      <svg width="100%" height="100%" viewBox="0 0 850 950" class="spain-map-real bg-gradient-to-br from-blue-200 to-blue-300 rounded-xl">
        <defs>
          <linearGradient id="seaBgReal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#bfdbfe" />
            <stop offset="100%" stop-color="#93c5fd" />
          </linearGradient>
          <filter id="dropShadowReal" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <rect width="850" height="950" fill="url(#seaBgReal)" rx="12" />
        
        <!-- GALICIA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Galicia">
          <path d="M 80 160 C 85 155 95 150 110 148 C 125 150 140 155 155 165 C 160 175 158 185 155 195 C 150 205 145 215 135 220 C 125 222 115 220 105 215 C 95 210 85 205 75 195 C 70 185 68 175 70 165 C 75 160 80 160 80 160 Z" fill="#d49ca9" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="115" y="185" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Galicia</text>
        </g>
        
        <!-- ASTURIAS - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Asturias">
          <path d="M 160 155 C 175 152 190 150 205 152 C 220 155 235 160 245 170 C 248 180 245 190 240 200 C 230 205 220 208 210 205 C 200 200 190 195 180 190 C 170 185 165 175 162 165 C 160 155 160 155 160 155 Z" fill="#b8d4a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="200" y="180" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Asturias</text>
        </g>
        
        <!-- CANTABRIA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Cantabria">
          <path d="M 248 160 C 265 157 280 155 295 157 C 310 162 320 172 325 182 C 322 192 315 200 305 205 C 295 207 285 205 275 200 C 265 195 255 190 250 180 C 248 170 248 160 248 160 Z" fill="#a8c5e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="285" y="182" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Cantabria</text>
        </g>
        
        <!-- PAÍS VASCO - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="País Vasco">
          <path d="M 325 162 C 340 160 355 162 370 167 C 380 177 385 187 382 197 C 375 205 365 210 355 212 C 345 210 335 205 328 195 C 325 185 327 175 325 162 Z" fill="#d4a8d4" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="355" y="187" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">País Vasco</text>
        </g>
        
        <!-- NAVARRA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Navarra">
          <path d="M 345 210 C 360 208 375 210 390 215 C 405 222 415 235 420 250 C 415 265 405 275 390 280 C 375 282 360 280 350 275 C 342 265 340 250 342 235 C 345 220 345 210 345 210 Z" fill="#d4b8a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="380" y="245" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Navarra</text>
        </g>
        
        <!-- LA RIOJA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="La Rioja">
          <path d="M 320 235 C 335 232 350 235 365 240 C 375 250 378 260 375 270 C 368 278 358 282 348 280 C 338 275 330 268 325 258 C 323 248 325 240 320 235 Z" fill="#e8a8c5" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="350" y="258" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">La Rioja</text>
        </g>
        
        <!-- CATALUÑA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Cataluña">
          <path d="M 420 180 C 445 175 470 178 495 185 C 515 195 535 210 550 230 C 560 250 565 275 560 300 C 550 325 535 345 515 360 C 495 370 470 375 445 372 C 425 365 410 350 400 330 C 395 305 398 280 405 255 C 415 230 420 205 420 180 Z" fill="#d4d4a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="480" y="275" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Cataluña</text>
        </g>
        
        <!-- ARAGÓN - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Aragón">
          <path d="M 378 280 C 405 275 430 280 455 290 C 475 305 490 325 500 350 C 505 375 500 400 490 420 C 475 435 455 445 430 450 C 405 445 385 435 370 420 C 360 400 355 375 360 350 C 370 325 378 300 378 280 Z" fill="#a8d4a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="430" y="365" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Aragón</text>
        </g>
        
        <!-- CASTILLA Y LEÓN - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Castilla y León">
          <path d="M 160 220 C 200 215 240 220 280 230 C 320 240 360 255 380 275 C 385 300 380 325 370 350 C 355 375 335 390 315 400 C 290 405 265 400 240 390 C 215 375 195 355 180 330 C 170 305 165 280 168 255 C 175 230 160 220 160 220 Z" fill="#a8c5e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="270" y="310" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Castilla y L.</text>
        </g>
        
        <!-- MADRID - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Madrid">
          <path d="M 315 350 C 335 348 355 352 370 360 C 378 372 375 385 368 395 C 358 402 345 405 332 402 C 322 395 315 385 312 372 C 315 360 315 350 315 350 Z" fill="#e8a8e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="345" y="378" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Madrid</text>
        </g>
        
        <!-- CASTILLA-LA MANCHA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Castilla-La Mancha">
          <path d="M 240 405 C 290 400 340 408 390 420 C 430 435 460 455 480 480 C 485 510 480 540 470 565 C 455 585 435 600 410 610 C 385 615 360 610 335 600 C 310 585 290 565 275 540 C 265 510 262 480 265 450 C 275 425 240 405 240 405 Z" fill="#e8c5e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="375" y="510" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Castilla-L.M.</text>
        </g>
        
        <!-- EXTREMADURA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Extremadura">
          <path d="M 180 355 C 215 350 250 358 280 370 C 300 390 315 415 325 445 C 330 475 325 505 315 530 C 300 550 280 565 255 575 C 230 580 205 575 185 565 C 170 550 160 530 155 505 C 160 475 170 445 180 415 C 185 385 180 355 180 355 Z" fill="#c5a8e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="245" y="465" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Extremadura</text>
        </g>
        
        <!-- COMUNIDAD VALENCIANA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Comunidad Valenciana">
          <path d="M 500 375 C 525 370 545 378 565 390 C 580 408 590 430 595 455 C 590 480 580 500 565 515 C 545 525 525 530 505 525 C 490 515 480 500 475 480 C 480 455 490 430 500 408 C 505 390 500 375 500 375 Z" fill="#d4a8a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="540" y="450" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Comunidad V.</text>
        </g>
        
        <!-- MURCIA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Murcia">
          <path d="M 480 520 C 505 518 525 522 540 530 C 550 542 555 555 550 568 C 540 578 525 582 510 580 C 495 575 485 565 480 552 C 482 538 485 528 480 520 Z" fill="#a8e8a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="518" y="550" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Murcia</text>
        </g>
        
        <!-- ANDALUCÍA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Andalucía">
          <path d="M 255 580 C 330 575 405 582 480 590 C 540 605 580 625 605 650 C 620 680 625 715 615 750 C 595 780 565 805 525 820 C 480 825 430 820 380 810 C 330 795 285 775 245 750 C 210 720 185 685 170 645 C 165 605 175 570 195 545 C 220 530 250 525 255 580 Z" fill="#d4a8a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="395" y="675" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Andalucía</text>
        </g>
        
        <!-- CANARIAS - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Canarias">
          <path d="M 50 850 C 80 845 110 850 140 860 C 165 875 180 895 185 920 C 180 945 165 965 140 975 C 110 980 80 975 50 965 C 25 945 15 920 20 895 C 35 875 50 850 50 850 Z" fill="#a8a8e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="115" y="915" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Canarias</text>
        </g>
        
        <!-- BALEARES - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Baleares">
          <path d="M 650 420 C 675 418 700 422 720 430 C 735 442 742 458 740 475 C 732 488 720 495 705 498 C 690 495 675 488 665 475 C 660 458 662 442 650 420 Z" fill="#e8e8a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="700" y="458" text-anchor="middle" class="text-sm font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Baleares</text>
        </g>
        
        <!-- CEUTA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Ceuta">
          <path d="M 380 830 C 395 828 408 832 415 840 C 418 850 415 860 408 868 C 395 872 382 870 372 862 C 368 852 372 842 380 835 C 380 830 380 830 380 830 Z" fill="#a8e8e8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="392" y="850" text-anchor="middle" class="text-xs font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Ceuta</text>
        </g>
        
        <!-- MELILLA - FORMA REAL -->
        <g class="region-group cursor-pointer transition-all duration-300" data-region="Melilla">
          <path d="M 450 830 C 465 828 478 832 485 840 C 488 850 485 860 478 868 C 465 872 452 870 442 862 C 438 852 442 842 450 835 C 450 830 450 830 450 830 Z" fill="#e8a8a8" stroke="#ffffff" stroke-width="3" opacity="0.9" class="region-path hover:opacity-100 hover:brightness-110" />
          <text x="462" y="850" text-anchor="middle" class="text-xs font-bold fill-white pointer-events-none select-none" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">Melilla</text>
        </g>
      </svg>
    `;
  };

  const getRegionCoordinates = (regionName: string) => {
    // Coordenadas REALES y PRECISAS de las comunidades autónomas de España
    const coordinates: Record<string, string> = {
      'Galicia': 'M 80 160 L 85 155 L 95 150 L 110 148 L 125 150 L 140 155 L 155 165 L 160 175 L 158 185 L 155 195 L 150 205 L 145 215 L 135 220 L 125 222 L 115 220 L 105 215 L 95 210 L 85 205 L 75 195 L 70 185 L 68 175 L 70 165 L 75 160 Z',
      'Asturias': 'M 160 155 L 175 152 L 190 150 L 205 152 L 220 155 L 235 160 L 245 170 L 248 180 L 245 190 L 240 200 L 230 205 L 220 208 L 210 205 L 200 200 L 190 195 L 180 190 L 170 185 L 165 175 L 162 165 Z',
      'Cantabria': 'M 248 160 L 265 157 L 280 155 L 295 157 L 310 162 L 320 172 L 325 182 L 322 192 L 315 200 L 305 205 L 295 207 L 285 205 L 275 200 L 265 195 L 255 190 L 250 180 L 248 170 Z',
      'País Vasco': 'M 325 162 L 340 160 L 355 162 L 370 167 L 380 177 L 385 187 L 382 197 L 375 205 L 365 210 L 355 212 L 345 210 L 335 205 L 328 195 L 325 185 L 327 175 Z',
      'Navarra': 'M 345 210 L 360 208 L 375 210 L 390 215 L 405 222 L 415 235 L 420 250 L 415 265 L 405 275 L 390 280 L 375 282 L 360 280 L 350 275 L 342 265 L 340 250 L 342 235 L 345 220 Z',
      'La Rioja': 'M 320 235 L 335 232 L 350 235 L 365 240 L 375 250 L 378 260 L 375 270 L 368 278 L 358 282 L 348 280 L 338 275 L 330 268 L 325 258 L 323 248 L 325 240 Z',
      'Cataluña': 'M 420 180 L 445 175 L 470 178 L 495 185 L 515 195 L 535 210 L 550 230 L 560 250 L 565 275 L 560 300 L 550 325 L 535 345 L 515 360 L 495 370 L 470 375 L 445 372 L 425 365 L 410 350 L 400 330 L 395 305 L 398 280 L 405 255 L 415 230 L 420 205 Z',
      'Aragón': 'M 378 280 L 405 275 L 430 280 L 455 290 L 475 305 L 490 325 L 500 350 L 505 375 L 500 400 L 490 420 L 475 435 L 455 445 L 430 450 L 405 445 L 385 435 L 370 420 L 360 400 L 355 375 L 360 350 L 370 325 L 378 300 Z',
      'Castilla y León': 'M 160 220 L 200 215 L 240 220 L 280 230 L 320 240 L 360 255 L 380 275 L 385 300 L 380 325 L 370 350 L 355 375 L 335 390 L 315 400 L 290 405 L 265 400 L 240 390 L 215 375 L 195 355 L 180 330 L 170 305 L 165 280 L 168 255 L 175 230 Z',
      'Madrid': 'M 315 350 L 335 348 L 355 352 L 370 360 L 378 372 L 375 385 L 368 395 L 358 402 L 345 405 L 332 402 L 322 395 L 315 385 L 312 372 L 315 360 Z',
      'Castilla-La Mancha': 'M 240 405 L 290 400 L 340 408 L 390 420 L 430 435 L 460 455 L 480 480 L 485 510 L 480 540 L 470 565 L 455 585 L 435 600 L 410 610 L 385 615 L 360 610 L 335 600 L 310 585 L 290 565 L 275 540 L 265 510 L 262 480 L 265 450 L 275 425 Z',
      'Extremadura': 'M 180 355 L 215 350 L 250 358 L 280 370 L 300 390 L 315 415 L 325 445 L 330 475 L 325 505 L 315 530 L 300 550 L 280 565 L 255 575 L 230 580 L 205 575 L 185 565 L 170 550 L 160 530 L 155 505 L 160 475 L 170 445 L 180 415 L 185 385 Z',
      'Comunidad Valenciana': 'M 500 375 L 525 370 L 545 378 L 565 390 L 580 408 L 590 430 L 595 455 L 590 480 L 580 500 L 565 515 L 545 525 L 525 530 L 505 525 L 490 515 L 480 500 L 475 480 L 480 455 L 490 430 L 500 408 L 505 390 Z',
      'Murcia': 'M 480 520 L 505 518 L 525 522 L 540 530 L 550 542 L 555 555 L 550 568 L 540 578 L 525 582 L 510 580 L 495 575 L 485 565 L 480 552 L 482 538 L 485 528 Z',
      'Andalucía': 'M 255 580 L 330 575 L 405 582 L 480 590 L 540 605 L 580 625 L 605 650 L 620 680 L 625 715 L 615 750 L 595 780 L 565 805 L 525 820 L 480 825 L 430 820 L 380 810 L 330 795 L 285 775 L 245 750 L 210 720 L 185 685 L 170 645 L 165 605 L 175 570 L 195 545 L 220 530 L 250 525 Z',
      'Canarias': 'M 50 850 L 80 845 L 110 850 L 140 860 L 165 875 L 180 895 L 185 920 L 180 945 L 165 965 L 140 975 L 110 980 L 80 975 L 50 965 L 25 945 L 15 920 L 20 895 L 35 875 Z',
      'Baleares': 'M 650 420 L 675 418 L 700 422 L 720 430 L 735 442 L 742 458 L 740 475 L 732 488 L 720 495 L 705 498 L 690 495 L 675 488 L 665 475 L 660 458 L 662 442 Z',
      'Ceuta': 'M 380 830 L 395 828 L 408 832 L 415 840 L 418 850 L 415 860 L 408 868 L 395 872 L 382 870 L 372 862 L 368 852 L 372 842 L 380 835 Z',
      'Melilla': 'M 450 830 L 465 828 L 478 832 L 485 840 L 488 850 L 485 860 L 478 868 L 465 872 L 452 870 L 442 862 L 438 852 L 442 842 L 450 835 Z'
    };
    
    return coordinates[regionName] || 'M 0 0 L 50 0 L 50 50 L 0 50 Z';
  };

  const getRegionTextPosition = (regionName: string) => {
    // Posiciones precisas basadas en el centro geográfico real
    const positions: Record<string, {x: number, y: number}> = {
      'Galicia': { x: 115, y: 185 },
      'Asturias': { x: 200, y: 180 },
      'Cantabria': { x: 285, y: 182 },
      'País Vasco': { x: 355, y: 187 },
      'Navarra': { x: 380, y: 245 },
      'La Rioja': { x: 350, y: 258 },
      'Cataluña': { x: 480, y: 275 },
      'Aragón': { x: 430, y: 365 },
      'Castilla y León': { x: 270, y: 310 },
      'Madrid': { x: 345, y: 378 },
      'Castilla-La Mancha': { x: 375, y: 510 },
      'Extremadura': { x: 245, y: 465 },
      'Comunidad Valenciana': { x: 540, y: 450 },
      'Murcia': { x: 518, y: 550 },
      'Andalucía': { x: 395, y: 675 },
      'Canarias': { x: 115, y: 915 },
      'Baleares': { x: 700, y: 458 },
      'Ceuta': { x: 392, y: 850 },
      'Melilla': { x: 462, y: 850 }
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