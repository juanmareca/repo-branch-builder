import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Database,
  Search,
  RefreshCw,
  Download,
  Eye,
  Trash2,
  ArrowLeft,
  Filter,
  Home,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Backup {
  id: string;
  table_name: string;
  file_name: string;
  created_at: string;
  record_count: number;
  file_size: string;
  created_by: string;
  backup_data: any;
}

const BackupsManagement = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [filteredBackups, setFilteredBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedBackups, setSelectedBackups] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBackups(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los backups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  useEffect(() => {
    let filtered = backups;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(backup =>
        backup.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        backup.table_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(backup => backup.table_name === typeFilter);
    }

    setFilteredBackups(filtered);
  }, [backups, searchTerm, typeFilter]);

  const handleDownloadBackup = async (backup: Backup) => {
    try {
      const dataStr = JSON.stringify(backup.backup_data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Éxito",
        description: "Backup descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el backup",
        variant: "destructive",
      });
    }
  };

  const handleViewBackup = (backup: Backup) => {
    // Open a modal or new window to view backup content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Backup: ${backup.file_name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>Backup: ${backup.file_name}</h1>
            <p><strong>Tabla:</strong> ${backup.table_name}</p>
            <p><strong>Fecha:</strong> ${format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm:ss')}</p>
            <p><strong>Registros:</strong> ${backup.record_count}</p>
            <p><strong>Tamaño:</strong> ${backup.file_size}</p>
            <h2>Datos:</h2>
            <pre>${JSON.stringify(backup.backup_data, null, 2)}</pre>
          </body>
        </html>
      `);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este backup?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Backup eliminado correctamente",
      });

      fetchBackups();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el backup",
        variant: "destructive",
      });
    }
  };

  const toggleBackupSelection = (id: string) => {
    setSelectedBackups(prev => 
      prev.includes(id) 
        ? prev.filter(backupId => backupId !== id)
        : [...prev, id]
    );
  };

  const getTypeColor = (tableName: string) => {
    const colors = {
      holidays: 'bg-yellow-100 text-yellow-700',
      projects: 'bg-purple-100 text-purple-700',
      persons: 'bg-blue-100 text-blue-700',
      capacities: 'bg-cyan-100 text-cyan-700'
    };
    return colors[tableName as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (tableName: string) => {
    const labels = {
      holidays: 'Festivos',
      projects: 'Proyectos', 
      persons: 'Personas',
      capacities: 'Capacidades'
    };
    return labels[tableName as keyof typeof labels] || tableName;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando backups...</p>
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
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Database className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gestión de Backups</h1>
                  <p className="text-muted-foreground">Administra y descarga copias de seguridad de tus datos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchBackups} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
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
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar backups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="persons">Personas</SelectItem>
                <SelectItem value="projects">Proyectos</SelectItem>
                <SelectItem value="holidays">Festivos</SelectItem>
                <SelectItem value="capacities">Capacidades</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 py-2">
                    <Checkbox
                      checked={selectedBackups.length === filteredBackups.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBackups(filteredBackups.map(b => b.id));
                        } else {
                          setSelectedBackups([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="py-2">ARCHIVO</TableHead>
                  <TableHead className="py-2">TIPO</TableHead>
                  <TableHead className="py-2">FECHA DE CREACIÓN</TableHead>
                  <TableHead className="py-2">TAMAÑO</TableHead>
                  <TableHead className="py-2">REGISTROS</TableHead>
                  <TableHead className="w-32 py-2">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBackups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="py-2">
                      <Checkbox
                        checked={selectedBackups.includes(backup.id)}
                        onCheckedChange={() => toggleBackupSelection(backup.id)}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{backup.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Tabla: {backup.table_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={cn("text-xs", getTypeColor(backup.table_name))}>
                        📁 {getTypeLabel(backup.table_name)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        📅 {format(new Date(backup.created_at), 'dd/MM/yyyy, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">{backup.file_size}</TableCell>
                    <TableCell className="font-mono py-2">{backup.record_count}</TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBackup(backup)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
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

        {filteredBackups.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No hay backups</h3>
            <p className="text-muted-foreground">No se encontraron backups que coincidan con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupsManagement;