import React, { useState, useRef } from 'react';
import { Person } from '../types';
import { User, Mail, Calendar, MapPin, ChevronUp, ChevronDown, ChevronsUpDown, Type, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PersonTableProps {
  persons: Person[];
  onEditPerson?: (person: Person) => void;
}

const PersonTable: React.FC<PersonTableProps> = ({ persons, onEditPerson }) => {
  const [sortedPersons, setSortedPersons] = useState<Person[]>(persons);
  const [sortField, setSortField] = useState<keyof Person | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnWidths, setColumnWidths] = useState({
    index: 60,
    nombre: 280,
    cex: 100,
    num_pers: 110,
    fecha_incorporacion: 160,
    mail_empresa: 320,
    grupo: 140,
    categoria: 200,
    oficina: 120
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizingColumn = useRef<string | null>(null);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Update sorted persons when persons prop changes
  React.useEffect(() => {
    setSortedPersons(persons);
  }, [persons]);

  const handleSort = (field: keyof Person) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...persons].sort((a, b) => {
      let aValue: any = a[field];
      let bValue: any = b[field];
      
      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
      
      if (newDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    setSortedPersons(sorted);
  };

  const getSortIcon = (field: keyof Person) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleMouseDown = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setIsResizing(true);
    resizingColumn.current = column;
    
    const startX = e.clientX;
    const startWidth = columnWidths[column as keyof typeof columnWidths];
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn.current) return;
      
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn.current!]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      resizingColumn.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getFontSizeLabel = () => {
    switch (fontSize) {
      case 'small': return 'Pequeño';
      case 'large': return 'Grande';
      default: return 'Mediano';
    }
  };

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    if (direction === 'increase') {
      if (fontSize === 'small') setFontSize('medium');
      else if (fontSize === 'medium') setFontSize('large');
    } else {
      if (fontSize === 'large') setFontSize('medium');
      else if (fontSize === 'medium') setFontSize('small');
    }
  };

  if (persons.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay personas asignadas a este squad lead</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de tamaño de letra */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-sm text-muted-foreground">Tamaño de letra:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustFontSize('decrease')}
          disabled={fontSize === 'small'}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm min-w-[60px] text-center">{getFontSizeLabel()}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustFontSize('increase')}
          disabled={fontSize === 'large'}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Tabla */}
    <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden w-full max-h-[70vh]">
      <div className="overflow-auto">
        <table className="w-full divide-y divide-border table-fixed">
          <colgroup>
            <col style={{ width: `${columnWidths.index}px` }} />
            <col style={{ width: `${columnWidths.nombre}px` }} />
            <col style={{ width: `${columnWidths.cex}px` }} />
            <col style={{ width: `${columnWidths.num_pers}px` }} />
            <col style={{ width: `${columnWidths.fecha_incorporacion}px` }} />
            <col style={{ width: `${columnWidths.mail_empresa}px` }} />
            <col style={{ width: `${columnWidths.grupo}px` }} />
            <col style={{ width: `${columnWidths.categoria}px` }} />
            <col style={{ width: `${columnWidths.oficina}px` }} />
          </colgroup>
          <thead className="bg-muted sticky top-0 z-10">
            <tr className="bg-muted border-b border-border">
              <th 
                className={`px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted sticky left-0 z-20 border-r border-border relative group ${getFontSizeClass()}`}
              >
                Índice
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'index')}
                />
              </th>
              <th 
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('nombre')}
              >
                <div className="flex items-center justify-between">
                  <span>Nombre</span>
                  {getSortIcon('nombre')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'nombre')}
                />
              </th>
              <th 
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('cex')}
              >
                <div className="flex items-center justify-between">
                  <span>CEX</span>
                  {getSortIcon('cex')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'cex')}
                />
              </th>
              <th 
                className="px-6 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('num_pers')}
              >
                <div className="flex items-center justify-between">
                  <span>Nº Personal</span>
                  {getSortIcon('num_pers')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'num_pers')}
                />
              </th>
              <th 
                className="px-6 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('fecha_incorporacion')}
              >
                <div className="flex items-center justify-between">
                  <span>Fecha de Incorporación</span>
                  {getSortIcon('fecha_incorporacion')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'fecha_incorporacion')}
                />
              </th>
              <th 
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('mail_empresa')}
              >
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  {getSortIcon('mail_empresa')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'mail_empresa')}
                />
              </th>
              <th 
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('grupo')}
              >
                <div className="flex items-center justify-between">
                  <span>Grupo</span>
                  {getSortIcon('grupo')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'grupo')}
                />
              </th>
              <th 
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('categoria')}
              >
                <div className="flex items-center justify-between">
                  <span>Categoría</span>
                  {getSortIcon('categoria')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'categoria')}
                />
              </th>
              <th 
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('oficina')}
              >
                <div className="flex items-center justify-between">
                  <span>Oficina</span>
                  {getSortIcon('oficina')}
                </div>
                <div 
                  className="absolute right-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/50 group-hover:bg-primary/30"
                  onMouseDown={(e) => handleMouseDown(e, 'oficina')}
                />
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {sortedPersons.map((person, index) => (
              <tr 
                key={person.id || index} 
                className={`hover:bg-muted/50 transition-colors duration-150 ${
                  person.origen === 'Administrador' ? 'bg-red-50 dark:bg-red-950/20' : 
                  person.origen === 'Squad Lead' ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                }`}
              >
                <td 
                  className={`px-3 py-2 whitespace-nowrap text-muted-foreground font-mono bg-background sticky left-0 z-10 border-r border-border ${getFontSizeClass()}`}
                >
                  {index + 1}
                </td>
                <td className={`px-6 py-2 whitespace-nowrap ${getFontSizeClass()}`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="ml-3">
                      <div className={`font-medium text-foreground ${getFontSizeClass()}`}>{person.nombre}</div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground text-center ${getFontSizeClass()}`}>
                  {person.cex}
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground text-center ${getFontSizeClass()}`}>
                  {person.num_pers}
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground text-center ${getFontSizeClass()}`}>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                    {(() => {
                      if (!person.fecha_incorporacion) return '';
                      
                      // Si ya está en formato dd/mm/yyyy, mostrarlo tal como está
                      if (person.fecha_incorporacion.includes('/')) {
                        return person.fecha_incorporacion;
                      }
                      
                      // Si es un número (fecha serial de Excel), convertirlo
                      const excelDate = parseInt(person.fecha_incorporacion);
                      if (!isNaN(excelDate) && excelDate > 0) {
                        // Excel epoch: 1 de enero de 1900 (pero Excel considera 1900 como año bisiesto incorrectamente)
                        const excelEpoch = new Date(1900, 0, 1);
                        const jsDate = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
                        return jsDate.toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      }
                      
                      return person.fecha_incorporacion;
                    })()}
                  </div>
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground ${getFontSizeClass()}`}>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                    <a href={`mailto:${person.mail_empresa}`} className="text-primary hover:text-primary/80">
                      {person.mail_empresa}
                    </a>
                  </div>
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground ${getFontSizeClass()}`}>
                  {person.grupo}
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground ${getFontSizeClass()}`}>
                  <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                    {person.categoria}
                  </span>
                </td>
                <td className={`px-6 py-2 whitespace-nowrap text-foreground ${getFontSizeClass()}`}>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                    {person.oficina}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
};

export default PersonTable;