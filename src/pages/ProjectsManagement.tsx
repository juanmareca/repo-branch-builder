import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
  FolderOpen,
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
  CalendarIcon,
  ArrowLeft,
  GripVertical,
  MoreHorizontal,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ProjectsUpload from '@/components/FileUpload/ProjectsUpload';
import EditProjectDialog from '@/components/EditProjectDialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

interface CurrentSquadLead {
  name: string;
  availableSquadLeads: string[];
}

interface Project {
  id: string;
  codigo_inicial: string;
  denominacion: string;
  descripcion: string;
  cliente: string;
  grupo_cliente: string;
  gestor_proyecto: string;
  socio_responsable: string;
  tipologia: string;
  tipologia_2: string;
  created_at: string;
  updated_at: string;
  origen: string;
}

interface ColumnConfig {
  key: keyof Project;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
  resizable: boolean;
}

const ProjectsManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [squadMemberFilter, setSquadMemberFilter] = useState<string[]>([]); // Nuevo filtro para miembros del squad
  const [tipologiaFilter, setTipologiaFilter] = useState<string[]>([]);
  const [clienteFilter, setClienteFilter] = useState<string[]>([]);
  const [gestorFilter, setGestorFilter] = useState<string[]>([]);
  const [socioResponsableFilter, setSocioResponsableFilter] = useState<string[]>([]);
  const [origenFilter, setOrigenFilter] = useState<string[]>([]);
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Project>('denominacion');
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Chart states
  const [showCharts, setShowCharts] = useState(false);
  const [chartStartDate, setChartStartDate] = useState<Date>(startOfMonth(new Date()));
  const [chartEndDate, setChartEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Font size control
  const [fontSize, setFontSize] = useState(12);
  
  // Column resizing
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Form data
  const [formData, setFormData] = useState({
    codigo_inicial: '',
    denominacion: '',
    descripcion: '',
    cliente: '',
    grupo_cliente: '',
    gestor_proyecto: '',
    socio_responsable: '',
    tipologia: '',
    tipologia_2: ''
  });
  
  // Column management with persistence
  const getInitialColumns = (): ColumnConfig[] => {
    const defaultColumns: ColumnConfig[] = [
      { key: 'codigo_inicial', label: 'CÓDIGO INICIAL', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'denominacion', label: 'DENOMINACIÓN / DESCRIPCIÓN', visible: true, width: 300, minWidth: 200, resizable: true },
      { key: 'cliente', label: 'CLIENTE / GRUPO', visible: true, width: 250, minWidth: 180, resizable: true },
      { key: 'gestor_proyecto', label: 'GESTOR', visible: true, width: 180, minWidth: 150, resizable: true },
      { key: 'socio_responsable', label: 'SOCIO RESPONSABLE', visible: true, width: 180, minWidth: 150, resizable: true },
      { key: 'tipologia', label: 'TIPOLOGÍA', visible: true, width: 150, minWidth: 120, resizable: true },
      { key: 'tipologia_2', label: 'TIPOLOGÍA 2', visible: false, width: 150, minWidth: 120, resizable: true },
      { key: 'origen', label: 'ORIGEN', visible: true, width: 120, minWidth: 100, resizable: true }
    ];

    const savedColumns = localStorage.getItem('projects-columns-config');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Filter out any fields that no longer exist in our Project interface
        const validKeys = defaultColumns.map(col => col.key);
        const validSavedColumns = parsed.filter((col: ColumnConfig) => 
          validKeys.includes(col.key)
        );
        
        // Merge saved config with default config to ensure new fields are included
        const mergedColumns = defaultColumns.map(defaultCol => {
          const savedCol = validSavedColumns.find((col: ColumnConfig) => col.key === defaultCol.key);
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
        });
        
        return mergedColumns;
      } catch (error) {
        console.error('Error parsing saved columns config:', error);
        // Clear invalid localStorage data
        localStorage.removeItem('projects-columns-config');
      }
    }
    
    return defaultColumns;
  };

  const [columns, setColumns] = useState<ColumnConfig[]>(getInitialColumns());

  // Save columns configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('projects-columns-config', JSON.stringify(columns));
  }, [columns]);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useCurrentUser();
  
  // Lista de miembros del squad para los filtros
  const [squadMembers, setSquadMembers] = useState<string[]>([]);
  // Lista de squad leads disponibles
  const [availableSquadLeads, setAvailableSquadLeads] = useState<string[]>([]);
  const [selectedSquadLead, setSelectedSquadLead] = useState<string>('');

  // Clean up obsolete localStorage on component mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('projects-columns-config');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Check if saved config has obsolete fields like 'status'
        const hasObsoleteFields = parsed.some((col: any) => 
          ['status', 'priority', 'billing_type', 'progress', 'budget'].includes(col.key)
        );
        
        if (hasObsoleteFields) {
          console.log('🧹 Cleaning obsolete column configuration...');
          localStorage.removeItem('projects-columns-config');
          // Force reload columns with clean config
          setColumns(getInitialColumns());
        }
      } catch (error) {
        console.error('Error checking saved columns:', error);
        localStorage.removeItem('projects-columns-config');
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && !userLoading) {
      if (currentUser.role === 'squad_lead') {
        loadSquadLeads();
      } else {
        fetchProjects();
      }
    }
  }, [currentUser, userLoading]);

  const loadSquadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('persons')
        .select('squad_lead')
        .not('squad_lead', 'eq', '')
        .order('squad_lead');

      if (error) throw error;
      
      const uniqueSquadLeads = [...new Set(data?.map(p => p.squad_lead) || [])];
      setAvailableSquadLeads(uniqueSquadLeads);
      
      // Seleccionar el primer squad lead como default
      if (uniqueSquadLeads.length > 0) {
        const defaultSquadLead = uniqueSquadLeads[0];
        setSelectedSquadLead(defaultSquadLead);
        localStorage.setItem('current-squad-lead', defaultSquadLead);
      }
    } catch (error: any) {
      toast({
        title: "Error al cargar squad leads",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedSquadLead && currentUser?.role === 'squad_lead') {
      fetchProjects();
    }
  }, [selectedSquadLead]);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, squadMemberFilter, tipologiaFilter, clienteFilter, gestorFilter, socioResponsableFilter, origenFilter, sortField, sortDirection]);

  // Función para cargar datos del gráfico
  const fetchChartData = async () => {
    if (!currentUser || currentUser.role !== 'squad_lead' || selectedMembers.length === 0) {
      setChartData([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          start_date,
          end_date,
          hours_allocated,
          projects:project_id(
            id,
            denominacion,
            codigo_inicial
          ),
          persons:person_id(
            id,
            nombre,
            squad_lead
          )
        `)
        .eq('persons.squad_lead', currentUser.name)
        .in('persons.nombre', selectedMembers)
        .gte('start_date', format(chartStartDate, 'yyyy-MM-dd'))
        .lte('end_date', format(chartEndDate, 'yyyy-MM-dd'));

      if (error) throw error;

      // Procesar datos para el gráfico
      const chartProjects = data?.reduce((acc: any[], assignment: any) => {
        if (!assignment.projects || !assignment.persons) return acc;
        
        const projectName = assignment.projects.denominacion;
        const days = assignment.hours_allocated ? Math.ceil(assignment.hours_allocated / 8) : 0;
        
        const existingProject = acc.find(p => p.proyecto === projectName);
        if (existingProject) {
          existingProject.dias += days;
        } else {
          acc.push({
            proyecto: projectName,
            dias: days
          });
        }
        
        return acc;
      }, []) || [];

      setChartData(chartProjects.sort((a, b) => b.dias - a.dias));
    } catch (error: any) {
      toast({
        title: "Error al cargar datos del gráfico",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (showCharts) {
      fetchChartData();
    }
  }, [showCharts, chartStartDate, chartEndDate, selectedMembers, currentUser]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando proyectos...');
      
      let allProjects: Project[] = [];
      
      if (currentUser?.role === 'squad_lead' && selectedSquadLead) {
        // Para Squad Lead: obtener proyectos donde hay asignaciones de su equipo
        console.log('📋 Cargando proyectos del squad:', selectedSquadLead);
        
        // Primero obtenemos todos los miembros del squad
        const { data: squadData, error: squadError } = await supabase
          .from('persons')
          .select('id, nombre')
          .eq('squad_lead', selectedSquadLead);

        if (squadError) throw squadError;
        
        const squadPersonIds = squadData?.map(p => p.id) || [];
        const squadNames = squadData?.map(p => p.nombre) || [];
        
        // Agregar el squad lead a la lista si no está
        if (!squadNames.includes(currentUser.name)) {
          squadNames.push(currentUser.name);
        }
        setSquadMembers(squadNames);
        
        if (squadPersonIds.length > 0) {
          // Obtener proyectos únicos donde hay asignaciones
          const { data: projectIds, error: assignmentsError } = await supabase
            .from('assignments')
            .select('project_id')
            .in('person_id', squadPersonIds);

          if (assignmentsError) throw assignmentsError;
          
          const uniqueProjectIds = [...new Set(projectIds?.map(a => a.project_id) || [])];
          
          if (uniqueProjectIds.length > 0) {
            const { data, error } = await supabase
              .from('projects')
              .select('*')
              .in('id', uniqueProjectIds)
              .order('denominacion', { ascending: true });

            if (error) throw error;
            allProjects = data || [];
          }
        }
        
      } else {
        // Para Admin: todos los proyectos
        console.log('🔄 Cargando todos los proyectos...');
        
        let hasMore = true;
        let from = 0;
        const batchSize = 1000;
        
        while (hasMore) {
          console.log(`📦 Cargando lote desde ${from} hasta ${from + batchSize - 1}`);
          
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('denominacion', { ascending: true })
            .range(from, from + batchSize - 1);

          if (error) throw error;
          
          if (data && data.length > 0) {
            allProjects = [...allProjects, ...data];
            from += batchSize;
            
            if (data.length < batchSize) {
              hasMore = false;
            }
            
            console.log(`📊 Lote cargado: ${data.length} proyectos. Total acumulado: ${allProjects.length}`);
          } else {
            hasMore = false;
          }
        }
      }
      
      console.log('✅ Proyectos cargados:', allProjects.length);
      setProjects(allProjects);
    } catch (error: any) {
      toast({
        title: "Error al cargar proyectos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(async () => {
    let filtered = [...projects];

    // Squad Member filter - para Squad Leads
    if (currentUser?.role === 'squad_lead' && squadMemberFilter.length > 0) {
      try {
        // Obtener IDs de personas seleccionadas
        const { data: selectedPersons } = await supabase
          .from('persons')
          .select('id')
          .in('nombre', squadMemberFilter);
        
        const selectedPersonIds = selectedPersons?.map(p => p.id) || [];
        
        if (selectedPersonIds.length > 0) {
          // Obtener proyectos con asignaciones de las personas seleccionadas
          const { data: assignments } = await supabase
            .from('assignments')
            .select('project_id')
            .in('person_id', selectedPersonIds);
          
          const projectIds = assignments?.map(a => a.project_id) || [];
          filtered = filtered.filter(project => projectIds.includes(project.id));
        }
      } catch (error) {
        console.error('Error applying squad member filter:', error);
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.denominacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.codigo_inicial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.gestor_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.socio_responsable.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tipología filter
    if (tipologiaFilter.length > 0) {
      filtered = filtered.filter(project => tipologiaFilter.includes(project.tipologia));
    }

    // Cliente filter
    if (clienteFilter.length > 0) {
      filtered = filtered.filter(project => clienteFilter.includes(project.cliente));
    }

    // Gestor filter
    if (gestorFilter.length > 0) {
      filtered = filtered.filter(project => gestorFilter.includes(project.gestor_proyecto));
    }

    // Socio Responsable filter
    if (socioResponsableFilter.length > 0) {
      filtered = filtered.filter(project => socioResponsableFilter.includes(project.socio_responsable));
    }

    // Origen filter
    if (origenFilter.length > 0) {
      filtered = filtered.filter(project => origenFilter.includes(project.origen));
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

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, searchTerm, squadMemberFilter, tipologiaFilter, clienteFilter, gestorFilter, socioResponsableFilter, origenFilter, sortField, sortDirection, currentUser]);

  const handleAddProject = async () => {
    if (!formData.codigo_inicial || !formData.denominacion || !formData.cliente) {
      toast({
        title: "Error",
        description: "Por favor, complete al menos el código, denominación y cliente",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .insert(formData);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Proyecto agregado correctamente",
      });

      setIsAddDialogOpen(false);
      setFormData({
        codigo_inicial: '',
        denominacion: '',
        descripcion: '',
        cliente: '',
        grupo_cliente: '',
        gestor_proyecto: '',
        socio_responsable: '',
        tipologia: '',
        tipologia_2: ''
      });
      fetchProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el proyecto",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Proyecto actualizado correctamente",
      });

      fetchProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Proyecto eliminado correctamente",
      });

      fetchProjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto",
        variant: "destructive",
      });
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditDialogOpen(true);
  };

  const handleSaveProject = async (updatedProject: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...updatedProject,
          origen: 'Administrador', // Cambiar origen a Administrador cuando se edita
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProject.id);

      if (error) throw error;

      // Actualizar el estado local
      setProjects(prev => 
        prev.map(project => 
          project.id === updatedProject.id 
            ? { ...updatedProject, origen: 'Administrador' }
            : project
        )
      );

      toast({
        title: "Éxito",
        description: "Proyecto actualizado correctamente",
      });

      setEditDialogOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el proyecto",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredProjects.map((project, index) => ({
      'ÍNDICE': index + 1,
      'CÓDIGO INICIAL': project.codigo_inicial,
      'DENOMINACIÓN': project.denominacion,
      'DESCRIPCIÓN': project.descripcion,
      'CLIENTE': project.cliente,
      'GRUPO CLIENTE': project.grupo_cliente,
      'GESTOR PROYECTO': project.gestor_proyecto,
      'SOCIO RESPONSABLE': project.socio_responsable,
      'TIPOLOGÍA': project.tipologia,
      'TIPOLOGÍA 2': project.tipologia_2,
      'ORIGEN': project.origen,
      'FECHA CREACIÓN': new Date(project.created_at).toLocaleDateString()
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
          fgColor: { rgb: "7C3AED" }
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
      colWidths.push({ wch: Math.min(maxLength + 2, 50) });
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');
    XLSX.writeFile(wb, `proyectos_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Éxito",
      description: "Archivo Excel exportado correctamente",
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSquadMemberFilter([]);
    setTipologiaFilter([]);
    setClienteFilter([]);
    setGestorFilter([]);
    setSocioResponsableFilter([]);
    setOrigenFilter([]);
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || 
           squadMemberFilter.length > 0 ||
           tipologiaFilter.length > 0 || 
           clienteFilter.length > 0 || 
           gestorFilter.length > 0 || 
           socioResponsableFilter.length > 0 || 
           origenFilter.length > 0;
  };

  const getUniqueValues = (field: keyof Project) => {
    return [...new Set(projects.map(project => project[field]).filter(Boolean))].sort();
  };

  const toggleColumnVisibility = (key: keyof Project) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const toggleFilter = (currentFilter: string[], value: string, setFilter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentFilter.includes(value)) {
      setFilter(currentFilter.filter(item => item !== value));
    } else {
      setFilter([...currentFilter, value]);
    }
  };


  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Project) => {
    if (sortField !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
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
    filteredProjects.forEach(project => {
      let cellContent = '';
      if (columnKey === 'denominacion') {
        cellContent = `${project.denominacion}\n${project.descripcion || ''}`;
      } else if (columnKey === 'cliente') {
        cellContent = `${project.cliente}\n${project.grupo_cliente || ''}`;
      } else {
        cellContent = String(project[columnKey] || '');
      }
      
      const contentWidth = Math.max(...cellContent.split('\n').map(line => line.length * 7)) + 30;
      maxWidth = Math.max(maxWidth, contentWidth);
    });
    
    // Cap at reasonable maximum
    maxWidth = Math.min(maxWidth, 400);
    
    setColumns(prev => prev.map(col => 
      col.key === columnKey ? { ...col, width: maxWidth } : col
    ));
  };

  // Column reordering function
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const visibleColumns = columns.filter(col => col.visible);
    const hiddenColumns = columns.filter(col => !col.visible);
    
    const [reorderedColumn] = visibleColumns.splice(sourceIndex, 1);
    visibleColumns.splice(destinationIndex, 0, reorderedColumn);
    
    setColumns([...visibleColumns, ...hiddenColumns]);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Cargando proyectos...</span>
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
                <div className="p-2 bg-purple-600 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Gestión de Proyectos ({filteredProjects.length})</h1>
                  <p className="text-muted-foreground">Administra todos los proyectos del sistema</p>
                </div>
              </div>
              
              {/* Selector de Squad Lead - Solo para Squad Leads */}
              {currentUser?.role === 'squad_lead' && (
                <div className="flex items-center gap-2 ml-6">
                  <Label className="text-sm font-medium">Squad Lead:</Label>
                  <Select 
                    value={selectedSquadLead} 
                    onValueChange={(value) => {
                      setSelectedSquadLead(value);
                      localStorage.setItem('current-squad-lead', value);
                    }}
                  >
                    <SelectTrigger className="w-80">
                      <SelectValue placeholder="Seleccionar Squad Lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSquadLeads.map((squadLead) => (
                        <SelectItem key={squadLead} value={squadLead}>
                          {squadLead}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
            {/* Add Project Dialog - Solo para administradores */}
            {currentUser?.role === 'admin' && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Proyecto
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Agregar Nuevo Proyecto
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo_inicial">Código Inicial *</Label>
                    <Input
                      id="codigo_inicial"
                      value={formData.codigo_inicial}
                      onChange={(e) => setFormData({ ...formData, codigo_inicial: e.target.value })}
                      placeholder="Ej: PROJ-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="denominacion">Denominación *</Label>
                    <Input
                      id="denominacion"
                      value={formData.denominacion}
                      onChange={(e) => setFormData({ ...formData, denominacion: e.target.value })}
                      placeholder="Nombre del proyecto"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción del proyecto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Cliente *</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grupo_cliente">Grupo Cliente</Label>
                    <Input
                      id="grupo_cliente"
                      value={formData.grupo_cliente}
                      onChange={(e) => setFormData({ ...formData, grupo_cliente: e.target.value })}
                      placeholder="Grupo del cliente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gestor_proyecto">Gestor Proyecto</Label>
                    <Input
                      id="gestor_proyecto"
                      value={formData.gestor_proyecto}
                      onChange={(e) => setFormData({ ...formData, gestor_proyecto: e.target.value })}
                      placeholder="Gestor del proyecto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="socio_responsable">Socio Responsable</Label>
                    <Input
                      id="socio_responsable"
                      value={formData.socio_responsable}
                      onChange={(e) => setFormData({ ...formData, socio_responsable: e.target.value })}
                      placeholder="Socio responsable"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipologia">Tipología</Label>
                    <Input
                      id="tipologia"
                      value={formData.tipologia}
                      onChange={(e) => setFormData({ ...formData, tipologia: e.target.value })}
                      placeholder="Tipología del proyecto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipologia_2">Tipología 2</Label>
                    <Input
                      id="tipologia_2"
                      value={formData.tipologia_2}
                      onChange={(e) => setFormData({ ...formData, tipologia_2: e.target.value })}
                      placeholder="Tipología secundaria"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddProject}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Guardar Proyecto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}

            {/* Botones de upload - Solo para administradores */}
            {currentUser?.role === 'admin' && (
              <>
                <Button
                  onClick={() => setShowUpload(!showUpload)}
                  variant="outline"
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Cargar Excel
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleExportExcel}
                  disabled={filteredProjects.length === 0}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </>
            )}

            {/* Botón de gráficos - Solo para Squad Leads */}
            {currentUser?.role === 'squad_lead' && (
              <Button
                onClick={() => setShowCharts(!showCharts)}
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showCharts ? "Ocultar Gráficos" : "Ver Gráficos"}
              </Button>
            )}
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

        {showUpload && (
          <div className="mb-8">
            <ProjectsUpload />
          </div>
        )}

        {/* Charts Section - Solo para Squad Leads */}
        {showCharts && currentUser?.role === 'squad_lead' && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gráficos de Asignación de Proyectos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros de fechas y miembros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !chartStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {chartStartDate ? format(chartStartDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={chartStartDate}
                          onSelect={(date) => date && setChartStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !chartEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {chartEndDate ? format(chartEndDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={chartEndDate}
                          onSelect={(date) => date && setChartEndDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Miembros del Equipo</Label>
                    <Select value={selectedMembers.join(',')} onValueChange={(value) => setSelectedMembers(value ? value.split(',') : [])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar miembros" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={squadMembers.join(',')}>Todos los miembros</SelectItem>
                        {squadMembers.map((member) => (
                          <SelectItem key={member} value={member}>
                            {member}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Gráfico */}
                {chartData.length > 0 ? (
                  <div className="h-96">
                    <ChartContainer
                      config={{
                        dias: {
                          label: "Días Asignados",
                          color: "hsl(var(--primary))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis 
                            dataKey="proyecto" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="dias" fill="var(--color-dias)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {selectedMembers.length === 0 
                      ? "Selecciona miembros del equipo para ver los gráficos"
                      : "No hay datos para el período seleccionado"
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar proyectos por nombre, código, cliente, gestor..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {/* Squad Member Filter - Solo para Squad Leads */}
                {currentUser?.role === 'squad_lead' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Miembros del Squad</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {squadMembers.map((member) => (
                        <div key={member} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member}`}
                            checked={squadMemberFilter.includes(member)}
                            onCheckedChange={() => toggleFilter(squadMemberFilter, member, setSquadMemberFilter)}
                          />
                          <Label htmlFor={`member-${member}`} className="text-sm">
                            {member}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tipología Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipología</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                     {getUniqueValues('tipologia').map((tipologia) => (
                       <div key={String(tipologia)} className="flex items-center space-x-2">
                         <Checkbox
                           id={`tipologia-${tipologia}`}
                           checked={tipologiaFilter.includes(String(tipologia))}
                           onCheckedChange={() => toggleFilter(tipologiaFilter, String(tipologia), setTipologiaFilter)}
                         />
                        <Label htmlFor={`tipologia-${tipologia}`} className="text-sm">
                           {String(tipologia)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cliente Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cliente</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                     {getUniqueValues('cliente').map((cliente) => (
                       <div key={String(cliente)} className="flex items-center space-x-2">
                         <Checkbox
                           id={`cliente-${cliente}`}
                           checked={clienteFilter.includes(String(cliente))}
                           onCheckedChange={() => toggleFilter(clienteFilter, String(cliente), setClienteFilter)}
                         />
                        <Label htmlFor={`cliente-${cliente}`} className="text-sm">
                           {String(cliente)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gestor Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Gestor</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                     {getUniqueValues('gestor_proyecto').map((gestor) => (
                       <div key={String(gestor)} className="flex items-center space-x-2">
                         <Checkbox
                           id={`gestor-${gestor}`}
                           checked={gestorFilter.includes(String(gestor))}
                           onCheckedChange={() => toggleFilter(gestorFilter, String(gestor), setGestorFilter)}
                         />
                        <Label htmlFor={`gestor-${gestor}`} className="text-sm">
                           {String(gestor)}
                        </Label>
                      </div>
                    ))}
                   </div>
                 </div>

                 {/* Socio Responsable Filter */}
                 <div>
                   <Label className="text-sm font-medium mb-2 block">Socio Responsable</Label>
                   <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getUniqueValues('socio_responsable').map((socio) => (
                        <div key={String(socio)} className="flex items-center space-x-2">
                          <Checkbox
                            id={`socio-${socio}`}
                            checked={socioResponsableFilter.includes(String(socio))}
                            onCheckedChange={() => toggleFilter(socioResponsableFilter, String(socio), setSocioResponsableFilter)}
                          />
                         <Label htmlFor={`socio-${socio}`} className="text-sm">
                            {String(socio)}
                         </Label>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Origen Filter */}
                 <div>
                   <Label className="text-sm font-medium mb-2 block">Origen</Label>
                   <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getUniqueValues('origen').map((origen) => (
                        <div key={String(origen)} className="flex items-center space-x-2">
                          <Checkbox
                            id={`origen-${origen}`}
                            checked={origenFilter.includes(String(origen))}
                            onCheckedChange={() => toggleFilter(origenFilter, String(origen), setOrigenFilter)}
                          />
                         <Label htmlFor={`origen-${origen}`} className="text-sm">
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              String(origen) === 'Administrador' 
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            )}>
                              {String(origen) || 'Fichero'}
                            </span>
                         </Label>
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
              <CardTitle className="text-lg">Configuración de Columnas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column.key}`}
                      checked={column.visible}
                      onCheckedChange={() => toggleColumnVisibility(column.key)}
                    />
                    <Label htmlFor={`column-${column.key}`} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox 
                  id="save-default"
                  checked={isDefaultViewSaved}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      localStorage.setItem('projects-columns-config', JSON.stringify(columns));
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
                    localStorage.removeItem('projects-columns-config');
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

        {/* Pagination Info - MOVER ARRIBA DE LA TABLA */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredProjects.length)} de {filteredProjects.length} proyectos
            </span>
            <span className="text-sm text-muted-foreground">por página</span>
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

        {/* Font Size Control */}
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tamaño de fuente:</span>
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

        {/* Table */}
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
                        {columns.filter(col => col.visible).map((column, colIndex, visibleColumns) => (
                         <th
                           key={column.key}
                           className={cn(
                             "relative bg-blue-50 text-center font-semibold text-xs",
                             // Add border-r to all columns except the last visible one
                             colIndex < visibleColumns.length - 1 ? "border-r border-gray-200" : ""
                           )}
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
                     {currentProjects.map((project, index) => (
                       <tr key={project.id} className={`hover:bg-gray-50 border-b border-gray-100 ${
                         project.origen === 'Administrador' ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30' : ''
                       }`}>
                         {/* Columna índice fija */}
                          <td 
                            className={cn(
                              "sticky left-0 z-10 font-medium text-center border-r border-gray-200 p-3",
                              project.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                            )}
                            style={{ width: 64 }}
                          >
                            <span className="font-arial" style={{ fontSize: `${fontSize}px` }}>
                              {startIndex + index + 1}
                            </span>
                          </td>
                          
                           {/* Celdas de datos */}
                           {columns.filter(col => col.visible).map((column, colIndex, visibleColumns) => (
                             <td 
                               key={column.key} 
                               className={cn(
                                 "p-3",
                                 // Add border-r to all columns except the last visible one
                                 colIndex < visibleColumns.length - 1 ? "border-r border-gray-200" : "",
                                 project.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                               )}
                               style={{ 
                                 width: column.width,
                                 minWidth: column.minWidth,
                                 maxWidth: column.width
                               }}
                            >
                              <div
                                className="p-1 rounded min-h-[32px] flex items-center"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                 {column.key === 'denominacion' ? (
                                   <div>
                                     <div className="font-medium text-sm">{project.denominacion}</div>
                                     {project.descripcion && (
                                       <div className="text-xs text-muted-foreground truncate">{project.descripcion}</div>
                                     )}
                                   </div>
                                 ) : column.key === 'cliente' ? (
                                   <div>
                                     <div className="font-medium text-sm">{project.cliente}</div>
                                     {project.grupo_cliente && (
                                       <div className="text-xs text-muted-foreground">{project.grupo_cliente}</div>
                                     )}
                                   </div>
                                 ) : column.key === 'origen' ? (
                                   <span className={cn(
                                     "px-2 py-1 text-xs font-medium rounded-full",
                                     project.origen === 'Administrador' 
                                       ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                       : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                   )}>
                                     {project.origen || 'Fichero'}
                                   </span>
                                 ) : (
                                   <span className="truncate">{project[column.key] || '-'}</span>
                                 )}
                              </div>
                            </td>
                          ))}

                          {/* Columna acciones fija */}
                           <td 
                             className={cn(
                               "sticky right-0 z-10 border-l border-gray-200 p-3",
                               project.origen === 'Administrador' ? "bg-red-50" : "bg-white"
                             )}
                             style={{ width: 96 }}
                           >
                             <div className="flex items-center gap-2 justify-center">
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                       onClick={() => handleEditProject(project)}
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
                                     onClick={() => handleDeleteProject(project.id)}
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

            {filteredProjects.length === 0 && (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron proyectos que coincidan con los filtros</p>
              </div>
            )}
           </CardContent>
        </Card>

        {/* Edit Project Dialog */}
        <EditProjectDialog
          project={editingProject}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleSaveProject}
        />
      </div>
    </div>
    </TooltipProvider>
  );
};

export default ProjectsManagement;