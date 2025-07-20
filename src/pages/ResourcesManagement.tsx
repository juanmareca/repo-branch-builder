import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Search, FileDown, Trash2, Eye, Plus, Filter, X, Settings2, RotateCcw, Edit, 
  ChevronUp, ChevronDown, ChevronsUpDown, ArrowLeft, Home, LogOut, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, GripVertical, MoreHorizontal 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ResourcesUpload from '@/components/FileUpload/ResourcesUpload';
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
  skill1: string;
  skill2: string;
  nivel_ingles: string;
  created_at: string;
  updated_at: string;
}

const ResourcesManagement = () => {
  const [resources, setResources] = useState<Person[]>([]);
  const [filteredResources, setFilteredResources] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [grupoFilter, setGrupoFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [oficinaFilter, setOficinaFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Person>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(999999);
  
  // Column management
  const [visibleColumns, setVisibleColumns] = useState({
    num_pers: true,
    nombre: true,
    fecha_incorporacion: true,
    mail_empresa: true,
    squad_lead: true,
    cex: true,
    grupo: true,
    categoria: true,
    oficina: true,
    skill1: false,
    skill2: false,
    nivel_ingles: false
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, searchTerm, squadFilter, grupoFilter, categoriaFilter, oficinaFilter, sortField, sortDirection]);

  const fetchResources = async () => {
    try {
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

  const applyFilters = () => {
    let filtered = [...resources];

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.num_pers.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.mail_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.cex.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros específicos
    if (squadFilter !== 'all') {
      filtered = filtered.filter(resource => resource.squad_lead === squadFilter);
    }
    if (grupoFilter !== 'all') {
      filtered = filtered.filter(resource => resource.grupo === grupoFilter);
    }
    if (categoriaFilter !== 'all') {
      filtered = filtered.filter(resource => resource.categoria === categoriaFilter);
    }
    if (oficinaFilter !== 'all') {
      filtered = filtered.filter(resource => resource.oficina === oficinaFilter);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    setFilteredResources(filtered);
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

  const exportToExcel = () => {
    const dataToExport = filteredResources.map(resource => ({
      'Código Empleado': resource.num_pers,
      'Nombre': resource.nombre,
      'Fecha Incorporación': resource.fecha_incorporacion,
      'Mail Empresa': resource.mail_empresa,
      'Squad Lead': resource.squad_lead,
      'CEX': resource.cex,
      'Grupo': resource.grupo,
      'Categoría': resource.categoria,
      'Oficina': resource.oficina,
      'Skill 1': resource.skill1,
      'Skill 2': resource.skill2,
      'Nivel Inglés': resource.nivel_ingles
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recursos');
    XLSX.writeFile(wb, 'recursos.xlsx');

    toast({
      title: "Exportación completada",
      description: `Se han exportado ${dataToExport.length} recursos a Excel`,
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSquadFilter('all');
    setGrupoFilter('all');
    setCategoriaFilter('all');
    setOficinaFilter('all');
    setSortField('nombre');
    setSortDirection('asc');
  };

  // Get unique values for filters
  const uniqueSquadLeads = [...new Set(resources.map(r => r.squad_lead).filter(Boolean))];
  const uniqueGrupos = [...new Set(resources.map(r => r.grupo).filter(Boolean))];
  const uniqueCategorias = [...new Set(resources.map(r => r.categoria).filter(Boolean))];
  const uniqueOficinas = [...new Set(resources.map(r => r.oficina).filter(Boolean))];

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
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
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Recursos</h1>
          </div>
          <p className="text-muted-foreground">
            Administra la información de recursos humanos y personal
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <ResourcesUpload />
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros y Búsqueda
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Limpiar Filtros
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={squadFilter} onValueChange={setSquadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Squad Lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Squad Leads</SelectItem>
                  {uniqueSquadLeads.map(squad => (
                    <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={grupoFilter} onValueChange={setGrupoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Grupos</SelectItem>
                  {uniqueGrupos.map(grupo => (
                    <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Categorías</SelectItem>
                  {uniqueCategorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={oficinaFilter} onValueChange={setOficinaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Oficina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Oficinas</SelectItem>
                  {uniqueOficinas.map(oficina => (
                    <SelectItem key={oficina} value={oficina}>{oficina}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Búsqueda: {searchTerm}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                </Badge>
              )}
              {squadFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Squad: {squadFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSquadFilter('all')} />
                </Badge>
              )}
              {grupoFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Grupo: {grupoFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setGrupoFilter('all')} />
                </Badge>
              )}
              {categoriaFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Categoría: {categoriaFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoriaFilter('all')} />
                </Badge>
              )}
              {oficinaFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Oficina: {oficinaFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setOficinaFilter('all')} />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recursos ({filteredResources.length} de {resources.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToExcel}
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    {visibleColumns.num_pers && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('num_pers')}>
                        <div className="flex items-center gap-2">
                          Código
                          {getSortIcon('num_pers')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.nombre && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('nombre')}>
                        <div className="flex items-center gap-2">
                          Nombre
                          {getSortIcon('nombre')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.fecha_incorporacion && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('fecha_incorporacion')}>
                        <div className="flex items-center gap-2">
                          Fecha Inc.
                          {getSortIcon('fecha_incorporacion')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.mail_empresa && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('mail_empresa')}>
                        <div className="flex items-center gap-2">
                          Email
                          {getSortIcon('mail_empresa')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.squad_lead && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('squad_lead')}>
                        <div className="flex items-center gap-2">
                          Squad Lead
                          {getSortIcon('squad_lead')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.cex && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('cex')}>
                        <div className="flex items-center gap-2">
                          CEX
                          {getSortIcon('cex')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.grupo && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('grupo')}>
                        <div className="flex items-center gap-2">
                          Grupo
                          {getSortIcon('grupo')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.categoria && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('categoria')}>
                        <div className="flex items-center gap-2">
                          Categoría
                          {getSortIcon('categoria')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.oficina && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('oficina')}>
                        <div className="flex items-center gap-2">
                          Oficina
                          {getSortIcon('oficina')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.skill1 && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('skill1')}>
                        <div className="flex items-center gap-2">
                          Skill 1
                          {getSortIcon('skill1')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.skill2 && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('skill2')}>
                        <div className="flex items-center gap-2">
                          Skill 2
                          {getSortIcon('skill2')}
                        </div>
                      </th>
                    )}
                    {visibleColumns.nivel_ingles && (
                      <th className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('nivel_ingles')}>
                        <div className="flex items-center gap-2">
                          Nivel Inglés
                          {getSortIcon('nivel_ingles')}
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentResources.map((resource) => (
                    <tr key={resource.id} className="border-b hover:bg-muted/50">
                      {visibleColumns.num_pers && (
                        <td className="p-3 text-sm">{resource.num_pers}</td>
                      )}
                      {visibleColumns.nombre && (
                        <td className="p-3 text-sm font-medium">{resource.nombre}</td>
                      )}
                      {visibleColumns.fecha_incorporacion && (
                        <td className="p-3 text-sm">{resource.fecha_incorporacion}</td>
                      )}
                      {visibleColumns.mail_empresa && (
                        <td className="p-3 text-sm">{resource.mail_empresa}</td>
                      )}
                      {visibleColumns.squad_lead && (
                        <td className="p-3 text-sm">{resource.squad_lead}</td>
                      )}
                      {visibleColumns.cex && (
                        <td className="p-3 text-sm">{resource.cex}</td>
                      )}
                      {visibleColumns.grupo && (
                        <td className="p-3 text-sm">{resource.grupo}</td>
                      )}
                      {visibleColumns.categoria && (
                        <td className="p-3 text-sm">{resource.categoria}</td>
                      )}
                      {visibleColumns.oficina && (
                        <td className="p-3 text-sm">{resource.oficina}</td>
                      )}
                      {visibleColumns.skill1 && (
                        <td className="p-3 text-sm">{resource.skill1}</td>
                      )}
                      {visibleColumns.skill2 && (
                        <td className="p-3 text-sm">{resource.skill2}</td>
                      )}
                      {visibleColumns.nivel_ingles && (
                        <td className="p-3 text-sm">{resource.nivel_ingles}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron recursos que coincidan con los filtros</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResourcesManagement;