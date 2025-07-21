import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Upload, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
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
  Zap,
  Calendar as CalendarIcon,
  TableIcon,
  IdCard,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CapacitiesUpload from "@/components/FileUpload/CapacitiesUpload";
import * as XLSX from 'xlsx';

interface Capacity {
  id: string;
  person_name: string;
  skill: string;
  level: string;
  certification: string;
  comments: string;
  evaluation_date: string | null;
  created_at: string;
}

interface EmployeeCapacities {
  person_name: string;
  id: string;
  capacities: Capacity[];
  sap_modules: { [key: string]: string };
  sap_implementation: { [key: string]: string };
  languages: { [key: string]: string };
  industries: { [key: string]: string };
  evaluation_date: string | null;
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
  resizable: boolean;
}

const SKILL_LEVELS = ['Nulo', 'Básico', 'Medio', 'Alto', 'Experto'];

export default function CapacitiesManagement() {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [employeeCapacities, setEmployeeCapacities] = useState<EmployeeCapacities[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeCapacities[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [personFilter, setPersonFilter] = useState<string[]>([]);
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string[]>([]);
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDefaultViewSaved, setIsDefaultViewSaved] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(999999);
  
  // Column management with persistence
  const getInitialColumns = (): ColumnConfig[] => {
    const savedColumns = localStorage.getItem('capacities-columns-config');
    if (savedColumns) {
      try {
        return JSON.parse(savedColumns);
      } catch (error) {
        console.error('Error parsing saved columns config:', error);
      }
    }
    // Default configuration
    return [
      { key: 'person_name', label: 'Empleado', visible: true, width: 200, minWidth: 150, resizable: true },
      { key: 'sap_modules', label: 'Módulos SAP', visible: true, width: 300, minWidth: 200, resizable: true },
      { key: 'sap_implementation', label: 'Implantación SAP', visible: true, width: 300, minWidth: 200, resizable: true },
      { key: 'languages', label: 'Idiomas', visible: true, width: 250, minWidth: 180, resizable: true },
      { key: 'industries', label: 'Industrias', visible: true, width: 250, minWidth: 180, resizable: true },
      { key: 'evaluation_date', label: 'Fecha Evaluación', visible: true, width: 150, minWidth: 120, resizable: true }
    ];
  };

  // Column management
  const [columns, setColumns] = useState<ColumnConfig[]>(getInitialColumns());
  
  const [resizing, setResizing] = useState<{ columnKey: string; startX: number; startWidth: number } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Save columns configuration to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('capacities-columns-config', JSON.stringify(columns));
  }, [columns]);

  // Form state
  const [formData, setFormData] = useState({
    person_name: '',
    skill: '',
    level: '',
    certification: '',
    comments: '',
    evaluation_date: undefined as Date | undefined
  });

  // Función para convertir capacidades individuales en estructura de empleado
  const groupCapacitiesByEmployee = (caps: Capacity[]): EmployeeCapacities[] => {
    const employeeMap = new Map<string, EmployeeCapacities>();

    caps.forEach(cap => {
      if (!employeeMap.has(cap.person_name)) {
        employeeMap.set(cap.person_name, {
          person_name: cap.person_name,
          id: cap.person_name, // Usar nombre como ID único
          capacities: [],
          sap_modules: {},
          sap_implementation: {},
          languages: {},
          industries: {},
          evaluation_date: cap.evaluation_date
        });
      }

      const employee = employeeMap.get(cap.person_name)!;
      employee.capacities.push(cap);

      // Clasificar capacidades por bloque
      if (cap.skill.includes('Módulo SAP')) {
        const skillName = cap.skill.replace('Módulo SAP - ', '');
        employee.sap_modules[skillName] = cap.level;
      } else if (cap.skill.includes('Implantación SAP')) {
        const skillName = cap.skill.replace('Implantación SAP - ', '');
        employee.sap_implementation[skillName] = cap.level;
      } else if (cap.skill.includes('Idiomas')) {
        const skillName = cap.skill.replace('Idiomas - ', '');
        employee.languages[skillName] = cap.level;
      } else if (cap.skill.includes('Industrias')) {
        const skillName = cap.skill.replace('Industrias - ', '');
        employee.industries[skillName] = cap.level;
      }
    });

    return Array.from(employeeMap.values());
  };

  useEffect(() => {
    fetchCapacities();
  }, []);

  useEffect(() => {
    const employees = groupCapacitiesByEmployee(capacities);
    setEmployeeCapacities(employees);
    
    // Aplicar filtros
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.person_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (personFilter.length > 0) {
      filtered = filtered.filter(employee => personFilter.includes(employee.person_name));
    }

    if (skillFilter.length > 0) {
      filtered = filtered.filter(employee => 
        skillFilter.some(skill => 
          Object.keys(employee.sap_modules).includes(skill) ||
          Object.keys(employee.sap_implementation).includes(skill)
        )
      );
    }

    if (languageFilter.length > 0) {
      filtered = filtered.filter(employee => 
        languageFilter.some(language => Object.keys(employee.languages).includes(language))
      );
    }

    if (industryFilter.length > 0) {
      filtered = filtered.filter(employee => 
        industryFilter.some(industry => 
          Object.keys(employee.industries).includes(industry) && 
          employee.industries[industry] === 'Sí'
        )
      );
    }

    if (levelFilter.length > 0) {
      filtered = filtered.filter(employee => 
        levelFilter.some(level => 
          Object.values(employee.sap_modules).includes(level) ||
          Object.values(employee.sap_implementation).includes(level) ||
          Object.values(employee.languages).includes(level) ||
          Object.values(employee.industries).includes(level)
        )
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [capacities, searchTerm, personFilter, skillFilter, languageFilter, industryFilter, levelFilter]);

  const fetchCapacities = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando todas las capacidades...');
      
      let allCapacities: Capacity[] = [];
      let hasMore = true;
      let from = 0;
      const batchSize = 1000;
      
      while (hasMore) {
        console.log(`📦 Cargando lote desde ${from} hasta ${from + batchSize - 1}`);
        
        const { data, error } = await supabase
          .from('capacities')
          .select('*')
          .order('person_name', { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allCapacities = [...allCapacities, ...data];
          from += batchSize;
          
          // Si el lote es menor que batchSize, hemos llegado al final
          if (data.length < batchSize) {
            hasMore = false;
          }
          
          console.log(`📊 Lote cargado: ${data.length} capacidades. Total acumulado: ${allCapacities.length}`);
        } else {
          hasMore = false;
        }
      }
      
      console.log('✅ Capacidades cargadas:', allCapacities.length);
      setCapacities(allCapacities);
    } catch (error: any) {
      console.error('Error fetching capacities:', error);
      toast({
        title: "Error al cargar capacidades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCapacity = async () => {
    if (!formData.person_name || !formData.skill || !formData.level) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('capacities')
        .insert({
          person_name: formData.person_name,
          skill: formData.skill,
          level: formData.level,
          certification: formData.certification,
          comments: formData.comments,
          evaluation_date: formData.evaluation_date ? format(formData.evaluation_date, 'yyyy-MM-dd') : null
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Capacidad agregada correctamente",
      });

      setIsAddDialogOpen(false);
      setFormData({
        person_name: '',
        skill: '',
        level: '',
        certification: '',
        comments: '',
        evaluation_date: undefined
      });
      fetchCapacities();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar la capacidad",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (employeeName: string) => {
    try {
      const { error } = await supabase
        .from('capacities')
        .delete()
        .eq('person_name', employeeName);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Empleado eliminado correctamente",
      });

      fetchCapacities();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((employee, index) => {
      const row: any = {
        'ÍNDICE': index + 1,
        'EMPLEADO': employee.person_name,
        'FECHA EVALUACIÓN': employee.evaluation_date ? format(new Date(employee.evaluation_date), 'dd/MM/yyyy') : ''
      };

      // Agregar columnas dinámicas para cada capacidad
      employee.capacities.forEach(cap => {
        row[cap.skill] = cap.level;
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Capacidades');
    XLSX.writeFile(wb, `capacidades_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Éxito",
      description: "Archivo Excel exportado correctamente",
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPersonFilter([]);
    setSkillFilter([]);
    setLanguageFilter([]);
    setIndustryFilter([]);
    setLevelFilter([]);
  };

  const toggleFilter = (filterArray: string[], value: string, setFilter: (arr: string[]) => void) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(item => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const getUniqueValues = (field: 'person_name') => {
    return [...new Set(employeeCapacities.map(emp => emp.person_name))].sort();
  };

  const getUniqueSkills = () => {
    const skills = new Set<string>();
    employeeCapacities.forEach(emp => {
      Object.keys(emp.sap_modules).forEach(skill => skills.add(skill));
      Object.keys(emp.sap_implementation).forEach(skill => skills.add(skill));
    });
    return Array.from(skills).sort();
  };

  const getUniqueLanguages = () => {
    const languages = new Set<string>();
    employeeCapacities.forEach(emp => {
      Object.keys(emp.languages).forEach(lang => languages.add(lang));
    });
    return Array.from(languages).sort();
  };

  const getUniqueIndustries = () => {
    const industries = new Set<string>();
    employeeCapacities.forEach(emp => {
      Object.keys(emp.industries).forEach(industry => industries.add(industry));
    });
    return Array.from(industries).sort();
  };

  const getUniqueLevels = () => {
    const levels = new Set<string>();
    employeeCapacities.forEach(emp => {
      Object.values(emp.sap_modules).forEach(level => levels.add(level));
      Object.values(emp.sap_implementation).forEach(level => levels.add(level));
      Object.values(emp.languages).forEach(level => levels.add(level));
      Object.values(emp.industries).forEach(level => levels.add(level));
    });
    return Array.from(levels).sort();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Column resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
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
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
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

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'Experto': return 'bg-green-100 text-green-800 border-green-300';
      case 'Alto': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Medio': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Básico': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Sí': return 'bg-green-100 text-green-800 border-green-300';
      case 'No': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Componente para la ficha de empleado
  const EmployeeCard = ({ employee }: { employee: EmployeeCapacities }) => (
    <Card className="mb-6 break-inside-avoid">
      <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{employee.person_name}</CardTitle>
          <Badge variant="outline" className="bg-white text-cyan-600 border-white">
            {employee.capacities.length} capacidades
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Módulos SAP */}
        {Object.keys(employee.sap_modules).length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Módulos SAP
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(employee.sap_modules).map(([skill, level]) => (
                <div key={skill} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-sm font-medium">{skill}</span>
                  <Badge variant="outline" className={cn("text-xs", getLevelBadgeColor(level))}>
                    {level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implantación SAP */}
        {Object.keys(employee.sap_implementation).length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              Implantación SAP
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(employee.sap_implementation).map(([skill, level]) => (
                <div key={skill} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span className="text-sm font-medium">{skill}</span>
                  <Badge variant="outline" className={cn("text-xs", getLevelBadgeColor(level))}>
                    {level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {Object.keys(employee.languages).length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Idiomas
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(employee.languages).map(([skill, level]) => (
                <div key={skill} className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-sm font-medium">{skill}</span>
                  <Badge variant="outline" className={cn("text-xs", getLevelBadgeColor(level))}>
                    {level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Industrias */}
        {Object.keys(employee.industries).length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              Industrias
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(employee.industries).map(([skill, level]) => (
                <div key={skill} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-sm font-medium">{skill}</span>
                  <Badge variant="outline" className={cn("text-xs", getLevelBadgeColor(level))}>
                    {level}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {employee.evaluation_date && (
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            Última evaluación: {formatDate(employee.evaluation_date)}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando capacidades...</p>
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
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Zap className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gestión de Capacidades ({filteredEmployees.length})</h1>
                  <p className="text-muted-foreground">Administra las capacidades y habilidades del equipo</p>
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
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Capacidad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Capacidad</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="person_name">Empleado *</Label>
                    <Input
                      id="person_name"
                      placeholder="Nombre del empleado"
                      value={formData.person_name}
                      onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="skill">Habilidad *</Label>
                    <Input
                      id="skill"
                      placeholder="Ej: Módulo SAP - FI, Idiomas - Inglés"
                      value={formData.skill}
                      onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="level">Nivel *</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar nivel" />
                      </SelectTrigger>
                      <SelectContent>
                        {SKILL_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="certification">Certificación</Label>
                    <Input
                      id="certification"
                      placeholder="Certificación obtenida"
                      value={formData.certification}
                      onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="comments">Comentarios</Label>
                    <Input
                      id="comments"
                      placeholder="Comentarios adicionales"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="evaluation_date">Fecha de Evaluación</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.evaluation_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.evaluation_date ? format(formData.evaluation_date, "dd/MM/yyyy") : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.evaluation_date}
                          onSelect={(date) => setFormData({ ...formData, evaluation_date: date })}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={handleAddCapacity} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                      Agregar Capacidad
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Cargar Excel
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={filteredEmployees.length === 0}
              className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Tabla
            </Button>
            <Button 
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <IdCard className="h-4 w-4 mr-2" />
              Fichas
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn("text-orange-600 border-orange-600", showFilters && "bg-orange-50")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {viewMode === 'table' && (
              <Button 
                variant="outline" 
                onClick={() => setShowColumns(!showColumns)}
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Columnas
              </Button>
            )}
          </div>
        </div>

        {showUpload && (
          <div className="mb-8">
            <CapacitiesUpload />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar empleados..."
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Empleado Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Empleado</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('person_name').map(person => (
                      <div key={person} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`person-${person}`}
                          checked={personFilter.includes(person)}
                          onCheckedChange={() => toggleFilter(personFilter, person, setPersonFilter)}
                        />
                        <label htmlFor={`person-${person}`} className="text-sm">{person}</label>
                      </div>
                    ))}
                  </div>
                  {personFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {personFilter.map(person => (
                        <Badge key={person} variant="secondary" className="text-xs">
                          {person}
                          <button 
                            onClick={() => toggleFilter(personFilter, person, setPersonFilter)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Habilidades SAP</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueSkills().map(skill => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`skill-${skill}`}
                          checked={skillFilter.includes(skill)}
                          onCheckedChange={() => toggleFilter(skillFilter, skill, setSkillFilter)}
                        />
                        <label htmlFor={`skill-${skill}`} className="text-sm">{skill}</label>
                      </div>
                    ))}
                  </div>
                  {skillFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {skillFilter.map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {skill}
                          <button 
                            onClick={() => toggleFilter(skillFilter, skill, setSkillFilter)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Languages Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Idiomas</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueLanguages().map(language => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`language-${language}`}
                          checked={languageFilter.includes(language)}
                          onCheckedChange={() => toggleFilter(languageFilter, language, setLanguageFilter)}
                        />
                        <label htmlFor={`language-${language}`} className="text-sm">{language}</label>
                      </div>
                    ))}
                  </div>
                  {languageFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {languageFilter.map(language => (
                        <Badge key={language} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {language}
                          <button 
                            onClick={() => toggleFilter(languageFilter, language, setLanguageFilter)}
                            className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Industries Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Industrias</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueIndustries().map(industry => (
                      <div key={industry} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`industry-${industry}`}
                          checked={industryFilter.includes(industry)}
                          onCheckedChange={() => toggleFilter(industryFilter, industry, setIndustryFilter)}
                        />
                        <label htmlFor={`industry-${industry}`} className="text-sm">{industry}</label>
                      </div>
                    ))}
                  </div>
                  {industryFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {industryFilter.map(industry => (
                        <Badge key={industry} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          {industry}
                          <button 
                            onClick={() => toggleFilter(industryFilter, industry, setIndustryFilter)}
                            className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Levels Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Niveles</Label>
                  <div className="space-y-2 border rounded-md p-2">
                    {getUniqueLevels().map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`level-${level}`}
                          checked={levelFilter.includes(level)}
                          onCheckedChange={() => toggleFilter(levelFilter, level, setLevelFilter)}
                        />
                        <label htmlFor={`level-${level}`} className="text-sm">{level}</label>
                      </div>
                    ))}
                  </div>
                  {levelFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {levelFilter.map(level => (
                        <Badge key={level} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                          {level}
                          <button 
                            onClick={() => toggleFilter(levelFilter, level, setLevelFilter)}
                            className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
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

        {/* Column Management */}
        {showColumns && viewMode === 'table' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Gestión de Columnas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                <Checkbox 
                  id="save-default"
                  checked={isDefaultViewSaved}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      localStorage.setItem('capacities-columns-config', JSON.stringify(columns));
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
                    localStorage.removeItem('capacities-columns-config');
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

        {/* Pagination Controls */}
        {viewMode === 'table' && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredEmployees.length)} de {filteredEmployees.length} empleados
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
                  <SelectItem value="1000">1000</SelectItem>
                  <SelectItem value="999999">Todos</SelectItem>
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
        )}

        {/* Content based on view mode */}
        {viewMode === 'table' ? (
          /* Modern Card Layout similar to Reference */
          <div className="space-y-6">
            {currentEmployees.map((employee, index) => (
              <Card key={employee.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {employee.person_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-blue-800">
                          {employee.person_name.toUpperCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {Object.keys({...employee.sap_modules, ...employee.sap_implementation}).length} capacidades disponibles ({Object.values({...employee.sap_modules, ...employee.sap_implementation}).filter(level => ['Alto', 'Experto'].includes(level)).length} con experiencia) - 
                          {Math.round((Object.values({...employee.sap_modules, ...employee.sap_implementation}).filter(level => ['Alto', 'Experto'].includes(level)).length / Object.keys({...employee.sap_modules, ...employee.sap_implementation}).length) * 100) || 0}%
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.person_name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Módulos SAP e Implantaciones */}
                  {(Object.keys(employee.sap_modules).length > 0 || Object.keys(employee.sap_implementation).length > 0) && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-gray-600" />
                        <h4 className="font-semibold text-gray-800">Módulos SAP e Implantaciones</h4>
                        <span className="text-sm text-gray-500">
                          {Object.keys({...employee.sap_modules, ...employee.sap_implementation}).length} capacidades
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {/* SAP Modules */}
                        {Object.entries(employee.sap_modules).map(([skill, level]) => (
                          <div key={skill} className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm text-gray-900 mb-1">{skill}</h5>
                                <Badge 
                                  className={cn(
                                    "text-xs font-medium",
                                    level === 'Básico' && "bg-yellow-100 text-yellow-800 border-yellow-300",
                                    level === 'Medio' && "bg-orange-100 text-orange-800 border-orange-300",
                                    level === 'Alto' && "bg-green-100 text-green-800 border-green-300",
                                    level === 'Experto' && "bg-purple-100 text-purple-800 border-purple-300",
                                    level === 'Nulo' && "bg-gray-100 text-gray-800 border-gray-300"
                                  )}
                                >
                                  {level}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* SAP Implementation */}
                        {Object.entries(employee.sap_implementation).map(([skill, level]) => (
                          <div key={skill} className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm text-blue-900 mb-1">{skill}</h5>
                                <Badge 
                                  className={cn(
                                    "text-xs font-medium",
                                    level === 'Básico' && "bg-yellow-100 text-yellow-800 border-yellow-300",
                                    level === 'Medio' && "bg-orange-100 text-orange-800 border-orange-300",
                                    level === 'Alto' && "bg-green-100 text-green-800 border-green-300",
                                    level === 'Experto' && "bg-purple-100 text-purple-800 border-purple-300",
                                    level === 'Nulo' && "bg-gray-100 text-gray-800 border-gray-300"
                                  )}
                                >
                                  {level}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Idiomas */}
                  {Object.keys(employee.languages).length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🌐</span>
                        <h4 className="font-semibold text-gray-800">Idiomas</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(employee.languages).map(([skill, level]) => (
                          <div key={skill} className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-sm">
                            <div className="text-center">
                              <h5 className="font-medium text-sm text-green-900 mb-1">{skill}</h5>
                              <Badge 
                                className={cn(
                                  "text-xs font-medium",
                                  level === 'B1' && "bg-yellow-100 text-yellow-800",
                                  level === 'Básico' && "bg-yellow-100 text-yellow-800",
                                  level === 'Bilingüe' && "bg-green-100 text-green-800",
                                  level === 'Nulo' && "bg-gray-100 text-gray-800",
                                  !['B1', 'Básico', 'Bilingüe', 'Nulo'].includes(level) && "bg-blue-100 text-blue-800"
                                )}
                              >
                                {level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Industrias */}
                  {Object.keys(employee.industries).length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🏭</span>
                        <h4 className="font-semibold text-gray-800">Industrias</h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(employee.industries).map(([skill, level]) => (
                          <div key={skill} className="bg-orange-50 border border-orange-200 rounded-lg p-3 shadow-sm">
                            <div className="text-center">
                              <h5 className="font-medium text-sm text-orange-900 mb-1">{skill}</h5>
                              <Badge 
                                className={cn(
                                  "text-xs font-medium",
                                  level === 'Sí' && "bg-green-100 text-green-800",
                                  level === 'No' && "bg-red-100 text-red-800"
                                )}
                              >
                                {level}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Card View */
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
            {filteredEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        )}

        {/* Bottom Pagination for Table Mode */}
        {viewMode === 'table' && (
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
        )}
      </div>
    </div>
  );
}