import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Brain, Star, Award, Loader2, Users, Info, Edit, Save, X, Building2, Globe, Cog, ArrowRight, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import { useSquadData } from '../hooks/useSquadData';

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
  
  // Módulos FINANCIEROS
  'Módulo SAP - (FI-GL) Financials - General Ledger',
  'Módulo SAP - (FI-AP) Financials - Accounts Payable',
  'Módulo SAP - (FI-AR) Financials - Accounts Receivable',
  'Módulo SAP - (FI-AA) Financials - Assets Accounting',
  'Módulo SAP - (FI-Taxes) - SII / DRC',
  
  // Módulos TESORERÍA
  'Módulo SAP - (TR-CM) Treasury - Cash Management',
  'Módulo SAP - (TR-TM) Treasury Management',
  'Módulo SAP - (TR-TRM) Treasury and Risk Management',
  
  // Módulos CONTROLLING
  'Módulo SAP - (CO-CCA) Controlling - Cost Center Accounting',
  'Módulo SAP - (CO-PA (MA) Controlling – Profitability Analysis (por Margen de Contribución)',
  'Módulo SAP - (CO-PC) Controlling - Product Costing',
  'Módulo SAP - (CO-PCA) Controlling - Profit Center Accounting',
  
  // Otros Módulos
  'Módulo SAP - (RE-FX) SAP Flexible Real Estate',
  'Módulo SAP - (SAP BRIM) Billing and Revenue Innovation Management',
  'Módulo SAP - (SAP GRC) Governance, Risk and Compliance',
  'Módulo SAP - SAP. Ledgers S4',
  'Módulo SAP - SAP. Monedas S4',
  
  // Implantaciones SAP
  'Implantación SAP - SAP S4HANA Greenfield',
  'Implantación SAP - SAP S4HANA Brownfield',
  'Implantación SAP - SAP S4 HANA Mix&Match',
  
  'Industrias - Automotion',
  'Industrias - Manufacturing',
  'Industrias - Oil & Gas',
  'Industrias - Pharma',
  'Industrias - Services',
  'Industrias - Telecom',
  'Industrias - Utilities'
];

const LEVEL_OPTIONS = ['Nulo', 'Pre-A1', 'Básico', 'Medio', 'Alto', 'Experto'];
const LANGUAGE_LEVEL_OPTIONS = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const INDUSTRY_OPTIONS = ['No', 'Sí'];

