import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Eye,
  Search,
  RefreshCw,
  Download,
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Edit,
  Plus,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
  user_name: string;
  created_at: string;
  timestamp: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [operationFilter, setOperationFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los logs de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Table filter
    if (tableFilter) {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }

    // Operation filter
    if (operationFilter) {
      filtered = filtered.filter(log => log.operation === operationFilter);
    }

    // User filter
    if (userFilter) {
      filtered = filtered.filter(log => log.user_name === userFilter);
    }

    // Date filters
    if (dateFrom) {
      filtered = filtered.filter(log => new Date(log.created_at) >= dateFrom);
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.created_at) <= endOfDay);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, tableFilter, operationFilter, userFilter, dateFrom, dateTo]);

  const applyFilters = () => {
    // This function can be used to manually trigger filter application
    // For now, filtering is automatic via useEffect
    toast({
      title: "Filtros aplicados",
      description: `Se encontraron ${filteredLogs.length} registros`,
    });
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Fecha', 'Tabla', 'Operación', 'Usuario', 'Campos Modificados', 'ID'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
        log.table_name,
        log.operation,
        log.user_name,
        log.changed_fields?.length || 0,
        log.record_id
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const getOperationIcon = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'insert':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'update':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <div className="h-4 w-4 bg-red-600 rounded-full" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'insert':
        return 'Creado';
      case 'update':
        return 'Modificado';
      case 'delete':
        return 'Eliminado';
      default:
        return operation;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'insert':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getUniqueValues = (field: keyof AuditLog) => {
    return [...new Set(logs.map(log => log[field]))].filter(Boolean).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando logs de auditoría...</p>
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
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Logs de Auditoría ({logs.length})</h1>
                  <p className="text-muted-foreground">Historial completo de cambios en el sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={fetchAuditLogs} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar en logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Festivos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las tablas</SelectItem>
                    {getUniqueValues('table_name').map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={operationFilter} onValueChange={setOperationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las operaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las operaciones</SelectItem>
                    {getUniqueValues('operation').map(operation => (
                      <SelectItem key={operation} value={operation}>{getOperationLabel(operation)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los usuarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los usuarios</SelectItem>
                    {getUniqueValues('user_name').map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha desde:</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/mm/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Fecha hasta:</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/mm/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleLogExpansion(log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getOperationIcon(log.operation)}
                        <Badge className={cn("text-xs", getOperationColor(log.operation))}>
                          {getOperationLabel(log.operation)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          📁 {log.table_name}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        ID: {log.record_id.substring(0, 8)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          {log.user_name}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), 'dd/MM/yyyy, HH:mm:ss')}
                        </div>
                      </div>
                      
                      {log.operation.toLowerCase() === 'update' && log.changed_fields && (
                        <Badge variant="secondary" className="text-xs">
                          📝 {log.changed_fields.length} campo(s) modificado(s)
                        </Badge>
                      )}

                      <Button variant="ghost" size="sm" className="p-1">
                        <span className="text-xs mr-1">Detalles</span>
                        {expandedLogs.includes(log.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedLogs.includes(log.id) && (
                  <div className="border-t bg-muted/20 p-4">
                    <div className="space-y-4">
                      {log.operation.toLowerCase() === 'update' && log.changed_fields && log.changed_fields.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-3">Campos modificados:</h4>
                          <div className="space-y-2">
                            {log.changed_fields.map((field) => (
                              <div key={field} className="bg-background rounded p-3 border">
                                <div className="font-medium text-sm mb-2">{field}:</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-red-600 font-medium">Anterior:</span>
                                    <div className="bg-red-50 p-2 rounded mt-1 text-red-800">
                                      {log.old_values?.[field] || 'N/A'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-green-600 font-medium">Nuevo:</span>
                                    <div className="bg-green-50 p-2 rounded mt-1 text-green-800">
                                      {log.new_values?.[field] || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        <p>ID de Sesión: {log.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No hay logs de auditoría</h3>
            <p className="text-muted-foreground">No se encontraron logs que coincidan con los filtros seleccionados.</p>
          </div>
        )}

        {/* System Status */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Sistema de Auditoría Activo</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Todos los cambios se registran automáticamente con fecha y hora</p>
              <p>• Se guardan los valores anteriores y nuevos para cada modificación</p>
              <p>• Los logs incluyen información del usuario que realizó el cambio</p>
              <p>• Puedes exportar logs por rango de fechas para auditorías</p>
              <p>• Los registros de auditoría no se pueden modificar ni eliminar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditLogs;