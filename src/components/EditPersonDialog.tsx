import React, { useState, useEffect } from 'react';
import { Person } from '@/types';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditPersonDialogProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (person: Person) => void;
  availableOptions: {
    cex: string[];
    grupo: string[];
    categoria: string[];
    oficina: string[];
    squadLeads: string[];
  };
}

const EditPersonDialog: React.FC<EditPersonDialogProps> = ({
  person,
  open,
  onOpenChange,
  onSave,
  availableOptions,
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Helper function to convert Excel date serial number to Date
  const convertExcelDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    
    // Check if it's an Excel serial number (numeric)
    if (/^\d+$/.test(dateStr)) {
      const excelEpoch = new Date(1899, 11, 30); // Excel epoch
      const days = parseInt(dateStr);
      return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    }
    
    // Try to parse as regular date
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  // Helper function to format date for display
  const formatDateForInput = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  useEffect(() => {
    if (person) {
      setFormData(person);
      
      // Handle date conversion
      const convertedDate = convertExcelDate(person.fecha_incorporacion);
      setSelectedDate(convertedDate);
      
      // Update formData with formatted date if converted successfully
      if (convertedDate) {
        setFormData(prev => ({
          ...prev,
          fecha_incorporacion: formatDateForInput(convertedDate)
        }));
      }
    }
  }, [person]);

  const handleSave = () => {
    const dataToSave = { ...formData };
    
    // If we have a selected date, format it properly
    if (selectedDate) {
      dataToSave.fecha_incorporacion = formatDateForInput(selectedDate);
    }
    
    onSave(dataToSave);
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
            <Select
              value={formData.cex}
              onValueChange={(value) => handleInputChange('cex', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar CEX" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {availableOptions.cex.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDateForInput(selectedDate) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border border-border z-50" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      handleInputChange('fecha_incorporacion', formatDateForInput(date));
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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
            <Select
              value={formData.grupo}
              onValueChange={(value) => handleInputChange('grupo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Grupo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {availableOptions.grupo.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Categoría" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {availableOptions.categoria.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="oficina">Oficina</Label>
            <div className="space-y-2">
              <Input
                id="oficina"
                value={formData.oficina}
                onChange={(e) => handleInputChange('oficina', e.target.value)}
                placeholder="Escribir oficina manualmente..."
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                O seleccionar de las opciones existentes:
              </div>
              <Select
                value=""
                onValueChange={(value) => handleInputChange('oficina', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar oficina existente..." />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {availableOptions.oficina.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="squad_lead">Squad Lead</Label>
            <Select
              value={formData.squad_lead}
              onValueChange={(value) => handleInputChange('squad_lead', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar Squad Lead" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {availableOptions.squadLeads.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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