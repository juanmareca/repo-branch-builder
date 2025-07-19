import React from 'react';
import { Person } from '../types';
import { User, Mail, Calendar, MapPin } from 'lucide-react';

interface PersonTableProps {
  persons: Person[];
}

const PersonTable: React.FC<PersonTableProps> = ({ persons }) => {
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
            <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 bg-muted sticky left-0 z-20 border-r border-border">
              Índice
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              CEX
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Nº Pers.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Fecha Inc.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Grupo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Categoría
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Oficina
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Skills
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted">
              Inglés
            </th>
          </tr>
        </thead>
          <tbody className="bg-background divide-y divide-border">
          {persons.map((person, index) => (
            <tr key={person.id || index} className="hover:bg-muted/50 transition-colors duration-150">
              <td className="px-3 py-4 whitespace-nowrap text-xs text-muted-foreground font-mono bg-background sticky left-0 z-10 border-r border-border">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-foreground">{person.nombre}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {person.cex}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {person.num_pers}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                  {person.fecha_incorporacion}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-muted-foreground mr-2" />
                  <a href={`mailto:${person.mail_empresa}`} className="text-primary hover:text-primary/80">
                    {person.mail_empresa}
                  </a>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {person.grupo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                  {person.categoria}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-muted-foreground mr-2" />
                  {person.oficina}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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