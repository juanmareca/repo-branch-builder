import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface UserRow {
  nombre: string;
  password: string;
  rol: string;
}

interface UsersUploadProps {
  onUploadComplete?: () => void;
}

export default function UsersUpload({ onUploadComplete }: UsersUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const validateRole = (rol: string): 'admin' | 'squad_lead' | 'operations' | null => {
    const normalizedRole = rol?.toLowerCase().trim();
    
    if (normalizedRole === 'administrador' || normalizedRole === 'admin') return 'admin';
    if (normalizedRole === 'squad lead' || normalizedRole === 'squad_lead' || normalizedRole === 'squadlead') return 'squad_lead';
    if (normalizedRole === 'operaciones' || normalizedRole === 'operations') return 'operations';
    
    return null;
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "❌ Formato no válido",
        description: "Solo se permiten archivos Excel (.xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<UserRow>(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: "❌ Archivo vacío",
          description: "El archivo no contiene datos válidos",
          variant: "destructive",
        });
        return;
      }

      // Validar estructura del archivo con debugging mejorado
      const requiredColumns = ['nombre', 'password', 'rol'];
      const firstRow = jsonData[0] || {};
      const originalHeaders = Object.keys(firstRow);
      
      console.log('📋 Primeras 3 filas del Excel:', jsonData.slice(0, 3));
      console.log('📋 Headers originales:', originalHeaders);
      
      // Normalizar headers (quitar espacios, convertir a minúsculas)
      const normalizedHeaders = originalHeaders.map(h => 
        h.toString().toLowerCase().trim().replace(/\s+/g, '')
      );
      
      console.log('📋 Headers normalizados:', normalizedHeaders);
      console.log('📋 Columnas requeridas:', requiredColumns);
      
      const missingColumns = requiredColumns.filter(col => 
        !normalizedHeaders.includes(col.toLowerCase())
      );

      if (missingColumns.length > 0) {
        console.error('❌ Columnas faltantes:', missingColumns);
        toast({
          title: "❌ Estructura incorrecta",
          description: `El archivo debe contener las columnas: ${requiredColumns.join(', ')}. Encontradas: ${originalHeaders.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Procesar y validar datos
      const usersToCreate = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2; // Excel row number (header is row 1)

        if (!row.nombre?.trim()) {
          errors.push(`Fila ${rowNum}: Nombre requerido`);
          continue;
        }

        if (!row.password || !row.password.toString().trim()) {
          errors.push(`Fila ${rowNum}: Password requerido`);
          continue;
        }

        const validRole = validateRole(row.rol);
        if (!validRole) {
          errors.push(`Fila ${rowNum}: Rol inválido "${row.rol}". Debe ser: Administrador, Squad Lead, o Operaciones`);
          continue;
        }

        usersToCreate.push({
          name: row.nombre.trim(),
          password: row.password.toString().trim(),
          role: validRole
        });
      }

      if (errors.length > 0) {
        toast({
          title: "❌ Errores en el archivo",
          description: `Se encontraron ${errors.length} errores. Revisa el formato.`,
          variant: "destructive",
        });
        console.log('Errores encontrados:', errors);
        return;
      }

      // Crear usuarios en Supabase
      let successCount = 0;
      let errorCount = 0;

      console.log('Usuarios a crear:', usersToCreate);

      for (const user of usersToCreate) {
        try {
          console.log(`Creando usuario: ${user.name} con rol: ${user.role}`);
          
          // Crear perfil directamente en la tabla profiles sin email
          const userId = crypto.randomUUID();
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              name: user.name,
              role: user.role,
              is_active: true
            });

          console.log('Datos enviados:', { id: userId, name: user.name, role: user.role, is_active: true });

          if (profileError) {
            console.error(`Error creando perfil para ${user.name}:`, profileError);
            errorCount++;
          } else {
            console.log(`Usuario ${user.name} creado exitosamente`);
            successCount++;
          }

        } catch (error) {
          console.error(`Error procesando usuario ${user.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "✅ Usuarios creados",
          description: `Se crearon ${successCount} usuarios correctamente${errorCount > 0 ? `. ${errorCount} errores.` : '.'}`,
        });
        onUploadComplete?.();
      } else {
        toast({
          title: "❌ Error al crear usuarios",
          description: "No se pudo crear ningún usuario. Revisa los logs para más detalles.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error procesando archivo:', error);
      toast({
        title: "❌ Error al procesar archivo",
        description: error.message || "Error desconocido al procesar el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Subir Usuarios desde Excel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Formato requerido del archivo Excel:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>nombre</strong>: Nombre completo del usuario</li>
                  <li><strong>password</strong>: Contraseña del usuario</li>
                  <li><strong>rol</strong>: Administrador, Squad Lead, o Operaciones</li>
                </ul>
              </div>
            </div>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {uploading ? (
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <Upload className="h-6 w-6 text-primary" />
                )}
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  {uploading ? 'Procesando archivo...' : 'Arrastra tu archivo Excel aquí'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  o haz clic para seleccionar
                </p>
              </div>
              
              <Button
                variant="outline"
                disabled={uploading}
                className="pointer-events-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                Seleccionar archivo Excel
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}