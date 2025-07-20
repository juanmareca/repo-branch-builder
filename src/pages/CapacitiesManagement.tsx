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
  Calendar as CalendarIcon,
  TableIcon,
  IdCard
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

const SKILL_LEVELS = ['Básico', 'Medio', 'Alto', 'Experto'];

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
  const [showFilters, setShowFilters] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

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

    setFilteredEmployees(filtered);
  }, [capacities, searchTerm, personFilter]);

  const fetchCapacities = async () => {
    try {
      const { data, error } = await supabase
        .from('capacities')
        .select('*')
        .order('person_name', { ascending: true });

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
    XLSX.writeFile(wb, 'capacidades.xlsx');

    toast({
      title: "Éxito",
      description: "Archivo Excel exportado correctamente",
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPersonFilter([]);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy');
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
                  <Badge variant="outline" className={cn(
                    level === 'Experto' ? "text-green-700 border-green-700" :
                    level === 'Alto' ? "text-blue-700 border-blue-700" :
                    level === 'Medio' ? "text-yellow-700 border-yellow-700" :
                    "text-gray-700 border-gray-700"
                  )}>
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
                  <Badge variant="outline" className={cn(
                    level === 'Experto' ? "text-green-700 border-green-700" :
                    level === 'Alto' ? "text-blue-700 border-blue-700" :
                    level === 'Medio' ? "text-yellow-700 border-yellow-700" :
                    "text-gray-700 border-gray-700"
                  )}>
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
                  <Badge variant="outline" className={cn(
                    level === 'Experto' ? "text-green-700 border-green-700" :
                    level === 'Alto' ? "text-blue-700 border-blue-700" :
                    level === 'Medio' ? "text-yellow-700 border-yellow-700" :
                    "text-gray-700 border-gray-700"
                  )}>
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
                  <Badge variant="outline" className={cn(
                    level === 'Experto' ? "text-green-700 border-green-700" :
                    level === 'Alto' ? "text-blue-700 border-blue-700" :
                    level === 'Medio' ? "text-yellow-700 border-yellow-700" :
                    "text-gray-700 border-gray-700"
                  )}>
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

  const isCardViewEnabled = personFilter.length === 1;

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
                  <h1 className="text-2xl font-bold text-foreground">
                    Gestión de Capacidades ({employeeCapacities.length})
                  </h1>
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
            
            {isCardViewEnabled && (
              <Button 
                variant="outline" 
                onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                className={cn(
                  "text-green-600 border-green-600", 
                  viewMode === 'card' && "bg-green-50"
                )}
              >
                {viewMode === 'table' ? <IdCard className="h-4 w-4 mr-2" /> : <TableIcon className="h-4 w-4 mr-2" />}
                {viewMode === 'table' ? 'Vista Compactada' : 'Vista Tabla'}
              </Button>
            )}
          </div>
        </div>

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
                <CardTitle className="text-lg">Filtros por Empleado</CardTitle>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Content - Vista de tarjetas o visual */}
        {isCardViewEnabled && viewMode === 'card' ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        ) : (
          /* Vista visual de capacidades */
          <div className="space-y-6">
            {filteredEmployees.map((employee, index) => (
              <Card key={employee.id} className="border-l-4 border-l-cyan-500">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 font-bold text-sm">
                        {index + 1}
                      </div>
                      <CardTitle className="text-lg">{employee.person_name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-cyan-50">
                        {employee.capacities.length} capacidades
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.person_name)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {/* Módulos SAP e Implantaciones */}
                    {(Object.keys(employee.sap_modules).length > 0 || Object.keys(employee.sap_implementation).length > 0) && (
                      <div>
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm font-medium mb-3 inline-block">
                          Módulos SAP e IMPLANTACIONES
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {/* Módulos SAP */}
                          {Object.entries(employee.sap_modules).map(([skill, level]) => (
                            <div key={skill} className={`px-3 py-2 rounded text-xs font-medium text-center ${
                              level === 'Básico' ? 'bg-yellow-200 text-yellow-800' :
                              level === 'Medio' ? 'bg-orange-200 text-orange-800' :
                              level === 'Alto' ? 'bg-blue-200 text-blue-800' :
                              level === 'Experto' ? 'bg-green-200 text-green-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              <div className="font-semibold">{skill}</div>
                              <div className="text-xs">{level}</div>
                            </div>
                          ))}
                          {/* Implantaciones SAP */}
                          {Object.entries(employee.sap_implementation).map(([skill, level]) => (
                            <div key={skill} className={`px-3 py-2 rounded text-xs font-medium text-center ${
                              level === 'Nulo' ? 'bg-red-200 text-red-800' :
                              level === 'Básico' ? 'bg-yellow-200 text-yellow-800' :
                              level === 'Medio' ? 'bg-orange-200 text-orange-800' :
                              level === 'Alto' ? 'bg-blue-200 text-blue-800' :
                              level === 'Experto' ? 'bg-green-200 text-green-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              <div className="font-semibold">{skill}</div>
                              <div className="text-xs">{level}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Idiomas */}
                    {Object.keys(employee.languages).length > 0 && (
                      <div>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium mb-3 inline-block">
                          IDIOMAS
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {Object.entries(employee.languages).map(([skill, level]) => (
                            <div key={skill} className={`px-3 py-2 rounded text-xs font-medium text-center ${
                              level === 'Nulo' ? 'bg-gray-200 text-gray-800' :
                              level === 'Básico' ? 'bg-yellow-200 text-yellow-800' :
                              level === 'Medio' ? 'bg-orange-200 text-orange-800' :
                              level === 'Alto' ? 'bg-blue-200 text-blue-800' :
                              level === 'Bilingüe' || level === 'Experto' ? 'bg-green-200 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              <div className="font-semibold">{skill}</div>
                              <div className="text-xs">{level}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Industrias */}
                    {Object.keys(employee.industries).length > 0 && (
                      <div>
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium mb-3 inline-block">
                          INDUSTRIAS
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {Object.entries(employee.industries).map(([skill, level]) => (
                            <div key={skill} className={`px-3 py-2 rounded text-xs font-medium text-center ${
                              level === 'No' ? 'bg-red-200 text-red-800' :
                              level === 'Sí' ? 'bg-green-200 text-green-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              <div className="font-semibold">{skill}</div>
                              <div className="text-xs">{level}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fecha de evaluación */}
                    {employee.evaluation_date && (
                      <div className="text-xs text-muted-foreground">
                        Última evaluación: {formatDate(employee.evaluation_date)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredEmployees.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay empleados registrados. Sube un archivo para comenzar.
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}