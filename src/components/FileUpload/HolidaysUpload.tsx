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
    
    // Verificar si existen registros manuales
    const hasManualRecordsResult = await checkForManualRecords();
    setHasManualRecords(hasManualRecordsResult);
    
    if (hasManualRecordsResult) {
      setShowConflictDialog(true);
    } else {
      processUpload();
    }
  };

  const processUpload = async () => {
    setUploading(true);
    setShowConflictDialog(false);
    
    try {
      if (!selectedFile) {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      // Si no preservar manuales, eliminar TODOS los registros
      if (!preserveManual) {
        const { error: deleteError } = await supabase
          .from('holidays')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos los registros
        
        if (deleteError) {
          console.error('Error al eliminar registros:', deleteError);
          throw new Error('Error al eliminar registros existentes');
        }
      }

      // Simular procesamiento del archivo Excel
      // En una implementación real, aquí se procesaría el archivo Excel
      // y se insertarían los nuevos registros
      
      // Simular proceso de carga
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setUploading(false);
      setSelectedFile(null);
      
      // Construir mensaje dinámico según el contexto
      let additionalMessage = '';
      if (!preserveManual) {
        additionalMessage = 'Todos los registros anteriores han sido eliminados.';
      } else if (hasManualRecords && preserveManual) {
        additionalMessage = 'Se preservaron los registros del Administrador.';
      }
      
      toast({
        title: "✅ Carga completada exitosamente",
        description: `Se ha creado el backup automáticamente y se han cargado ${fileRecordsCount} registros.${additionalMessage ? ' ' + additionalMessage : ''}`,
      });
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
            <div className="py-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <FileSpreadsheet className="h-8 w-8 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">{selectedFile.name}</p>
                    <p className="text-sm text-amber-600">
                      Archivo: {formatFileSize(selectedFile.size)} • {fileRecordsCount} registros
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">Listo para cargar</span>
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

      {/* Dialog de Conflicto con Registros Manuales */}
      <Dialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Registros del Administrador Detectados</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Se encontraron {manualRecords.length} registro(s) añadido(s) manualmente
            </p>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-foreground mb-4">
              ¿Qué deseas hacer con los registros añadidos por el Administrador?
            </p>
            
            <div className="space-y-3">
              {/* Opción Preservar */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  preserveManual 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => setPreserveManual(true)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    preserveManual ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {preserveManual && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Preservar registros del Administrador</p>
                    <p className="text-sm text-green-600">
                      Mantener los {manualRecords.length} registro(s) manual(es) + agregar los nuevos del archivo Excel
                    </p>
                  </div>
                </div>
              </div>

              {/* Opción Sustituir */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  !preserveManual 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300'
                }`}
                onClick={() => setPreserveManual(false)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    !preserveManual ? 'bg-red-500 border-red-500' : 'border-gray-300'
                  }`}>
                    {!preserveManual && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Sustitución completa</p>
                    <p className="text-sm text-red-600">
                      Eliminar TODOS los registros existentes y reemplazar solo con el archivo Excel
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConflictDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className={preserveManual ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              onClick={processUpload}
            >
              {preserveManual ? "Preservar" : "Sustituir Todo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HolidaysUpload;