import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Upload, FileText, Info } from 'lucide-react';

const ResourcesUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    // TODO: Implement file upload logic
    setTimeout(() => {
      setUploading(false);
      setFile(null);
    }, 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-blue-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-blue-800">Cargar Recursos</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <div className="space-y-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
              />
              {file && (
                <p className="text-sm text-blue-600 font-medium">{file.name}</p>
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
                      <li>• Nombre</li>
                      <li>• CEX</li>
                      <li>• Número Personal</li>
                      <li>• Fecha Incorporación</li>
                      <li>• Email Empresa</li>
                      <li>• Grupo</li>
                      <li>• Categoría</li>
                      <li>• Oficina</li>
                      <li>• Skills (1 y 2)</li>
                      <li>• Nivel Inglés</li>
                      <li>• Squad Lead</li>
                    </ul>
                  </div>
                </div>
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

export default ResourcesUpload;