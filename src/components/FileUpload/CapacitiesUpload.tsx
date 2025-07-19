import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Zap, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CapacitiesUploadProps {
  onUploadComplete?: () => void;
}

const CapacitiesUpload = ({ onUploadComplete }: CapacitiesUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      // TODO: Implement actual file processing logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Archivo procesado",
        description: `Se ha cargado correctamente el archivo ${file.name}`,
      });
      
      setFile(null);
      const fileInput = document.getElementById('capacities-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      onUploadComplete?.();
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-cyan-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-600 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-cyan-800">Cargar Capacidades</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-cyan-200 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <div className="space-y-2">
              <Input
                id="capacities-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              {file && (
                <p className="text-sm text-cyan-600 font-medium">{file.name}</p>
              )}
            </div>
          </div>

          <Alert className="border-orange-200 bg-orange-50">
            <FileText className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-medium">Formato requerido: Excel (.xlsx)</p>
                <div>
                  <p className="font-medium mb-1">Estructura esperada:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>Columna A:</strong> Id Empleado</li>
                    <li>• <strong>Columna B:</strong> Nombre</li>
                    <li>• <strong>Columnas C en adelante:</strong> Capacidades organizadas por bloques:</li>
                    <li className="ml-4">- MÓDULO SAP (múltiples columnas)</li>
                    <li className="ml-4">- IMPLANTACIÓN SAP (múltiples columnas)</li>
                    <li className="ml-4">- IDIOMAS (Inglés, Francés, Alemán, etc.)</li>
                    <li className="ml-4">- INDUSTRIA (diversos sectores)</li>
                  </ul>
                  <p className="text-xs mt-2 text-orange-700">
                    <strong>Valores permitidos:</strong> Básico, Medio, Alto, Experto, Nulo, etc.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'Procesando archivo...' : 'Procesar Archivo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CapacitiesUpload;