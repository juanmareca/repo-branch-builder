import React, { useState, useEffect } from "react";
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
  Calendar as CalendarIcon
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

type SortField = keyof Capacity;
type SortDirection = 'asc' | 'desc' | null;

const SKILL_LEVELS = ['Básico', 'Medio', 'Alto', 'Experto'];
const SKILL_BLOCKS = ['Módulo SAP', 'Implantación SAP', 'Idiomas', 'Industrias'];

export default function CapacitiesManagement() {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [filteredCapacities, setFilteredCapacities] = useState<Capacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [personFilter, setPersonFilter] = useState<string[]>([]);
  const [skillFilter, setSkillFilter] = useState<string[]>([]);
  const [levelFilter, setLevelFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    person_name: true,
    skill: true,
    level: true,
    certification: true,
    evaluation_date: true,
    comments: true
  });

  // Form state
  const [formData, setFormData] = useState({
    person_name: '',
    skill: '',
    level: '',
    certification: '',
    comments: '',
    evaluation_date: undefined as Date | undefined
  });

  useEffect(() => {
    fetchCapacities();
  }, []);

  useEffect(() => {
    let filtered = capacities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(capacity =>
        capacity.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        capacity.skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Person filter
    if (personFilter.length > 0) {
      filtered = filtered.filter(capacity => personFilter.includes(capacity.person_name));
    }

    // Skill filter
    if (skillFilter.length > 0) {
      filtered = filtered.filter(capacity => skillFilter.includes(capacity.skill));
    }

    // Level filter
    if (levelFilter.length > 0) {
      filtered = filtered.filter(capacity => levelFilter.includes(capacity.level));
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];
        
        // Handle date sorting
        if (sortField === 'evaluation_date') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else {
          // Convert to string for comparison
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }
        
        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    setFilteredCapacities(filtered);
  }, [capacities, searchTerm, personFilter, skillFilter, levelFilter, sortField, sortDirection]);

  const fetchCapacities = async () => {
    try {
      const { data, error } = await supabase
        .from('capacities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCapacities(data || []);
    } catch (error) {
      console.error('Error fetching capacities:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las capacidades",
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

  const handleUpdateCapacity = async (id: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('capacities')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Capacidad actualizada correctamente",
      });

      fetchCapacities();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la capacidad",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCapacity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('capacities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Capacidad eliminada correctamente",
      });

      fetchCapacities();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la capacidad",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredCapacities.map((capacity, index) => ({
      'ÍNDICE': index + 1,
      'EMPLEADO': capacity.person_name,
      'CAPACIDAD': capacity.skill,
      'NIVEL': capacity.level,
      'CERTIFICACIÓN': capacity.certification,
      'FECHA EVALUACIÓN': capacity.evaluation_date ? format(new Date(capacity.evaluation_date), 'dd/MM/yyyy') : '',
      'COMENTARIOS': capacity.comments
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Capacidades');
    XLSX.writeFile(wb, 'capacidades.xlsx');

    toast({
      title: "Éxito",
      description: "Archivo Excel exportado correctamente",
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPersonFilter([]);
    setSkillFilter([]);
    setLevelFilter([]);
  };

  const toggleFilter = (filterArray: string[], value: string, setFilter: (arr: string[]) => void) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(item => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const getUniqueValues = (field: keyof Capacity) => {
    return [...new Set(capacities.map(capacity => capacity[field]).filter(Boolean))].sort();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambiar dirección
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nuevo campo, empezar con ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

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
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Zap className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gestión de Capacidades ({capacities.length})</h1>
                  <p className="text-muted-foreground">Administra las capacidades y habilidades del personal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              >
                <Home className="h-4 w-4" />
                Panel de Administración
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
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
                    <Label htmlFor="skill">Capacidad *</Label>
                    <Input
                      id="skill"
                      placeholder="Nombre de la capacidad"
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

                  <div>
                    <Label htmlFor="comments">Comentarios</Label>
                    <Input
                      id="comments"
                      placeholder="Comentarios adicionales"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                    />
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

            <Button variant="outline" className="text-cyan-600 border-cyan-600 hover:bg-cyan-50" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>

            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              {showUpload ? 'Ocultar Carga' : 'Cargar Archivo'}
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar capacidades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cargar Archivo de Capacidades</CardTitle>
              <CardDescription>
                Sube un archivo Excel con las capacidades de los empleados organizadas por bloques de conocimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CapacitiesUpload onUploadComplete={fetchCapacities} />
            </CardContent>
          </Card>
        )}

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
                {/* Person Filter */}
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

                {/* Skill Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Capacidad</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('skill').map(skill => (
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

                {/* Level Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Nivel</Label>
                  <div className="space-y-2 border rounded-md p-2">
                    {getUniqueValues('level').map(level => (
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
                        <Badge key={level} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {level}
                          <button 
                            onClick={() => toggleFilter(levelFilter, level, setLevelFilter)}
                            className="ml-1 hover:bg-green-200 rounded-full p-0.5"
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
        {showColumns && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Gestión de Columnas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(visibleColumns).map(([column, visible]) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`column-${column}`}
                      checked={visible}
                      onCheckedChange={(checked) => 
                        setVisibleColumns(prev => ({ ...prev, [column]: !!checked }))
                      }
                    />
                    <label htmlFor={`column-${column}`} className="text-sm capitalize">
                      {column.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Checkbox id="save-default" />
                <label htmlFor="save-default" className="text-sm text-muted-foreground">
                  Guardar como vista por defecto
                </label>
                <Button variant="outline" size="sm" className="ml-4">
                  Resetear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 py-2">ÍNDICE</TableHead>
                  {visibleColumns.person_name && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('person_name')}
                    >
                      <div className="flex items-center justify-between">
                        <span>EMPLEADO</span>
                        {getSortIcon('person_name')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.skill && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('skill')}
                    >
                      <div className="flex items-center justify-between">
                        <span>CAPACIDAD</span>
                        {getSortIcon('skill')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.level && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('level')}
                    >
                      <div className="flex items-center justify-between">
                        <span>NIVEL</span>
                        {getSortIcon('level')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.certification && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('certification')}
                    >
                      <div className="flex items-center justify-between">
                        <span>CERTIFICACIÓN</span>
                        {getSortIcon('certification')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.evaluation_date && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('evaluation_date')}
                    >
                      <div className="flex items-center justify-between">
                        <span>FECHA EVALUACIÓN</span>
                        {getSortIcon('evaluation_date')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.comments && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('comments')}
                    >
                      <div className="flex items-center justify-between">
                        <span>COMENTARIOS</span>
                        {getSortIcon('comments')}
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="w-24 py-2">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCapacities.map((capacity, index) => (
                  <TableRow key={capacity.id}>
                    <TableCell className="font-medium py-2">{index + 1}</TableCell>
                    {visibleColumns.person_name && (
                      <TableCell className="py-2">
                        {editingRow === capacity.id ? (
                          <Input
                            defaultValue={capacity.person_name}
                            onBlur={(e) => handleUpdateCapacity(capacity.id, 'person_name', e.target.value)}
                          />
                        ) : (
                          capacity.person_name
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.skill && (
                      <TableCell className="py-2">
                        {editingRow === capacity.id ? (
                          <Input
                            defaultValue={capacity.skill}
                            onBlur={(e) => handleUpdateCapacity(capacity.id, 'skill', e.target.value)}
                          />
                        ) : (
                          capacity.skill
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.level && (
                      <TableCell className="py-2">
                        {editingRow === capacity.id ? (
                          <Select 
                            defaultValue={capacity.level}
                            onValueChange={(value) => handleUpdateCapacity(capacity.id, 'level', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SKILL_LEVELS.map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={cn(
                            capacity.level === 'Experto' ? "text-green-700 border-green-700" :
                            capacity.level === 'Alto' ? "text-blue-700 border-blue-700" :
                            capacity.level === 'Medio' ? "text-yellow-700 border-yellow-700" :
                            "text-gray-700 border-gray-700"
                          )}>
                            {capacity.level}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.certification && (
                      <TableCell className="py-2">
                        {editingRow === capacity.id ? (
                          <Input
                            defaultValue={capacity.certification}
                            onBlur={(e) => handleUpdateCapacity(capacity.id, 'certification', e.target.value)}
                          />
                        ) : (
                          capacity.certification
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.evaluation_date && (
                      <TableCell className="py-2">
                        {editingRow === capacity.id ? (
                          <Input
                            type="date"
                            defaultValue={capacity.evaluation_date}
                            onBlur={(e) => handleUpdateCapacity(capacity.id, 'evaluation_date', e.target.value)}
                            className="w-auto"
                          />
                        ) : (
                          formatDate(capacity.evaluation_date)
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.comments && (
                      <TableCell className="py-2">
                        {editingRow === capacity.id ? (
                          <Input
                            defaultValue={capacity.comments}
                            onBlur={(e) => handleUpdateCapacity(capacity.id, 'comments', e.target.value)}
                          />
                        ) : (
                          capacity.comments
                        )}
                      </TableCell>
                    )}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRow(editingRow === capacity.id ? null : capacity.id)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCapacity(capacity.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCapacities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No hay capacidades registradas. Sube un archivo para comenzar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}