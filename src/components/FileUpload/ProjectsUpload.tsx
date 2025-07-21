import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  FolderOpen,
  Upload,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ManualRecord {
  id: string;
  code: string;
  name: string;
}

const ProjectsUpload = () => {
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileRecordsCount, setFileRecordsCount] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [manualRecords, setManualRecords] = useState<ManualRecord[]>([]);
  const [preserveManual, setPreserveManual] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [checkingManualRecords, setCheckingManualRecords] = useState(false);
  const [hasManualRecords, setHasManualRecords] = useState(false);
  const [uploadMode, setUploadMode] = useState<'replace' | 'add'>('add');
  const { toast } = useToast();

  // Función para procesar el archivo Excel y contar registros
  const processExcelFile = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Contar filas con datos (excluyendo header si existe)
          const dataRows = jsonData.filter((row: any) => row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''));
          const recordCount = dataRows.length > 0 ? dataRows.length - 1 : 0; // -1 para excluir header
          
          resolve(Math.max(0, recordCount));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessingFile(true);
      
      try {
        const recordsCount = await processExcelFile(file);
        setFileRecordsCount(recordsCount);
        setShowUploadDialog(true);
      } catch (error) {
        toast({
          title: "Error al procesar archivo",
          description: "No se pudo leer el archivo Excel. Verifique que sea un archivo válido.",
          variant: "destructive",
        });
        setSelectedFile(null);
      } finally {
        setProcessingFile(false);
      }
    }
  };

  const checkForManualRecords = async () => {
    setCheckingManualRecords(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('origen', 'Administrador');

      if (error) throw error;
      
      const manualProjects = (data || []).map(project => ({
        id: project.id,
        code: project.codigo_inicial,
        name: project.denominacion
      }));
      
      setManualRecords(manualProjects);
      return manualProjects.length > 0;
    } catch (error) {
      console.error('Error checking manual records:', error);
      return false;
    } finally {
      setCheckingManualRecords(false);
    }
  };

  const handleUploadConfirm = async () => {
    setShowUploadDialog(false);
    
    try {
      const { data: allProjects, error } = await supabase
        .from('projects')
        .select('*');
        
      if (error) throw error;
      
      const hasAnyRecords = (allProjects || []).length > 0;
      
      if (hasAnyRecords) {
        const hasManualRecordsResult = await checkForManualRecords();
        setHasManualRecords(hasManualRecordsResult);
        setShowConflictDialog(true);
      } else {
        processUpload();
      }
    } catch (error) {
      console.error('Error checking existing records:', error);
      toast({
        title: "Error",
        description: "Error al verificar registros existentes",
        variant: "destructive",
      });
    }
  };

  const processUpload = async () => {
    setUploading(true);
    setShowConflictDialog(false);
    
    try {
      if (!selectedFile) {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      // Crear backup
      const { data: existingProjects, error: fetchError } = await supabase
        .from('projects')
        .select('*');

      if (fetchError) {
        console.error('Error al obtener proyectos para backup:', fetchError);
        throw new Error('Error al crear backup de los datos existentes');
      }

      const backupData = {
        table_name: 'projects',
        file_name: `projects_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`,
        record_count: existingProjects?.length || 0,
        file_size: `${Math.round((JSON.stringify(existingProjects).length / 1024))} KB`,
        created_by: 'System',
        backup_data: existingProjects
      };

      const { error: backupError } = await supabase
        .from('backups')
        .insert(backupData);

      if (backupError) {
        console.error('Error al crear backup:', backupError);
        toast({
          title: "⚠️ Advertencia",
          description: "No se pudo crear el backup automático, pero se continuará con la carga",
          variant: "destructive",
        });
      }

      // Manejar eliminación según la opción seleccionada
      if (uploadMode === 'replace') {
        if (preserveManual && hasManualRecords) {
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .eq('origen', 'Fichero');
          
          if (deleteError) {
            console.error('Error al eliminar registros de archivo:', deleteError);
            throw new Error('Error al eliminar registros del archivo');
          }
        } else {
          const { error: deleteError } = await supabase
            .from('projects')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          if (deleteError) {
            console.error('Error al eliminar todos los registros:', deleteError);
            throw new Error('Error al eliminar registros existentes');
          }
        }
      }

      // Leer y procesar el archivo Excel
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const dataRows = jsonData.slice(1).filter((row: any) => 
            row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
          );
          
          const projectsToInsert = dataRows.map((row: any) => ({
            codigo_inicial: row[0] || '',
            descripcion: row[1] || '',
            denominacion: row[2] || '',
            tipologia: row[3] || '',
            tipologia_2: row[4] || '',
            gestor_proyecto: row[5] || '',
            socio_responsable: row[6] || '',
            cliente: row[7] || '',
            grupo_cliente: row[8] || '',
            origen: 'Fichero'
          })).filter(project => project.codigo_inicial);
          
          const { error: insertError } = await supabase
            .from('projects')
            .insert(projectsToInsert);
          
          if (insertError) {
            console.error('Error inserting projects:', insertError);
            throw new Error('Error al insertar los proyectos en la base de datos');
          }
          
          setUploading(false);
          setSelectedFile(null);
          
          let additionalMessage = '';
          if (uploadMode === 'replace') {
            if (preserveManual && hasManualRecords) {
              additionalMessage = 'Se sustituyeron los registros del archivo, manteniendo los del Administrador.';
            } else {
              additionalMessage = 'Se sustituyeron todos los registros anteriores.';
            }
          } else {
            additionalMessage = 'Se añadieron a los registros existentes.';
          }
          
          toast({
            title: "✅ Carga completada exitosamente",
            description: `Se ha creado el backup automáticamente y se han cargado ${projectsToInsert.length} registros.${additionalMessage ? ' ' + additionalMessage : ''}`,
          });
          
        } catch (error) {
          setUploading(false);
          console.error('Error processing file:', error);
          toast({
            title: "❌ Error en la carga",
            description: error instanceof Error ? error.message : 'Error al procesar el archivo Excel',
            variant: "destructive",
          });
        }
      };
      
      reader.onerror = () => {
        setUploading(false);
        toast({
          title: "❌ Error en la carga",
          description: 'Error al leer el archivo',
          variant: "destructive",
        });
      };
      
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      setUploading(false);
      toast({
        title: "❌ Error en la carga",
        description: error instanceof Error ? error.message : 'Error desconocido al procesar el archivo',
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (uploading) {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FolderOpen className="h-6 w-6" />
            </div>
            <CardTitle>Procesando Proyectos...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-800 font-medium">Cargando archivo Excel...</p>
            <p className="text-purple-600 text-sm mt-2">Creando backup automático</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-50">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FolderOpen className="h-6 w-6" />
            </div>
            <CardTitle>Cargar Proyectos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Formato Requerido - Expandible */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setIsFormatExpanded(!isFormatExpanded)}
              className="w-full justify-between border-purple-300 hover:bg-purple-100"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-600" />
                Formato requerido: Excel (.xlsx)
              </span>
              {isFormatExpanded ? 
                <ChevronUp className="h-4 w-4 text-purple-600" /> : 
                <ChevronDown className="h-4 w-4 text-purple-600" />
              }
            </Button>
            
            {isFormatExpanded && (
              <Alert className="mt-3 border-purple-200 bg-purple-50">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription>
                  <div className="text-purple-800">
                    <p className="font-semibold mb-2">Columnas requeridas:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Código Inicial
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Descripción
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Denominación
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Tipología
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Tipología 2
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Gestor Proyecto
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Socio Responsable
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Cliente
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Grupo Cliente
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-purple-100 rounded border border-purple-300">
                      <p className="text-xs"><strong>Nota:</strong> Archivo Excel con información de proyectos</p>
                    </div>
                    
                    {/* Imagen de ejemplo del Excel */}
                    <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                      <p className="text-sm font-semibold text-purple-800 mb-2">Ejemplo de fichero Excel para cargar:</p>
                       <img 
                         src="/lovable-uploads/dce93539-da1c-4a81-9463-7dd483fd6e0b.png" 
                         alt="Ejemplo de fichero Excel para cargar proyectos"
                         className="w-full rounded border border-gray-300 shadow-sm cursor-pointer transition-transform duration-300 hover:scale-[2.5] hover:z-10"
                         title="Pasa el ratón para ampliar la imagen"
                       />
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Zona de Carga */}
          <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center mb-4 hover:border-purple-400 transition-colors">
            <Upload className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <p className="text-purple-800 font-medium mb-2">Arrastra el archivo Excel aquí</p>
            <p className="text-purple-600 text-sm mb-4">Archivo Excel con datos de proyectos</p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="projects-file-input"
              disabled={processingFile}
            />
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => document.getElementById('projects-file-input')?.click()}
              disabled={processingFile}
            >
              {processingFile ? 'Procesando...' : 'Seleccionar Archivo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmación de Archivo */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-800">
              <FolderOpen className="h-5 w-5" />
              Cargar Proyectos
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <FileSpreadsheet className="h-8 w-8 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium text-purple-800">{selectedFile.name}</p>
                  <p className="text-sm text-purple-600">
                    Archivo: {formatFileSize(selectedFile.size)} • {fileRecordsCount} registros
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setShowUploadDialog(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleUploadConfirm}
              disabled={checkingManualRecords}
            >
              <Upload className="h-4 w-4 mr-2" />
              {checkingManualRecords ? 'Verificando...' : 'Cargar Proyectos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Conflicto - Registros Existentes */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-800">
              <AlertTriangle className="h-5 w-5" />
              Registros Existentes Detectados
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Alert className="border-purple-200 bg-purple-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                Ya existen registros de proyectos en la base de datos.
                {hasManualRecords && (
                  <span className="font-medium">
                    {" "}Se detectaron {manualRecords.length} registros del Administrador.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Tu archivo contiene <strong>{fileRecordsCount}</strong> registros. 
                ¿Qué quieres hacer con los registros existentes?
              </p>
              
              {/* Opciones de carga */}
              <div className="bg-gray-50 border rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-800 mb-3">Selecciona el modo de carga:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="mode-replace"
                      name="uploadMode"
                      value="replace"
                      checked={uploadMode === 'replace'}
                      onChange={(e) => setUploadMode(e.target.value as 'replace' | 'add')}
                      className="h-4 w-4 text-purple-600"
                    />
                    <label htmlFor="mode-replace" className="text-sm text-gray-700 cursor-pointer">
                      <span className="font-medium">SUSTITUIR:</span> Reemplazar toda la base de proyectos por el nuevo archivo
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="mode-add"
                      name="uploadMode"
                      value="add"
                      checked={uploadMode === 'add'}
                      onChange={(e) => setUploadMode(e.target.value as 'replace' | 'add')}
                      className="h-4 w-4 text-purple-600"
                    />
                    <label htmlFor="mode-add" className="text-sm text-gray-700 cursor-pointer">
                      <span className="font-medium">AÑADIR:</span> Añadir los registros del archivo a los existentes
                    </label>
                  </div>
                </div>
              </div>
              
              {hasManualRecords && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Registros del Administrador encontrados:
                    </span>
                  </div>
                  <div className="text-xs text-blue-700 max-h-32 overflow-y-auto">
                    {manualRecords.map((record, index) => (
                      <div key={record.id} className="mb-1">
                        <strong>{record.code}:</strong> {record.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="preserve-manual"
                  checked={preserveManual}
                  onChange={(e) => setPreserveManual(e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded border-purple-300 focus:ring-purple-500"
                />
                <label htmlFor="preserve-manual" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">¿Desea mantener los registros del Administrador añadidos manualmente?</span>
                </label>
              </div>
              
              {uploadMode === 'replace' && !preserveManual && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>⚠️ Atención:</strong> Se eliminarán TODOS los registros existentes, incluidos los del Administrador.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConflictDialog(false);
                setSelectedFile(null);
              }}
              className="border-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={processUpload}
              disabled={uploading || checkingManualRecords}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {uploadMode === 'replace' ? 'Sustituir' : 'Añadir'} Registros
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsUpload;