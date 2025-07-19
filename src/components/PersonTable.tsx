import React, { useState } from 'react';
import { Person } from '../types';
import { User, Mail, Calendar, MapPin, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface PersonTableProps {
  persons: Person[];
}

const PersonTable: React.FC<PersonTableProps> = ({ persons }) => {
  const [sortedPersons, setSortedPersons] = useState<Person[]>(persons);
  const [sortField, setSortField] = useState<keyof Person | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  if (persons.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay personas asignadas a este squad lead</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl shadow-sm border border-border overflow-hidden w-full max-h-[70vh] min-w-[1600px]">
      <div className="overflow-auto">
        <table className="w-full divide-y divide-border table-auto">
          <thead className="bg-muted sticky top-0 z-10">
          <tr className="bg-muted border-b border-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 bg-muted sticky left-0 z-20 border-r border-border">
              Índice
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('nombre')}
            >
              <div className="flex items-center justify-between">
                <span>Nombre</span>
                {getSortIcon('nombre')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('cex')}
            >
              <div className="flex items-center justify-between">
                <span>CEX</span>
                {getSortIcon('cex')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('num_pers')}
            >
              <div className="flex items-center justify-between">
                <span>Nº Pers.</span>
                {getSortIcon('num_pers')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('fecha_incorporacion')}
            >
              <div className="flex items-center justify-between">
                <span>Fecha Inc.</span>
                {getSortIcon('fecha_incorporacion')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('mail_empresa')}
            >
              <div className="flex items-center justify-between">
                <span>Email</span>
                {getSortIcon('mail_empresa')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('grupo')}
            >
              <div className="flex items-center justify-between">
                <span>Grupo</span>
                {getSortIcon('grupo')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('categoria')}
            >
              <div className="flex items-center justify-between">
                <span>Categoría</span>
                {getSortIcon('categoria')}
              </div>
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('oficina')}
            >
              <div className="flex items-center justify-between">
                <span>Oficina</span>
                {getSortIcon('oficina')}
              </div>
            </th>
            <th className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Skills
            </th>
            <th 
              className="px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted cursor-pointer hover:bg-muted/80 select-none"
              onClick={() => handleSort('nivel_ingles')}
            >
              <div className="flex items-center justify-between">
                <span>Inglés</span>
                {getSortIcon('nivel_ingles')}
              </div>
            </th>
          </tr>
        </thead>
          <tbody className="bg-background divide-y divide-border">
          {sortedPersons.map((person, index) => (
            <tr key={person.id || index} className="hover:bg-muted/50 transition-colors duration-150">
              <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground font-mono bg-background sticky left-0 z-10 border-r border-border">
                {index + 1}
              </td>
              <td className="px-6 py-2 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-foreground">{person.nombre}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                {person.cex}
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                {person.num_pers}
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                  {person.fecha_incorporacion}
                </div>
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                  <a href={`mailto:${person.mail_empresa}`} className="text-primary hover:text-primary/80">
                    {person.mail_empresa}
                  </a>
                </div>
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                {person.grupo}
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                  {person.categoria}
                </span>
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                  {person.oficina}
                </div>
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                <div className="flex flex-wrap gap-1">
                  {person.skill1 && (
                    <span className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded">
                      {person.skill1}
                    </span>
                  )}
                  {person.skill2 && (
                    <span className="px-2 py-1 text-xs bg-accent text-accent-foreground rounded">
                      {person.skill2}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-2 whitespace-nowrap text-sm text-foreground">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  person.nivel_ingles?.toLowerCase().includes('alto') || person.nivel_ingles?.toLowerCase().includes('advanced')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : person.nivel_ingles?.toLowerCase().includes('medio') || person.nivel_ingles?.toLowerCase().includes('intermediate')
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {person.nivel_ingles}
                </span>
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