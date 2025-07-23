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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Users,
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
  CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ResourcesUpload from '@/components/FileUpload/ResourcesUpload';
import EditPersonDialog from '@/components/EditPersonDialog';
import PersonTable from '@/components/PersonTable';
import * as XLSX from 'xlsx';

interface Person {
  id: string;
  num_pers: string;
  nombre: string;
  fecha_incorporacion: string;
  mail_empresa: string;
  squad_lead: string;
  cex: string;
  grupo: string;
  categoria: string;
  oficina: string;
  origen?: string;
  created_at: string;
  updated_at: string;
}

interface ColumnConfig {
  key: keyof Person;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
  resizable: boolean;
}

const ResourcesManagement = () => {
  const [resources, setResources] = useState<Person[]>([]);
  const [filteredResources, setFilteredResources] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  
  // Filters - Selected filters
  const [squadFilter, setSquadFilter] = useState<string[]>([]);
  const [grupoFilter, setGrupoFilter] = useState<string[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState<string[]>([]);
  const [oficinaFilter, setOficinaFilter] = useState<string[]>([]);
  const [origenFilter, setOrigenFilter] = useState<string[]>([]);
  const [cexFilter, setCexFilter] = useState<string[]>([]);
  
  // Applied filters (only these are used for filtering)
  const [appliedSquadFilter, setAppliedSquadFilter] = useState<string[]>([]);
  const [appliedGrupoFilter, setAppliedGrupoFilter] = useState<string[]>([]);
  const [appliedCategoriaFilter, setAppliedCategoriaFilter] = useState<string[]>([]);
  const [appliedOficinaFilter, setAppliedOficinaFilter] = useState<string[]>([]);
  const [appliedOrigenFilter, setAppliedOrigenFilter] = useState<string[]>([]);
  const [appliedCexFilter, setAppliedCexFilter] = useState<string[]>([]);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Person>('nombre');
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
  
  // Form data
  const [formData, setFormData] = useState({
    num_pers: '',
    nombre: '',
    fecha_incorporacion: '',
    mail_empresa: '',
    squad_lead: '',
    cex: '',
    grupo: '',
    categoria: '',
    oficina: ''
  });
  
  // Column management with persistence
  const getInitialColumns = (): ColumnConfig[] => {
    const savedColumns = localStorage.getItem('resources-columns-config');
    if (savedColumns) {
      try {
        return JSON.parse(savedColumns);
      } catch (error) {
        console.error('Error parsing saved columns config:', error);
      }
    }
    // Default configuration
    return [
      { key: 'num_pers', label: 'CÓDIGO', visible: true, width: 100, minWidth: 80, resizable: true },
      { key: 'nombre', label: 'NOMBRE / SQUAD LEAD', visible: true, width: 220, minWidth: 180, resizable: true },
      { key: 'fecha_incorporacion', label: 'FECHA INCORPORACIÓN', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'mail_empresa', label: 'EMAIL', visible: true, width: 200, minWidth: 150, resizable: true },
      { key: 'cex', label: 'CEX', visible: true, width: 80, minWidth: 60, resizable: true },
      { key: 'grupo', label: 'GRUPO / CATEGORÍA', visible: true, width: 180, minWidth: 140, resizable: true },
      { key: 'oficina', label: 'OFICINA', visible: true, width: 100, minWidth: 80, resizable: true },
      { key: 'origen', label: 'ORIGEN', visible: false, width: 120, minWidth: 100, resizable: true }
    ];
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(getInitialColumns());

  // Save columns configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('resources-columns-config', JSON.stringify(columns));
  }, [columns]);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, searchTerm, appliedSquadFilter, appliedGrupoFilter, appliedCategoriaFilter, appliedOficinaFilter, appliedCexFilter, appliedOrigenFilter, sortField, sortDirection]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando todos los recursos...');
      
      let allResources: Person[] = [];
      let hasMore = true;
      let from = 0;
      const batchSize = 1000;
      
      while (hasMore) {
        console.log(`📦 Cargando lote desde ${from} hasta ${from + batchSize - 1}`);
        
        const { data, error } = await supabase
          .from('persons')
          .select('*')
          .order('nombre', { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allResources = [...allResources, ...data];
          from += batchSize;
          
          if (data.length < batchSize) {
            hasMore = false;
          }
          
          console.log(`📊 Lote cargado: ${data.length} recursos. Total acumulado: ${allResources.length}`);
        } else {
          hasMore = false;
        }
      }
      
      console.log('✅ Recursos cargados:', allResources.length);
      setResources(allResources);
    } catch (error: any) {
      toast({
        title: "Error al cargar recursos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...resources];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.num_pers.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.mail_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.cex.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Squad Lead filter
    if (appliedSquadFilter.length > 0) {
      filtered = filtered.filter(resource => appliedSquadFilter.includes(resource.squad_lead));
    }

    // Grupo filter
    if (appliedGrupoFilter.length > 0) {
      filtered = filtered.filter(resource => appliedGrupoFilter.includes(resource.grupo));
    }

    // Categoría filter
    if (appliedCategoriaFilter.length > 0) {
      filtered = filtered.filter(resource => appliedCategoriaFilter.includes(resource.categoria));
    }

    // Oficina filter
    if (appliedOficinaFilter.length > 0) {
      filtered = filtered.filter(resource => appliedOficinaFilter.includes(resource.oficina));
    }

    // CEX filter
    if (appliedCexFilter.length > 0) {
      filtered = filtered.filter(resource => appliedCexFilter.includes(resource.cex));
    }

    // Origen filter
    if (appliedOrigenFilter.length > 0) {
      filtered = filtered.filter(resource => appliedOrigenFilter.includes(resource.origen));
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];
        
        // Convert to string for comparison
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    setFilteredResources(filtered);
    setCurrentPage(1);
  }, [resources, searchTerm, appliedSquadFilter, appliedGrupoFilter, appliedCategoriaFilter, appliedOficinaFilter, appliedCexFilter, appliedOrigenFilter, sortField, sortDirection]);

  const clearFilters = () => {
    setSearchTerm('');
    setSquadFilter([]);
    setGrupoFilter([]);
    setCategoriaFilter([]);
    setOficinaFilter([]);
    setCexFilter([]);
    setOrigenFilter([]);
    setAppliedSquadFilter([]);
    setAppliedGrupoFilter([]);
    setAppliedCategoriaFilter([]);
    setAppliedOficinaFilter([]);
    setAppliedCexFilter([]);
    setAppliedOrigenFilter([]);
  };

  const applyCurrentFilters = () => {
    setAppliedSquadFilter([...squadFilter]);
    setAppliedGrupoFilter([...grupoFilter]);
    setAppliedCategoriaFilter([...categoriaFilter]);
    setAppliedOficinaFilter([...oficinaFilter]);
    setAppliedCexFilter([...cexFilter]);
    setAppliedOrigenFilter([...origenFilter]);
  };

  const hasActiveFilters = () => {
    return appliedSquadFilter.length > 0 || 
           appliedGrupoFilter.length > 0 || 
           appliedCategoriaFilter.length > 0 || 
           appliedOficinaFilter.length > 0 || 
           appliedCexFilter.length > 0 || 
           appliedOrigenFilter.length > 0;
  };

  const toggleFilter = (filterArray: string[], value: string, setFilter: (arr: string[]) => void) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(item => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const getUniqueValues = (field: keyof Person) => {
    return [...new Set(resources.map(resource => resource[field]))].filter(Boolean).sort();
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResources = filteredResources.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando recursos...</span>
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
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Recursos ({filteredResources.length})</h1>
                    <p className="text-muted-foreground">Administra los recursos humanos y personal</p>
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
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setShowUpload(!showUpload)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Subir Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {}}
                className="text-green-600 border-green-600 hover:bg-green-50"
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
                  hasActiveFilters() 
                    ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25" 
                    : "text-orange-600 border-orange-600 hover:bg-orange-50"
                )}
              >
                <Filter className="h-4 w-4 mr-2" />
                {hasActiveFilters() ? "Filtros activos" : "Filtros"}
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

          {/* Upload Section */}
          {showUpload && (
            <div className="mb-6">
              <ResourcesUpload />
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar recursos..."
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {/* Squad Lead Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Squad Lead</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {getUniqueValues('squad_lead').map(squad => (
                        <div key={squad} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`squad-${squad}`}
                            checked={squadFilter.includes(squad)}
                            onCheckedChange={() => toggleFilter(squadFilter, squad, setSquadFilter)}
                          />
                          <label htmlFor={`squad-${squad}`} className="text-sm">{squad}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grupo Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Grupo</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {getUniqueValues('grupo').map(grupo => (
                        <div key={grupo} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`grupo-${grupo}`}
                            checked={grupoFilter.includes(grupo)}
                            onCheckedChange={() => toggleFilter(grupoFilter, grupo, setGrupoFilter)}
                          />
                          <label htmlFor={`grupo-${grupo}`} className="text-sm">{grupo}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categoría Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Categoría</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {getUniqueValues('categoria').map(categoria => (
                        <div key={categoria} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`categoria-${categoria}`}
                            checked={categoriaFilter.includes(categoria)}
                            onCheckedChange={() => toggleFilter(categoriaFilter, categoria, setCategoriaFilter)}
                          />
                          <label htmlFor={`categoria-${categoria}`} className="text-sm">{categoria}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Oficina Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Oficina</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {getUniqueValues('oficina').map(oficina => (
                        <div key={oficina} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`oficina-${oficina}`}
                            checked={oficinaFilter.includes(oficina)}
                            onCheckedChange={() => toggleFilter(oficinaFilter, oficina, setOficinaFilter)}
                          />
                          <label htmlFor={`oficina-${oficina}`} className="text-sm">{oficina}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CEX Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">CEX</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {getUniqueValues('cex').map(cex => (
                        <div key={cex} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`cex-${cex}`}
                            checked={cexFilter.includes(cex)}
                            onCheckedChange={() => toggleFilter(cexFilter, cex, setCexFilter)}
                          />
                          <label htmlFor={`cex-${cex}`} className="text-sm">{cex}</label>
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

          {/* Columns Configuration Panel */}
          {showColumns && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Configuración de Columnas</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowColumns(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {columns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={column.key}
                        checked={column.visible}
                        onCheckedChange={(checked) => {
                          setColumns(prev => prev.map(col => 
                            col.key === column.key ? { ...col, visible: !!checked } : col
                          ));
                        }}
                      />
                      <Label htmlFor={column.key} className="flex-1 text-sm font-medium">
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setColumns(prev => prev.map(col => ({ ...col, visible: true })));
                    }}
                  >
                    Mostrar Todas
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setColumns(getInitialColumns());
                    }}
                  >
                    Restablecer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="relative overflow-auto">
                <PersonTable 
                  persons={currentResources}
                  startIndex={startIndex}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredResources.length)} de {filteredResources.length} recursos
              </span>
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
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ResourcesManagement;