const TeamCapabilities: React.FC<TeamCapabilitiesProps> = ({ 
  teamMembers, 
  currentSquadLeadName 
}) => {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [personsData, setPersonsData] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCapacities, setEditedCapacities] = useState<{[key: string]: string}>({});
  const [saving, setSaving] = useState(false);
  const [hideNoExperience, setHideNoExperience] = useState(false);
  const { toast } = useToast();
  const { refetch } = useSquadData();

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
          setPersonsData({});
          setLoading(false);
          return;
        }

        // Obtener capacidades
        const { data: capacitiesData, error: capacitiesError } = await supabase
          .from('capacities')
          .select('*')
          .in('person_name', allMembers)
          .order('person_name')
          .order('skill');

        if (capacitiesError) throw capacitiesError;
        setCapacities(capacitiesData || []);

        // Obtener datos de personas (fecha de incorporación, oficina, etc.)
        const { data: personsQueryData, error: personsError } = await supabase
          .from('persons')
          .select('nombre, fecha_incorporacion, oficina')
          .in('nombre', allMembers);

        if (personsError) throw personsError;
        
        // Crear un mapa de personas para fácil acceso
        const personsMap: {[key: string]: any} = {};
        personsQueryData?.forEach(person => {
          personsMap[person.nombre] = person;
        });
        setPersonsData(personsMap);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
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
      case 'pre-a1':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-400';
      case 'a1':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/10 dark:text-orange-400';
      case 'a2':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/10 dark:text-yellow-400';
      case 'b1':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400';
      case 'b2':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/10 dark:text-indigo-400';
      case 'c1':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/10 dark:text-purple-400';
      case 'c2':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400';
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

  // Función para procesar y estructurar la información de módulos SAP
  const parseModuleInfo = (moduleName: string, description: string) => {
    const sections = description.split('. ');
    
    // Extraer el nombre y descripción principal
    const mainDesc = sections[0] || description;
    const [moduleCode, ...restParts] = mainDesc.split(': ');
    const mainDefinition = restParts.join(': ');
    
    // Buscar secciones específicas
    const funciones = sections.find(s => s.toLowerCase().includes('funciones') || s.toLowerCase().includes('función'))?.replace(/^[^:]*: ?/, '');
    const componentes = sections.find(s => s.toLowerCase().includes('componentes') || s.toLowerCase().includes('estructura'))?.replace(/^[^:]*: ?/, '');
    const transacciones = sections.find(s => s.toLowerCase().includes('transacciones') || s.toLowerCase().includes('transacción'))?.replace(/^[^:]*: ?/, '');
    const integraciones = sections.find(s => s.toLowerCase().includes('integra') || s.toLowerCase().includes('conecta'))?.replace(/^[^:]*: ?/, '');
    const s4hana = sections.find(s => s.toLowerCase().includes('s/4hana') || s.toLowerCase().includes('s4hana'))?.replace(/^[^:]*: ?/, '');
    
    return {
      moduleCode: moduleCode.trim(),
      mainDefinition: mainDefinition.trim(),
      funciones,
      componentes,
      transacciones,
      integraciones,
      s4hana,
      isFinancial: moduleCode.includes('FI-'),
      isControlling: moduleCode.includes('CO-'),
      isTreasury: moduleCode.includes('TR-'),
      isRealEstate: moduleCode.includes('RE-'),
      isBRIM: moduleCode.includes('BRIM'),
      isGRC: moduleCode.includes('GRC'),
      isS4Implementation: moduleCode.includes('S4HANA')
    };
  };

  const getSAPModuleInfo = (moduleName: string): string => {
    const modules: { [key: string]: string } = {
      'FI-GL': 'FI-GL: Financial Accounting - General Ledger (Contabilidad General). Núcleo del módulo financiero SAP donde se registran, procesan y reportan todas las transacciones contables conforme a normas locales e internacionales (IFRS, US GAAP). Libro mayor que consolida operaciones de FI-AP, FI-AR, FI-AA, CO, MM, SD, PP. Componentes clave: Cuenta de mayor (GL account), Plan de cuentas (estructura jerárquica), Segmento/Sociedad (dimensiones contables), Centro de beneficio/coste (información analítica). Funciones: asientos manuales/automáticos, contabilidad multinorma y multimoneda, periodificación, reclasificación, cierre contable, reportes en tiempo real. Transacciones: FB50/F-02 (asientos), FS00 (cuentas), FAGLL03/FBL3N (consultas). En S/4HANA usa Universal Journal (ACDOCA) unificando todas las vistas contables con Extension Ledgers.',
      'FI-AP': 'FI-AP: Financials - Accounts Payable (Contabilidad Financiera – Cuentas a Pagar). Submódulo SAP para gestión de deudas con proveedores desde recepción de facturas hasta pago y conciliación. Funciones principales: registro de facturas de proveedores, gestión de pagos (automáticos/manuales), anticipos y pagos a cuenta, conciliación bancaria, gestión de retenciones fiscales, reportes de antigüedad de saldos y previsiones de pagos. Se integra con MM (facturas de compras automáticas), FI-BL (ejecución de pagos), CO (asignación de costos). Flujo típico: factura recibida → verificación → pago → conciliación bancaria. Gestión del maestro de proveedor (FK01/FK02/FK03) con datos generales, societarios y de compras.',
      'FI-AR': 'FI-AR: Financial Accounting - Accounts Receivable (Cuentas a Cobrar). Submódulo SAP FI para gestión del ciclo completo de ingresos de clientes desde factura hasta cobro. Funciones: emisión y registro de facturas de venta, gestión de pagos y anticipos, seguimiento de saldos de clientes, cobros automáticos, intereses de mora, gestión de crédito, informes de análisis de cuentas por cobrar. Ciclo: factura al cliente → registro del pago → conciliación/compensación → seguimiento de saldo → reportes de antigüedad. Transacciones clave: FB70 (factura manual), F-28 (registrar cobro), F-32 (compensar partidas), F110 (cobros automáticos), FBL5N (partidas cliente), XD01/XD02/XD03 (maestro cliente). En S/4HANA integrado en Universal Journal (ACDOCA) con apps Fiori modernas.',
      'FI-AA': 'FI-AA: Financial Accounting - Asset Accounting (Contabilidad de Activos Fijos). Submódulo SAP FI para gestión completa de activos tangibles e intangibles durante todo su ciclo de vida (edificios, maquinaria, vehículos, hardware, software). Ciclo de vida: alta del activo → capitalización → amortización automática → transferencias → baja. Estructura: Clase de activo (tipo: edificios, equipos, software), Área de valoración (amortizaciones contable/fiscal/corporativa), Centro de coste/Ubicación, Elemento de coste (imputación a CO). Transacciones clave: AS01/AS02/AS03 (maestro activos), F-90 (alta con proveedor), ABZON (alta manual), ABUMN (transferencias), ABAVN/ABAON (bajas), AFAB (amortización). En S/4HANA se integra en tabla ACDOCA con apps Fiori modernas.',
      'FI-Taxes': 'Financials - Taxes: Gestión de impuestos, SII y declaraciones fiscales.',
      'SAP Ledgers': 'SAP Ledgers S4: Sistema de libros contables paralelos en S/4HANA para gestionar múltiples principios contables dentro de una empresa. Tipos: Ledger 0L (principal/Leading Ledger basado normalmente en IFRS), Ledgers no principales (contabilidad paralela bajo GAAP local, SNC, etc.), Extension Ledgers (ledger virtual para ajustes o simulaciones sin duplicar datos). Permite registrar una operación impactando varios ledgers automáticamente con reglas específicas, mayor flexibilidad para cumplir regulaciones locales e internacionales simultáneamente, reportes paralelos y consolidaciones legales. Ideal para multinacionales que necesitan cumplir múltiples marcos normativos (IFRS, GAAP, Plan General Contable local).',
      'SAP Monedas': 'SAP Monedas S4: Gestión avanzada de múltiples monedas en S/4HANA a través del Universal Journal (tabla ACDOCA). Permite registrar automáticamente varias monedas en paralelo por cada operación contable. Tipos principales: Moneda de la sociedad (Company Code Currency - código 10), Moneda de grupo (Group Currency - código 30 para todo el grupo empresarial), Moneda de transacción (moneda real de la operación/factura/pago), Monedas adicionales (códigos 40, 50... hasta 10 monedas adicionales configurables desde S/4HANA 2022), Moneda funcional opcional (base para contabilidad de gestión CO). Evolución significativa vs. ECC con enfoque más flexible y centralizado para multinacionales con operaciones en múltiples divisas.',
      'CO-PA (MA)': 'CO-PA (MA): Controlling – Profitability Analysis (Análisis de Rentabilidad por Margen de Contribución). El sufijo (MA) indica enfoque Marginal Accounting (también llamado "Costing-Based CO-PA"). Herramienta de SAP dentro del módulo Controlling (CO) que permite analizar la rentabilidad de la empresa por diferentes dimensiones como producto, cliente, canal de distribución, segmento de mercado, región, unidad de negocio, etc., todo según el margen de contribución (ingresos menos costes variables). Diferencias con CO-PA (AA): CO-PA (MA) basado en márgenes de contribución con datos en tablas específicas, permite mucha flexibilidad pero no siempre alineado 100% con FI; CO-PA (AA) basado en contabilidad financiera usando Universal Journal (ACDOCA) con consistencia total con FI/CO pero menos flexible. Funciones: analiza margen bruto por múltiples dimensiones, usa segmentos de rentabilidad para desglosar ingresos y costes, permite informes avanzados de rentabilidad, se alimenta de datos de SD (ventas), FI (facturas), MM (costes), CO, puede usarse para planificación de márgenes y simulación de escenarios. En S/4HANA: SAP recomienda Account-Based CO-PA (CO-PA AA) por integración completa en Universal Journal, evita duplicación de datos y es más fácil de mantener y auditar, aunque CO-PA (MA) sigue usado si se necesita estructura analítica más rica y flexible.',
      'CO-PCA': 'CO-PCA: Profit Center Accounting (Contabilidad de Centros de Beneficio). Forma parte del módulo SAP CO (Controlling) y tiene como objetivo principal proporcionar información sobre la rentabilidad y desempeño económico de distintas áreas organizativas llamadas centros de beneficio (profit centers), que suelen representar unidades internas como departamentos, líneas de negocio, ubicaciones geográficas y divisiones estratégicas. Funciones principales: permite asignar ingresos y gastos a distintos centros de beneficio, facilita el análisis de resultados operativos por cada unidad, proporciona una visión descentralizada de la rentabilidad útil para toma de decisiones y control de gestión, puede usarse junto con otras dimensiones como segmentos o centros de coste. Características clave: permite informes por centro de beneficio en tiempo real, puede integrarse con módulos como FI, SD, MM, PP y otros componentes de CO, útil en estructuras organizativas con enfoque en responsabilidad de resultados. En S/4HANA: aunque CO-PCA sigue existiendo, SAP lo ha integrado dentro del módulo de Contabilidad de Resultados (Universal Journal) con Segment Reporting, lo que permite un análisis aún más detallado y flexible a través del "segmento" como dimensión contable.',
      'TR-CM': 'TR-CM: Treasury and Risk Management – Cash Management (Gestión de Tesorería – Gestión de Caja). Submódulo del antiguo módulo SAP TR que se encarga específicamente de gestión de caja, saldos bancarios y liquidez diaria de la empresa. Actualmente forma parte de SAP Treasury and Risk Management (TRM) dentro del módulo SAP Financial Supply Chain Management (FSCM). Funciones principales: gestión de saldos bancarios diarios por cuenta y banco, previsión de caja (Cash Forecast) con análisis futuro de liquidez basado en ingresos y pagos esperados, planificación de liquidez consolidando entradas y salidas de efectivo por periodo, gestión de posición de caja visualizando disponibilidad de efectivo a corto plazo, integración bancaria automática a través de extractos electrónicos (MT940, CAMT.053). Integración: FI (cuentas bancarias, extractos, pagos/recibos), SD/MM (pedidos, entregas, cobros y pagos previstos), CO (centros de coste), TRM (instrumentos financieros). Informes: posición de tesorería actual, flujo de caja previsto, saldos consolidados por banco/divisa/país, comparativas previsto vs realizado. En S/4HANA evoluciona hacia: SAP Cash Management, Bank Account Management (gestión de cuentas bancarias), SAP Fiori Apps para visualización en tiempo real, integración con SAP Analytics Cloud para cuadro de mando completo de tesorería. Ideal para: multinacionales con muchas cuentas bancarias, empresas que necesitan controlar liquidez diaria, departamentos de tesorería con flujos complejos, entornos que requieren forecasting de caja para decisiones de financiación.',
      'TR-TM': 'TR-TM: Treasury Management (Gestión de Tesorería Financiera). Submódulo clásico del SAP TR enfocado en gestión de instrumentos financieros y operaciones de tesorería estratégica. Controla inversiones, préstamos, derivados, líneas de crédito, operaciones FX, bonos, pagarés, depósitos, forwards, swaps. Se diferencia de TR-CM por su enfoque en mediano/largo plazo vs. liquidez diaria. Alta integración contable con FI (valorización, devengo, liquidación), CO, TRM y Risk Management. Ideal para portafolios de inversiones, préstamos financieros y planificación financiera estratégica. En S/4HANA forma parte de SAP Treasury and Risk Management (TRM) y Financial Risk Management.',
      'TR-TRM': 'TR-TRM: Treasury and Risk Management (Gestión de Tesorería y Riesgos). Subcomponente avanzado del módulo SAP TR para gestión de operaciones financieras complejas. Funcionalidades: instrumentos financieros (derivados, bonos, préstamos, inversiones), riesgos de mercado y crédito, valoración y contabilización de productos financieros, análisis de exposición al riesgo, cumplimiento normativo (IFRS, EMIR, MiFID). Componentes: Transaction Manager (instrumentos financieros), Market Risk Analyzer (riesgo de mercado), Credit Risk Analyzer (riesgo de crédito), Portfolio Analyzer (carteras), Market Data Management (datos de mercado). Transacciones: FTR_CREATE/FTR_EDIT (transacciones financieras), TPM10 (valoración), TPM40 (cierre), TRMEX (datos mercado). Ideal para banca, seguros, energía y multinacionales con tesorería avanzada. En S/4HANA integrado con Fiori y Business Partner.',
      'CO-CCA': 'CO-CCA: Controlling - Cost Center Accounting (Contabilidad de Centros de Coste). Submódulo clave de SAP CO para planificar, registrar, monitorizar y analizar costes de áreas internas de la empresa (IT, RRHH, Finanzas, Marketing). Estructura: Centro de coste (unidad organizativa que acumula costes), Área de imputación (Controlling Area), Elementos de coste primarios (costes desde FI como sueldos, energía), Elementos secundarios (distribuciones internas). Flujo: planificación → imputación de costes reales → distribuciones/asignaciones internas → análisis de desviaciones plan vs real. Transacciones clave: KSB1 (partidas individuales), KP06/KP26 (planificación), KS01/KS02/KS03 (maestro centros), KSV5/KSU5 (distribuciones). En S/4HANA usa tabla ACDOCA con apps Fiori en tiempo real.',
      'CO-PC': 'CO-PC: Product Costing (Cálculo de Costes del Producto). Forma parte del módulo SAP CO (Controlling) y su función principal es calcular los costes de fabricación, adquisición y venta de productos o servicios. Es esencial en empresas manufactureras y de producción para la planificación, control y análisis de los costes reales y planificados de productos. Se divide en dos grandes subcomponentes: CO-PC-PC (Product Cost Planning) para estimación de costes antes de producir usando listas de materiales (BOM) y hojas de ruta para calcular costes estándar y fijación de precios; y CO-PC-OBJ (Cost Object Controlling) para control de costes durante la producción real con asignación a órdenes de producción, procesos, series, WIP, variaciones y liquidaciones. Funciones: calcular coste estándar de productos, controlar costes reales vs. planificados, analizar variaciones (materia prima, mano de obra, tiempos), valorar inventarios con base en coste estándar o real, tomar decisiones de fijación de precios y rentabilidad. Integración: MM (precios materiales y consumos), PP (órdenes de fabricación), FI (valoración del inventario), SD (márgenes y costes de ventas). En S/4HANA: sigue existiendo como parte del Universal Journal con integración simplificada con FI y otros módulos, valoración del inventario basada en coste real (actual) y herramientas de análisis mejoradas.',
      'RE-FX': 'RE-FX: Real Estate Management - Gestión Inmobiliaria. Módulo SAP para gestión completa de activos inmobiliarios tanto propios como arrendados, útil para inmobiliarias, retail con muchas tiendas, bancos con oficinas y compañías con múltiples plantas o edificios. Funciones principales: gestión de contratos de arrendamiento y alquiler, administración de inmuebles (edificios, terrenos, espacios), gestión contable conforme a IFRS/NIIF 16, Space Management para distribución de áreas útiles, control de costes y rentabilidad por inmueble, facturación automática de rentas periódicas y liquidaciones. Componentes clave: gestión de contratos (arrendamientos, subarrendamiento), gestión de inmuebles y espacios, gestión contable IFRS 16, facturación y cobros automáticos, integración con activos fijos. Integraciones: FI para contabilidad de contratos y pagos, AA para activos inmobiliarios, CO para centros de coste asignados a inmuebles, PS para proyectos de construcción, PM/MM para mantenimiento de edificios. En S/4HANA: gestión completa de arrendamientos conforme a IFRS 16/NIIF 16, Universal Journal integrado en tabla ACDOCA, Apps Fiori modernas para contratos e inmuebles, reporting avanzado y compliance legal automático.',
      'SAP BRIM': 'SAP BRIM: Billing and Revenue Innovation Management (Gestión de Facturación e Innovación en Ingresos). Diseñado para empresas que venden servicios recurrentes, por consumo o suscripción, con necesidades de facturación compleja y flexible, alto volumen de transacciones y clientes. Componentes principales: SOM (Subscription Order Management para gestión de pedidos y contratos de suscripción), CC (Convergent Charging para cálculo de precios por uso y tarificación), CM (Convergent Mediation para recopilación y procesamiento de datos de uso como datos técnicos de red, llamadas, sesiones), CI (Convergent Invoicing para consolidación y emisión de facturas), FI-CA (Contract Accounts Receivable and Payable para contabilidad de clientes masiva, cobros, deudas, intereses). Funciones principales: facturación basada en eventos (llamadas, consumo de datos, sesiones), ofertas combinadas (producto físico + servicio mensual + tarifa por uso), consolidación de múltiples transacciones en una única factura, modelos de precios dinámicos con descuentos y paquetes, procesos de cobro masivo con recargos e intereses por impagos. Integraciones: SD para pedidos de cliente, FI-CA para contabilidad de contratos, FI/CO para contabilidad general, CRM/CX para gestión comercial, SAP Analytics Cloud para reportes y análisis de ingresos. En S/4HANA: completamente integrado con soporte para arquitectura cloud, on-premise o híbrida, incluye apps Fiori para visualizar contratos, configurar reglas de tarificación, controlar ingresos por cliente y automatizar facturación y cobros. Ideal para telcos (Telefónica, Vodafone), utilities (agua, luz, gas), transportes públicos, empresas SaaS, medios digitales, plataformas de streaming, automoción con servicios conectados.',
      'SAP GRC': 'SAP GRC: Governance, Risk and Compliance (Gobierno Corporativo, Gestión de Riesgos y Cumplimiento Normativo). Conjunto de soluciones SAP diseñado para controlar accesos y autorizaciones, gestionar riesgos corporativos, detectar y prevenir fraudes, cumplir con normativas legales y auditorías internas/externas. Componentes principales: Access Control (GRC-AC) para gestión de usuarios, roles y segregación de funciones SoD que previene accesos indebidos, Process Control (GRC-PC) para supervisar y documentar controles internos y automatizar auditorías, Risk Management (GRC-RM) para identificar evaluar y monitorizar riesgos empresariales, Audit Management (GRC-AM) para planificación y ejecución de auditorías internas, Fraud Management para detección y análisis de actividades sospechosas o fraudulentas. Funciones principales: gestionar solicitudes de acceso de usuarios, prevenir conflictos de segregación de funciones, automatizar controles de autorización y cumplimiento, monitorizar usuarios con acceso crítico, detectar automáticamente conflictos de roles como usuarios que pueden crear y aprobar pagos. Integraciones: FI/CO MM SD HR para controlar accesos y riesgos por módulo, IDM (SAP Identity Management) para gestionar identidades de usuarios, SAP Audit Logs ST03 STAD para analizar actividad de usuarios. En S/4HANA: totalmente compatible y actualizado con versiones on-premise y cloud, integración nativa con SAP Fiori, automatización de workflows y alertas en tiempo real, preparado para auditorías externas SOX GDPR ISO 27001.',
      'SAP S4HANA Brownfield': 'SAP S4HANA Brownfield: Estrategia de migración hacia SAP S/4HANA que reutiliza el sistema SAP existente, en lugar de empezar desde cero. Término tomado del urbanismo donde Brownfield es terreno con edificaciones existentes que se renuevan vs. Greenfield (terreno virgen). En SAP: Brownfield = conversión del sistema ECC actual a S/4HANA conservando procesos, datos y personalizaciones; Greenfield = nueva implantación limpia de S/4HANA rediseñando todo desde cero. Proceso: conversión técnica del sistema ECC a S/4HANA, limpieza de datos innecesarios, adaptación de código Z (desarrollos propios), activación de nuevas funcionalidades gradualmente, conversión del sistema financiero al nuevo Universal Journal, migración de estructuras CO-PA, materiales, activos fijos. Ventajas: menor coste y tiempo que Greenfield, conserva la configuración y desarrollos actuales, menor disrupción para el negocio, ideal si sistema actual está bien construido y documentado. Requiere: sistema ECC actualizado (al menos EHP6), evaluar dependencias técnicas (addons, Z, integraciones), planificación detallada y pruebas extensas. Herramientas: SAP Readiness Check, Maintenance Planner, Simplification Item List, SUM (Software Update Manager) con DMO (Database Migration Option). Recomendable cuando: sistema ECC estabilizado y bien estructurado, se quiere conservar historial y desarrollos, se busca migración rápida y controlada sin rediseñar procesos de negocio desde cero.',
      'SAP S4HANA Greenfield': 'SAP S4HANA Greenfield: Estrategia de implantación donde una empresa empieza desde cero al implementar SAP S/4HANA, sin depender del sistema SAP anterior (como ECC o R/3). Es como construir una casa nueva en un solar vacío. Componentes: nueva instalación limpia de SAP S/4HANA, reingeniería de procesos desde el principio adaptados a mejores prácticas estándar de SAP, eliminación de personalizaciones datos antiguos y desarrollos innecesarios del sistema anterior, modernización completa de arquitectura con funcionalidades innovadoras como Fiori analítica en tiempo real y simplificación de datos. Funciones principales: adoptar mejores prácticas estándar desde el inicio, reducir complejidad heredada, mayor flexibilidad para rediseñar procesos, ideal para organizaciones que desean transformación total o vienen de sistemas no SAP. Ventajas: permite adoptar mejores prácticas desde el inicio, reduce complejidad heredada, mayor flexibilidad para rediseñar procesos, ideal para transformación total. Inconvenientes: proyecto más largo y costoso que Brownfield, implica gestión de cambio intensiva, requiere migrar datos maestros y transaccionales cuidadosamente desde sistema antiguo. Comparativa: Greenfield reimplementación desde cero vs Brownfield conversión técnica del sistema actual vs Mix & Match combinación de ambos por módulos o fases.',
      'SAP S4 HANA Mix&Match': 'SAP S4HANA Mix & Match (Hybrid Approach): Estrategia intermedia entre Greenfield y Brownfield diseñada para aprovechar lo mejor de ambos mundos al migrar a SAP S/4HANA. Enfoque flexible que reutiliza lo que funciona del sistema actual (configuraciones, desarrollos Z bien estructurados), rediseña procesos obsoletos o mal implementados, y combina herramientas de migración, exportación selectiva de datos y cargas iniciales. Diferencias: configuración parcial según convenga, datos históricos opcionales por selección, análisis proceso por proceso, mantiene desarrollos útiles, coste y riesgo moderados. Proceso: evaluación de procesos y calidad de datos, selección de procesos/módulos a rediseñar, exportación selectiva de datos desde ECC, importación/carga en sistema S/4 limpio, adaptación de desarrollos útiles (Z, workflows), integración entre módulos migrados y no migrados. Ejemplo: reutilizar módulo logística (MM, SD) bien diseñado con enfoque brownfield, rediseñar completamente contabilidad para Universal Journal con enfoque greenfield, cargar selectivamente clientes y materiales con migración selectiva. Cuándo usar: sistema actual con módulos muy desalineados, no querer perder histórico valioso pero tampoco migrar todo tal cual, transformar procesos clave conservando lo que funciona. Herramientas: SAP Landscape Transformation (SLT), Selective Data Transition, SAP Data Services, Readiness Check, Custom Code Migration Tool, SAP Activate con ruta híbrida.'
    };

    // Buscar por código de módulo
    for (const [key, value] of Object.entries(modules)) {
      if (moduleName.includes(key)) {
        return value;
      }
    }

    return 'Información detallada no disponible para este módulo.';
  };

  const calculateYearsInStratesys = (fechaIncorporacion: string): string => {
    if (!fechaIncorporacion) return '';
    
    const startDate = new Date(fechaIncorporacion);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    
    return diffYears > 0 ? `${diffYears} años en Stratesys` : 'menos de 1 año en Stratesys';
  };

  // Función para generar currículum en texto de una persona
  const generateCurriculum = (personName: string, personCapacities: Capacity[]) => {
    // Obtener datos de la persona
    const personInfo = personsData[personName];
    const yearsInStratesys = personInfo?.fecha_incorporacion ? calculateYearsInStratesys(personInfo.fecha_incorporacion) : '';
    const office = personInfo?.oficina || '';
    
    // Analizar capacidades por nivel
    const sapModules = personCapacities.filter(c => c.skill.includes('Módulo SAP') && c.level !== 'Nulo');
    const expertModules = sapModules.filter(c => c.level === 'Experto' || c.level === 'Alto');
    const basicModules = sapModules.filter(c => c.level === 'Básico' || c.level === 'Medio');
    
    const industries = personCapacities.filter(c => c.skill.includes('Industrias') && c.level === 'Sí');
    const languages = personCapacities.filter(c => c.skill.includes('Idiomas') && c.level !== 'Pre-A1');
    const nativeLanguage = languages.find(c => c.level === 'Experto' || c.level === 'Alto');
    const basicLanguages = languages.filter(c => ['Pre-A1', 'Básico', 'Medio'].includes(c.level));

    // Generar texto del currículum
    let curriculum = `${personName}`;
    
    // Añadir información de oficina y años en Stratesys
    if (office || yearsInStratesys) {
      curriculum += ', ';
      if (office) curriculum += `Oficina de ${office}`;
      if (office && yearsInStratesys) curriculum += ', ';
      if (yearsInStratesys) curriculum += yearsInStratesys;
    }
    
    curriculum += '. ';

    // Idioma nativo
    if (nativeLanguage) {
      const language = nativeLanguage.skill.replace('Idiomas - ', '');
      curriculum += `Idioma nativo: ${language}. `;
    }

    // Módulos SAP de alto nivel
    if (expertModules.length > 0) {
      curriculum += `Experto en módulos SAP: ${expertModules.map(m => 
        m.skill.replace('Módulo SAP - ', '').replace(/^\([^)]+\)\s*/, '')
      ).join(', ')}. `;
    }

    if (basicModules.length > 0) {
      curriculum += `Conocimientos en módulos SAP: ${basicModules.map(m => 
        m.skill.replace('Módulo SAP - ', '').replace(/^\([^)]+\)\s*/, '')
      ).join(', ')}. `;
    }

    // Industrias
    if (industries.length > 0) {
      curriculum += `Experiencia en industrias: ${industries.map(i => 
        i.skill.replace('Industrias - ', '')
      ).join(', ')}. `;
    }

    // Idiomas adicionales
    if (basicLanguages.length > 0) {
      curriculum += `Idiomas adicionales: ${basicLanguages.map(l => {
        const language = l.skill.replace('Idiomas - ', '');
        return `${language} (${l.level})`;
      }).join(', ')}. `;
    }

    return curriculum.trim();
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 30;

    // Título
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Currículum del Equipo', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition);
    
    yPosition += 20;

    // Generar currículums
    const completeCapacities = generateCompleteCapacities();
    const allMembers = getAllTeamMembers();

    allMembers.forEach((personName, index) => {
      const personCapacities = completeCapacities[personName];
      const allPersonCapacities = Object.values(personCapacities).flat();
      const curriculum = generateCurriculum(personName, allPersonCapacities);
      
      // Verificar si necesitamos una nueva página
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Escribir el currículum
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const splitText = pdf.splitTextToSize(curriculum, 170);
      pdf.text(splitText, 20, yPosition);
      
      yPosition += splitText.length * 5 + 15;
    });

    // Guardar el PDF
    pdf.save(`Curriculum_Equipo_${currentSquadLeadName || 'Squad'}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF generado",
      description: "El currículum del equipo se ha exportado correctamente.",
    });
  };

  const isSAPModule = (skillName: string): boolean => {
    return skillName.toLowerCase().includes('módulo sap') || 
           skillName.toLowerCase().includes('implantación sap');
  };

  const isLanguageSkill = (skillName: string): boolean => {
    return skillName.toLowerCase().includes('idiomas');
  };

  const isIndustrySkill = (skillName: string): boolean => {
    return skillName.toLowerCase().includes('industrias');
  };

  const getSkillIcon = (skill: string) => {
    if (skill.toLowerCase().includes('módulos sap')) {
      return <Brain className="h-4 w-4" />;
    }
    if (skill.toLowerCase().includes('idiomas')) {
      return <Globe className="h-4 w-4" />;
    }
    if (skill.toLowerCase().includes('industrias')) {
      return <Building2 className="h-4 w-4" />;
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
          completeData[personName][category].push(existingCapacity);
        } else {
          // Crear capacidad con nivel por defecto
          const defaultLevel = isIndustrySkill(skill) ? 'No' : 
                              isLanguageSkill(skill) ? 'Pre-A1' : 'Nulo';
          
          completeData[personName][category].push({
            id: `${personName}-${skill}`,
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

  const saveCapacities = async () => {
    setSaving(true);
    try {
      const updates = [];
      const inserts = [];

      for (const [editKey, newLevel] of Object.entries(editedCapacities)) {
        const [personName, ...skillParts] = editKey.split('-');
        const skill_full = skillParts.join('-');

        const existingCapacity = capacities.find(c => 
          c.person_name === personName && c.skill === skill_full
        );

        if (existingCapacity) {
          // Solo actualizar si el nivel ha cambiado
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
          const isLanguage = skill_full.toLowerCase().includes('idioma');
          const defaultLevel = isIndustry ? 'No' : isLanguage ? 'Pre-A1' : 'Nulo';
          
          if (newLevel !== defaultLevel) {
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

      // Recargar datos
      const allMembers = getAllTeamMembers();
      const { data, error } = await supabase
        .from('capacities')
        .select('*')
        .in('person_name', allMembers)
        .order('person_name')
        .order('skill');

      if (error) throw error;
      setCapacities(data || []);
      
      // Forzar recálculo del currículum actualizando el estado
      setIsEditing(false);
      setEditedCapacities({});
      
      // También refrescar los datos de personas si es necesario
      if (refetch) {
        await refetch();
      }

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
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando capacidades del equipo...</span>
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

  // Función para agrupar módulos SAP en subcategorías
  const groupSAPModules = (sapCapacities: Capacity[]) => {
    const groups: { [key: string]: Capacity[] } = {
      'Módulos FINANCIEROS': [],
      'Módulos TESORERÍA': [],
      'Módulos CONTROLLING': [],
      'Otros Módulos': [],
      'Implantaciones SAP': []
    };

    sapCapacities.forEach(capacity => {
      if (capacity.skill.toLowerCase().includes('implantación sap')) {
        groups['Implantaciones SAP'].push(capacity);
      } else if (capacity.skill.includes('FI-')) {
        groups['Módulos FINANCIEROS'].push(capacity);
      } else if (capacity.skill.includes('TR-')) {
        groups['Módulos TESORERÍA'].push(capacity);
      } else if (capacity.skill.includes('CO-')) {
        groups['Módulos CONTROLLING'].push(capacity);
      } else {
        groups['Otros Módulos'].push(capacity);
      }
    });

    // Filtrar grupos vacíos
    return Object.entries(groups).filter(([_, caps]) => caps.length > 0);
  };

  // Función para formatear títulos de módulos financieros
  const formatFinancialModuleTitle = (skill: string) => {
    const cleanedSkill = skill.replace('Módulo SAP - ', '').replace('Implantación SAP - ', '');
    
    // Casos especiales para módulos financieros
    if (cleanedSkill.includes('FI-GL')) {
      return { line1: "(FI-GL) Financials", line2: "General Ledger" };
    } else if (cleanedSkill.includes('FI-AP')) {
      return { line1: "(FI-AP) Financials", line2: "Accounts Payable" };
    } else if (cleanedSkill.includes('FI-AR')) {
      return { line1: "(FI-AR) Financials", line2: "Accounts Receivable" };
    } else if (cleanedSkill.includes('FI-AA')) {
      return { line1: "(FI-AA) Financials", line2: "Assets Accounting" };
    } else if (cleanedSkill.includes('FI-Taxes')) {
      return { line1: "(FI-TAXES)", line2: "SII / DRC" };
    }
    
    // Para otros módulos, retornar el texto original
    return { line1: cleanedSkill, line2: null };
  };

  const completeCapacities = generateCompleteCapacities();
  const allMembers = getAllTeamMembers();

  // Función para filtrar capacidades sin experiencia
  const shouldHideCapacity = (capacity: Capacity) => {
    if (!hideNoExperience) return false;
    
    // Ocultar si es "Nulo"
    if (capacity.level === 'Nulo') return true;
    
    // Ocultar si es idioma con "Pre-A1"
    if (capacity.skill.startsWith('Idiomas -') && capacity.level === 'Pre-A1') return true;
    
    return false;
  };

  // Filtrar capacidades completas
  const filteredCompleteCapacities = Object.entries(completeCapacities).reduce((acc, [personName, personCapacities]) => {
    const filteredPersonCapacities = Object.entries(personCapacities).reduce((personAcc, [category, categoryCapacities]) => {
      const filteredCategoryCapacities = categoryCapacities.filter(capacity => !shouldHideCapacity(capacity));
      if (filteredCategoryCapacities.length > 0) {
        personAcc[category] = filteredCategoryCapacities;
      }
      return personAcc;
    }, {} as typeof personCapacities);
    
    if (Object.keys(filteredPersonCapacities).length > 0) {
      acc[personName] = filteredPersonCapacities;
    }
    return acc;
  }, {} as typeof completeCapacities);

  return (
    <div className="space-y-6">
      {/* Botón de actualizar capacidades y exportar PDF */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Capacidades del Equipo</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportToPDF}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          
          {isEditing ? (
            <>
              <Button 
                onClick={saveCapacities}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
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
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Actualizar Capacidades del Equipo
            </Button>
          )}
        </div>
      </div>

      {/* Toggle para ocultar capacidades sin conocimiento */}
      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
        <Switch
          id="hide-no-experience"
          checked={hideNoExperience}
          onCheckedChange={setHideNoExperience}
        />
        <Label htmlFor="hide-no-experience" className="text-sm font-medium cursor-pointer">
          Ocultar capacidades sin conocimiento o experiencia
        </Label>
      </div>

      {/* Lista de miembros del equipo */}
      <div className="space-y-8">
        {allMembers.map((personName, index) => {
          const personCapacities = filteredCompleteCapacities[personName];
          
          // Si no hay capacidades después del filtrado, no mostrar la persona
          if (!personCapacities || Object.keys(personCapacities).length === 0) {
            return null;
          }
          
          const isSquadLead = index === 0 && personName === currentSquadLeadName;
          const allPersonCapacities = Object.values(personCapacities).flat();
          
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
                    {(() => {
                      const totalCapacities = ALL_SKILLS.length;
                      const experiencedCapacities = Object.values(personCapacities).flat().filter(c => 
                        c.level !== 'Nulo' && c.level !== 'No' && c.level !== 'Pre-A1'
                      ).length;
                      const percentage = totalCapacities > 0 ? Math.round((experiencedCapacities / totalCapacities) * 100) : 0;
                      
                      return `${totalCapacities} capacidades disponibles (${experiencedCapacities} con experiencia o conocimiento) - ${percentage}%`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Categorías de capacidades para esta persona */}
              <div className="grid gap-4 ml-4">
                {Object.entries(personCapacities).map(([category, categoryCapacities]) => (
                  <Card key={category} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/80 py-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getSkillIcon(category)}
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {category === 'Módulos SAP e Implantaciones' ? (
                        // Renderizar subcategorías para módulos SAP
                        <div className="space-y-4">
                          {groupSAPModules(categoryCapacities).map(([subCategory, subCapacities]) => (
                            <div key={subCategory}>
                              {/* Cabecera de subcategoría con estilo diferenciado */}
                              <div className="bg-gradient-to-r from-accent/20 to-accent/30 px-3 py-2 rounded-md mb-3 border border-accent/20">
                                <h5 className="text-xs font-medium text-accent-foreground uppercase tracking-wide">{subCategory}</h5>
                              </div>
                              {/* Grid de capacidades de la subcategoría */}
                              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                {subCapacities.map((capacity) => {
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
                                              {(() => {
                                                const moduleTitle = formatFinancialModuleTitle(capacity.skill);
                                                return (
                                                  <h4 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                                                    {moduleTitle.line2 ? (
                                                      <div className="text-center">
                                                        <div>{moduleTitle.line1}</div>
                                                        <div className="text-xs text-muted-foreground">{moduleTitle.line2}</div>
                                                      </div>
                                                    ) : (
                                                      moduleTitle.line1
                                                    )}
                                                  </h4>
                                                );
                                              })()}
                                              
                                             {isSAPModule(capacity.skill) && (
                                               <Popover>
                                                 <PopoverTrigger asChild>
                                                   <Button
                                                     variant="ghost"
                                                     size="sm"
                                                     className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors"
                                                   >
                                                     <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                                   </Button>
                                                 </PopoverTrigger>
                                                 <PopoverContent className="w-[400px] p-0 bg-background border shadow-lg animate-fade-in" sideOffset={8}>
                                                   {(() => {
                                                     const description = getSAPModuleInfo(capacity.skill);
                                                     const moduleInfo = parseModuleInfo(capacity.skill, description);
                                                     
                                                     return (
                                                       <div className="space-y-4 p-5">
                                                         {/* Header del módulo */}
                                                         <div className="flex items-start gap-3 pb-3 border-b">
                                                           <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                                             moduleInfo.isFinancial ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                             moduleInfo.isControlling ? 'bg-purple-100 dark:bg-purple-900/30' :
                                                             moduleInfo.isTreasury ? 'bg-green-100 dark:bg-green-900/30' :
                                                             moduleInfo.isRealEstate ? 'bg-orange-100 dark:bg-orange-900/30' :
                                                             moduleInfo.isBRIM ? 'bg-pink-100 dark:bg-pink-900/30' :
                                                             moduleInfo.isGRC ? 'bg-red-100 dark:bg-red-900/30' :
                                                             moduleInfo.isS4Implementation ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                                                             'bg-gray-100 dark:bg-gray-900/30'
                                                           }`}>
                                                             {moduleInfo.isFinancial ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                                                              moduleInfo.isControlling ? <Cog className="w-5 h-5 text-purple-600 dark:text-purple-400" /> :
                                                              moduleInfo.isTreasury ? <Globe className="w-5 h-5 text-green-600 dark:text-green-400" /> :
                                                              moduleInfo.isRealEstate ? <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" /> :
                                                              moduleInfo.isBRIM ? <Cog className="w-5 h-5 text-pink-600 dark:text-pink-400" /> :
                                                              moduleInfo.isGRC ? <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /> :
                                                              moduleInfo.isS4Implementation ? <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> :
                                                              <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                                                           </div>
                                                           <div className="flex-1 min-w-0">
                                                             <h4 className="font-bold text-base text-foreground leading-tight">
                                                               {moduleInfo.moduleCode}
                                                             </h4>
                                                             <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                               {moduleInfo.mainDefinition}
                                                             </p>
                                                           </div>
                                                         </div>

                                                         {/* Contenido estructurado */}
                                                         <div className="space-y-4">
                                                           {moduleInfo.funciones && (
                                                             <div className="space-y-2">
                                                               <div className="flex items-center gap-2">
                                                                 <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                 <h5 className="font-semibold text-sm text-foreground">Funciones Principales</h5>
                                                               </div>
                                                               <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                                 {moduleInfo.funciones}
                                                               </p>
                                                             </div>
                                                           )}

                                                           {moduleInfo.componentes && (
                                                             <div className="space-y-2">
                                                               <div className="flex items-center gap-2">
                                                                 <Cog className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                 <h5 className="font-semibold text-sm text-foreground">Componentes</h5>
                                                               </div>
                                                               <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                                 {moduleInfo.componentes}
                                                               </p>
                                                             </div>
                                                           )}

                                                           {moduleInfo.transacciones && (
                                                             <div className="space-y-2">
                                                               <div className="flex items-center gap-2">
                                                                 <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                                 <h5 className="font-semibold text-sm text-foreground">Transacciones Clave</h5>
                                                               </div>
                                                               <p className="text-xs text-muted-foreground leading-relaxed pl-6 font-mono">
                                                                 {moduleInfo.transacciones}
                                                               </p>
                                                             </div>
                                                           )}

                                                           {moduleInfo.integraciones && (
                                                             <div className="space-y-2">
                                                               <div className="flex items-center gap-2">
                                                                 <Globe className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                                 <h5 className="font-semibold text-sm text-foreground">Integraciones</h5>
                                                               </div>
                                                               <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                                 {moduleInfo.integraciones}
                                                               </p>
                                                             </div>
                                                           )}

                                                           {moduleInfo.s4hana && (
                                                             <div className="space-y-2 bg-gradient-to-r from-primary/5 to-primary/10 p-3 rounded-lg border border-primary/20">
                                                               <div className="flex items-center gap-2">
                                                                 <Star className="w-4 h-4 text-primary" />
                                                                 <h5 className="font-semibold text-sm text-primary">S/4HANA</h5>
                                                               </div>
                                                               <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                                 {moduleInfo.s4hana}
                                                               </p>
                                                             </div>
                                                           )}
                                                         </div>

                                                         {/* Badge del tipo de módulo */}
                                                         <div className="flex justify-end pt-2 border-t">
                                                           <Badge 
                                                             variant="secondary" 
                                                             className={`text-xs px-3 py-1 ${
                                                               moduleInfo.isFinancial ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                               moduleInfo.isControlling ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                               moduleInfo.isTreasury ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                               moduleInfo.isRealEstate ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                               moduleInfo.isBRIM ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                                                               moduleInfo.isGRC ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                               moduleInfo.isS4Implementation ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                               'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                                             }`}
                                                           >
                                                             {moduleInfo.isFinancial ? 'Financials' :
                                                              moduleInfo.isControlling ? 'Controlling' :
                                                              moduleInfo.isTreasury ? 'Treasury' :
                                                              moduleInfo.isRealEstate ? 'Real Estate' :
                                                              moduleInfo.isBRIM ? 'BRIM' :
                                                              moduleInfo.isGRC ? 'GRC' :
                                                              moduleInfo.isS4Implementation ? 'S/4HANA Implementation' :
                                                              'SAP Module'}
                                                           </Badge>
                                                         </div>
                                                       </div>
                                                     );
                                                   })()}
                                                  </PopoverContent>
                                                </Popover>
                                              )}
                                          </div>
                                        </div>
                                        
                                        {isEditing ? (
                                          <Select 
                                            value={currentLevel} 
                                            onValueChange={(value) => setEditedCapacities(prev => ({ ...prev, [editKey]: value }))}
                                          >
                                            <SelectTrigger className="w-20 h-7 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {LEVEL_OPTIONS.map(level => (
                                                <SelectItem key={level} value={level} className="text-xs">
                                                  {level}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <Badge 
                                            variant="outline" 
                                            className={`${getLevelColor(currentLevel)} text-xs px-2 py-1 border`}
                                          >
                                            {currentLevel}
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {capacity.certification && (
                                        <div className="mt-2 flex items-center gap-1">
                                          <Award className="h-3 w-3 text-amber-500" />
                                          <span className="text-xs text-muted-foreground">{capacity.certification}</span>
                                        </div>
                                      )}
                                      
                                      {capacity.comments && (
                                        <div className="mt-2">
                                          <p className="text-xs text-muted-foreground">{capacity.comments}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Renderizado normal para otras categorías (Idiomas, Industrias, etc.)
                        <div className={cn(
                          "grid gap-2",
                          category === 'Idiomas' || category === 'Industrias'
                            ? "grid-cols-[repeat(auto-fit,minmax(120px,1fr))]"
                            : ""
                        )} style={category !== 'Idiomas' && category !== 'Industrias' ? { 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
                        } : undefined}>
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
                                       <h4 className={cn(
                                         "font-medium text-sm leading-tight group-hover:text-primary transition-colors",
                                         category === 'Industrias' ? "text-center" : ""
                                       )}>
                                         {category === 'Industrias' ? (
                                           <div className="flex flex-col items-center">
                                             <span className="text-xs">Industrias</span>
                                             <span className="text-xs font-bold">
                                               {capacity.skill.replace('Industrias - ', '')}
                                             </span>
                                           </div>
                                         ) : (
                                           capacity.skill.replace('Módulo SAP - ', '')
                                         )}
                                       </h4>
                                       {isLanguageSkill(capacity.skill) && (
                                         <Popover>
                                           <PopoverTrigger asChild>
                                             <Button
                                               variant="ghost"
                                               size="sm"
                                               className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors"
                                             >
                                               <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                             </Button>
                                           </PopoverTrigger>
                                           <PopoverContent className="w-[500px] p-0 bg-background border shadow-lg animate-fade-in" sideOffset={8}>
                                             <div className="space-y-4 p-6">
                                               {/* Header */}
                                               <div className="text-center pb-4 border-b">
                                                 <h4 className="font-bold text-lg text-foreground mb-2">
                                                   Niveles de Conocimiento de Idiomas
                                                 </h4>
                                                 <p className="text-sm text-muted-foreground">
                                                   Basado en el Marco Común Europeo de Referencia (MCER)
                                                 </p>
                                               </div>

                                               {/* Niveles */}
                                               <div className="space-y-3">
                                                 {/* Pre-A1 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                                                   <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs px-2">
                                                     Pre-A1
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-red-800 dark:text-red-300 mb-1">
                                                       Principiante Absoluto
                                                     </h5>
                                                     <p className="text-xs text-red-700 dark:text-red-400">
                                                       Conocimiento muy básico o nulo. Puede reconocer palabras muy familiares.
                                                     </p>
                                                   </div>
                                                 </div>

                                                 {/* A1 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                                                   <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs px-2">
                                                     A1
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-orange-800 dark:text-orange-300 mb-1">
                                                       Acceso / Principiante
                                                     </h5>
                                                     <p className="text-xs text-orange-700 dark:text-orange-400">
                                                       Comprende expresiones familiares de uso cotidiano. Puede presentarse y hacer preguntas básicas.
                                                     </p>
                                                   </div>
                                                 </div>

                                                 {/* A2 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                                                   <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs px-2">
                                                     A2
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-yellow-800 dark:text-yellow-300 mb-1">
                                                       Plataforma / Elemental
                                                     </h5>
                                                     <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                                       Comprende frases sobre temas familiares. Puede comunicarse en tareas simples y rutinarias.
                                                     </p>
                                                   </div>
                                                 </div>

                                                 {/* B1 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                                   <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2">
                                                     B1
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-1">
                                                       Umbral / Intermedio
                                                     </h5>
                                                     <p className="text-xs text-blue-700 dark:text-blue-400">
                                                       Comprende textos sobre temas conocidos. Puede desenvolverse en viajes y expresar opiniones.
                                                     </p>
                                                   </div>
                                                 </div>

                                                 {/* B2 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
                                                   <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs px-2">
                                                     B2
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-indigo-800 dark:text-indigo-300 mb-1">
                                                       Avanzado / Intermedio Alto
                                                     </h5>
                                                     <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                       Comprende textos complejos. Puede relacionarse con hablantes nativos con fluidez.
                                                     </p>
                                                   </div>
                                                 </div>

                                                 {/* C1 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800">
                                                   <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2">
                                                     C1
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-purple-800 dark:text-purple-300 mb-1">
                                                       Dominio Operativo / Avanzado
                                                     </h5>
                                                     <p className="text-xs text-purple-700 dark:text-purple-400">
                                                       Comprende textos extensos y complejos. Se expresa con fluidez y espontaneidad.
                                                     </p>
                                                   </div>
                                                 </div>

                                                 {/* C2 */}
                                                 <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                                   <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2">
                                                     C2
                                                   </Badge>
                                                   <div className="flex-1">
                                                     <h5 className="font-semibold text-sm text-green-800 dark:text-green-300 mb-1">
                                                       Maestría / Nativo
                                                     </h5>
                                                     <p className="text-xs text-green-700 dark:text-green-400">
                                                       Se comunica de forma espontánea, fluida y precisa. Nivel similar al de un nativo culto.
                                                     </p>
                                                   </div>
                                                 </div>
                                               </div>
                                             </div>
                                           </PopoverContent>
                                         </Popover>
                                       )}
                                   </div>
                                 </div>
                                 
                                 {isEditing ? (
                                   <Select 
                                     value={currentLevel} 
                                     onValueChange={(value) => setEditedCapacities(prev => ({ ...prev, [editKey]: value }))}
                                   >
                                     <SelectTrigger className="w-20 h-7 text-xs">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       {(isLanguageSkill(capacity.skill) ? LANGUAGE_LEVEL_OPTIONS : 
                                         isIndustrySkill(capacity.skill) ? INDUSTRY_OPTIONS : 
                                         LEVEL_OPTIONS).map(level => (
                                         <SelectItem key={level} value={level} className="text-xs">
                                           {level}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 ) : (
                                   <Badge 
                                     variant="outline" 
                                     className={`${getLevelColor(currentLevel, isIndustrySkill(capacity.skill))} text-xs px-2 py-1 border`}
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
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Currículum en texto */}
              <div className="ml-4">
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-2">Currículum Profesional</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {generateCurriculum(personName, allPersonCapacities)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamCapabilities;
