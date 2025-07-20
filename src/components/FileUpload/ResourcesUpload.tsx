import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Users,
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

const ResourcesUpload = () => {
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileRecordsCount, setFileRecordsCount] = useState<number>(0);
  const [duplicatesCount, setDuplicatesCount] = useState<number>(0);
  const [newResourcesCount, setNewResourcesCount] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'add-new' | 'replace-all'>('add-new');
  const { toast } = useToast();

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
        
        // Obtener códigos de empleado existentes
        const { data: existingPersons } = await supabase
          .from('persons')
          .select('num_pers');
        
        const existingCodes = new Set(existingPersons?.map(p => p.num_pers) || []);
        
        // Contar duplicados y recursos nuevos
        const duplicates = dataRows.filter(row => existingCodes.has(String(row[0]))).length;
        const newResources = recordsCount - duplicates;
        
        setFileRecordsCount(recordsCount);
        setDuplicatesCount(duplicates);
        setNewResourcesCount(newResources);
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
      num_pers: String(row[0]) || '', // Código Empleado
      nombre: row[1] || '', // Nombre
      fecha_incorporacion: row[2] || '', // Fecha incorporación
      mail_empresa: row[3] || '', // Mail empresa
      squad_lead: row[4] || '', // Squad Lead
      cex: row[5] || '', // CEX
      grupo: row[6] || '', // Grupo
      categoria: row[7] || '', // Categoria
      oficina: row[8] || '', // Oficina
      origen: 'Fichero' // Origen por defecto para archivos
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
      const resourcesToInsert = dataRows
        .filter(row => row[0]) // Filtrar filas vacías
        .map(mapExcelToDatabase);

      if (resourcesToInsert.length === 0) {
        throw new Error('No se encontraron datos válidos para procesar');
      }

      if (uploadMode === 'replace-all') {
        // Eliminar todos los recursos existentes y insertar los nuevos
        const { error: deleteError } = await supabase
          .from('persons')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (deleteError) {
          console.error('Error deleting existing resources:', deleteError);
          throw new Error('Error al eliminar recursos existentes: ' + deleteError.message);
        }

        const { data, error: insertError } = await supabase
          .from('persons')
          .insert(resourcesToInsert)
          .select();

        if (insertError) {
          console.error('Error inserting new resources:', insertError);
          throw new Error('Error al insertar recursos: ' + insertError.message);
        }

        toast({
          title: "✅ Recursos reemplazados exitosamente",
          description: `Se han reemplazado todos los recursos. Total: ${data?.length || 0}`,
        });
      } else {
        // Modo añadir solo nuevos: filtrar recursos que no existen
        const { data: existingPersons } = await supabase
          .from('persons')
          .select('num_pers');
        
        const existingCodes = new Set(existingPersons?.map(p => p.num_pers) || []);
        const newResourcesToInsert = resourcesToInsert.filter(resource => !existingCodes.has(resource.num_pers));
        
        if (newResourcesToInsert.length === 0) {
          toast({
            title: "ℹ️ No hay recursos nuevos",
            description: "Todos los recursos del archivo ya existen en la base de datos",
          });
        } else {
          const { data, error } = await supabase
            .from('persons')
            .insert(newResourcesToInsert)
            .select();

          if (error) {
            console.error('Error inserting new resources:', error);
            throw new Error('Error al insertar recursos: ' + error.message);
          }

          toast({
            title: "✅ Recursos nuevos añadidos",
            description: `Se han añadido ${data?.length || 0} recursos nuevos`,
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
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle>Procesando Recursos...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800 font-medium">Cargando archivo Excel...</p>
            <p className="text-blue-600 text-sm mt-2">Procesando datos de recursos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <CardTitle>Cargar Recursos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Formato Requerido - Expandible */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setIsFormatExpanded(!isFormatExpanded)}
              className="w-full justify-between border-blue-300 hover:bg-blue-100"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Formato requerido: Excel (.xlsx)
              </span>
              {isFormatExpanded ? 
                <ChevronUp className="h-4 w-4 text-blue-600" /> : 
                <ChevronDown className="h-4 w-4 text-blue-600" />
              }
            </Button>
            
            {isFormatExpanded && (
              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="text-blue-800">
                    <p className="font-semibold mb-2">Columnas requeridas:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Código Empleado
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Nombre
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Fecha Incorporación
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Mail Empresa
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Squad Lead
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        CEX
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Grupo
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Categoría
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Oficina
                      </div>
                     </div>
                     <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                       <p className="text-xs"><strong>Nota:</strong> Archivo Excel con información de recursos humanos</p>
                     </div>
                     
                     {/* Imagen de ejemplo del Excel */}
                     <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                       <p className="text-sm font-semibold text-blue-800 mb-2">Ejemplo de fichero Excel para cargar:</p>
                        <img 
                          src="/lovable-uploads/acabfdf3-b391-4e0d-b764-82e6c102790e.png" 
                          alt="Ejemplo de fichero Excel para cargar recursos"
                          className="w-full rounded border border-gray-300 shadow-sm cursor-pointer transition-transform duration-300 hover:scale-150 hover:z-10"
                          title="Pasa el ratón para ampliar la imagen"
                        />
                     </div>
                   </div>
                 </AlertDescription>
               </Alert>
            )}
          </div>

          {/* Zona de Carga */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center mb-4 hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-blue-800 font-medium mb-2">Arrastra el archivo Excel aquí</p>
            <p className="text-blue-600 text-sm mb-4">Archivo Excel con datos de recursos</p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="resources-file-input"
              disabled={processingFile}
            />
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => document.getElementById('resources-file-input')?.click()}
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
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Users className="h-5 w-5" />
              Cargar Recursos
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800">{selectedFile.name}</p>
                  <p className="text-sm text-blue-600">
                    Archivo: {formatFileSize(selectedFile.size)} • {fileRecordsCount} registros totales
                  </p>
                  <div className="text-sm text-blue-600 mt-1">
                    • Recursos nuevos: <span className="font-medium text-green-700">{newResourcesCount}</span>
                  </div>
                  <div className="text-sm text-blue-600">
                    • Recursos duplicados: <span className="font-medium text-orange-700">{duplicatesCount}</span>
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
                      className="text-blue-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Añadir solo recursos nuevos
                      </span>
                      <p className="text-xs text-gray-600">
                        Se añadirán {newResourcesCount} recursos nuevos, ignorando duplicados
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
                      className="text-blue-600"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Reemplazar todos los recursos
                      </span>
                      <p className="text-xs text-gray-600">
                        Se eliminarán todos los recursos existentes y se cargarán {fileRecordsCount} recursos nuevos
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setShowUploadDialog(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUploadConfirm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar Carga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResourcesUpload;