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
  X,
  FileSpreadsheet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const ProjectsUpload = () => {
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileRecordsCount, setFileRecordsCount] = useState<number>(0);
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0);
  const [newProjectsCount, setNewProjectsCount] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'add-new' | 'replace-all'>('add-new');
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
        // Procesar archivo y detectar duplicados
        const rawData = await processExcelData(file);
        const dataRows = rawData.slice(1).filter(row => row[0]); // Excluir header y filas vacías
        const recordsCount = dataRows.length;
        
        // Obtener códigos iniciales existentes
        const { data: existingProjects } = await supabase
          .from('projects')
          .select('codigo_inicial');
        
        const existingCodes = new Set(existingProjects?.map(p => p.codigo_inicial) || []);
        
        // Contar duplicados y proyectos nuevos
        const duplicates = dataRows.filter(row => existingCodes.has(row[0])).length;
        const newProjects = recordsCount - duplicates;
        
        setFileRecordsCount(recordsCount);
        setDuplicatesCount(duplicates);
        setNewProjectsCount(newProjects);
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

  const processExcelData = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const mapExcelToDatabase = (row: any[]): any => {
    // Mapear las columnas del Excel a los campos de la base de datos
    return {
      codigo_inicial: row[0] || '',
      descripcion: row[1] || '',
      denominacion: row[2] || '',
      tipologia: row[3] || '',
      tipologia_2: row[4] || '',
      gestor_proyecto: row[5] || '',
      socio_responsable: row[6] || '',
      cliente: row[7] || '',
      grupo_cliente: row[8] || '',
      // Campos adicionales requeridos por la tabla
      codigo_proyecto: row[0] || '', // Usar el código inicial como código de proyecto
      name: row[2] || '', // Usar denominación como name
      status: 'planning',
      billing_type: 'billable',
      priority: 'medium',
      progress: 0
    };
  };

  const handleUploadConfirm = async () => {
    setShowUploadDialog(false);
    setUploading(true);
    
    try {
      if (!selectedFile) {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      const rawData = await processExcelData(selectedFile);
      
      if (rawData.length < 2) {
        throw new Error('El archivo debe contener al menos una fila de datos además de la cabecera');
      }

      // Saltar la primera fila (cabecera) y procesar los datos
      const dataRows = rawData.slice(1);
      const projectsToInsert = dataRows
        .filter(row => row[0]) // Filtrar filas vacías
        .map(mapExcelToDatabase);

      if (projectsToInsert.length === 0) {
        throw new Error('No se encontraron datos válidos para procesar');
      }

      if (uploadMode === 'replace-all') {
        // Eliminar todos los proyectos existentes y insertar los nuevos
        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
          console.error('Error deleting existing projects:', deleteError);
          throw new Error('Error al eliminar proyectos existentes: ' + deleteError.message);
        }

        const { data, error: insertError } = await supabase
          .from('projects')
          .insert(projectsToInsert)
          .select();

        if (insertError) {
          console.error('Error inserting new projects:', insertError);
          throw new Error('Error al insertar proyectos: ' + insertError.message);
        }

        toast({
          title: "✅ Proyectos reemplazados exitosamente",
          description: `Se han reemplazado todos los proyectos. Total: ${data?.length || 0}`,
        });
      } else {
        // Modo añadir solo nuevos: filtrar proyectos que no existen
        const { data: existingProjects } = await supabase
          .from('projects')
          .select('codigo_inicial');
        
        const existingCodes = new Set(existingProjects?.map(p => p.codigo_inicial) || []);
        const newProjectsToInsert = projectsToInsert.filter(project => !existingCodes.has(project.codigo_inicial));
        
        if (newProjectsToInsert.length === 0) {
          toast({
            title: "ℹ️ No hay proyectos nuevos",
            description: "Todos los proyectos del archivo ya existen en la base de datos",
          });
        } else {
          const { data, error } = await supabase
            .from('projects')
            .insert(newProjectsToInsert)
            .select();

          if (error) {
            console.error('Error inserting new projects:', error);
            throw new Error('Error al insertar proyectos: ' + error.message);
          }

          toast({
            title: "✅ Proyectos nuevos añadidos",
            description: `Se han añadido ${data?.length || 0} proyectos nuevos`,
          });
        }
      }

      setSelectedFile(null);
      setUploadMode('add-new');

    } catch (error: any) {
      console.error('Upload error:', error);
      
      toast({
        title: "❌ Error en la carga",
        description: error.message || "Ha ocurrido un error al procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
            <p className="text-purple-600 text-sm mt-2">Procesando datos de proyectos</p>
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
                        src="/lovable-uploads/54b12f06-d668-4202-880e-32785d0f7135.png" 
                        alt="Ejemplo de fichero Excel para cargar proyectos"
                        className="w-full rounded border border-gray-300 shadow-sm"
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
                    Archivo: {formatFileSize(selectedFile.size)} • {fileRecordsCount} registros totales
                  </p>
                  <div className="text-sm text-purple-600 mt-1">
                    • Proyectos nuevos: <span className="font-medium text-green-700">{newProjectsCount}</span>
                  </div>
                  <div className="text-sm text-purple-600">
                    • Proyectos duplicados: <span className="font-medium text-orange-700">{duplicatesCount}</span>
                  </div>
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

              {/* Opciones de carga */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700">Modo de carga:</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMode"
                      value="add-new"
                      checked={uploadMode === 'add-new'}
                      onChange={(e) => setUploadMode(e.target.value as 'add-new' | 'replace-all')}
                      className="text-purple-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Añadir solo proyectos nuevos
                      </span>
                      <p className="text-xs text-gray-600">
                        Se añadirán {newProjectsCount} proyectos nuevos, ignorando duplicados
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMode"
                      value="replace-all"
                      checked={uploadMode === 'replace-all'}
                      onChange={(e) => setUploadMode(e.target.value as 'add-new' | 'replace-all')}
                      className="text-purple-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Reemplazar toda la base de datos
                      </span>
                      <p className="text-xs text-gray-600">
                        Se eliminarán todos los proyectos existentes y se cargarán {fileRecordsCount} nuevos
                      </p>
                    </div>
                  </label>
                </div>
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
            >
              <Upload className="h-4 w-4 mr-2" />
              Cargar Proyectos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectsUpload;