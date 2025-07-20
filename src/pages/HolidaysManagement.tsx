import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  ArrowLeft,
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
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import HolidaysUpload from '@/components/FileUpload/HolidaysUpload';
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
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [communityFilter, setCommunityFilter] = useState<string[]>([]);
  const [originFilter, setOriginFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Holiday | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Column management
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'date', label: 'Fecha', visible: true, width: 150, minWidth: 120, resizable: true },
    { key: 'festivo', label: 'Festivo', visible: true, width: 250, minWidth: 200, resizable: true },
    { key: 'pais', label: 'País / Comunidad', visible: true, width: 200, minWidth: 160, resizable: true },
    { key: 'origen', label: 'Origen', visible: true, width: 120, minWidth: 100, resizable: true }
  ]);
  
  const [resizing, setResizing] = useState<{ columnKey: keyof Holiday; startX: number; startWidth: number } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<keyof Holiday | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    festivo: '',
    pais: '',
    comunidad_autonoma: '',
    origen: 'Administrador'
  });

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los festivos",
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
    let filtered = holidays;

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
  }, [holidays, searchTerm, countryFilter, communityFilter, originFilter, sortField, sortDirection]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setCountryFilter([]);
    setCommunityFilter([]);
    setOriginFilter([]);
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

  // Column resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: keyof Holiday) => {
    e.preventDefault();
    const column = columns.find(col => col.key === columnKey);
    if (!column) return;

    setResizing({
      columnKey,
      startX: e.clientX,
      startWidth: column.width
    });
  }, [columns]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;

    const deltaX = e.clientX - resizing.startX;
    const newWidth = Math.max(resizing.startWidth + deltaX, 
      columns.find(col => col.key === resizing.columnKey)?.minWidth || 100);

    setColumns(prev => prev.map(col => 
      col.key === resizing.columnKey 
        ? { ...col, width: newWidth }
        : col
    ));
  }, [resizing, columns]);

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  // Column drag and drop handlers
  const handleDragStart = (e: React.DragEvent, columnKey: keyof Holiday) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: keyof Holiday) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnKey) return;

    const draggedIndex = columns.findIndex(col => col.key === draggedColumn);
    const targetIndex = columns.findIndex(col => col.key === targetColumnKey);

    const newColumns = [...columns];
    const [draggedCol] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedCol);

    setColumns(newColumns);
    setDraggedColumn(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando festivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CalendarIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gestión de Festivos ({filteredHolidays.length})</h1>
                  <p className="text-muted-foreground">Administra los días festivos del calendario</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Festivo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Festivo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
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
                          {formData.date ? format(formData.date, "dd/MM/yyyy") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData({ ...formData, date })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="festivo">Festivo *</Label>
                    <Input
                      id="festivo"
                      placeholder="Nombre del festivo"
                      value={formData.festivo}
                      onChange={(e) => setFormData({ ...formData, festivo: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pais">País *</Label>
                    <Select value={formData.pais} onValueChange={(value) => setFormData({ ...formData, pais: value, comunidad_autonoma: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar país" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.pais === 'España' && (
                    <div>
                      <Label htmlFor="comunidad">Comunidad Autónoma</Label>
                      <Select value={formData.comunidad_autonoma} onValueChange={(value) => setFormData({ ...formData, comunidad_autonoma: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar comunidad autónoma" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPANISH_AUTONOMOUS_COMMUNITIES.map(community => (
                            <SelectItem key={community} value={community}>{community}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleAddHoliday} className="flex-1 bg-amber-600 hover:bg-amber-700">
                      Agregar Festivo
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              className="text-amber-600 border-amber-600 hover:bg-amber-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Cargar Excel
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={filteredHolidays.length === 0}
              className="text-amber-600 border-amber-600 hover:bg-amber-50"
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
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar festivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filtros por Columna</CardTitle>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* País Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">País</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('pais').map(country => (
                      <div key={country} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`country-${country}`}
                          checked={countryFilter.includes(country)}
                          onCheckedChange={() => toggleFilter(countryFilter, country, setCountryFilter)}
                        />
                        <label htmlFor={`country-${country}`} className="text-sm">{country}</label>
                      </div>
                    ))}
                  </div>
                  {countryFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {countryFilter.map(country => (
                        <Badge key={country} variant="secondary" className="text-xs">
                          {country}
                          <button 
                            onClick={() => toggleFilter(countryFilter, country, setCountryFilter)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comunidad Autónoma Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Comunidad Autónoma</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('comunidad_autonoma').map(community => (
                      <div key={community} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`community-${community}`}
                          checked={communityFilter.includes(community)}
                          onCheckedChange={() => toggleFilter(communityFilter, community, setCommunityFilter)}
                        />
                        <label htmlFor={`community-${community}`} className="text-sm">{community}</label>
                      </div>
                    ))}
                  </div>
                  {communityFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {communityFilter.map(community => (
                        <Badge key={community} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          {community}
                          <button 
                            onClick={() => toggleFilter(communityFilter, community, setCommunityFilter)}
                            className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Origen Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Origen</Label>
                  <div className="space-y-2 border rounded-md p-2">
                    {getUniqueValues('origen').map(origin => (
                      <div key={origin} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`origin-${origin}`}
                          checked={originFilter.includes(origin)}
                          onCheckedChange={() => toggleFilter(originFilter, origin, setOriginFilter)}
                        />
                        <label htmlFor={`origin-${origin}`} className="text-sm">{origin}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Column Management */}
        {showColumns && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Gestión de Columnas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`column-${column.key}`}
                      checked={column.visible}
                      onCheckedChange={(checked) => 
                        setColumns(prev => prev.map(col => 
                          col.key === column.key 
                            ? { ...col, visible: !!checked }
                            : col
                        ))
                      }
                    />
                    <label htmlFor={`column-${column.key}`} className="text-sm">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox id="save-default" />
                <label htmlFor="save-default" className="text-sm text-muted-foreground">
                  Guardar como vista por defecto
                </label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={() => {
                    setColumns(prev => prev.map(col => ({ ...col, visible: true })));
                  }}
                >
                  Resetear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredHolidays.length)} de {filteredHolidays.length} festivos
            </span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
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
            <span className="text-sm text-muted-foreground">por página</span>
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
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
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
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 py-3 px-4 font-semibold text-xs text-muted-foreground bg-muted/30">
                      ÍNDICE
                    </TableHead>
                    {columns.filter(col => col.visible).map((column) => (
                      <TableHead 
                        key={column.key}
                        className="py-3 px-4 font-semibold text-xs text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 select-none relative group"
                        style={{ width: column.width }}
                        onClick={() => handleSort(column.key)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, column.key)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.key)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3 h-3 opacity-50 cursor-move" />
                            <span>{column.label.toUpperCase()}</span>
                          </div>
                          {getSortIcon(column.key)}
                        </div>
                        {column.resizable && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 group-hover:bg-primary/20"
                            onMouseDown={(e) => handleMouseDown(e, column.key)}
                          />
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="w-24 py-3 px-4 font-semibold text-xs text-muted-foreground bg-muted/30">
                      ACCIONES
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentHolidays.map((holiday, index) => (
                    <TableRow 
                      key={holiday.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        holiday.origen === 'Administrador' && "bg-red-50 hover:bg-red-100"
                      )}
                    >
                      <TableCell className="font-medium py-4 px-4 text-sm text-center">
                        {startIndex + index + 1}
                      </TableCell>
                      
                      {/* Fecha */}
                      {columns.find(col => col.key === 'date')?.visible && (
                        <TableCell 
                          className="py-4 px-4"
                          style={{ width: columns.find(col => col.key === 'date')?.width }}
                        >
                          <div className="text-sm font-medium text-foreground">
                            {format(new Date(holiday.date), 'dd/MM/yyyy')}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Festivo */}
                      {columns.find(col => col.key === 'festivo')?.visible && (
                        <TableCell 
                          className="py-4 px-4"
                          style={{ width: columns.find(col => col.key === 'festivo')?.width }}
                        >
                          <div className="font-semibold text-foreground text-sm leading-tight">
                            {holiday.festivo}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* País / Comunidad */}
                      {columns.find(col => col.key === 'pais')?.visible && (
                        <TableCell 
                          className="py-4 px-4"
                          style={{ width: columns.find(col => col.key === 'pais')?.width }}
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-foreground text-sm leading-tight">
                              {holiday.pais}
                            </div>
                            {holiday.comunidad_autonoma && holiday.comunidad_autonoma !== 'NACIONAL' && (
                              <div className="text-xs text-muted-foreground leading-tight">
                                {holiday.comunidad_autonoma}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      
                      {/* Origen */}
                      {columns.find(col => col.key === 'origen')?.visible && (
                        <TableCell 
                          className="py-4 px-4"
                          style={{ width: columns.find(col => col.key === 'origen')?.width }}
                        >
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              holiday.origen === 'Administrador' ? "text-red-700 border-red-700" : "text-blue-700 border-blue-700"
                            )}
                          >
                            {holiday.origen}
                          </Badge>
                        </TableCell>
                      )}
                      
                      {/* Acciones */}
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRow(editingRow === holiday.id ? null : holiday.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Pagination */}
        <div className="flex items-center justify-center mt-6">
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
            <span className="text-sm text-muted-foreground px-4">
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
      </div>
    </div>
  );
};

export default HolidaysManagement;