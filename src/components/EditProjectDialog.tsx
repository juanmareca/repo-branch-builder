import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

interface Project {
  id: string;
  codigo_inicial: string;
  denominacion: string;
  descripcion: string;
  cliente: string;
  grupo_cliente: string;
  gestor_proyecto: string;
  socio_responsable: string;
  tipologia: string;
  tipologia_2: string;
  created_at: string;
  updated_at: string;
  origen: string;
}

interface EditProjectDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: Project) => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({
  project,
  open,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState<Project | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({ ...project });
    }
  }, [project]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof Project, value: string | number) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            Editar Proyecto
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="codigo_inicial">Código Inicial</Label>
            <Input
              id="codigo_inicial"
              value={formData.codigo_inicial}
              onChange={(e) => handleInputChange('codigo_inicial', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="denominacion">Denominación</Label>
            <Input
              id="denominacion"
              value={formData.denominacion}
              onChange={(e) => handleInputChange('denominacion', e.target.value)}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              value={formData.cliente}
              onChange={(e) => handleInputChange('cliente', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo_cliente">Grupo Cliente</Label>
            <Input
              id="grupo_cliente"
              value={formData.grupo_cliente}
              onChange={(e) => handleInputChange('grupo_cliente', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gestor_proyecto">Gestor Proyecto</Label>
            <Input
              id="gestor_proyecto"
              value={formData.gestor_proyecto}
              onChange={(e) => handleInputChange('gestor_proyecto', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="socio_responsable">Socio Responsable</Label>
            <Input
              id="socio_responsable"
              value={formData.socio_responsable}
              onChange={(e) => handleInputChange('socio_responsable', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipologia">Tipología</Label>
            <Input
              id="tipologia"
              value={formData.tipologia}
              onChange={(e) => handleInputChange('tipologia', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipologia_2">Tipología 2</Label>
            <Input
              id="tipologia_2"
              value={formData.tipologia_2}
              onChange={(e) => handleInputChange('tipologia_2', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;