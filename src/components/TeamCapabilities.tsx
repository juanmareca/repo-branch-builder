import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Star, Award, Loader2, Users, Info, Edit, Save, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

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
  currentSquadLeadName?: string;
}

// Lista completa de todas las capacidades disponibles
const ALL_SKILLS = [
  'Idiomas - Alemán',
  'Idiomas - Español', 
  'Idiomas - Francés',
  'Idiomas - Inglés',
  'Idiomas - Portugués',
  'Implantación SAP - SAP S4 HANA Mix&Match',
  'Implantación SAP - SAP S4HANA Brownfield',
  'Implantación SAP - SAP S4HANA Greenfield',
  'Industrias - Automotion',
  'Industrias - Manufacturing',
  'Industrias - Oil & Gas',
  'Industrias - Pharma',
  'Industrias - Services',
  'Industrias - Telecom',
  'Industrias - Utilities',
  'Módulo SAP - (CO-CCA) Controlling - Cost Center Accounting',
  'Módulo SAP - (CO-PA (MA) Controlling – Profitability Analysis (por Margen de Contribución)',
  'Módulo SAP - (CO-PC) Controlling - Product Costing',
  'Módulo SAP - (CO-PCA) Controlling - Profit Center Accounting',
  'Módulo SAP - (FI-AA) Financials - Assets Accounting',
  'Módulo SAP - (FI-AP) Financials - Accounts Payable',
  'Módulo SAP - (FI-AR) Financials - Accounts Receivable',
  'Módulo SAP - (FI-GL) Financials - General Ledger',
  'Módulo SAP - (FI-Taxes) - SII / DRC',
  'Módulo SAP - (RE-FX) SAP Flexible Real Estate',
  'Módulo SAP - (SAP BRIM) Billing and Revenue Innovation Management',
  'Módulo SAP - (SAP GRC) Governance, Risk and Compliance',
  'Módulo SAP - (TR-CM) Treasury - Cash Management',
  'Módulo SAP - (TR-TM) Treasury Management',
  'Módulo SAP - (TR-TRM) Treasury and Risk Management',
  'Módulo SAP - SAP. Ledgers S4',
  'Módulo SAP - SAP. Monedas S4'
];

const LEVEL_OPTIONS = ['Nulo', 'Básico', 'Medio', 'Alto', 'Experto'];
const INDUSTRY_OPTIONS = ['No', 'Sí'];

const TeamCapabilities: React.FC<TeamCapabilitiesProps> = ({ 
  teamMembers, 
  currentSquadLeadName 
}) => {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCapacities, setEditedCapacities] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Obtener todos los miembros del equipo incluyendo al squad lead actual
  const getAllTeamMembers = () => {
    const allMembers = [...teamMembers];
    if (currentSquadLeadName && !allMembers.includes(currentSquadLeadName)) {
      allMembers.unshift(currentSquadLeadName); // Añadir al principio
    }
    return allMembers;
  };

  useEffect(() => {
    const fetchCapacities = async () => {
      try {
        setLoading(true);
        
        const allMembers = getAllTeamMembers();
        
        if (allMembers.length === 0) {
          setCapacities([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('capacities')
          .select('*')
          .in('person_name', allMembers)
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
  }, [teamMembers, currentSquadLeadName]);

  const getLevelColor = (level: string, isIndustry: boolean = false) => {
    if (isIndustry) {
      // Colores específicos para industrias (Sí/No)
      switch (level?.toLowerCase()) {
        case 'sí':
        case 'si':
          return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
        case 'no':
          return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
      }
    }
    
    // Colores para niveles de competencia (resto de capacidades)
    switch (level?.toLowerCase()) {
      case 'básico':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'medio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'alto':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'experto':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
      case 'nulo':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
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
      'SAP Ledgers': 'SAP Ledgers S4: Sistema de libros contables paralelos en S/4HANA para gestionar múltiples principios contables dentro de una empresa. Tipos: Ledger 0L (principal/Leading Ledger basado normalmente en IFRS), Ledgers no principales (contabilidad paralela bajo GAAP local, SNC, etc.), Extension Ledgers (ledger virtual para ajustes o simulaciones sin duplicar datos). Permite registrar una operación impactando varios ledgers automáticamente con reglas específicas, mayor flexibilidad para cumplir regulaciones locales e internacionales simultáneamente, reportes paralelos y consolidaciones legales. Ideal para multinacionales que necesitan cumplir múltiples marcos normativos (IFRS, GAAP, Plan General Contable local).',
      'SAP Monedas': 'SAP Monedas S4: Gestión avanzada de múltiples monedas en S/4HANA a través del Universal Journal (tabla ACDOCA). Permite registrar automáticamente varias monedas en paralelo por cada operación contable. Tipos principales: Moneda de la sociedad (Company Code Currency - código 10), Moneda de grupo (Group Currency - código 30 para todo el grupo empresarial), Moneda de transacción (moneda real de la operación/factura/pago), Monedas adicionales (códigos 40, 50... hasta 10 monedas adicionales configurables desde S/4HANA 2022), Moneda funcional opcional (base para contabilidad de gestión CO). Evolución significativa vs. ECC con enfoque más flexible y centralizado para multinacionales con operaciones en múltiples divisas.',
      'CO-PA (MA)': 'CO-PA (MA): Controlling – Profitability Analysis por Margen de Contribución (Marginal Accounting/Costing-Based CO-PA). Herramienta de análisis de rentabilidad por diferentes dimensiones como producto, cliente, canal de distribución, segmento de mercado, región y unidad de negocio según el margen de contribución (ingresos menos costes variables). Permite analizar márgenes brutos por múltiples dimensiones, usa segmentos de rentabilidad, genera informes avanzados de rentabilidad y se alimenta de datos de SD, FI, MM y CO. A diferencia de CO-PA (AA) que usa Universal Journal, CO-PA (MA) ofrece mayor flexibilidad analítica pero menor consistencia con FI.',
      'CO-PCA': 'CO-PCA: Profit Center Accounting (Contabilidad de Centros de Beneficio). Forma parte del módulo SAP CO (Controlling) y proporciona información sobre la rentabilidad y desempeño económico de distintas áreas organizativas como departamentos, líneas de negocio, ubicaciones geográficas y divisiones estratégicas. Permite asignar ingresos y gastos a distintos centros de beneficio, facilita el análisis de resultados operativos por cada unidad y proporciona una visión descentralizada de la rentabilidad. En S/4HANA se integra dentro del módulo de Contabilidad de Resultados (Universal Journal) con Segment Reporting.',
      'TR-CM': 'TR-CM: Treasury and Risk Management – Cash Management (Gestión de Tesorería – Gestión de Caja). Submódulo del antiguo SAP TR que se encarga de gestión de caja, saldos bancarios y liquidez diaria. Funciones: gestión de saldos bancarios diarios, previsión de caja (Cash Forecast), planificación de liquidez, gestión de posición de caja, integración bancaria automática (MT940, CAMT.053). Se integra con FI (cuentas bancarias, extractos), SD/MM (pedidos, entregas, cobros), CO (centros de coste), TRM (instrumentos financieros). En S/4HANA evoluciona hacia SAP Cash Management, Bank Account Management y SAP Fiori Apps. Ideal para multinacionales con muchas cuentas bancarias, control de liquidez diaria y forecasting de caja.',
      'TR-TM': 'TR-TM: Treasury Management (Gestión de Tesorería Financiera). Submódulo clásico del SAP TR enfocado en gestión de instrumentos financieros y operaciones de tesorería estratégica. Controla inversiones, préstamos, derivados, líneas de crédito, operaciones FX, bonos, pagarés, depósitos, forwards, swaps. Se diferencia de TR-CM por su enfoque en mediano/largo plazo vs. liquidez diaria. Alta integración contable con FI (valorización, devengo, liquidación), CO, TRM y Risk Management. Ideal para portafolios de inversiones, préstamos financieros y planificación financiera estratégica. En S/4HANA forma parte de SAP Treasury and Risk Management (TRM) y Financial Risk Management.',
      'TR-TRM': 'Treasury and Risk Management: Gestión de riesgos financieros y tesorería.',
      'CO-CCA': 'Controlling - Cost Center Accounting: Contabilidad de centros de coste.',
      'CO-PC': 'CO-PC: Product Costing (Cálculo de Costes del Producto). Forma parte del módulo SAP CO (Controlling) y calcula los costes de fabricación, adquisición y venta de productos o servicios. Se divide en dos subcomponentes: CO-PC-PC (Product Cost Planning) para estimación de costes antes de producir usando BOMs y hojas de ruta, y CO-PC-OBJ (Cost Object Controlling) para control de costes durante la producción real. Permite calcular costes estándar, controlar costes reales vs. planificados, analizar variaciones, valorar inventarios y tomar decisiones de precios y rentabilidad. Se integra con MM, PP, FI y SD.',
      'RE-FX': 'RE-FX: Real Estate Management - Flexible Real Estate (Gestión Inmobiliaria Flexible). Módulo SAP para gestión de activos inmobiliarios propios y arrendados. En S/4HANA reemplaza al RE clásico. Subcomponentes: gestión de contratos (arrendamientos, alquiler, subarrendamiento), gestión de inmuebles (edificios, terrenos, espacios), gestión contable IFRS/NIIF 16, Space Management (distribución de áreas), gestión de costes y rentabilidad, facturación y cobros automáticos. Se integra con FI (contabilidad de contratos), AA (activos inmobiliarios), CO (centros de coste), PS (proyectos de construcción), PM/MM (mantenimiento). En S/4HANA incluye compliance IFRS 16, Universal Journal, Apps Fiori y reporting avanzado. Ideal para inmobiliarias, retail, bancos con oficinas y empresas con muchos activos inmobiliarios.',
      'SAP BRIM': 'SAP BRIM: Billing and Revenue Innovation Management (Gestión de Facturación e Innovación en Ingresos). Diseñado para empresas con servicios recurrentes, por consumo o suscripción que requieren facturación compleja y flexible. Componentes principales: SOM (Subscription Order Management - contratos de suscripción), CC (Convergent Charging - cálculo de precios por uso), CM (Convergent Mediation - procesamiento de datos de uso), CI (Convergent Invoicing - consolidación y emisión de facturas), FI-CA (Contract Accounts - contabilidad de clientes masiva). Ideal para telcos, utilities, transportes, empresas SaaS, medios digitales, automoción. Resuelve facturación basada en eventos, ofertas combinadas, consolidación de transacciones, precios dinámicos, cobros masivos. Completamente integrado en S/4HANA con apps Fiori.',
      'SAP GRC': 'SAP GRC: Governance, Risk and Compliance (Gobierno Corporativo, Gestión de Riesgos y Cumplimiento Normativo). Conjunto de soluciones para controlar accesos, gestionar riesgos, detectar fraudes y cumplir normativas. Componentes principales: Access Control (GRC-AC - gestión de usuarios, roles y segregación de funciones SoD), Process Control (GRC-PC - controles internos y auditorías automatizadas), Risk Management (GRC-RM - identificación y monitorización de riesgos), Audit Management (GRC-AM - auditorías internas), Fraud Management (detección de actividades sospechosas). Resuelve accesos no autorizados, conflictos de roles, riesgos no documentados, fraudes internos y falta de trazabilidad. Totalmente compatible con S/4HANA, Fiori, workflows automatizados. Ideal para empresas con procesos sensibles, auditorías SOX/GDPR/ISO 27001.',
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

  // Función para generar las capacidades completas para cada persona
  const generateCompleteCapacities = () => {
    const allMembers = getAllTeamMembers();
    const completeData: { [personName: string]: { [category: string]: Capacity[] } } = {};

    allMembers.forEach(personName => {
      completeData[personName] = {
        'Módulos SAP e Implantaciones': [],
        'Idiomas': [],
        'Industrias': [],
        'Otras Capacidades': []
      };

      ALL_SKILLS.forEach(skill => {
        let category = 'Otras Capacidades';
        
        if (skill.toLowerCase().includes('módulo sap') || skill.toLowerCase().includes('implantación sap')) {
          category = 'Módulos SAP e Implantaciones';
        } else if (skill.toLowerCase().includes('idioma')) {
          category = 'Idiomas';
        } else if (skill.toLowerCase().includes('industria')) {
          category = 'Industrias';
        }

        // Buscar si ya existe esta capacidad para esta persona
        const existingCapacity = capacities.find(c => 
          c.person_name === personName && c.skill === skill
        );

        if (existingCapacity) {
          // Usar la capacidad existente
          completeData[personName][category].push(existingCapacity);
        } else {
          // Crear una capacidad con valor por defecto según el tipo
          const defaultLevel = category === 'Industrias' ? 'No' : 'Nulo';
          completeData[personName][category].push({
            id: `${personName}-${skill}`, // ID temporal
            person_name: personName,
            skill: skill,
            level: defaultLevel,
            certification: '',
            comments: '',
            evaluation_date: ''
          });
        }
      });
    });

    return completeData;
  };

  const handleEditCapacity = (personName: string, skill: string, newLevel: string) => {
    const key = `${personName}-${skill}`;
    setEditedCapacities(prev => ({
      ...prev,
      [key]: newLevel
    }));
  };

  const handleSaveCapacities = async () => {
    setSaving(true);
    try {
      const updates = [];
      const inserts = [];

      for (const [key, newLevel] of Object.entries(editedCapacities)) {
        const [personName, skill] = key.split('-', 2);
        const skill_full = key.replace(`${personName}-`, '');
        
        const existingCapacity = capacities.find(c => 
          c.person_name === personName && c.skill === skill_full
        );

        if (existingCapacity) {
          // Actualizar capacidad existente
          if (existingCapacity.level !== newLevel) {
            updates.push({
              id: existingCapacity.id,
              level: newLevel,
              evaluation_date: new Date().toISOString().split('T')[0]
            });
          }
        } else {
          // Insertar nueva capacidad - tanto para industrias como para otros niveles
          const isIndustry = skill_full.toLowerCase().includes('industria');
          const shouldInsert = isIndustry ? (newLevel === 'Sí') : (newLevel !== 'Nulo');
          
          if (shouldInsert) {
            inserts.push({
              person_name: personName,
              skill: skill_full,
              level: newLevel,
              evaluation_date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      // Ejecutar actualizaciones
      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('capacities')
            .update({ 
              level: update.level, 
              evaluation_date: update.evaluation_date 
            })
            .eq('id', update.id);

          if (error) throw error;
        }
      }

      // Ejecutar inserciones
      if (inserts.length > 0) {
        const { error } = await supabase
          .from('capacities')
          .insert(inserts);

        if (error) throw error;
      }

      // Refrescar datos
      const allMembers = getAllTeamMembers();
      const { data, error } = await supabase
        .from('capacities')
        .select('*')
        .in('person_name', allMembers)
        .order('person_name')
        .order('skill');

      if (error) throw error;
      setCapacities(data || []);
      setIsEditing(false);
      setEditedCapacities({});

      toast({
        title: "Capacidades actualizadas",
        description: "Las capacidades del equipo se han actualizado correctamente.",
      });

    } catch (error) {
      console.error('Error updating capacities:', error);
      toast({
        title: "Error",
        description: "Error al actualizar las capacidades. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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

  const completeCapacities = generateCompleteCapacities();
  const allMembers = getAllTeamMembers();

  return (
    <div className="space-y-6">
      {/* Botón de actualizar capacidades */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Capacidades del Equipo</h3>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  setEditedCapacities({});
                }}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveCapacities}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Actualizar Capacidades del Equipo
            </Button>
          )}
        </div>
      </div>

      {/* Lista de miembros del equipo */}
      <div className="space-y-8">
        {allMembers.map((personName, index) => {
          const personCapacities = completeCapacities[personName];
          const isSquadLead = index === 0 && personName === currentSquadLeadName;
          
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
                     {ALL_SKILLS.length} capacidades ({Object.values(personCapacities).flat().filter(c => 
                       c.level !== 'Nulo' && c.level !== 'No'
                     ).length} registradas)
                  </p>
                </div>
              </div>

              {/* Categorías de capacidades para esta persona */}
              <div className="grid gap-4 ml-4">
                {Object.entries(personCapacities).map(([category, categoryCapacities]) => (
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
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                      }}>
                        {categoryCapacities.map((capacity) => {
                          const editKey = `${capacity.person_name}-${capacity.skill}`;
                          const currentLevel = editedCapacities[editKey] || capacity.level;
                          
                          return (
                            <div
                              key={editKey}
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
                                
                                {isEditing ? (
                                  <Select
                                    value={currentLevel}
                                    onValueChange={(value) => handleEditCapacity(capacity.person_name, capacity.skill, value)}
                                  >
                                    <SelectTrigger className="w-24 h-8 bg-background">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border shadow-lg z-50">
                                      {/* Usar opciones diferentes según si es industria o no */}
                                      {(category === 'Industrias' ? INDUSTRY_OPTIONS : LEVEL_OPTIONS).map(level => (
                                        <SelectItem key={level} value={level} className="bg-background hover:bg-muted">
                                          {level}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 ${getLevelColor(currentLevel, category === 'Industrias')}`}
                                  >
                                    {currentLevel}
                                  </Badge>
                                )}
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
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamCapabilities;