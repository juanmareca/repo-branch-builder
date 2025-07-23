import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ValidationError {
  type: 'person' | 'project';
  code: string;
  name?: string;
  row: number;
}

interface AssignmentRecord {
  personCode: string;
  personName: string;
  projectCode: string;
  assignments: Record<string, number>; // fecha -> porcentaje
}

const AssignmentsUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState<'replace' | 'add'>('replace');
  const [rowCount, setRowCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validRecordsCount, setValidRecordsCount] = useState(0);

  const processExcelFile = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Contar filas con datos (excluyendo header)
          const dataRows = jsonData.slice(1).filter((row: any) => row && row.length > 0 && row[0]);
          resolve(dataRows.length);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      const count = await processExcelFile(selectedFile);
      setFile(selectedFile);
      setRowCount(count);
      setShowUploadDialog(true);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error al procesar el archivo Excel');
    }
  };

  const validateRecords = async (records: AssignmentRecord[]): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    
    // Obtener códigos de personas existentes
    const { data: persons } = await supabase
      .from('persons')
      .select('num_pers, nombre');
    
    const personCodes = new Set(persons?.map(p => p.num_pers) || []);
    
    // Obtener códigos de proyectos existentes
    const { data: projects } = await supabase
      .from('projects')
      .select('codigo_inicial');
    
    const projectCodes = new Set(projects?.map(p => p.codigo_inicial) || []);
    
    records.forEach((record, index) => {
      // Validar código de persona
      if (!personCodes.has(record.personCode)) {
        errors.push({
          type: 'person',
          code: record.personCode,
          name: record.personName,
          row: index + 2 // +2 porque empezamos desde fila 1 y excluimos header
        });
      }
      
      // Validar código de proyecto
      if (!projectCodes.has(record.projectCode)) {
        errors.push({
          type: 'project',
          code: record.projectCode,
          row: index + 2
        });
      }
    });
    
    return errors;
  };

  const parseExcelData = (file: File): Promise<AssignmentRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const records: AssignmentRecord[] = [];
          const headerRow = jsonData[0];
          
          // Encontrar índices de las fechas (a partir de la columna K)
          const dateStartIndex = 10; // Columna K es índice 10
          const dateColumns: { index: number; date: string }[] = [];
          
          for (let i = dateStartIndex; i < headerRow.length; i++) {
            const cellValue = headerRow[i];
            if (cellValue && typeof cellValue === 'string') {
              // Verificar si es una fecha válida en formato DD/MM/YYYY
              const dateMatch = cellValue.match(/^\d{2}\/\d{2}\/\d{4}$/);
              if (dateMatch) {
                dateColumns.push({ index: i, date: cellValue });
              }
            }
          }
          
          // Procesar cada fila de datos
          for (let rowIndex = 1; rowIndex < jsonData.length; rowIndex++) {
            const row = jsonData[rowIndex];
            if (!row || !row[0]) continue; // Saltar filas vacías
            
            const personCode = String(row[0]).trim();
            const personName = String(row[1] || '').trim();
            const projectCode = String(row[2] || '').split('-')[0].trim(); // Todo antes del guión
            
            if (!personCode || !projectCode) continue;
            
            const assignments: Record<string, number> = {};
            
            // Procesar asignaciones para cada fecha
            dateColumns.forEach(({ index, date }) => {
              const value = row[index];
              if (value !== undefined && value !== null && value !== '') {
                const stringValue = String(value).trim();
                
                // Ignorar FS (Fin de Semana), V (Vacaciones), F (Festivos)
                if (!['FS', 'V', 'F'].includes(stringValue)) {
                  const percentage = parseFloat(stringValue);
                  if (!isNaN(percentage) && percentage > 0) {
                    // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
                    const [day, month, year] = date.split('/');
                    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    assignments[isoDate] = percentage;
                  }
                }
              }
            });
            
            // Solo añadir el registro si tiene al menos una asignación
            if (Object.keys(assignments).length > 0) {
              records.push({
                personCode,
                personName,
                projectCode,
                assignments
              });
            }
          }
          
          resolve(records);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUploadConfirm = async () => {
    if (!file) return;
    
    setUploading(true);
    setShowUploadDialog(false);
    
    try {
      // Parsear datos del Excel
      const records = await parseExcelData(file);
      
      // Validar registros
      const errors = await validateRecords(records);
      setValidationErrors(errors);
      setValidRecordsCount(records.length - errors.length);
      
      if (errors.length > 0) {
        setShowConflictDialog(true);
        setUploading(false);
        return;
      }
      
      // Si no hay errores, proceder con la carga
      await processUpload(records);
      
    } catch (error) {
      console.error('Error during upload:', error);
      toast.error('Error al procesar el archivo de asignaciones');
      setUploading(false);
    }
  };

  const processUpload = async (records?: AssignmentRecord[]) => {
    if (!file && !records) return;
    
    try {
      setUploading(true);
      
      let finalRecords = records;
      if (!finalRecords) {
        finalRecords = await parseExcelData(file!);
      }
      
      // Crear backup antes de proceder
      const { data: existingAssignments } = await supabase
        .from('assignments')
        .select('*');
      
      if (existingAssignments && existingAssignments.length > 0) {
        const { error: backupError } = await supabase
          .from('backups')
          .insert({
            table_name: 'assignments',
            backup_data: existingAssignments,
            record_count: existingAssignments.length,
            file_name: `assignments_backup_${new Date().toISOString()}`,
            created_by: 'Administrador'
          });
        
        if (backupError) {
          console.error('Error creating backup:', backupError);
          toast.error('Error al crear backup de asignaciones');
          return;
        }
      }
      
      // Si es modo reemplazar, eliminar todas las asignaciones existentes
      if (uploadMode === 'replace') {
        const { error: deleteError } = await supabase
          .from('assignments')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
        
        if (deleteError) {
          console.error('Error deleting existing assignments:', deleteError);
          toast.error('Error al eliminar asignaciones existentes');
          return;
        }
      }
      
      // Obtener mapeo de códigos a IDs
      const { data: persons } = await supabase
        .from('persons')
        .select('id, num_pers');
      
      const { data: projects } = await supabase
        .from('projects')
        .select('id, codigo_inicial');
      
      const personMap = new Map(persons?.map(p => [p.num_pers, p.id]) || []);
      const projectMap = new Map(projects?.map(p => [p.codigo_inicial, p.id]) || []);
      
      // Convertir registros a formato de asignaciones
      const assignmentsToInsert: any[] = [];
      
      for (const record of finalRecords) {
        const personId = personMap.get(record.personCode);
        const projectId = projectMap.get(record.projectCode);
        
        if (!personId || !projectId) continue; // Saltar registros inválidos
        
        // Crear una asignación por cada fecha con porcentaje > 0
        Object.entries(record.assignments).forEach(([date, percentage]) => {
          assignmentsToInsert.push({
            person_id: personId,
            project_id: projectId,
            start_date: date,
            end_date: date,
            hours_allocated: Math.round((percentage / 100) * 8), // Asumiendo 8 horas por día
            type: 'project',
            status: 'assigned',
            notes: `Migrado desde Excel - ${percentage}% asignación`
          });
        });
      }
      
      // Insertar asignaciones en lotes
      const batchSize = 1000;
      for (let i = 0; i < assignmentsToInsert.length; i += batchSize) {
        const batch = assignmentsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('assignments')
          .insert(batch);
        
        if (insertError) {
          console.error('Error inserting assignments batch:', insertError);
          toast.error(`Error al insertar lote de asignaciones: ${insertError.message}`);
          return;
        }
      }
      
      toast.success(`✅ Migración completada: ${assignmentsToInsert.length} asignaciones importadas`);
      
      // Limpiar estado
      setFile(null);
      setShowConflictDialog(false);
      setValidationErrors([]);
      
      // Resetear input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error during upload:', error);
      toast.error('Error durante la migración de asignaciones');
    } finally {
      setUploading(false);
    }
  };

  const getPersonErrors = () => validationErrors.filter(e => e.type === 'person');
  const getProjectErrors = () => validationErrors.filter(e => e.type === 'project');

  return (
    <>
      <Card className="hover:shadow-lg transition-all border-emerald-200 hover:border-emerald-300">
        <CardHeader className="bg-emerald-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-emerald-800">Migración de Asignaciones</CardTitle>
              <p className="text-sm text-emerald-600 mt-1">
                Cargar asignaciones desde archivos Excel
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-emerald-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
              <FileText className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">
                Selecciona un archivo Excel con las asignaciones a migrar
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="assignments-upload"
              />
              <label htmlFor="assignments-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Seleccionar Archivo Excel</span>
                </Button>
              </label>
            </div>

            {file && (
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">
                    Archivo seleccionado: {file.name}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  {rowCount} registros detectados
                </p>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-700">
                  <p className="font-semibold mb-1">Formato requerido:</p>
                  <ul className="space-y-1">
                    <li>• Columna A: Nº Pers (código de empleado)</li>
                    <li>• Columna B: Nombre (opcional, se ignora)</li>
                    <li>• Columna C: Código de proyecto (antes del guión)</li>
                    <li>• Columnas K en adelante: Fechas DD/MM/YYYY con porcentajes</li>
                    <li>• Se ignoran: FS (fin semana), V (vacaciones), F (festivos)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación inicial */}
      <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Migración de Asignaciones</AlertDialogTitle>
            <AlertDialogDescription>
              Se procesarán {rowCount} registros del archivo "{file?.name}".
              
              <div className="mt-4 space-y-3">
                <Label className="text-sm font-medium">Modo de migración:</Label>
                <RadioGroup value={uploadMode} onValueChange={(value: 'replace' | 'add') => setUploadMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="text-sm">
                      Reemplazar todas las asignaciones existentes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="text-sm">
                      Mantener asignaciones existentes y añadir nuevas
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUploadConfirm}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Continuar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de errores de validación */}
      <AlertDialog open={showConflictDialog} onOpenChange={setShowConflictDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Errores de Validación Detectados
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <p>
                  Se van a migrar <strong>{validRecordsCount}</strong> asignaciones válidas.
                  Se encontraron <strong>{validationErrors.length}</strong> errores:
                </p>

                {getPersonErrors().length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">
                      Códigos de empleado no encontrados ({getPersonErrors().length}):
                    </h4>
                    <div className="max-h-32 overflow-y-auto text-xs text-red-700">
                      {getPersonErrors().slice(0, 10).map((error, index) => (
                        <div key={index}>
                          Fila {error.row}: {error.code} {error.name && `(${error.name})`}
                        </div>
                      ))}
                      {getPersonErrors().length > 10 && (
                        <div className="text-red-600 font-medium">
                          ... y {getPersonErrors().length - 10} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {getProjectErrors().length > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">
                      Códigos de proyecto no encontrados ({getProjectErrors().length}):
                    </h4>
                    <div className="max-h-32 overflow-y-auto text-xs text-orange-700">
                      {getProjectErrors().slice(0, 10).map((error, index) => (
                        <div key={index}>
                          Fila {error.row}: {error.code}
                        </div>
                      ))}
                      {getProjectErrors().length > 10 && (
                        <div className="text-orange-600 font-medium">
                          ... y {getProjectErrors().length - 10} más
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-sm">
                  ¿Desea continuar con la migración de los registros válidos o prefiere 
                  depurar el archivo y volver a cargarlo correctamente?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConflictDialog(false);
              setValidationErrors([]);
              setUploading(false);
            }}>
              Depurar Archivo
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => processUpload()}
              disabled={uploading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : (
                `Migrar ${validRecordsCount} Registros Válidos`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AssignmentsUpload;