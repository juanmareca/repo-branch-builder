import React, { useState, useRef } from 'react';
import { Person } from '../types';
import { User, Mail, Calendar, MapPin, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface PersonTableProps {
  persons: Person[];
  onEditPerson?: (person: Person) => void;
}

const PersonTable: React.FC<PersonTableProps> = ({ persons, onEditPerson }) => {
  const [sortedPersons, setSortedPersons] = useState<Person[]>(persons);
  const [sortField, setSortField] = useState<keyof Person | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnWidths, setColumnWidths] = useState({
    index: 80,
    nombre: 250,
    cex: 120,
    num_pers: 120,
    fecha_incorporacion: 180,
    mail_empresa: 300,
    grupo: 150,
    categoria: 180,
    oficina: 150
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizingColumn = useRef<string | null>(null);

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

  if (persons.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay personas asignadas a este squad lead</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden w-full max-h-[70vh]">
      <div className="overflow-auto">
        <table className="w-full divide-y divide-border">
          <thead className="bg-muted sticky top-0 z-10">
            <tr className="bg-muted border-b border-border">
              <th 
                className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted sticky left-0 z-20 border-r border-border relative group"
                style={{ width: `${columnWidths.index}px` }}
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
                style={{ width: `${columnWidths.nombre}px` }}
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
                style={{ width: `${columnWidths.cex}px` }}
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
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('num_pers')}
                style={{ width: `${columnWidths.num_pers}px` }}
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
                className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none relative group"
                onClick={() => handleSort('fecha_incorporacion')}
                style={{ width: `${columnWidths.fecha_incorporacion}px` }}
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
                style={{ width: `${columnWidths.mail_empresa}px` }}
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
                style={{ width: `${columnWidths.grupo}px` }}
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
                style={{ width: `${columnWidths.categoria}px` }}
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
                style={{ width: `${columnWidths.oficina}px` }}
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
                  className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground font-mono bg-background sticky left-0 z-10 border-r border-border"
                  style={{ width: `${columnWidths.index}px` }}
                >
                  {index + 1}
                </td>
                <td className="px-6 py-2 whitespace-nowrap" style={{ width: `${columnWidths.nombre}px` }}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-foreground">{person.nombre}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.cex}px` }}>
                  {person.cex}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.num_pers}px` }}>
                  {person.num_pers}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.fecha_incorporacion}px` }}>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                    {person.fecha_incorporacion ? 
                      new Date(person.fecha_incorporacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : 
                      person.fecha_incorporacion
                    }
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.mail_empresa}px` }}>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                    <a href={`mailto:${person.mail_empresa}`} className="text-primary hover:text-primary/80">
                      {person.mail_empresa}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.grupo}px` }}>
                  {person.grupo}
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.categoria}px` }}>
                  <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                    {person.categoria}
                  </span>
                </td>
                <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground" style={{ width: `${columnWidths.oficina}px` }}>
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
  );
};

export default PersonTable;