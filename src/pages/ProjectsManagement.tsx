import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FolderOpen, Search, FileDown, Trash2, Eye, Plus, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipologiaFilter, setTipologiaFilter] = useState('all');
  const [clienteFilter, setClienteFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, statusFilter, tipologiaFilter, clienteFilter]);

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
        project.gestor_proyecto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filtro por tipología
    if (tipologiaFilter !== 'all') {
      filtered = filtered.filter(project => project.tipologia === tipologiaFilter);
    }

    // Filtro por cliente
    if (clienteFilter !== 'all') {
      filtered = filtered.filter(project => project.cliente === clienteFilter);
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTipologiaFilter('all');
    setClienteFilter('all');
  };

  const getUniqueValues = (field: keyof Project) => {
    return [...new Set(projects.map(project => project[field]).filter(Boolean))];
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-lg">
            <FolderOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
            <p className="text-gray-600">Administra todos los proyectos del sistema</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Cargar Proyectos
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            disabled={filteredProjects.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {showUpload && (
        <div className="mb-8">
          <ProjectsUpload />
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="planning">Planificación</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipologiaFilter} onValueChange={setTipologiaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipología" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las tipologías</SelectItem>
                {getUniqueValues('tipologia').map(tipologia => (
                  <SelectItem key={tipologia} value={tipologia}>
                    {tipologia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={clienteFilter} onValueChange={setClienteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {getUniqueValues('cliente').map(cliente => (
                  <SelectItem key={cliente} value={cliente}>
                    {cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{projects.length}</div>
            <p className="text-sm text-gray-600">Total Proyectos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {projects.filter(p => p.status === 'active').length}
            </div>
            <p className="text-sm text-gray-600">Proyectos Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {projects.filter(p => p.status === 'planning').length}
            </div>
            <p className="text-sm text-gray-600">En Planificación</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {filteredProjects.length}
            </div>
            <p className="text-sm text-gray-600">Resultados Filtrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de proyectos */}
      <Card>
        <CardHeader>
          <CardTitle>Proyectos ({filteredProjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Denominación</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Tipología</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.codigo_inicial}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.denominacion}</div>
                        {project.descripcion && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {project.descripcion}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.cliente}</div>
                        <div className="text-sm text-gray-500">{project.grupo_cliente}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.gestor_proyecto}</div>
                        <div className="text-sm text-gray-500">{project.socio_responsable}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{project.tipologia}</Badge>
                        {project.tipologia_2 && (
                          <Badge variant="outline" className="ml-1">{project.tipologia_2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
              <p className="text-gray-500">
                {projects.length === 0 
                  ? "No hay proyectos cargados en el sistema."
                  : "No se encontraron proyectos que coincidan con los filtros aplicados."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsManagement;