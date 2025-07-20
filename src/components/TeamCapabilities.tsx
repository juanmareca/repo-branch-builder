import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, Award, Loader2, Users, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface Capacity {
  id: string;
  person_name: string;
  skill: string;
  level: string;
  certification?: string;
  comments?: string;
  evaluation_date?: string;
}

interface TeamCapabilitiesProps {
  teamMembers: string[];
}

const TeamCapabilities: React.FC<TeamCapabilitiesProps> = ({ teamMembers }) => {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        setLoading(true);
        
        if (teamMembers.length === 0) {
          setCapacities([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('capacities')
          .select('*')
          .in('person_name', teamMembers)
          .order('person_name')
          .order('skill');

        if (error) throw error;
        setCapacities(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching capacities');
      } finally {
        setLoading(false);
      }
    };

    fetchCapacities();
  }, [teamMembers]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'básico':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'intermedio':
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'avanzado':
      case 'alto':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'experto':
      case 'expert':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
      case 'nulo':
      case 'no':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'sí':
      case 'si':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSAPModuleInfo = (moduleName: string): string => {
    const modules: { [key: string]: string } = {
      'FI-GL': 'Financials - General Ledger: Gestión del libro mayor general, contabilización automática y manual de asientos contables.',
      'FI-AP': 'Financials - Accounts Payable: Gestión de cuentas por pagar, proveedores y facturación.',
      'FI-AR': 'Financials - Accounts Receivable: Gestión de cuentas por cobrar y clientes.',
      'FI-AA': 'Financials - Assets Accounting: Contabilidad de activos fijos, depreciaciones y gestión de bienes.',
      'FI-Taxes': 'Financials - Taxes: Gestión de impuestos, SII y declaraciones fiscales.',
      'SAP Ledgers': 'SAP Ledgers S4: Gestión de libros contables en SAP S/4HANA.',
      'SAP Monedas': 'SAP Monedas S4: Gestión de múltiples monedas y tipos de cambio.',
      'CO-PA (MA)': 'CO-PA (MA): Controlling – Profitability Analysis por Margen de Contribución (Marginal Accounting/Costing-Based CO-PA). Herramienta de análisis de rentabilidad por diferentes dimensiones como producto, cliente, canal de distribución, segmento de mercado, región y unidad de negocio según el margen de contribución (ingresos menos costes variables). Permite analizar márgenes brutos por múltiples dimensiones, usa segmentos de rentabilidad, genera informes avanzados de rentabilidad y se alimenta de datos de SD, FI, MM y CO. A diferencia de CO-PA (AA) que usa Universal Journal, CO-PA (MA) ofrece mayor flexibilidad analítica pero menor consistencia con FI.',
      'CO-PCA': 'CO-PCA: Profit Center Accounting (Contabilidad de Centros de Beneficio). Forma parte del módulo SAP CO (Controlling) y proporciona información sobre la rentabilidad y desempeño económico de distintas áreas organizativas como departamentos, líneas de negocio, ubicaciones geográficas y divisiones estratégicas. Permite asignar ingresos y gastos a distintos centros de beneficio, facilita el análisis de resultados operativos por cada unidad y proporciona una visión descentralizada de la rentabilidad. En S/4HANA se integra dentro del módulo de Contabilidad de Resultados (Universal Journal) con Segment Reporting.',
      'TR-CM': 'TR-CM: Treasury and Risk Management – Cash Management (Gestión de Tesorería – Gestión de Caja). Submódulo del antiguo SAP TR que se encarga de gestión de caja, saldos bancarios y liquidez diaria. Funciones: gestión de saldos bancarios diarios, previsión de caja (Cash Forecast), planificación de liquidez, gestión de posición de caja, integración bancaria automática (MT940, CAMT.053). Se integra con FI (cuentas bancarias, extractos), SD/MM (pedidos, entregas, cobros), CO (centros de coste), TRM (instrumentos financieros). En S/4HANA evoluciona hacia SAP Cash Management, Bank Account Management y SAP Fiori Apps. Ideal para multinacionales con muchas cuentas bancarias, control de liquidez diaria y forecasting de caja.',
      'TR-TRM': 'Treasury and Risk Management: Gestión de riesgos financieros y tesorería.',
      'CO-CCA': 'Controlling - Cost Center Accounting: Contabilidad de centros de coste.',
      'CO-PC': 'CO-PC: Product Costing (Cálculo de Costes del Producto). Forma parte del módulo SAP CO (Controlling) y calcula los costes de fabricación, adquisición y venta de productos o servicios. Se divide en dos subcomponentes: CO-PC-PC (Product Cost Planning) para estimación de costes antes de producir usando BOMs y hojas de ruta, y CO-PC-OBJ (Cost Object Controlling) para control de costes durante la producción real. Permite calcular costes estándar, controlar costes reales vs. planificados, analizar variaciones, valorar inventarios y tomar decisiones de precios y rentabilidad. Se integra con MM, PP, FI y SD.',
      'RE-FX': 'Real Estate - Flexible Real Estate Management: Gestión inmobiliaria flexible.',
      'SAP BRIM': 'SAP Billing and Revenue Innovation Management: Facturación y gestión de ingresos.',
      'SAP GRC': 'SAP Governance, Risk and Compliance: Gobierno, riesgo y cumplimiento normativo.',
      'SAP S4HANA Brownfield': 'SAP S4HANA Brownfield: Estrategia de migración que reutiliza el sistema SAP ECC existente actualizándolo a S/4HANA, conservando procesos, configuración, datos y personalizaciones. A diferencia de Greenfield (implementación nueva), Brownfield busca preservar lo construido mediante conversión técnica, limpieza de datos, adaptación de código Z, activación gradual de funcionalidades y migración al Universal Journal. Ventajas: menor coste y tiempo, conserva configuración actual, menor disrupción del negocio. Requiere: ECC actualizado (mín. EHP6), evaluación de dependencias técnicas, planificación detallada. Herramientas: SAP Readiness Check, Maintenance Planner, SUM con DMO.',
      'SAP S4HANA Greenfield': 'Implementación nueva de SAP S/4HANA desde cero.',
      'SAP S4 HANA Mix&Match': 'SAP S4HANA Mix & Match (Hybrid Approach): Estrategia intermedia entre Greenfield y Brownfield que combina lo mejor de ambos mundos. Reutiliza lo que funciona del sistema actual (configuraciones, desarrollos Z bien estructurados) mientras rediseña procesos obsoletos o mal implementados. Permite exportación selectiva de datos, análisis proceso por proceso, y combinación de herramientas de migración. Ventajas: flexibilidad para conservar lo útil y transformar lo necesario, coste y riesgo moderados. Ideal cuando el sistema actual tiene módulos desalineados, se quiere conservar histórico valioso pero transformar procesos clave. Herramientas: SAP SLT, Data Services, Custom Code Migration Tool, SAP Activate con ruta híbrida.'
    };

    // Buscar coincidencias parciales en el nombre del módulo
    for (const [key, description] of Object.entries(modules)) {
      if (moduleName.includes(key)) {
        return description;
      }
    }

    return 'Información no disponible para este módulo. Contacta con el administrador para más detalles.';
  };

  const isSAPModule = (skillName: string): boolean => {
    return skillName.toLowerCase().includes('módulo sap') || 
           skillName.toLowerCase().includes('sap') ||
           skillName.includes('FI-') ||
           skillName.includes('CO-') ||
           skillName.includes('TR-') ||
           skillName.includes('RE-');
  };

  const getSkillIcon = (skill: string) => {
    if (skill.toLowerCase().includes('idioma')) {
      return <Star className="h-4 w-4" />;
    }
    if (skill.toLowerCase().includes('certificación') || skill.toLowerCase().includes('certification')) {
      return <Award className="h-4 w-4" />;
    }
    return <Brain className="h-4 w-4" />;
  };

  const groupCapacitiesByPerson = () => {
    const grouped: { [key: string]: { [category: string]: Capacity[] } } = {};
    
    capacities.forEach(capacity => {
      if (!grouped[capacity.person_name]) {
        grouped[capacity.person_name] = {};
      }
      
      let category = 'Otras Capacidades';
      
      if (capacity.skill.toLowerCase().includes('módulo sap') || capacity.skill.toLowerCase().includes('sap')) {
        category = 'Módulos SAP e Implantaciones';
      } else if (capacity.skill.toLowerCase().includes('idioma')) {
        category = 'Idiomas';
      } else if (capacity.skill.toLowerCase().includes('industria') || capacity.skill.toLowerCase().includes('sector')) {
        category = 'Industrias';
      }
      
      if (!grouped[capacity.person_name][category]) {
        grouped[capacity.person_name][category] = [];
      }
      grouped[capacity.person_name][category].push(capacity);
    });
    
    return grouped;
  };

  const sortPersons = (persons: string[]) => {
    // Buscar el squad lead en la lista de miembros del equipo
    const squadLead = teamMembers.find(member => 
      persons.includes(member) && member.includes('SQUAD LEAD') // Asumiendo que viene marcado así
    ) || teamMembers[0]; // Si no encontramos uno marcado, tomar el primero
    
    // Separar squad lead del resto
    const otherMembers = persons.filter(person => person !== squadLead).sort();
    
    // Retornar squad lead primero, luego el resto alfabéticamente
    return squadLead ? [squadLead, ...otherMembers] : otherMembers;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando capacidades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-2">Error al cargar capacidades</div>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (capacities.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay capacidades registradas para este equipo</p>
      </div>
    );
  }

  const groupedByPerson = groupCapacitiesByPerson();
  const sortedPersons = sortPersons(Object.keys(groupedByPerson));

  return (
    <div className="space-y-8">
      {sortedPersons.map((personName) => {
        const personCapacities = groupedByPerson[personName];
        const isSquadLead = personName === sortedPersons[0]; // El primero es el squad lead
        
        return (
          <div key={personName} className="space-y-4">
            {/* Header de la persona */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 ${
              isSquadLead 
                ? 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10' 
                : 'border-l-green-500 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10'
            }`}>
              <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${
                isSquadLead 
                  ? 'bg-blue-100 dark:bg-blue-900/50' 
                  : 'bg-green-100 dark:bg-green-900/50'
              }`}>
                <Users className={`w-6 h-6 ${
                  isSquadLead 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-green-600 dark:text-green-400'
                }`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${
                  isSquadLead 
                    ? 'text-blue-800 dark:text-blue-300' 
                    : 'text-green-800 dark:text-green-300'
                }`}>
                  {personName}
                  {isSquadLead && <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">(Squad Lead)</span>}
                </h2>
                <p className={`text-sm ${
                  isSquadLead 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {Object.values(personCapacities).flat().length} capacidades registradas
                </p>
              </div>
            </div>

            {/* Categorías de capacidades para esta persona */}
            <div className="grid gap-4 ml-4">
              {['Módulos SAP e Implantaciones', 'Idiomas', 'Industrias', 'Otras Capacidades'].map(category => {
                const categoryCapacities = personCapacities[category];
                
                if (!categoryCapacities || categoryCapacities.length === 0) {
                  return null;
                }

                return (
                  <Card key={category} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/80 py-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getSkillIcon(category)}
                        {category}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {categoryCapacities.length} capacidades
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid gap-2" style={{ 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
                      }}>
                        {categoryCapacities.map((capacity) => (
                          <div
                            key={capacity.id}
                            className="p-3 border rounded-lg hover:shadow-sm transition-shadow group"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                                    {capacity.skill.replace('Módulo SAP - ', '')}
                                  </h4>
                                  {isSAPModule(capacity.skill) && (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 hover:bg-primary/10"
                                        >
                                          <Info className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80 p-3">
                                        <div className="space-y-2">
                                          <h4 className="font-semibold text-sm">
                                            {capacity.skill.replace('Módulo SAP - ', '')}
                                          </h4>
                                          <p className="text-xs text-muted-foreground leading-relaxed">
                                            {getSAPModuleInfo(capacity.skill)}
                                          </p>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs px-2 py-1 ${getLevelColor(capacity.level)}`}
                              >
                                {capacity.level}
                              </Badge>
                            </div>
                            
                            {capacity.certification && (
                              <div className="flex items-center gap-1 mt-2">
                                <Award className="h-3 w-3 text-amber-500" />
                                <span className="text-xs text-muted-foreground truncate">
                                  {capacity.certification}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TeamCapabilities;