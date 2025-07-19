import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Zap,
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

interface CapacitiesUploadProps {
  onUploadComplete?: () => void;
}

const CapacitiesUpload = ({ onUploadComplete }: CapacitiesUploadProps) => {
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileRecordsCount, setFileRecordsCount] = useState<number>(0);
  const [processingFile, setProcessingFile] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          
          // Contar filas con datos (excluyendo la primera fila que es cabecera)
          const dataRows = jsonData.slice(1).filter((row: any) => row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== ''));
          const recordCount = dataRows.length;
          
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

  const handleUploadConfirm = async () => {
    setShowUploadDialog(false);
    processUpload();
  };

  const processUpload = async () => {
    setUploading(true);
    
    try {
      if (!selectedFile) {
        throw new Error('No se ha seleccionado ningún archivo');
      }

      // Crear backup automático antes de procesar
      const { data: existingCapacities } = await supabase
        .from('capacities')
        .select('*');

      if (existingCapacities && existingCapacities.length > 0) {
        await supabase
          .from('backups')
          .insert({
            table_name: 'capacities',
            file_name: `backup_capacities_${new Date().toISOString().split('T')[0]}.json`,
            record_count: existingCapacities.length,
            backup_data: existingCapacities,
            file_size: `${JSON.stringify(existingCapacities).length} bytes`,
            created_by: 'Sistema'
          });
      }

      // Eliminar registros existentes
      await supabase
        .from('capacities')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Leer y procesar el archivo Excel
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Obtener headers (una sola fila de cabecera)
          const skillHeaders = jsonData[0] as any[];
          const dataRows = jsonData.slice(1).filter((row: any) => 
            row && row.length > 0 && row.some((cell: any) => cell !== null && cell !== undefined && cell !== '')
          );
          
          // Función para obtener el bloque según la posición de la columna
          const getBlockName = (columnIndex: number): string => {
            if (columnIndex >= 2 && columnIndex <= 17) return 'Módulo SAP';
            if (columnIndex >= 18 && columnIndex <= 20) return 'Implantación SAP';
            if (columnIndex >= 21 && columnIndex <= 26) return 'Idiomas';
            if (columnIndex >= 27 && columnIndex <= 33) return 'Industrias';
            return '';
          };
          
          // Preparar datos para insertar
          const capacitiesToInsert = [];
          
          for (const row of dataRows) {
            const employeeId = row[0];
            const employeeName = row[1];
            
            // Procesar cada capacidad (columnas 2 en adelante)
            for (let i = 2; i < skillHeaders.length; i++) {
              const skillName = skillHeaders[i] || '';
              const skillLevel = row[i];
              const blockName = getBlockName(i);
              
              // Verificar que hay datos válidos
              if (skillName && skillLevel && blockName &&
                  String(skillLevel).trim() !== '' && 
                  String(skillLevel).toLowerCase() !== 'nulo' && 
                  String(skillLevel).toLowerCase() !== 'null') {
                
                // Combinar bloque y capacidad para crear el nombre completo
                const fullSkillName = `${blockName} - ${skillName.trim()}`;
                
                capacitiesToInsert.push({
                  person_name: String(employeeName || '').trim(),
                  skill: fullSkillName,
                  level: String(skillLevel || '').trim(),
                  certification: '',
                  comments: '',
                  evaluation_date: null
                });
              }
            }
          }
          
          // Insertar en Supabase
          if (capacitiesToInsert.length > 0) {
            const { error: insertError } = await supabase
              .from('capacities')
              .insert(capacitiesToInsert);
            
            if (insertError) {
              console.error('Error inserting capacities:', insertError);
              throw new Error('Error al insertar las capacidades en la base de datos');
            }
          }
          
          setUploading(false);
          setSelectedFile(null);
          
          toast({
            title: "✅ Carga completada exitosamente",
            description: `Se ha creado el backup automáticamente y se han cargado ${capacitiesToInsert.length} registros de capacidades.`,
          });
          
          onUploadComplete?.();
          
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
      <Card className="border-cyan-200 bg-cyan-50">
        <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <CardTitle>Procesando Capacidades...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
            <p className="text-cyan-800 font-medium">Cargando archivo Excel...</p>
            <p className="text-cyan-600 text-sm mt-2">Creando backup automático</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
        <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-6 w-6" />
            </div>
            <CardTitle>Cargar Capacidades</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Formato Requerido - Expandible */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setIsFormatExpanded(!isFormatExpanded)}
              className="w-full justify-between border-cyan-300 hover:bg-cyan-100"
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-cyan-600" />
                Formato requerido: Excel (.xlsx)
              </span>
              {isFormatExpanded ? 
                <ChevronUp className="h-4 w-4 text-cyan-600" /> : 
                <ChevronDown className="h-4 w-4 text-cyan-600" />
              }
            </Button>
            
            {isFormatExpanded && (
              <Alert className="mt-3 border-cyan-200 bg-cyan-50">
                <Info className="h-4 w-4 text-cyan-600" />
                <AlertDescription>
                  <div className="text-cyan-800">
                    <p className="font-semibold mb-2">Estructura esperada:</p>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                        <strong>Columna A:</strong> Id Empleado
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                        <strong>Columna B:</strong> Nombre
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                        <strong>Columnas C+:</strong> Capacidades por bloques
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="font-semibold text-xs">Bloques de conocimiento:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <span>• MÓDULO SAP</span>
                        <span>• IMPLANTACIÓN SAP</span>
                        <span>• IDIOMAS</span>
                        <span>• INDUSTRIA</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-cyan-100 rounded border border-cyan-300">
                      <p className="text-xs"><strong>Valores:</strong> Básico, Medio, Alto, Experto, Nulo</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Zona de Carga */}
          <div className="border-2 border-dashed border-cyan-300 rounded-lg p-8 text-center mb-4 hover:border-cyan-400 transition-colors">
            <Upload className="h-12 w-12 text-cyan-500 mx-auto mb-4" />
            <p className="text-cyan-800 font-medium mb-2">Arrastra el archivo Excel aquí</p>
            <p className="text-cyan-600 text-sm mb-4">Archivo Excel con capacidades por empleado</p>
            
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="capacities-file-input"
              disabled={processingFile}
            />
            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => document.getElementById('capacities-file-input')?.click()}
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
            <DialogTitle className="flex items-center gap-2 text-cyan-800">
              <Zap className="h-5 w-5" />
              Cargar Capacidades
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="py-4">
                <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <FileSpreadsheet className="h-8 w-8 text-cyan-600" />
                  <div className="flex-1">
                    <p className="font-medium text-cyan-800">{selectedFile.name}</p>
                    <p className="text-sm text-cyan-600">
                      Archivo: {formatFileSize(selectedFile.size)} • {fileRecordsCount} empleados
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
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={handleUploadConfirm}
            >
              <Upload className="h-4 w-4 mr-2" />
              Cargar Capacidades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CapacitiesUpload;