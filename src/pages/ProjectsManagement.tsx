import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderOpen, Search, FileDown, Trash2, Eye, Plus, Filter, X, Settings2, RotateCcw, Edit, ChevronUp, ChevronDown, ChevronsUpDown, ArrowLeft, Home, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ProjectsUpload from '@/components/FileUpload/ProjectsUpload';
import * as XLSX from 'xlsx';

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
  status: string;
  created_at: string;
}

const ProjectsManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tipologiaFilter, setTipologiaFilter] = useState<string[]>([]);
  const [clienteFilter, setClienteFilter] = useState<string[]>([]);
  const [gestorFilter, setGestorFilter] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Project | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    codigo_inicial: true,
    denominacion: true,
    descripcion: true,
    cliente: true,
    grupo_cliente: true,
    gestor_proyecto: true,
    socio_responsable: true,
    tipologia: true,
    tipologia_2: true,
    status: true
  });

  // Form state for adding new projects
  const [formData, setFormData] = useState({
    codigo_inicial: '',
    denominacion: '',
    descripcion: '',
    cliente: '',
    grupo_cliente: '',
    gestor_proyecto: '',
    socio_responsable: '',
    tipologia: '',
    tipologia_2: '',
    status: 'planning'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, statusFilter, tipologiaFilter, clienteFilter, gestorFilter]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los proyectos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Filtro de búsqueda
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

    // Filtros por arrays
    if (statusFilter.length > 0) {
      filtered = filtered.filter(project => statusFilter.includes(project.status));
    }

    if (tipologiaFilter.length > 0) {
      filtered = filtered.filter(project => tipologiaFilter.includes(project.tipologia));
    }

    if (clienteFilter.length > 0) {
      filtered = filtered.filter(project => clienteFilter.includes(project.cliente));
    }

    if (gestorFilter.length > 0) {
      filtered = filtered.filter(project => gestorFilter.includes(project.gestor_proyecto));
    }

    // Aplicar ordenamiento
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue = a[sortField] || '';
        let bValue = b[sortField] || '';
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado correctamente.",
      });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredProjects.map(project => ({
      'Código Inicial': project.codigo_inicial,
      'Denominación': project.denominacion,
      'Descripción': project.descripcion,
      'Cliente': project.cliente,
      'Grupo Cliente': project.grupo_cliente,
      'Gestor Proyecto': project.gestor_proyecto,
      'Socio Responsable': project.socio_responsable,
      'Tipología': project.tipologia,
      'Tipología 2': project.tipologia_2,
      'Estado': project.status,
      'Fecha Creación': new Date(project.created_at).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');
    XLSX.writeFile(wb, `proyectos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleAddProject = async () => {
    if (!formData.codigo_inicial || !formData.denominacion || !formData.cliente) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          codigo_inicial: formData.codigo_inicial,
          denominacion: formData.denominacion,
          descripcion: formData.descripcion,
          cliente: formData.cliente,
          grupo_cliente: formData.grupo_cliente,
          gestor_proyecto: formData.gestor_proyecto,
          socio_responsable: formData.socio_responsable,
          tipologia: formData.tipologia,
          tipologia_2: formData.tipologia_2,
          status: formData.status
        });

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
        tipologia_2: '',
        status: 'planning'
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter([]);
    setTipologiaFilter([]);
    setClienteFilter([]);
    setGestorFilter([]);
  };

  const toggleFilter = (filterArray: string[], value: string, setFilter: (arr: string[]) => void) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(item => item !== value));
    } else {
      setFilter([...filterArray, value]);
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
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const getUniqueValues = (field: keyof Project) => {
    return [...new Set(projects.map(project => project[field]).filter(Boolean))].sort();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando proyectos...</p>
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gestión de Proyectos ({projects.length})</h1>
                  <p className="text-muted-foreground">Administra todos los proyectos del sistema</p>
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
                  // Reset authentication and navigate to login
                  window.location.href = '/';
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
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Proyecto</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div>
                    <Label>Código Inicial *</Label>
                    <Input
                      value={formData.codigo_inicial}
                      onChange={(e) => setFormData(prev => ({ ...prev, codigo_inicial: e.target.value }))}
                      placeholder="Código del proyecto"
                    />
                  </div>
                  <div>
                    <Label>Denominación *</Label>
                    <Input
                      value={formData.denominacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, denominacion: e.target.value }))}
                      placeholder="Nombre del proyecto"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripción del proyecto"
                    />
                  </div>
                  <div>
                    <Label>Cliente *</Label>
                    <Input
                      value={formData.cliente}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  <div>
                    <Label>Grupo Cliente</Label>
                    <Input
                      value={formData.grupo_cliente}
                      onChange={(e) => setFormData(prev => ({ ...prev, grupo_cliente: e.target.value }))}
                      placeholder="Grupo del cliente"
                    />
                  </div>
                  <div>
                    <Label>Gestor Proyecto</Label>
                    <Input
                      value={formData.gestor_proyecto}
                      onChange={(e) => setFormData(prev => ({ ...prev, gestor_proyecto: e.target.value }))}
                      placeholder="Gestor del proyecto"
                    />
                  </div>
                  <div>
                    <Label>Socio Responsable</Label>
                    <Input
                      value={formData.socio_responsable}
                      onChange={(e) => setFormData(prev => ({ ...prev, socio_responsable: e.target.value }))}
                      placeholder="Socio responsable"
                    />
                  </div>
                  <div>
                    <Label>Tipología</Label>
                    <Input
                      value={formData.tipologia}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipologia: e.target.value }))}
                      placeholder="Tipología del proyecto"
                    />
                  </div>
                  <div>
                    <Label>Tipología 2</Label>
                    <Input
                      value={formData.tipologia_2}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipologia_2: e.target.value }))}
                      placeholder="Tipología secundaria"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddProject}>
                    Agregar Proyecto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Cargar Excel
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={filteredProjects.length === 0}
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              <FileDown className="h-4 w-4 mr-2" />
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
            <ProjectsUpload />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar proyectos..."
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Estado Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Estado</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('status').map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={() => toggleFilter(statusFilter, status, setStatusFilter)}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm">{status}</label>
                      </div>
                    ))}
                  </div>
                  {statusFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {statusFilter.map(status => (
                        <Badge key={status} variant="secondary" className="text-xs">
                          {status}
                          <button 
                            onClick={() => toggleFilter(statusFilter, status, setStatusFilter)}
                            className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cliente Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Cliente</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('cliente').map(cliente => (
                      <div key={cliente} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cliente-${cliente}`}
                          checked={clienteFilter.includes(cliente)}
                          onCheckedChange={() => toggleFilter(clienteFilter, cliente, setClienteFilter)}
                        />
                        <label htmlFor={`cliente-${cliente}`} className="text-sm">{cliente}</label>
                      </div>
                    ))}
                  </div>
                  {clienteFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {clienteFilter.map(cliente => (
                        <Badge key={cliente} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {cliente}
                          <button 
                            onClick={() => toggleFilter(clienteFilter, cliente, setClienteFilter)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tipología Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipología</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('tipologia').map(tipologia => (
                      <div key={tipologia} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tipologia-${tipologia}`}
                          checked={tipologiaFilter.includes(tipologia)}
                          onCheckedChange={() => toggleFilter(tipologiaFilter, tipologia, setTipologiaFilter)}
                        />
                        <label htmlFor={`tipologia-${tipologia}`} className="text-sm">{tipologia}</label>
                      </div>
                    ))}
                  </div>
                  {tipologiaFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tipologiaFilter.map(tipologia => (
                        <Badge key={tipologia} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {tipologia}
                          <button 
                            onClick={() => toggleFilter(tipologiaFilter, tipologia, setTipologiaFilter)}
                            className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Gestor Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Gestor Proyecto</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {getUniqueValues('gestor_proyecto').map(gestor => (
                      <div key={gestor} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`gestor-${gestor}`}
                          checked={gestorFilter.includes(gestor)}
                          onCheckedChange={() => toggleFilter(gestorFilter, gestor, setGestorFilter)}
                        />
                        <label htmlFor={`gestor-${gestor}`} className="text-sm">{gestor}</label>
                      </div>
                    ))}
                  </div>
                  {gestorFilter.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {gestorFilter.map(gestor => (
                        <Badge key={gestor} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                          {gestor}
                          <button 
                            onClick={() => toggleFilter(gestorFilter, gestor, setGestorFilter)}
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
        {showColumns && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Gestión de Columnas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                  {visibleColumns.codigo_inicial && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('codigo_inicial')}
                    >
                      <div className="flex items-center justify-between">
                        <span>CÓDIGO</span>
                        {getSortIcon('codigo_inicial')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.denominacion && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('denominacion')}
                    >
                      <div className="flex items-center justify-between">
                        <span>DENOMINACIÓN</span>
                        {getSortIcon('denominacion')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.descripcion && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('descripcion')}
                    >
                      <div className="flex items-center justify-between">
                        <span>DESCRIPCIÓN</span>
                        {getSortIcon('descripcion')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.cliente && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('cliente')}
                    >
                      <div className="flex items-center justify-between">
                        <span>CLIENTE</span>
                        {getSortIcon('cliente')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.grupo_cliente && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('grupo_cliente')}
                    >
                      <div className="flex items-center justify-between">
                        <span>GRUPO CLIENTE</span>
                        {getSortIcon('grupo_cliente')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.gestor_proyecto && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('gestor_proyecto')}
                    >
                      <div className="flex items-center justify-between">
                        <span>GESTOR PROYECTO</span>
                        {getSortIcon('gestor_proyecto')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.socio_responsable && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('socio_responsable')}
                    >
                      <div className="flex items-center justify-between">
                        <span>SOCIO RESPONSABLE</span>
                        {getSortIcon('socio_responsable')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.tipologia && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('tipologia')}
                    >
                      <div className="flex items-center justify-between">
                        <span>TIPOLOGÍA</span>
                        {getSortIcon('tipologia')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.tipologia_2 && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('tipologia_2')}
                    >
                      <div className="flex items-center justify-between">
                        <span>TIPOLOGÍA 2</span>
                        {getSortIcon('tipologia_2')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.status && (
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center justify-between">
                        <span>ESTADO</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="w-24 py-2">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project, index) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium py-2">{index + 1}</TableCell>
                    {visibleColumns.codigo_inicial && (
                      <TableCell className="py-2">
                        {editingRow === project.id ? (
                          <Input
                            defaultValue={project.codigo_inicial}
                            onBlur={(e) => handleUpdateProject(project.id, 'codigo_inicial', e.target.value)}
                            className="w-auto"
                          />
                        ) : (
                          project.codigo_inicial
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.denominacion && (
                      <TableCell className="py-2">
                        {editingRow === project.id ? (
                          <Input
                            defaultValue={project.denominacion}
                            onBlur={(e) => handleUpdateProject(project.id, 'denominacion', e.target.value)}
                          />
                        ) : (
                          project.denominacion
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.descripcion && (
                      <TableCell className="py-2 max-w-xs">
                        {editingRow === project.id ? (
                          <Textarea
                            defaultValue={project.descripcion || ''}
                            onBlur={(e) => handleUpdateProject(project.id, 'descripcion', e.target.value)}
                            className="min-h-[60px]"
                          />
                        ) : (
                          <div className="truncate" title={project.descripcion}>
                            {project.descripcion}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.cliente && <TableCell className="py-2">{project.cliente}</TableCell>}
                    {visibleColumns.grupo_cliente && <TableCell className="py-2">{project.grupo_cliente}</TableCell>}
                    {visibleColumns.gestor_proyecto && <TableCell className="py-2">{project.gestor_proyecto}</TableCell>}
                    {visibleColumns.socio_responsable && <TableCell className="py-2">{project.socio_responsable}</TableCell>}
                    {visibleColumns.tipologia && <TableCell className="py-2">{project.tipologia}</TableCell>}
                    {visibleColumns.tipologia_2 && <TableCell className="py-2">{project.tipologia_2}</TableCell>}
                    {visibleColumns.status && (
                      <TableCell className="py-2">
                        <Badge 
                          variant="outline" 
                          className={cn(getStatusBadgeColor(project.status))}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingRow(editingRow === project.id ? null : project.id)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsManagement;