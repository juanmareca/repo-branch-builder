import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Calendar,
  Upload,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  AlertTriangle,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ManualRecord {
  id: string;
  date: string;
  description: string;
  country: string;
  region: string;
}

const HolidaysUpload = () => {
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
  const [adminRecordsCount, setAdminRecordsCount] = useState(0);
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

  // Función para verificar registros manuales existentes
  const checkForManualRecords = async () => {
    setCheckingManualRecords(true);
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('origen', 'Administrador');

      if (error) throw error;
      
      const manualHolidays = (data || []).map(holiday => ({
        id: holiday.id,
        date: holiday.date,
        description: holiday.festivo,
        country: holiday.pais,
        region: holiday.comunidad_autonoma || 'NACIONAL'
      }));
      
      setManualRecords(manualHolidays);
      setAdminRecordsCount(manualHolidays.length);
      return manualHolidays.length > 0;
    } catch (error) {
      console.error('Error checking manual records:', error);
      return false;
    } finally {
      setCheckingManualRecords(false);
    }
  };

  const handleUploadConfirm = async () => {
    setShowUploadDialog(false);
    
    // Verificar si existen registros (cualquier origen)
    try {
      const { data: allHolidays, error } = await supabase
        .from('holidays')
        .select('*');
        
      if (error) throw error;
      
      const hasAnyRecords = (allHolidays || []).length > 0;
      
      if (hasAnyRecords) {
        // Verificar registros manuales específicamente
        const hasManualRecordsResult = await checkForManualRecords();
        setHasManualRecords(hasManualRecordsResult);
        setShowConflictDialog(true);
      } else {
        // No hay registros, proceder directamente
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

      // Crear backup antes de hacer cambios
      const { data: existingHolidays, error: fetchError } = await supabase
        .from('holidays')
        .select('*');

      if (fetchError) {
        console.error('Error al obtener festivos para backup:', fetchError);
        throw new Error('Error al crear backup de los datos existentes');
      }

      // Crear backup
      const backupData = {
        table_name: 'holidays',
        file_name: `holidays_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`,
        record_count: existingHolidays?.length || 0,
        file_size: `${Math.round((JSON.stringify(existingHolidays).length / 1024))} KB`,
        created_by: 'System',
        backup_data: existingHolidays
      };

      const { error: backupError } = await supabase
        .from('backups')
        .insert(backupData);

      if (backupError) {
        console.error('Error al crear backup:', backupError);
        // Continuar sin backup pero advertir al usuario
        toast({
          title: "⚠️ Advertencia",
          description: "No se pudo crear el backup automático, pero se continuará con la carga",
          variant: "destructive",
        });
      }

      // Manejar eliminación según la opción seleccionada
      if (uploadMode === 'replace') {
        // MODO SUSTITUIR
        if (preserveManual && hasManualRecords) {
          // Mantener registros del Administrador, eliminar solo los de Fichero
          const { error: deleteError } = await supabase
            .from('holidays')
            .delete()
            .eq('origen', 'Fichero');
          
          if (deleteError) {
            console.error('Error al eliminar registros de archivo:', deleteError);
            throw new Error('Error al eliminar registros del archivo');
          }
        } else {
          // Eliminar TODOS los registros
          const { error: deleteError } = await supabase
            .from('holidays')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
          
          if (deleteError) {
            console.error('Error al eliminar todos los registros:', deleteError);
            throw new Error('Error al eliminar registros existentes');
          }
        }
      }
      // En modo AÑADIR no eliminamos nada, solo insertamos nuevos registros

      // Leer y procesar el archivo Excel
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Filtrar filas vacías y omitir header
          const dataRows = jsonData.slice(1).filter((row: any) => 
            row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
          );
          
          // Preparar datos para insertar
          const holidaysToInsert = dataRows.map((row: any) => {
            const [fecha, festivo, pais, comunidadAutonoma] = row;
            
            // Convertir fecha al formato correcto
            let formattedDate;
            if (typeof fecha === 'number') {
              // Es una fecha de Excel (número serial)
              const date = new Date((fecha - 25569) * 86400 * 1000);
              formattedDate = date.toISOString().split('T')[0];
            } else if (typeof fecha === 'string') {
              // Es una fecha en formato string, intentar parsearlo
              const dateParts = fecha.split('/');
              if (dateParts.length === 3) {
                const [day, month, year] = dateParts;
                formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }
            
            return {
              date: formattedDate,
              festivo: festivo || '',
              pais: pais || '',
              comunidad_autonoma: comunidadAutonoma || '',
              origen: 'Fichero'
            };
          }).filter(holiday => holiday.date); // Solo incluir registros con fecha válida
          
          // Insertar en Supabase
          const { error: insertError } = await supabase
            .from('holidays')
            .insert(holidaysToInsert);
          
          if (insertError) {
            console.error('Error inserting holidays:', insertError);
            throw new Error('Error al insertar los festivos en la base de datos');
          }
          
          setUploading(false);
          setSelectedFile(null);
          
          // Construir mensaje dinámico según el contexto
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
            description: `Se ha creado el backup automáticamente y se han cargado ${holidaysToInsert.length} registros.${additionalMessage ? ' ' + additionalMessage : ''}`,
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
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <CardTitle>Procesando Festivos...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-amber-800 font-medium">Cargando archivo Excel...</p>
            <p className="text-amber-600 text-sm mt-2">Creando backup automático</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="h-6 w-6" />
            </div>
            <CardTitle>Cargar Festivos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Formato Requerido - Expandible */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setIsFormatExpanded(!isFormatExpanded)}
              className="w-full justify-between border-amber-300 hover:bg-amber-100"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-600" />
                Formato requerido: Excel (.xlsx)
              </span>
              {isFormatExpanded ? 
                <ChevronUp className="h-4 w-4 text-amber-600" /> : 
                <ChevronDown className="h-4 w-4 text-amber-600" />
              }
            </Button>
            
            {isFormatExpanded && (
              <Alert className="mt-3 border-amber-200 bg-amber-50">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription>
                  <div className="text-amber-800">
                    <p className="font-semibold mb-2">Columnas requeridas:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        Fecha (DD/MM/YYYY)
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        Descripción Festividad
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        País
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                        Comunidad Autónoma (sólo para ESPAÑA)
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-amber-100 rounded border border-amber-300">
                      <p className="text-xs"><strong>Nota:</strong> Archivo Excel con días festivos</p>
                    </div>

                    {/* Ejemplo de archivo Excel */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-amber-800 mb-2">Ejemplo de archivo Excel:</h4>
                      <div className="bg-white rounded border border-amber-300 p-2">
                         <img 
                           src="/lovable-uploads/bfdc98f8-7762-4f74-9d56-74de94379b37.png" 
                           alt="Ejemplo de archivo Excel con días festivos" 
                           className="w-full max-w-md mx-auto rounded shadow-sm cursor-pointer transition-transform duration-300 hover:scale-[2.5] hover:z-10"
                           title="Pasa el ratón para ampliar la imagen"
                         />
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Zona de Carga */}
          <div className="border-2 border-dashed border-amber-300 rounded-lg p-8 text-center mb-4 hover:border-amber-400 transition-colors">
            <Upload className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-amber-800 font-medium mb-2">Arrastra el archivo Excel aquí</p>
            <p className="text-amber-600 text-sm mb-4">Archivo Excel con días festivos</p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="holidays-file-input"
              disabled={processingFile}
            />
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => document.getElementById('holidays-file-input')?.click()}
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
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <Calendar className="h-5 w-5" />
              Cargar Festivos
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <FileSpreadsheet className="h-8 w-8 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">{selectedFile.name}</p>
                  <p className="text-sm text-amber-600">
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
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleUploadConfirm}
              disabled={checkingManualRecords}
            >
              <Upload className="h-4 w-4 mr-2" />
              {checkingManualRecords ? 'Verificando...' : 'Cargar Festivos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Conflicto - Registros Existentes */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Registros Existentes Detectados
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Alert className="border-amber-200 bg-amber-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Ya existen registros de festivos en la base de datos.
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
                      className="h-4 w-4 text-amber-600"
                    />
                    <label htmlFor="mode-replace" className="text-sm text-gray-700 cursor-pointer">
                      <span className="font-medium">SUSTITUIR:</span> Reemplazar toda la base de festivos por el nuevo archivo
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
                      className="h-4 w-4 text-amber-600"
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
                        <strong>{record.date}:</strong> {record.description} 
                        ({record.country}{record.region && record.region !== 'NACIONAL' ? ` - ${record.region}` : ''})
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
                  className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <label htmlFor="preserve-manual" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">¿Desea mantener los registros del Administrador añadidos manualmente?</span>
                </label>
              </div>
              
              <div className="mt-2 ml-6">
                <p className="text-xs text-amber-700">
                  Actualmente tienes {adminRecordsCount} registros de Administrador en la Base de Datos.
                </p>
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
              className="bg-amber-600 hover:bg-amber-700 text-white"
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

export default HolidaysUpload;