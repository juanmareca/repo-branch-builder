import React, { useState, useEffect } from 'react';
import { Person } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X } from 'lucide-react';

interface EditPersonDialogProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (person: Person) => void;
}

const EditPersonDialog: React.FC<EditPersonDialogProps> = ({
  person,
  open,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState<Person>({
    id: '',
    nombre: '',
    cex: '',
    num_pers: '',
    fecha_incorporacion: '',
    mail_empresa: '',
    grupo: '',
    categoria: '',
    oficina: '',
    squad_lead: '',
    origen: 'Fichero',
    created_at: '',
    updated_at: '',
  });

  useEffect(() => {
    if (person) {
      setFormData(person);
    }
  }, [person]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleInputChange = (field: keyof Person, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Editar Persona
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cex">CEX</Label>
            <Input
              id="cex"
              value={formData.cex}
              onChange={(e) => handleInputChange('cex', e.target.value)}
              placeholder="Código CEX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num_pers">Número Personal</Label>
            <Input
              id="num_pers"
              value={formData.num_pers}
              onChange={(e) => handleInputChange('num_pers', e.target.value)}
              placeholder="Número de personal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_incorporacion">Fecha Incorporación</Label>
            <Input
              id="fecha_incorporacion"
              value={formData.fecha_incorporacion}
              onChange={(e) => handleInputChange('fecha_incorporacion', e.target.value)}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail_empresa">Email Empresa</Label>
            <Input
              id="mail_empresa"
              type="email"
              value={formData.mail_empresa}
              onChange={(e) => handleInputChange('mail_empresa', e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo</Label>
            <Input
              id="grupo"
              value={formData.grupo}
              onChange={(e) => handleInputChange('grupo', e.target.value)}
              placeholder="Grupo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Input
              id="categoria"
              value={formData.categoria}
              onChange={(e) => handleInputChange('categoria', e.target.value)}
              placeholder="Categoría profesional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oficina">Oficina</Label>
            <Input
              id="oficina"
              value={formData.oficina}
              onChange={(e) => handleInputChange('oficina', e.target.value)}
              placeholder="Oficina"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="squad_lead">Squad Lead</Label>
            <Input
              id="squad_lead"
              value={formData.squad_lead}
              onChange={(e) => handleInputChange('squad_lead', e.target.value)}
              placeholder="Nombre del Squad Lead"
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
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPersonDialog;