import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CapacitiesUpload from "@/components/FileUpload/CapacitiesUpload";

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

export default function CapacitiesManagement() {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCapacities();
  }, []);

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

  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc';
    
    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }
    
    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);
    
    if (newDirection) {
      const sortedData = [...capacities].sort((a, b) => {
        const aValue = a[field] || '';
        const bValue = b[field] || '';
        
        if (newDirection === 'asc') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });
      setCapacities(sortedData);
    } else {
      fetchCapacities();
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    
    if (sortDirection === 'asc') {
      return <ChevronUp className="ml-2 h-4 w-4" />;
    } else if (sortDirection === 'desc') {
      return <ChevronDown className="ml-2 h-4 w-4" />;
    }
    
    return <ChevronsUpDown className="ml-2 h-4 w-4" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando capacidades...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold">Gestión de Capacidades</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
          >
            Panel de Administración
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Salir
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">
          {capacities.length} capacidades registradas
        </p>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {showUpload ? 'Ocultar Carga' : 'Cargar Archivo'}
        </Button>
      </div>

      {showUpload && (
        <Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Capacidades</CardTitle>
          <CardDescription>
            Capacidades registradas en el sistema por empleado y área de conocimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="py-2 cursor-pointer hover:bg-muted/50 select-none resize-column"
                    onClick={() => handleSort('person_name')}
                  >
                    <div className="flex items-center">
                      Empleado
                      {getSortIcon('person_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-2 cursor-pointer hover:bg-muted/50 select-none resize-column"
                    onClick={() => handleSort('skill')}
                  >
                    <div className="flex items-center">
                      Capacidad
                      {getSortIcon('skill')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-2 cursor-pointer hover:bg-muted/50 select-none resize-column"
                    onClick={() => handleSort('level')}
                  >
                    <div className="flex items-center">
                      Nivel
                      {getSortIcon('level')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-2 cursor-pointer hover:bg-muted/50 select-none resize-column"
                    onClick={() => handleSort('certification')}
                  >
                    <div className="flex items-center">
                      Certificación
                      {getSortIcon('certification')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-2 cursor-pointer hover:bg-muted/50 select-none resize-column"
                    onClick={() => handleSort('evaluation_date')}
                  >
                    <div className="flex items-center">
                      Fecha Evaluación
                      {getSortIcon('evaluation_date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="py-2 cursor-pointer hover:bg-muted/50 select-none resize-column"
                    onClick={() => handleSort('comments')}
                  >
                    <div className="flex items-center">
                      Comentarios
                      {getSortIcon('comments')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacities.map((capacity) => (
                  <TableRow key={capacity.id}>
                    <TableCell className="py-2 font-medium">{capacity.person_name}</TableCell>
                    <TableCell className="py-2">{capacity.skill}</TableCell>
                    <TableCell className="py-2">{capacity.level}</TableCell>
                    <TableCell className="py-2">{capacity.certification}</TableCell>
                    <TableCell className="py-2">{formatDate(capacity.evaluation_date)}</TableCell>
                    <TableCell className="py-2">{capacity.comments}</TableCell>
                  </TableRow>
                ))}
                {capacities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No hay capacidades registradas. Sube un archivo para comenzar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}