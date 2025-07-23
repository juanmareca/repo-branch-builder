import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Settings2,
  Download,
  X,
  Save,
  RotateCcw,
  Home,
  LogOut,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Type,
  GripVertical,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SpainHolidaysMap from '@/components/SpainHolidaysMap';
import * as XLSX from 'xlsx';

interface Holiday {
  id: string;
  date: string;
  festivo: string;
  pais: string;
  comunidad_autonoma: string;
  origen: string;
  created_at: string;
}

interface ColumnConfig {
  key: keyof Holiday;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
  resizable: boolean;
}

const SPANISH_AUTONOMOUS_COMMUNITIES = [
  'NACIONAL',
  'Andalucía',
  'Aragón',
  'Asturias',
  'Baleares',
  'Canarias',
  'Cantabria',
  'Castilla y León',
  'Castilla-La Mancha',
  'Cataluña',
  'Comunidad Valenciana',
  'Extremadura',
  'Galicia',
  'La Rioja',
  'Madrid',
  'Murcia',
  'Navarra',
  'País Vasco'
];

const COUNTRIES = [
  'España',
  'Brasil',
  'Chile',
  'Reino Unido',
  'Alemania',
  'Argentina',
  'Francia',
  'Italia',
  'Portugal'
];

const SquadLeadHolidaysManagement = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState<string[]>([]);
  const [originFilter, setOriginFilter] = useState<string[]>([]);
  const [festivoFilter, setFestivoFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Holiday>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [isDefaultViewSaved, setIsDefaultViewSaved] = useState(false);
  
  // Font size control
  const [fontSize, setFontSize] = useState(12);
  
  // Column resizing
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Column management with persistence - Sin la columna de acciones
  const getInitialColumns = (): ColumnConfig[] => {
    // Limpiar configuración obsoleta
    localStorage.removeItem('squad-lead-holidays-columns-config');
    
    // Configuración por defecto sin columna de acciones
    return [
      { key: 'date', label: 'FECHA', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'festivo', label: 'FESTIVO', visible: true, width: 250, minWidth: 200, resizable: true },
      { key: 'pais', label: 'PAÍS', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'comunidad_autonoma', label: 'COMUNIDAD AUTÓNOMA', visible: true, width: 200, minWidth: 180, resizable: true },
      { key: 'origen', label: 'ORIGEN', visible: true, width: 120, minWidth: 100, resizable: true }
    ];
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(getInitialColumns());

  // Save columns configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('squad-lead-holidays-columns-config', JSON.stringify(columns));
  }, [columns]);

  // Clean up obsolete columns configuration on component mount
  useEffect(() => {
    const validKeys: (keyof Holiday)[] = ['date', 'festivo', 'pais', 'comunidad_autonoma', 'origen'];
    const hasObsoleteColumns = columns.some(col => !validKeys.includes(col.key));
    
    if (hasObsoleteColumns) {
      const cleanedColumns = columns.filter(col => validKeys.includes(col.key));
      setColumns(cleanedColumns);
      localStorage.setItem('squad-lead-holidays-columns-config', JSON.stringify(cleanedColumns));
    }
  }, []);

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando todos los festivos...');
      
      let allHolidays: Holiday[] = [];
      let hasMore = true;
      let from = 0;
      const batchSize = 1000;
      
      while (hasMore) {
        console.log(`📦 Cargando lote desde ${from} hasta ${from + batchSize - 1}`);
        
        const { data, error } = await supabase
          .from('holidays')
          .select('*')
          .order('date', { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allHolidays = [...allHolidays, ...data];
          from += batchSize;
          
          // Si el lote es menor que batchSize, hemos llegado al final
          if (data.length < batchSize) {
            hasMore = false;
          }
          
          console.log(`📊 Lote cargado: ${data.length} festivos. Total acumulado: ${allHolidays.length}`);
        } else {
          hasMore = false;
        }
      }
      
      console.log('✅ Festivos cargados:', allHolidays.length);
      setHolidays(allHolidays);
    } catch (error: any) {
      toast({
        title: "Error al cargar festivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [holidays, searchTerm, countryFilter, communityFilter, originFilter, festivoFilter, yearFilter, monthFilter, sortField, sortDirection]);

  const applyFilters = useCallback(() => {
    let filtered = [...holidays];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(holiday =>
        holiday.festivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holiday.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
        holiday.comunidad_autonoma.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Country filter
    if (countryFilter.length > 0) {
      filtered = filtered.filter(holiday => countryFilter.includes(holiday.pais));
    }

    // Community filter
    if (communityFilter.length > 0) {
      filtered = filtered.filter(holiday => communityFilter.includes(holiday.comunidad_autonoma));
    }

    // Origin filter
    if (originFilter.length > 0) {
      filtered = filtered.filter(holiday => originFilter.includes(holiday.origen));
    }

    // Festivo filter
    if (festivoFilter.length > 0) {
      filtered = filtered.filter(holiday => festivoFilter.includes(holiday.festivo));
    }

    // Year filter
    if (yearFilter.length > 0) {
      filtered = filtered.filter(holiday => {
        const holidayYear = new Date(holiday.date).getFullYear().toString();
        return yearFilter.includes(holidayYear);
      });
    }

    // Month filter
    if (monthFilter.length > 0) {
      filtered = filtered.filter(holiday => {
        const holidayMonth = (new Date(holiday.date).getMonth() + 1).toString();
        return monthFilter.includes(holidayMonth);
      });
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];
        
        // Handle date sorting
        if (sortField === 'date') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          // Convert to string for comparison
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    setFilteredHolidays(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [holidays, searchTerm, countryFilter, communityFilter, originFilter, festivoFilter, sortField, sortDirection]);

  const handleExportExcel = () => {
    const exportData = filteredHolidays.map((holiday, index) => ({
      'ÍNDICE': index + 1,
      'FECHA': format(new Date(holiday.date), 'dd/MM/yyyy'),
      'FESTIVO': holiday.festivo,
      'PAÍS': holiday.pais,
      'COMUNIDAD AUTÓNOMA': holiday.comunidad_autonoma,
      'ORIGEN': holiday.origen
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Festivos');
    XLSX.writeFile(wb, `festivos_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Éxito",
      description: "Archivo Excel exportado correctamente",
    });
  };

  // Column resizing functions
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const column = columns.find(col => col.key === columnKey);
    if (column) {
      setResizingColumn(columnKey);
      setStartX(e.clientX);
      setStartWidth(column.width);
      document.body.style.cursor = 'col-resize';
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(startWidth + diff, 80);
    
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === resizingColumn ? { ...col, width: newWidth } : col
      )
    );
  }, [resizingColumn, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    setResizingColumn(null);
    document.body.style.cursor = 'default';
  }, []);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingColumn, handleMouseMove, handleMouseUp]);

  const toggleColumnVisibility = (key: keyof Holiday) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCountryFilter([]);
    setCommunityFilter([]);
    setOriginFilter([]);
    setFestivoFilter([]);
    setYearFilter([]);
    setMonthFilter([]);
  };

  const toggleFilter = (filterArray: string[], value: string, setFilter: (arr: string[]) => void) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(item => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const getUniqueValues = (field: keyof Holiday) => {
    return [...new Set(holidays.map(holiday => holiday[field]))].sort();
  };

  const handleSort = (field: keyof Holiday) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Holiday) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHolidays = filteredHolidays.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando festivos...</span>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Gestión de Festivos ({filteredHolidays.length})</h1>
                  <p className="text-muted-foreground">Consulta los días festivos del calendario</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/squad-dashboard')}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              >
                <Home className="h-4 w-4" />
                Panel de Squad Lead
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  window.location.reload();
                }}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons - Solo exportar Excel */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={filteredHolidays.length === 0}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn("text-orange-600 border-orange-600", showFilters && "bg-orange-50")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowColumns(!showColumns)}
              className={cn("text-orange-600 border-orange-600", showColumns && "bg-orange-50")}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Columnas
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar festivo, país o comunidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>País</Label>
                  <div className="max-h-40 overflow-auto border rounded p-2">
                    {COUNTRIES.map((country) => (
                      <div key={country} className="flex items-center">
                        <Checkbox
                          id={`country-${country}`}
                          checked={countryFilter.includes(country)}
                          onCheckedChange={() => toggleFilter(countryFilter, country, setCountryFilter)}
                        />
                        <Label htmlFor={`country-${country}`} className="ml-2 cursor-pointer">{country}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Comunidad Autónoma</Label>
                  <div className="max-h-40 overflow-auto border rounded p-2">
                    {SPANISH_AUTONOMOUS_COMMUNITIES.map((community) => (
                      <div key={community} className="flex items-center">
                        <Checkbox
                          id={`community-${community}`}
                          checked={communityFilter.includes(community)}
                          onCheckedChange={() => toggleFilter(communityFilter, community, setCommunityFilter)}
                        />
                        <Label htmlFor={`community-${community}`} className="ml-2 cursor-pointer">{community}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Origen</Label>
                  <div className="max-h-40 overflow-auto border rounded p-2">
                    {getUniqueValues('origen').map((origin) => (
                      <div key={origin} className="flex items-center">
                        <Checkbox
                          id={`origin-${origin}`}
                          checked={originFilter.includes(origin)}
                          onCheckedChange={() => toggleFilter(originFilter, origin, setOriginFilter)}
                        />
                        <Label htmlFor={`origin-${origin}`} className="ml-2 cursor-pointer">{origin}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <Label>Festivo</Label>
                  <div className="max-h-40 overflow-auto border rounded p-2">
                    {getUniqueValues('festivo').map((festivo) => (
                      <div key={festivo} className="flex items-center">
                        <Checkbox
                          id={`festivo-${festivo}`}
                          checked={festivoFilter.includes(festivo)}
                          onCheckedChange={() => toggleFilter(festivoFilter, festivo, setFestivoFilter)}
                        />
                        <Label htmlFor={`festivo-${festivo}`} className="ml-2 cursor-pointer">{festivo}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Año</Label>
                  <div className="max-h-40 overflow-auto border rounded p-2">
                    {[...new Set(holidays.map(holiday => new Date(holiday.date).getFullYear().toString()))].sort().map((year) => (
                      <div key={year} className="flex items-center">
                        <Checkbox
                          id={`year-${year}`}
                          checked={yearFilter.includes(year)}
                          onCheckedChange={() => toggleFilter(yearFilter, year, setYearFilter)}
                        />
                        <Label htmlFor={`year-${year}`} className="ml-2 cursor-pointer">{year}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Mes</Label>
                  <div className="max-h-40 overflow-auto border rounded p-2">
                    {Array.from({length: 12}, (_, i) => {
                      const monthNum = (i + 1).toString();
                      const monthName = new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' });
                      return { value: monthNum, label: `${monthNum} - ${monthName}` };
                    }).map((month) => (
                      <div key={month.value} className="flex items-center">
                        <Checkbox
                          id={`month-${month.value}`}
                          checked={monthFilter.includes(month.value)}
                          onCheckedChange={() => toggleFilter(monthFilter, month.value, setMonthFilter)}
                        />
                        <Label htmlFor={`month-${month.value}`} className="ml-2 cursor-pointer">{month.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Columns Management Section - Sin columna de acciones */}
        {showColumns && (
          <Card className="mb-6">
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {columns.map((col, index) => (
                  <div key={col.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-visible-${col.key}`}
                      checked={col.visible}
                      onCheckedChange={() => toggleColumnVisibility(col.key)}
                    />
                    <Label htmlFor={`col-visible-${col.key}`} className="cursor-pointer">{col.label}</Label>
                    {col.resizable && (
                      <div
                        className="ml-auto cursor-grab p-1"
                        title="Arrastrar para reordenar"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                 ))}
               </div>
               <div className="mt-4 flex items-center space-x-2">
                 <Checkbox 
                   id="save-default"
                   checked={isDefaultViewSaved}
                   onCheckedChange={(checked) => {
                     if (checked) {
                       localStorage.setItem('squad-lead-holidays-columns-config', JSON.stringify(columns));
                       setIsDefaultViewSaved(true);
                       toast({
                         title: "Configuración guardada",
                         description: "Esta configuración se aplicará por defecto cuando vuelvas a entrar",
                       });
                     } else {
                       setIsDefaultViewSaved(false);
                     }
                   }}
                 />
                 <label htmlFor="save-default" className="text-sm text-muted-foreground">
                   Guardar como vista por defecto
                 </label>
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="ml-4"
                   onClick={() => {
                     localStorage.removeItem('squad-lead-holidays-columns-config');
                     setColumns(getInitialColumns());
                     setIsDefaultViewSaved(false);
                     toast({
                       title: "Configuración restaurada",
                       description: "Se ha restaurado la configuración original de columnas",
                     });
                   }}
                 >
                   <RotateCcw className="h-4 w-4 mr-2" />
                   Restaurar por defecto
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}

        {/* Table Controls - Records per page selector */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Registros por página:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Font Size Control */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Tamaño de fuente:</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-arial" style={{ fontSize: '8px' }}>A</span>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              max={20}
              min={8}
              step={1}
              className="w-32"
            />
            <span className="text-lg font-arial" style={{ fontSize: '16px' }}>A</span>
            <span className="text-xs text-muted-foreground ml-2 min-w-[35px]">{fontSize}px</span>
          </div>
        </div>

        {/* Records info and Pagination - Above table */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <span className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredHolidays.length)} de {filteredHolidays.length} registros
          </span>
          
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-4">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Enhanced Table */}
        <Card>
          <CardContent className="p-0">
            <div className="h-[600px] overflow-auto border rounded-lg" style={{ fontSize: `${fontSize}px` }}>
              <table className="w-full">
                {/* Header fijo */}
                <thead className="sticky top-0 z-50">
                  <tr>
                     <th 
                       className="sticky left-0 z-60 bg-blue-50 border-r border-gray-200 p-3 text-center font-semibold"
                       style={{ width: 64 }}
                     >
                       <span style={{ fontSize: `${fontSize}px` }}>ÍNDICE</span>
                     </th>
                    {columns.filter(col => col.visible).map((column) => (
                      <th 
                        key={column.key}
                        className="bg-blue-50 border-b border-gray-200 relative"
                        style={{ 
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.width
                        }}
                      >
                        <div className="flex items-center p-3">
                          {/* Área de ordenación */}
                          <div 
                            className="flex-1 cursor-pointer hover:bg-blue-100 flex items-center justify-center gap-1 py-1 px-2 rounded"
                            onClick={() => handleSort(column.key)}
                            title="Click para ordenar"
                           >
                             <span style={{ fontSize: `${fontSize}px` }}>{column.label}</span>
                             {getSortIcon(column.key)}
                          </div>
                          
                          {/* Handle de redimensionamiento */}
                          <div
                            className="absolute right-0 top-0 w-2 h-full cursor-col-resize bg-blue-400 opacity-0 hover:opacity-100 transition-opacity z-20"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMouseDown(e, column.key);
                            }}
                            title="Arrastrar para redimensionar"
                          />
                        </div>
                      </th>
                    ))}
                   </tr>
               </thead>
                 
                 {/* Body */}
                 <tbody>
                   {currentHolidays.map((holiday, index) => (
                     <tr key={holiday.id} className={`hover:bg-gray-50 border-b border-gray-100 ${
                       holiday.origen === 'Administrador' ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30' : ''
                     }`}>
                       {/* Columna índice fija */}
                        <td 
                          className={cn(
                            "sticky left-0 z-10 font-medium text-center border-r border-gray-200 p-3",
                            holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                          )}
                          style={{ width: 64 }}
                        >
                          <span className="font-arial" style={{ fontSize: `${fontSize}px` }}>
                            {startIndex + index + 1}
                          </span>
                        </td>

                      {columns.filter(col => col.visible).map((column) => {
                        
                        if (column.key === 'date') {
                          return (
                            <td 
                              key={column.key}
                              className={cn(
                                "p-3 border-r border-gray-200",
                                holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                              )}
                              style={{ width: column.width }}
                            >
                              <div className="text-sm font-medium text-foreground" style={{ fontSize: `${fontSize}px` }}>
                                {format(new Date(holiday.date), 'dd/MM/yyyy')}
                              </div>
                            </td>
                          );
                        }

                        if (column.key === 'origen') {
                          return (
                            <td 
                              key={column.key}
                              className={cn(
                                "p-3 border-r border-gray-200",
                                holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                              )}
                              style={{ width: column.width }}
                            >
                              <Badge 
                                variant={holiday.origen === 'Sistema' ? 'default' : 'secondary'}
                                className="text-xs"
                                style={{ fontSize: `${Math.max(fontSize - 2, 8)}px` }}
                              >
                                {holiday.origen}
                              </Badge>
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={column.key}
                            className={cn(
                              "p-3 border-r border-gray-200",
                              holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                            )}
                            style={{ width: column.width }}
                          >
                            <div className="text-sm" style={{ fontSize: `${fontSize}px` }}>
                              {holiday[column.key]}
                            </div>
                          </td>
                        );
                      })}
                     </tr>
                   ))}
                 </tbody>
               </table>
               
               {filteredHolidays.length === 0 && (
                 <div className="text-center py-8 text-muted-foreground">
                   No se encontraron festivos que coincidan con los filtros aplicados.
                 </div>
               )}
             </div>
           </CardContent>
         </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredHolidays.length)} de {filteredHolidays.length} festivos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Mapa interactivo de España */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Mapa Interactivo de Festivos por Comunidades Autónomas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpainHolidaysMap />
          </CardContent>
        </Card>

      </div>
    </div>
    </TooltipProvider>
  );
};

export default SquadLeadHolidaysManagement;