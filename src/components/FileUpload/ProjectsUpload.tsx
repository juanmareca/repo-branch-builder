import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderOpen, Upload, FileText, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const ProjectsUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: number; errors: number } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processExcelFile = (file: File): Promise<any[]> => {
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

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadResult(null);
    
    try {
      const rawData = await processExcelFile(file);
      
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

      // Insertar los proyectos en la base de datos
      const { data, error } = await supabase
        .from('projects')
        .insert(projectsToInsert)
        .select();

      if (error) {
        console.error('Error inserting projects:', error);
        throw error;
      }

      setUploadResult({ success: data?.length || 0, errors: 0 });
      
      toast({
        title: "Carga exitosa",
        description: `Se han cargado ${data?.length || 0} proyectos correctamente.`,
      });

      setFile(null);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadResult({ success: 0, errors: 1 });
      
      toast({
        title: "Error en la carga",
        description: error.message || "Ha ocurrido un error al procesar el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-purple-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-purple-800">Cargar Proyectos</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-purple-600 hover:text-purple-800"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <div className="space-y-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              {file && (
                <p className="text-sm text-purple-600 font-medium">{file.name}</p>
              )}
            </div>
          </div>

          {showDetails && (
            <Alert className="border-orange-200 bg-orange-50">
              <FileText className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="space-y-2">
                  <p className="font-medium">Formato requerido: Excel (.xlsx)</p>
                  <div>
                    <p className="font-medium mb-1">Columnas requeridas:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Código Proyecto</li>
                      <li>• Denominación</li>
                      <li>• Cliente</li>
                      <li>• Grupo Cliente</li>
                      <li>• Gestor Proyecto</li>
                      <li>• Socio Responsable</li>
                      <li>• Tipología</li>
                      <li>• Descripción</li>
                      <li>• Fecha Inicio</li>
                      <li>• Fecha Fin</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {uploadResult && (
            <Alert className={uploadResult.errors > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              {uploadResult.errors > 0 ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={uploadResult.errors > 0 ? "text-red-800" : "text-green-800"}>
                {uploadResult.errors > 0 ? (
                  <span>Error en la carga. Revisa el formato del archivo.</span>
                ) : (
                  <span>¡Carga exitosa! Se procesaron {uploadResult.success} proyectos.</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'Cargando...' : 'Cargar Archivo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectsUpload;