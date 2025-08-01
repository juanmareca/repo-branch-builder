import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  Settings2,
  Plus,
  Download,
  X,
  Edit,
  Trash2,
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
import HolidaysUpload from '@/components/FileUpload/HolidaysUpload';
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

const HolidaysManagement = () => {
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
  
  // Applied filters (what's currently filtering the table)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState<string>('');
  const [appliedCountryFilter, setAppliedCountryFilter] = useState<string[]>([]);
  const [appliedCommunityFilter, setAppliedCommunityFilter] = useState<string[]>([]);
  const [appliedOriginFilter, setAppliedOriginFilter] = useState<string[]>([]);
  const [appliedFestivoFilter, setAppliedFestivoFilter] = useState<string[]>([]);
  const [appliedYearFilter, setAppliedYearFilter] = useState<string[]>([]);
  const [appliedMonthFilter, setAppliedMonthFilter] = useState<string[]>([]);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Holiday>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDefaultViewSaved, setIsDefaultViewSaved] = useState(false);
  
  // Font size control
  const [fontSize, setFontSize] = useState(12);
  
  // Column resizing
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    festivo: '',
    pais: '',
    comunidad_autonoma: '',
    origen: 'Administrador'
  });

  // Column management with persistence
  const getInitialColumns = (): ColumnConfig[] => {
    // Forzar limpieza de configuración obsoleta
    localStorage.removeItem('holidays-columns-config');
    
    // Configuración por defecto con columnas separadas
    return [
      { key: 'date', label: 'FECHA', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'festivo', label: 'FESTIVO', visible: true, width: 250, minWidth: 200, resizable: true },
      { key: 'pais', label: 'PAÍS', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'comunidad_autonoma', label: 'COMUNIDAD AUTÓNOMA', visible: true, width: 200, minWidth: 180, resizable: true },
      { key: 'origen', label: 'ORIGEN', visible: true, width: 120, minWidth: 100, resizable: true }
    ];
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(getInitialColumns());
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Save columns configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('holidays-columns-config', JSON.stringify(columns));
  }, [columns]);

  // Clean up obsolete columns configuration on component mount
  useEffect(() => {
    const validKeys: (keyof Holiday)[] = ['date', 'festivo', 'pais', 'comunidad_autonoma', 'origen'];
    const hasObsoleteColumns = columns.some(col => !validKeys.includes(col.key));
    
    if (hasObsoleteColumns) {
      const cleanedColumns = columns.filter(col => validKeys.includes(col.key));
      setColumns(cleanedColumns);
      localStorage.setItem('holidays-columns-config', JSON.stringify(cleanedColumns));
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
  }, [holidays, appliedSearchTerm, appliedCountryFilter, appliedCommunityFilter, appliedOriginFilter, appliedFestivoFilter, appliedYearFilter, appliedMonthFilter, sortField, sortDirection]);

  const applyFilters = useCallback(() => {
    let filtered = [...holidays];

    // Search filter
    if (appliedSearchTerm) {
      filtered = filtered.filter(holiday =>
        holiday.festivo.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
        holiday.pais.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
        holiday.comunidad_autonoma.toLowerCase().includes(appliedSearchTerm.toLowerCase())
      );
    }

    // Country filter
    if (appliedCountryFilter.length > 0) {
      filtered = filtered.filter(holiday => appliedCountryFilter.includes(holiday.pais));
    }

    // Community filter
    if (appliedCommunityFilter.length > 0) {
      filtered = filtered.filter(holiday => appliedCommunityFilter.includes(holiday.comunidad_autonoma));
    }

    // Origin filter
    if (appliedOriginFilter.length > 0) {
      filtered = filtered.filter(holiday => appliedOriginFilter.includes(holiday.origen));
    }

    // Festivo filter
    if (appliedFestivoFilter.length > 0) {
      filtered = filtered.filter(holiday => appliedFestivoFilter.includes(holiday.festivo));
    }

    // Year filter
    if (appliedYearFilter.length > 0) {
      filtered = filtered.filter(holiday => {
        const holidayYear = new Date(holiday.date).getFullYear().toString();
        return appliedYearFilter.includes(holidayYear);
      });
    }

    // Month filter
    if (appliedMonthFilter.length > 0) {
      filtered = filtered.filter(holiday => {
        const holidayMonth = (new Date(holiday.date).getMonth() + 1).toString();
        return appliedMonthFilter.includes(holidayMonth);
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
  }, [holidays, appliedSearchTerm, appliedCountryFilter, appliedCommunityFilter, appliedOriginFilter, appliedFestivoFilter, appliedYearFilter, appliedMonthFilter, sortField, sortDirection]);

  const handleAddHoliday = async () => {
    if (!formData.date || !formData.festivo || !formData.pais) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('holidays')
        .insert({
          date: format(formData.date, 'yyyy-MM-dd'),
          festivo: formData.festivo,
          pais: formData.pais,
          comunidad_autonoma: formData.comunidad_autonoma || 'NACIONAL',
          origen: 'Administrador'
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Festivo agregado correctamente",
      });

      setIsAddDialogOpen(false);
      setFormData({
        date: undefined,
        festivo: '',
        pais: '',
        comunidad_autonoma: '',
        origen: 'Administrador'
      });
      fetchHolidays();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el festivo",
        variant: "destructive",
      });
    }
  };

  const handleUpdateHoliday = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('holidays')
        .update({ 
          [field]: value,
          origen: 'Administrador' // Cambiar origen cuando se edita
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Festivo actualizado correctamente",
      });

      fetchHolidays();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el festivo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Festivo eliminado correctamente",
      });

      fetchHolidays();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el festivo",
        variant: "destructive",
      });
    }
  };

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
    e.stopPropagation(); // Evitar que se active el drag&drop
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
    const newWidth = Math.max(startWidth + diff, 80); // Mínimo 80px
    
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
    
    // Clear applied filters too
    setAppliedSearchTerm('');
    setAppliedCountryFilter([]);
    setAppliedCommunityFilter([]);
    setAppliedOriginFilter([]);
    setAppliedFestivoFilter([]);
    setAppliedYearFilter([]);
    setAppliedMonthFilter([]);
  };

  const applyCurrentFilters = () => {
    setAppliedSearchTerm(searchTerm);
    setAppliedCountryFilter([...countryFilter]);
    setAppliedCommunityFilter([...communityFilter]);
    setAppliedOriginFilter([...originFilter]);
    setAppliedFestivoFilter([...festivoFilter]);
    setAppliedYearFilter([...yearFilter]);
    setAppliedMonthFilter([...monthFilter]);
  };

  const hasActiveFilters = () => {
    return appliedSearchTerm || 
           appliedCountryFilter.length > 0 || 
           appliedCommunityFilter.length > 0 || 
           appliedOriginFilter.length > 0 || 
           appliedFestivoFilter.length > 0 || 
           appliedYearFilter.length > 0 || 
           appliedMonthFilter.length > 0;
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
                  <p className="text-muted-foreground">Administra los días festivos del calendario</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              >
                <Home className="h-4 w-4" />
                Panel de Administración
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
                Salir
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Add Holiday Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Festivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Festivo</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : <span>Seleccionar fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData({ ...formData, date })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="festivo">Festivo *</Label>
                    <Input
                      id="festivo"
                      value={formData.festivo}
                      onChange={(e) => setFormData({ ...formData, festivo: e.target.value })}
                      placeholder="Nombre del festivo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pais">País *</Label>
                    <Select value={formData.pais} onValueChange={(value) => setFormData({ ...formData, pais: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comunidad_autonoma">Comunidad Autónoma</Label>
                    <Select value={formData.comunidad_autonoma} onValueChange={(value) => setFormData({ ...formData, comunidad_autonoma: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar comunidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPANISH_AUTONOMOUS_COMMUNITIES.map((community) => (
                          <SelectItem key={community} value={community}>
                            {community}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddHoliday} className="bg-orange-600 hover:bg-orange-700">
                    Agregar Festivo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Cargar Excel
            </Button>

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
              className={cn(
                "text-orange-600 border-orange-600", 
                showFilters && "bg-orange-50",
                hasActiveFilters() && "bg-orange-400 text-white border-orange-400 hover:bg-orange-500"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              {hasActiveFilters() ? "Filtros activos" : "Filtros"}
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

        {showUpload && (
          <div className="mb-8">
            <HolidaysUpload />
          </div>
        )}

        {/* Search - Outside filters */}
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
              <div className="mt-4 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className={hasActiveFilters() ? "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100" : ""}
                >
                  Limpiar filtros
                </Button>
                <Button 
                  onClick={applyCurrentFilters}
                  className={hasActiveFilters() ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}
                >
                  Aplicar filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Columns Management Section */}
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
                        // Drag handle could be implemented here if needed
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
                       localStorage.setItem('holidays-columns-config', JSON.stringify(columns));
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
                     // Clear localStorage to ensure clean state
                     localStorage.removeItem('holidays-columns-config');
                     setColumns(getInitialColumns());
                     setIsDefaultViewSaved(false);
                     toast({
                       title: "Configuración reseteada",
                       description: "Se ha limpiado la configuración guardada y aplicado la configuración por defecto",
                     });
                   }}
                 >
                   Resetear
                 </Button>
               </div>
             </CardContent>
           </Card>
         )}

        {/* Records per page selector */}
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
                   
                   {/* Columna acciones fija */}
                    <th 
                      className="sticky right-0 z-40 bg-blue-50 border-l border-gray-200 p-3 text-center font-semibold"
                      style={{ width: 96, minWidth: 96 }}
                    >
                       <span style={{ fontSize: `${fontSize}px` }}>ACCIONES</span>
                     </th>
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
                        
                        if (column.key === 'festivo') {
                          return (
                            <td 
                              key={column.key}
                              className={cn(
                                "p-3 border-r border-gray-200",
                                holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                              )}
                              style={{ width: column.width }}
                            >
                              <div className="font-semibold text-foreground text-sm leading-tight" style={{ fontSize: `${fontSize}px` }}>
                                {holiday.festivo}
                              </div>
                            </td>
                          );
                        }
                        
                        if (column.key === 'pais') {
                          return (
                            <td 
                              key={column.key}
                              className={cn(
                                "p-3 border-r border-gray-200",
                                holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                              )}
                              style={{ width: column.width }}
                            >
                              <div className="font-medium text-foreground text-sm leading-tight" style={{ fontSize: `${fontSize}px` }}>
                                {holiday.pais}
                              </div>
                            </td>
                          );
                        }
                        
                        if (column.key === 'comunidad_autonoma') {
                          return (
                            <td 
                              key={column.key}
                              className={cn(
                                "p-3 border-r border-gray-200",
                                holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                              )}
                              style={{ width: column.width }}
                            >
                              <div className="font-medium text-foreground text-sm leading-tight" style={{ fontSize: `${fontSize}px` }}>
                                {holiday.comunidad_autonoma || 'NACIONAL'}
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
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  holiday.origen === 'Administrador' ? "text-red-700 border-red-700" : "text-blue-700 border-blue-700"
                                )}
                                style={{ fontSize: `${fontSize - 2}px` }}
                              >
                                {holiday.origen}
                              </Badge>
                            </td>
                          );
                        }
                        
                        return null;
                      })}

                      {/* Columna de acciones fija */}
                      <td 
                        className={cn(
                          "sticky right-0 z-10 p-3 border-l border-gray-200",
                          holiday.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                        )}
                        style={{ width: 96 }}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar festivo</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteHoliday(holiday.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar festivo</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
           </CardContent>
         </Card>

         {/* Pagination and Controls */}
         <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-4">
          </div>

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

export default HolidaysManagement;
