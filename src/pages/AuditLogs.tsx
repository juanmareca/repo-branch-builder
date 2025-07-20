import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye,
  Search,
  RefreshCw,
  Download,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Edit,
  Plus,
  Info,
  Home,
  LogOut,
  Shield,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
  user_name: string;
  user_id: string;
  session_id: string;
  created_at: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [operationFilter, setOperationFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

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
        log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.record_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Table filter
    if (tableFilter && tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }

    // Operation filter
    if (operationFilter && operationFilter !== 'all') {
      filtered = filtered.filter(log => log.operation.toLowerCase() === operationFilter.toLowerCase());
    }

    // User filter
    if (userFilter && userFilter !== 'all') {
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
    toast({
      title: "Filtros aplicados",
      description: `Se encontraron ${filteredLogs.length} registros`,
    });
  };

  const exportToExcel = () => {
    const dataToExport = filteredLogs.map(log => ({
      'Fecha': format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      'Tabla': log.table_name,
      'Operación': getOperationLabel(log.operation),
      'Usuario': log.user_name,
      'Registro ID': log.record_id,
      'Campos Modificados': log.changed_fields?.length || 0,
      'ID Sesión': log.session_id
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Logs');
    XLSX.writeFile(wb, `audit_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);

    toast({
      title: "Exportación completada",
      description: `Se han exportado ${dataToExport.length} registros a Excel`,
    });
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
        return <Trash2 className="h-4 w-4 text-red-600" />;
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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'update':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delete':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUniqueValues = (field: keyof AuditLog) => {
    return [...new Set(logs.map(log => log[field]))].filter(Boolean).sort();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTableFilter('all');
    setOperationFilter('all');
    setUserFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
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
      <div className="container mx-auto px-6 py-8 max-w-7xl">
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
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Logs de Auditoría ({filteredLogs.length})</h1>
                <p className="text-muted-foreground">Historial completo de cambios en el sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchAuditLogs} variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={exportToExcel} variant="outline" className="bg-green-600 text-white hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Sistema de Auditoría Activo */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="text-blue-800">
              <h3 className="font-semibold mb-2">🔍 Sistema de Auditoría Activo</h3>
              <ul className="space-y-1 text-sm">
                <li>• Todos los cambios se registran automáticamente con fecha y hora</li>
                <li>• Se guardan los valores anteriores y nuevos para cada modificación</li>
                <li>• Los logs incluyen información del usuario que realizó el cambio</li>
                <li>• Puedes exportar logs por rango de fechas para auditorías</li>
                <li>• Los registros de auditoría no se pueden modificar ni eliminar</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Filtros de Búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filtros de Búsqueda</span>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    <SelectValue placeholder="Todas las tablas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tablas</SelectItem>
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
                    <SelectItem value="all">Todas las operaciones</SelectItem>
                    <SelectItem value="insert">Creado</SelectItem>
                    <SelectItem value="update">Modificado</SelectItem>
                    <SelectItem value="delete">Eliminado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los usuarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    {getUniqueValues('user_name').map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
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
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full bg-blue-600 hover:bg-blue-700">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron logs que coincidan con los filtros</p>
              </CardContent>
            </Card>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleLogExpansion(log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getOperationIcon(log.operation)}
                          <Badge className={cn("text-xs border", getOperationColor(log.operation))}>
                            {getOperationLabel(log.operation)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            📁 {log.table_name}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          ID: {log.record_id.length > 16 ? `${log.record_id.substring(0, 8)}...` : log.record_id}
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
                        
                        {log.operation.toLowerCase() === 'update' && log.changed_fields && log.changed_fields.length > 0 && (
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
                    <div className="border-t bg-muted/20 p-6">
                      <div className="space-y-6">
                        {log.operation.toLowerCase() === 'update' && log.changed_fields && log.changed_fields.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-base mb-3 text-blue-800">Campos modificados:</h4>
                            <div className="space-y-3">
                              {log.changed_fields.map((field) => (
                                <div key={field} className="bg-background rounded-lg p-4 border">
                                  <div className="font-medium text-sm mb-3 text-gray-700">{field}:</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium text-red-600">Anterior:</span>
                                      <div className="bg-red-50 border border-red-200 p-3 rounded-md mt-2">
                                        <span className="text-red-800 line-through">
                                          {log.old_values?.[field] !== null && log.old_values?.[field] !== undefined 
                                            ? String(log.old_values[field]) 
                                            : 'N/A'
                                          }
                                        </span>
                                      </div>
                                    </div>
                                    <div>
                                      <span className="font-medium text-green-600">Nuevo:</span>
                                      <div className="bg-green-50 border border-green-200 p-3 rounded-md mt-2">
                                        <span className="text-green-800 font-medium">
                                          {log.new_values?.[field] !== null && log.new_values?.[field] !== undefined 
                                            ? String(log.new_values[field]) 
                                            : 'N/A'
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.operation.toLowerCase() === 'insert' && log.new_values && (
                          <div>
                            <h4 className="font-semibold text-base mb-3 text-green-800">Valores creados:</h4>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {Object.entries(log.new_values).map(([key, value]) => (
                                  <div key={key} className="flex justify-between border-b border-green-200 pb-1">
                                    <span className="font-medium text-green-700">{key}:</span>
                                    <span className="text-green-800">
                                      {value !== null && value !== undefined ? String(value) : 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {log.operation.toLowerCase() === 'delete' && log.old_values && (
                          <div>
                            <h4 className="font-semibold text-base mb-3 text-red-800">Valores eliminados:</h4>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {Object.entries(log.old_values).map(([key, value]) => (
                                  <div key={key} className="flex justify-between border-b border-red-200 pb-1">
                                    <span className="font-medium text-red-700">{key}:</span>
                                    <span className="text-red-800 line-through">
                                      {value !== null && value !== undefined ? String(value) : 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {log.session_id && (
                          <div className="text-xs text-muted-foreground border-t pt-3">
                            <div className="flex items-center justify-between">
                              <span>ID de Sesión: {log.session_id}</span>
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Información del Sistema */}
        <Alert className="mt-8 border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <Shield className="h-4 w-4 text-white" />
          <AlertDescription>
            <div className="text-white">
              <h3 className="font-semibold mb-2">⚡ Sistema de Auditoría y Trazabilidad Completa</h3>
              <p className="text-blue-100 text-sm">
                Registro completo de todos los cambios realizados en el sistema. Auditoría detallada con valores anteriores y nuevos, 
                usuario responsable y timestamp exacto en horario de Madrid - UTC+2 (Horario de Verano).
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AuditLogs;