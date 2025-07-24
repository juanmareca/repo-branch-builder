import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, RotateCcw, Settings, Shield, Clock, Palette, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/constants';

interface ConfigurationData {
  auth: {
    adminUsername: string;
    adminPassword: string;
  };
  work: {
    defaultHoursPerDay: number;
    defaultPercentage: number;
    defaultAssignmentType: string;
    defaultStatus: string;
  };
  dataSources: {
    defaultOrigin: string;
    adminOrigin: string;
    systemOrigin: string;
  };
  ui: {
    projectColors: string[];
    defaultLoadingText: string;
    defaultPageSize: number;
    maxPageSize: number;
  };
  database: {
    assignmentTypes: string[];
    assignmentStatuses: string[];
    taskStatuses: string[];
    priorityLevels: string[];
  };
}

export default function ConfigurationManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfigurationData>({
    auth: {
      adminUsername: APP_CONFIG.AUTH.ADMIN_CREDENTIALS.USERNAME,
      adminPassword: APP_CONFIG.AUTH.ADMIN_CREDENTIALS.PASSWORD,
    },
    work: {
      defaultHoursPerDay: APP_CONFIG.WORK.DEFAULT_HOURS_PER_DAY,
      defaultPercentage: APP_CONFIG.WORK.DEFAULT_PERCENTAGE,
      defaultAssignmentType: APP_CONFIG.WORK.DEFAULT_ASSIGNMENT_TYPE,
      defaultStatus: APP_CONFIG.WORK.DEFAULT_STATUS,
    },
    dataSources: {
      defaultOrigin: APP_CONFIG.DATA_SOURCES.DEFAULT_ORIGIN,
      adminOrigin: APP_CONFIG.DATA_SOURCES.ADMIN_ORIGIN,
      systemOrigin: APP_CONFIG.DATA_SOURCES.SYSTEM_ORIGIN,
    },
    ui: {
      projectColors: [...APP_CONFIG.UI.PROJECT_COLORS],
      defaultLoadingText: APP_CONFIG.UI.DEFAULT_LOADING_TEXT,
      defaultPageSize: APP_CONFIG.UI.PAGINATION.DEFAULT_PAGE_SIZE,
      maxPageSize: APP_CONFIG.UI.PAGINATION.MAX_PAGE_SIZE,
    },
    database: {
      assignmentTypes: [...APP_CONFIG.DATABASE.ASSIGNMENT_TYPES],
      assignmentStatuses: [...APP_CONFIG.DATABASE.ASSIGNMENT_STATUSES],
      taskStatuses: [...APP_CONFIG.DATABASE.TASK_STATUSES],
      priorityLevels: [...APP_CONFIG.DATABASE.PRIORITY_LEVELS],
    },
  });

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      // Por ahora cargar desde localStorage hasta que la migración esté lista
      const savedConfig = localStorage.getItem('app_configuration');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error: any) {
      console.log('Error loading configuration:', error);
      // Usar configuración por defecto si no se puede cargar
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setLoading(true);
      
      // Por ahora guardar en localStorage hasta que la migración esté lista
      localStorage.setItem('app_configuration', JSON.stringify(config));

      toast({
        title: "✅ Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      });
    } catch (error: any) {
      toast({
        title: "❌ Error al guardar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      auth: {
        adminUsername: APP_CONFIG.AUTH.ADMIN_CREDENTIALS.USERNAME,
        adminPassword: APP_CONFIG.AUTH.ADMIN_CREDENTIALS.PASSWORD,
      },
      work: {
        defaultHoursPerDay: APP_CONFIG.WORK.DEFAULT_HOURS_PER_DAY,
        defaultPercentage: APP_CONFIG.WORK.DEFAULT_PERCENTAGE,
        defaultAssignmentType: APP_CONFIG.WORK.DEFAULT_ASSIGNMENT_TYPE,
        defaultStatus: APP_CONFIG.WORK.DEFAULT_STATUS,
      },
      dataSources: {
        defaultOrigin: APP_CONFIG.DATA_SOURCES.DEFAULT_ORIGIN,
        adminOrigin: APP_CONFIG.DATA_SOURCES.ADMIN_ORIGIN,
        systemOrigin: APP_CONFIG.DATA_SOURCES.SYSTEM_ORIGIN,
      },
      ui: {
        projectColors: [...APP_CONFIG.UI.PROJECT_COLORS],
        defaultLoadingText: APP_CONFIG.UI.DEFAULT_LOADING_TEXT,
        defaultPageSize: APP_CONFIG.UI.PAGINATION.DEFAULT_PAGE_SIZE,
        maxPageSize: APP_CONFIG.UI.PAGINATION.MAX_PAGE_SIZE,
      },
      database: {
        assignmentTypes: [...APP_CONFIG.DATABASE.ASSIGNMENT_TYPES],
        assignmentStatuses: [...APP_CONFIG.DATABASE.ASSIGNMENT_STATUSES],
        taskStatuses: [...APP_CONFIG.DATABASE.TASK_STATUSES],
        priorityLevels: [...APP_CONFIG.DATABASE.PRIORITY_LEVELS],
      },
    });

    toast({
      title: "🔄 Configuración restablecida",
      description: "Se han restaurado los valores por defecto",
    });
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  const updateArrayField = (section: keyof ConfigurationData, field: string, index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((item: string, i: number) => i === index ? value : item)
      }
    }));
  };

  const addArrayItem = (section: keyof ConfigurationData, field: string, value: string = '') => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], value]
      }
    }));
  };

  const removeArrayItem = (section: keyof ConfigurationData, field: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_: any, i: number) => i !== index)
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Configuración del Sistema</h1>
                <p className="text-muted-foreground">Gestiona los parámetros centralizados de la aplicación</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Defecto
            </Button>
            <Button onClick={saveConfiguration} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="auth" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="auth" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Autenticación
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Trabajo
            </TabsTrigger>
            <TabsTrigger value="ui" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Interfaz
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Base de Datos
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Fuentes de Datos
            </TabsTrigger>
          </TabsList>

          {/* Autenticación */}
          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configuración de Autenticación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminUsername">Usuario Administrador</Label>
                    <Input
                      id="adminUsername"
                      value={config.auth.adminUsername}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        auth: { ...prev.auth, adminUsername: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Contraseña Administrador</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={config.auth.adminPassword}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        auth: { ...prev.auth, adminPassword: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trabajo */}
          <TabsContent value="work">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Configuración de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultHours">Horas por Día por Defecto</Label>
                    <Input
                      id="defaultHours"
                      type="number"
                      value={config.work.defaultHoursPerDay}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        work: { ...prev.work, defaultHoursPerDay: parseInt(e.target.value) || 8 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultPercentage">Porcentaje por Defecto</Label>
                    <Input
                      id="defaultPercentage"
                      type="number"
                      value={config.work.defaultPercentage}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        work: { ...prev.work, defaultPercentage: parseInt(e.target.value) || 100 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultAssignmentType">Tipo de Asignación por Defecto</Label>
                    <Input
                      id="defaultAssignmentType"
                      value={config.work.defaultAssignmentType}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        work: { ...prev.work, defaultAssignmentType: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defaultStatus">Estado por Defecto</Label>
                    <Input
                      id="defaultStatus"
                      value={config.work.defaultStatus}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        work: { ...prev.work, defaultStatus: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interfaz */}
          <TabsContent value="ui">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Configuración de Interfaz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Colores de Proyectos</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {config.ui.projectColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={color}
                          onChange={(e) => updateArrayField('ui', 'projectColors', index, e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeArrayItem('ui', 'projectColors', index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => addArrayItem('ui', 'projectColors', 'bg-gray-500')}
                  >
                    + Añadir Color
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loadingText">Texto de Carga por Defecto</Label>
                    <Input
                      id="loadingText"
                      value={config.ui.defaultLoadingText}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ui: { ...prev.ui, defaultLoadingText: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pageSize">Tamaño de Página por Defecto</Label>
                    <Input
                      id="pageSize"
                      type="number"
                      value={config.ui.defaultPageSize}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        ui: { ...prev.ui, defaultPageSize: parseInt(e.target.value) || 10 }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Base de Datos */}
          <TabsContent value="database">
            <div className="space-y-6">
              {[
                { key: 'assignmentTypes', label: 'Tipos de Asignación' },
                { key: 'assignmentStatuses', label: 'Estados de Asignación' },
                { key: 'taskStatuses', label: 'Estados de Tareas' },
                { key: 'priorityLevels', label: 'Niveles de Prioridad' },
              ].map(({ key, label }) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {config.database[key as keyof typeof config.database].map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="secondary">{item}</Badge>
                          <Input
                            value={item}
                            onChange={(e) => updateArrayField('database', key, index, e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeArrayItem('database', key, index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addArrayItem('database', key, '')}
                      >
                        + Añadir {label.slice(0, -1)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Fuentes de Datos */}
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Fuentes de Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defaultOrigin">Origen por Defecto</Label>
                    <Input
                      id="defaultOrigin"
                      value={config.dataSources.defaultOrigin}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        dataSources: { ...prev.dataSources, defaultOrigin: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminOrigin">Origen Administrador</Label>
                    <Input
                      id="adminOrigin"
                      value={config.dataSources.adminOrigin}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        dataSources: { ...prev.dataSources, adminOrigin: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="systemOrigin">Origen Sistema</Label>
                    <Input
                      id="systemOrigin"
                      value={config.dataSources.systemOrigin}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        dataSources: { ...prev.dataSources, systemOrigin: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}