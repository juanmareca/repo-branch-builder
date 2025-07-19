import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap,
  Upload,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CapacitiesUploadProps {
  onUploadComplete?: () => void;
}

const CapacitiesUpload = ({ onUploadComplete }: CapacitiesUploadProps) => {
  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "Archivo seleccionado",
        description: `Se ha seleccionado el archivo ${file.name}`,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      // TODO: Implement actual file processing logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "✅ Carga completada exitosamente",
        description: `Se ha procesado correctamente el archivo ${selectedFile.name}`,
      });
      
      setSelectedFile(null);
      const fileInput = document.getElementById('capacities-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      onUploadComplete?.();
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "❌ Error en la carga",
        description: "No se pudo procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
            <p className="text-cyan-600 text-sm mt-2">Procesando capacidades por empleado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
          />
          <Button 
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={() => document.getElementById('capacities-file-input')?.click()}
          >
            Seleccionar Archivo
          </Button>
        </div>

        {/* Mostrar archivo seleccionado */}
        {selectedFile && (
          <div className="mb-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <p className="font-medium text-cyan-800">{selectedFile.name}</p>
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700"
            >
              {uploading ? 'Procesando...' : 'Procesar Archivo'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CapacitiesUpload;