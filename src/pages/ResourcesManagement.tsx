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
  Type
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
  
  // Filters
  const [squadFilter, setSquadFilter] = useState<string[]>([]);
  const [grupoFilter, setGrupoFilter] = useState<string[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState<string[]>([]);
  const [oficinaFilter, setOficinaFilter] = useState<string[]>([]);
  const [origenFilter, setOrigenFilter] = useState<string[]>([]);
  const [cexFilter, setCexFilter] = useState<string[]>([]);
  
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
  
  // Font size control
  const [fontSize, setFontSize] = useState(12); // Tamaño inicial en px
  
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
    fetchAllUniqueOptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, searchTerm, squadFilter, grupoFilter, categoriaFilter, oficinaFilter, cexFilter, origenFilter, sortField, sortDirection]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando todos los recursos...');
      
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      console.log('✅ Recursos cargados:', data?.length);
      setResources(data || []);
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
    if (squadFilter.length > 0) {
      filtered = filtered.filter(resource => squadFilter.includes(resource.squad_lead));
    }

    // Grupo filter
    if (grupoFilter.length > 0) {
      filtered = filtered.filter(resource => grupoFilter.includes(resource.grupo));
    }

    // Categoría filter
    if (categoriaFilter.length > 0) {
      filtered = filtered.filter(resource => categoriaFilter.includes(resource.categoria));
    }

    // Oficina filter
    if (oficinaFilter.length > 0) {
      filtered = filtered.filter(resource => oficinaFilter.includes(resource.oficina));
    }

    // CEX filter
    if (cexFilter.length > 0) {
      filtered = filtered.filter(resource => cexFilter.includes(resource.cex));
    }

    // Origen filter
    if (origenFilter.length > 0) {
      filtered = filtered.filter(resource => origenFilter.includes(resource.origen));
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [resources, searchTerm, squadFilter, grupoFilter, categoriaFilter, oficinaFilter, sortField, sortDirection]);

  const handleAddResource = async () => {
    if (!formData.num_pers || !formData.nombre) {
      toast({
        title: "Error",
        description: "Por favor, complete al menos el código y nombre",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('persons')
        .insert(formData);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Recurso agregado correctamente",
      });

      setIsAddDialogOpen(false);
      setFormData({
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
      fetchResources();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el recurso",
        variant: "destructive",
      });
    }
  };

  const handleUpdateResource = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('persons')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Recurso actualizado correctamente",
      });

      fetchResources();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el recurso",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('persons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Recurso eliminado correctamente",
      });

      fetchResources();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el recurso",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredResources.map((resource, index) => ({
      'ÍNDICE': index + 1,
      'CÓDIGO': resource.num_pers,
      'NOMBRE': resource.nombre,
      'FECHA INCORPORACIÓN': resource.fecha_incorporacion, // Ya está en formato DD/MM/YYYY
      'EMAIL': resource.mail_empresa,
      'SQUAD LEAD': resource.squad_lead,
      'CEX': resource.cex,
      'GRUPO': resource.grupo,
      'CATEGORÍA': resource.categoria,
      'OFICINA': resource.oficina
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Aplicar estilos profesionales a las cabeceras
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    
    // Estilo para las cabeceras
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: "4472C4" } // Azul profesional
        },
        font: {
          color: { rgb: "FFFFFF" },
          bold: true,
          sz: 12
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Aplicar bordes a todas las celdas de datos
    for (let row = headerRange.s.r + 1; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          }
        };
      }
    }
    
    // Ajustar ancho de columnas automáticamente
    const colWidths = [];
    const headers = Object.keys(exportData[0] || {});
    headers.forEach((header, index) => {
      let maxLength = header.length;
      exportData.forEach(row => {
        const cellValue = row[header] ? row[header].toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      colWidths.push({ wch: Math.min(maxLength + 2, 50) }); // Máximo 50 caracteres
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recursos');
    XLSX.writeFile(wb, `recursos_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Éxito",
      description: "Archivo Excel exportado correctamente",
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSquadFilter([]);
    setGrupoFilter([]);
    setCategoriaFilter([]);
    setOficinaFilter([]);
    setCexFilter([]);
    setOrigenFilter([]);
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setEditDialogOpen(true);
  };

  const handleSavePerson = async (updatedPerson: Person) => {
    try {
      const { error } = await supabase
        .from('persons')
        .update({
          ...updatedPerson,
          origen: 'Administrador', // Cambiar origen a Administrador cuando se edita
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedPerson.id);

      if (error) throw error;

      // Actualizar el estado local
      setResources(prev => 
        prev.map(person => 
          person.id === updatedPerson.id 
            ? { ...updatedPerson, origen: 'Administrador' }
            : person
        )
      );

      toast({
        title: "Éxito",
        description: "Persona actualizada correctamente",
      });

      setEditDialogOpen(false);
      setEditingPerson(null);
    } catch (error) {
      console.error('Error updating person:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la persona",
        variant: "destructive",
      });
    }
  };

  const getAvailableOptions = () => {
    // For now, use the current resources in memory
    // This could be enhanced to fetch all unique values from the database
    const uniqueValues = (field: keyof Person) => {
      return Array.from(new Set(resources.map(r => r[field]).filter(v => v && v.trim() !== ''))).sort();
    };

    return {
      cex: uniqueValues('cex'),
      grupo: uniqueValues('grupo'),
      categoria: uniqueValues('categoria'),
      oficina: uniqueValues('oficina'),
      squadLeads: uniqueValues('squad_lead'),
    };
  };

  const [allUniqueOptions, setAllUniqueOptions] = useState({
    cex: [] as string[],
    grupo: [] as string[],
    categoria: [] as string[],
    oficina: [] as string[],
    squadLeads: [] as string[]
  });

  // Fetch all unique values from database
  const fetchAllUniqueOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('cex, grupo, categoria, oficina, squad_lead');
      
      if (error) {
        console.error('Error fetching unique options:', error);
        throw error;
      }
      
      if (data) {
        const getUniqueValues = (field: keyof Person) => {
          return Array.from(new Set(data.map(r => r[field]).filter(v => v && v.trim() !== ''))).sort();
        };

        const newOptions = {
          cex: getUniqueValues('cex'),
          grupo: getUniqueValues('grupo'),
          categoria: getUniqueValues('categoria'),
          oficina: getUniqueValues('oficina'),
          squadLeads: getUniqueValues('squad_lead'),
        };
        
        setAllUniqueOptions(newOptions);
      }
    } catch (error) {
      console.error('Error fetching unique options:', error);
    }
  };

  const getUniqueValues = (field: keyof Person) => {
    return [...new Set(resources.map(resource => resource[field]).filter(Boolean))].sort();
  };

  const toggleFilter = (currentFilter: string[], value: string, setFilter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentFilter.includes(value)) {
      setFilter(currentFilter.filter(item => item !== value));
    } else {
      setFilter([...currentFilter, value]);
    }
  };

  const handleSort = (field: keyof Person) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Person) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const toggleColumnVisibility = (key: keyof Person) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
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

  // Auto-resize column to fit content
  const autoResizeColumn = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column) return;

    // Calculate width based on content
    let maxWidth = 80; // minimum width
    
    // Check header width
    const headerText = column.label;
    maxWidth = Math.max(maxWidth, headerText.length * 8 + 60);
    
    // Check content width
    filteredResources.forEach(resource => {
      let cellContent = '';
      if (columnKey === 'nombre') {
        cellContent = `${resource.nombre}\n${resource.squad_lead}`;
      } else if (columnKey === 'grupo') {
        cellContent = `${resource.grupo}\n${resource.categoria}`;
      } else {
        cellContent = String(resource[columnKey] || '');
      }
      
      const contentWidth = Math.max(...cellContent.split('\n').map(line => line.length * 7)) + 30;
      maxWidth = Math.max(maxWidth, contentWidth);
    });
    
    // Cap at reasonable maximum
    maxWidth = Math.min(maxWidth, 300);
    
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, width: maxWidth } : col
    ));
  };

  // Column reordering function - MEJORADA
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Solo reordenar las columnas visibles
    const visibleColumns = columns.filter(col => col.visible);
    const hiddenColumns = columns.filter(col => !col.visible);
    
    const [reorderedColumn] = visibleColumns.splice(sourceIndex, 1);
    visibleColumns.splice(destinationIndex, 0, reorderedColumn);
    
    // Reconstruir el array de columnas manteniendo las ocultas al final
    setColumns([...visibleColumns, ...hiddenColumns]);
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
            {/* Add Resource Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Recurso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Recurso</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <Label htmlFor="num_pers">Código Empleado *</Label>
                    <Input
                      id="num_pers"
                      value={formData.num_pers}
                      onChange={(e) => setFormData({ ...formData, num_pers: e.target.value })}
                      placeholder="Ej: 4002383"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_incorporacion">Fecha Incorporación</Label>
                    <Input
                      id="fecha_incorporacion"
                      value={formData.fecha_incorporacion}
                      onChange={(e) => setFormData({ ...formData, fecha_incorporacion: e.target.value })}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mail_empresa">Email Empresa</Label>
                    <Input
                      id="mail_empresa"
                      type="email"
                      value={formData.mail_empresa}
                      onChange={(e) => setFormData({ ...formData, mail_empresa: e.target.value })}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="squad_lead">Squad Lead</Label>
                    <Input
                      id="squad_lead"
                      value={formData.squad_lead}
                      onChange={(e) => setFormData({ ...formData, squad_lead: e.target.value })}
                      placeholder="Nombre del Squad Lead"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cex">CEX</Label>
                    <Input
                      id="cex"
                      value={formData.cex}
                      onChange={(e) => setFormData({ ...formData, cex: e.target.value })}
                      placeholder="Código CEX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grupo">Grupo</Label>
                    <Input
                      id="grupo"
                      value={formData.grupo}
                      onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                      placeholder="Grupo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría</Label>
                    <Input
                      id="categoria"
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      placeholder="Categoría profesional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="oficina">Oficina</Label>
                    <Input
                      id="oficina"
                      value={formData.oficina}
                      onChange={(e) => setFormData({ ...formData, oficina: e.target.value })}
                      placeholder="Oficina"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddResource} className="bg-orange-600 hover:bg-orange-700">
                    <Save className="h-4 w-4 mr-2" />
                    Agregar Recurso
                  </Button>
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
              disabled={filteredResources.length === 0}
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
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
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
                  {squadFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {squadFilter.map(squad => (
                        <Badge key={squad} variant="secondary" className="text-xs">
                          {squad}
                          <button 
                            onClick={() => toggleFilter(squadFilter, squad, setSquadFilter)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  {grupoFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {grupoFilter.map(grupo => (
                        <Badge key={grupo} variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          {grupo}
                          <button 
                            onClick={() => toggleFilter(grupoFilter, grupo, setGrupoFilter)}
                            className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  {categoriaFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {categoriaFilter.map(categoria => (
                        <Badge key={categoria} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {categoria}
                          <button 
                            onClick={() => toggleFilter(categoriaFilter, categoria, setCategoriaFilter)}
                            className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                  {oficinaFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {oficinaFilter.map(oficina => (
                        <Badge key={oficina} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {oficina}
                          <button 
                            onClick={() => toggleFilter(oficinaFilter, oficina, setOficinaFilter)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                   )}
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
                   {cexFilter.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-1">
                       {cexFilter.map(cex => (
                         <Badge key={cex} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                           {cex}
                           <button 
                             onClick={() => toggleFilter(cexFilter, cex, setCexFilter)}
                             className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
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
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {getUniqueValues('origen').map(origen => (
                        <div key={origen} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`origen-${origen}`}
                            checked={origenFilter.includes(origen)}
                            onCheckedChange={() => toggleFilter(origenFilter, origen, setOrigenFilter)}
                          />
                          <label htmlFor={`origen-${origen}`} className="text-sm">{origen}</label>
                        </div>
                      ))}
                    </div>
                    {origenFilter.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {origenFilter.map(origen => (
                          <Badge key={origen} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            {origen}
                            <button 
                              onClick={() => toggleFilter(origenFilter, origen, setOrigenFilter)}
                              className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
            </CardContent>
          </Card>
        )}

        {/* Column Configuration */}
        {showColumns && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Columnas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {columns.map(column => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`column-${column.key}`}
                      checked={column.visible}
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
                    />
                    <label htmlFor={`column-${column.key}`} className="text-sm font-medium">
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="save-as-default"
                    checked={false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        localStorage.setItem('resources-columns-config', JSON.stringify(columns));
                        toast({
                          title: "Configuración guardada",
                          description: "Esta configuración se aplicará por defecto cuando vuelvas a entrar",
                        });
                      }
                    }}
                  />
                  <label htmlFor="save-as-default" className="text-sm font-medium">
                    Esta es mi selección por defecto
                  </label>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setColumns(getInitialColumns().map(col => ({ ...col, visible: true })));
                    localStorage.removeItem('resources-columns-config');
                    toast({
                      title: "Configuración restablecida",
                      description: "Se ha vuelto a la configuración original",
                    });
                  }}
                  className="text-xs"
                >
                  Restablecer todas las columnas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredResources.length)} de {filteredResources.length} recursos
            </span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-24">
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
              max={16}
              min={8}
              step={1}
              className="w-32"
            />
            <span className="text-lg font-arial" style={{ fontSize: '16px' }}>A</span>
          </div>
          
          <span className="text-sm text-muted-foreground">
            {fontSize}px
          </span>
        </div>

        {/* Resources Table */}
        <Card>
          <CardContent className="p-0">
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {/* Contenedor scrolleable principal */}
              <div className="max-h-[600px] overflow-auto relative">
                <table className="w-full border-collapse">
                  {/* Header sticky */}
                  <thead className="sticky top-0 z-30 bg-blue-50 border-b border-gray-200">
                    <tr>
                      {/* Columna índice fija */}
                      <th 
                        className="sticky left-0 z-40 bg-blue-50 border-r border-gray-200 p-3 text-center font-semibold text-xs"
                        style={{ width: 64, minWidth: 64 }}
                      >
                        ÍNDICE
                      </th>
                      
                       {/* Headers de columnas */}
                       {columns.filter(col => col.visible).map((column) => (
                         <th
                           key={column.key}
                           className="relative bg-blue-50 border-r border-gray-200 text-center font-semibold text-xs"
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
                               <span>{column.label}</span>
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
                               onDoubleClick={(e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 autoResizeColumn(column.key);
                               }}
                               title="Arrastrar para redimensionar | Doble click para ajustar automáticamente"
                             />
                           </div>
                         </th>
                       ))}
                      
                      {/* Columna acciones fija */}
                      <th 
                        className="sticky right-0 z-40 bg-blue-50 border-l border-gray-200 p-3 text-center font-semibold text-xs"
                        style={{ width: 96, minWidth: 96 }}
                      >
                        ACCIONES
                      </th>
                    </tr>
                  </thead>
                    
                    {/* Body */}
                    <tbody>
                      {currentResources.map((resource, index) => (
                        <tr key={resource.id} className={`hover:bg-gray-50 border-b border-gray-100 ${
                          resource.origen === 'Administrador' ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30' : ''
                        }`}>
                          {/* Columna índice fija */}
                           <td 
                             className={cn(
                               "sticky left-0 z-10 font-medium text-center border-r border-gray-200 p-3",
                               resource.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                             )}
                             style={{ width: 64 }}
                           >
                             <span className="font-arial" style={{ fontSize: `${fontSize}px` }}>
                               {startIndex + index + 1}
                             </span>
                           </td>
                          
                           {/* Celdas de datos */}
                           {columns.filter(col => col.visible).map(column => (
                             <td 
                               key={column.key}
                               className={`border-r border-gray-200 p-3 ${column.key === 'fecha_incorporacion' ? 'text-center' : ''}`}
                               style={{ 
                                 width: column.width,
                                 minWidth: column.minWidth,
                                 maxWidth: column.width
                               }}
                             >
                                <div 
                                  className="overflow-hidden text-ellipsis font-arial"
                                  style={{ fontSize: `${fontSize}px` }}
                                >
                                  {column.key === 'nombre' ? (
                                    <div className="flex flex-col">
                                      <span className="font-medium">{resource.nombre}</span>
                                      <span className="text-muted-foreground opacity-75">{resource.squad_lead}</span>
                                    </div>
                                  ) : column.key === 'fecha_incorporacion' ? (
                                    (() => {
                                      if (!resource.fecha_incorporacion) return '-';
                                      
                                      const fechaStr = String(resource.fecha_incorporacion);
                                      
                                      // Si ya está en formato DD/MM/YYYY, devolverla tal como está
                                      if (fechaStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                        return fechaStr;
                                      }
                                      
                                      // Si es un número (timestamp de Excel)
                                      if (!isNaN(Number(fechaStr))) {
                                        const excelDate = Number(fechaStr);
                                        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                                        return format(jsDate, 'dd/MM/yyyy');
                                      }
                                      
                                      // Para otros formatos, intentar parsear
                                      try {
                                        return format(new Date(fechaStr), 'dd/MM/yyyy');
                                      } catch {
                                        return fechaStr; // Si falla, devolver el original
                                      }
                                    })()
                                   ) : column.key === 'grupo' ? (
                                     <div className="flex flex-col">
                                       <span className="font-medium">{resource.grupo}</span>
                                       <span className="text-muted-foreground opacity-75">{resource.categoria}</span>
                                     </div>
                                   ) : column.key === 'origen' ? (
                                     <span className={cn(
                                       "px-2 py-1 text-xs font-medium rounded-full",
                                       resource.origen === 'Administrador' 
                                         ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                         : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                     )}>
                                       {resource.origen || 'Fichero'}
                                     </span>
                                   ) : (
                                     resource[column.key] || '-'
                                   )}
                                </div>
                             </td>
                           ))}
                          
                          {/* Columna acciones fija */}
                           <td 
                             className={cn(
                               "sticky right-0 z-10 border-l border-gray-200 p-3",
                               resource.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                             )}
                             style={{ width: 96 }}
                           >
                             <div className="flex items-center gap-2 justify-center">
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                      onClick={() => handleEditPerson(resource)}
                                     className="h-8 w-8 p-0"
                                   >
                                     <Edit className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Modificar</p>
                                 </TooltipContent>
                               </Tooltip>
                               
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => handleDeleteResource(resource.id)}
                                     className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                   >
                                     <Trash2 className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Eliminar</p>
                                 </TooltipContent>
                               </Tooltip>
                             </div>
                          </td>
                        </tr>
                      ))}
                     </tbody>
                  </table>
                </div>
              </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron recursos que coincidan con los filtros</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Person Dialog */}
        <EditPersonDialog
          person={editingPerson}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSavePerson}
          availableOptions={allUniqueOptions}
        />

        {/* Person Table Alternative (for reference) */}
        {false && (
          <PersonTable 
            persons={filteredResources} 
            onEditPerson={handleEditPerson} 
          />
        )}
      </div>
    </div>
    </TooltipProvider>
  );
};

export default ResourcesManagement;