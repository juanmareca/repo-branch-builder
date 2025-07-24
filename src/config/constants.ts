// Configuración centralizada de la aplicación
// Evita valores hardcodeados y permite fácil mantenimiento

export const APP_CONFIG = {
  // Configuración de autenticación
  AUTH: {
    ADMIN_CREDENTIALS: {
      USERNAME: process.env.ADMIN_USERNAME || 'admin',
      PASSWORD: process.env.ADMIN_PASSWORD || 'admin123'
    },
    ROLES: {
      ADMIN: 'admin',
      SQUAD_LEAD: 'squad_lead',
      OPERATIONS: 'operations'
    } as const
  },

  // Configuración de trabajo
  WORK: {
    DEFAULT_HOURS_PER_DAY: 8,
    DEFAULT_PERCENTAGE: 100,
    DEFAULT_ASSIGNMENT_TYPE: 'project',
    DEFAULT_STATUS: 'assigned'
  },

  // Configuración de origen de datos
  DATA_SOURCES: {
    DEFAULT_ORIGIN: 'Fichero',
    ADMIN_ORIGIN: 'Administrador',
    SYSTEM_ORIGIN: 'Sistema'
  },

  // Configuración de UI
  UI: {
    PROJECT_COLORS: [
      'bg-blue-500', 
      'bg-green-500', 
      'bg-purple-500', 
      'bg-orange-500', 
      'bg-pink-500', 
      'bg-indigo-500', 
      'bg-teal-500', 
      'bg-red-500'
    ],
    DEFAULT_LOADING_TEXT: 'Cargando...',
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100
    }
  },

  // Configuración de base de datos
  DATABASE: {
    ASSIGNMENT_TYPES: ['development', 'analysis', 'support', 'testing', 'project'] as const,
    ASSIGNMENT_STATUSES: ['assigned', 'in_progress', 'completed', 'cancelled'] as const,
    TASK_STATUSES: ['todo', 'in_progress', 'done'] as const,
    PRIORITY_LEVELS: ['low', 'medium', 'high', 'urgent'] as const
  },

  // Configuración de notificaciones
  NOTIFICATIONS: {
    TYPES: {
      INFO: 'info',
      SUCCESS: 'success',
      WARNING: 'warning',
      ERROR: 'error'
    } as const,
    DEFAULT_DURATION: 5000
  },

  // Squad Leads disponibles (esto debería venir de la base de datos en el futuro)
  SQUAD_LEADS: [
    { name: 'ALVAREZ DOMINGUEZ, JORGE', code: '4000063' },
    { name: 'BAUTISTA MIRA, JOAQUIN', code: '4000146' },
    { name: 'CABRERA GALERA, ALEJANDRO', code: '4002847' },
    { name: 'CAMPOS APARICIO, FRANCISCO JAVIER', code: '4000068' },
    { name: 'CAUSSE ALEMAN, MARC', code: '4001869' },
    { name: 'CORTES SANTIESTEBAN, ALEJANDRO', code: '4000069' },
    { name: 'DELGADO LOPEZ, ALBERTO', code: '4000074' },
    { name: 'DIAZ GARCES, CARLOS', code: '4000077' },
    { name: 'DONATE NAVARRO, CARLOS', code: '4000081' },
    { name: 'ESTEVE PASTOR, MIGUEL ANGEL', code: '4001837' },
    { name: 'FERNANDEZ CRUZ, CARLOS', code: '4000086' },
    { name: 'GARCIA SANCHEZ, FRANCISCO JOSE', code: '4000088' },
    { name: 'GOMEZ CANO, MIGUEL ANGEL', code: '4002845' },
    { name: 'HERRERA CARRERA, JOSE MIGUEL', code: '4001523' },
    { name: 'JIMENEZ GALLEGO, PABLO', code: '4001243' },
    { name: 'LOPEZ AVILA, AITOR', code: '4002731' },
    { name: 'LOPEZ MARTINEZ, FRANCISCO', code: '4000100' },
    { name: 'LOPEZ RUEDA, MIGUEL ANGEL', code: '4003057' },
    { name: 'MARCO CANADAS, CARLOS', code: '4001247' },
    { name: 'MARCUS CRISAN, IONUT ALEXANDRU', code: '4000316' },
    { name: 'MARTINEZ DE SORIA RUEDA, ANDER', code: '4001245' },
    { name: 'MARTINEZ MARTIN, FRANCISCO', code: '4000465' },
    { name: 'MELERO MILLAN, IVAN', code: '4001251' },
    { name: 'MIGUEL NIEVA, EDUARDO', code: '4001833' },
    { name: 'ORTEGA CUEVAS, ANGEL LUIS', code: '4000089' },
    { name: 'ORTEGA MUNTANE, LUIS JAVIER', code: '4000112' },
    { name: 'PORTEIRO EIROA, EZEQUIEL', code: '4000090' },
    { name: 'RABAGO TORRE, VALENTIN', code: '4002133' },
    { name: 'REVILLA MAILLO, JUAN MANUEL', code: '4002729' },
    { name: 'RODRIGUEZ FERNANDEZ, BELEN', code: '4001527' },
    { name: 'ROLDAN COSANO, EMILIO', code: '4000147' },
    { name: 'ROMERO SALINAS, ESTEFANIA', code: '4000535' },
    { name: 'ROQUE DIAZ, MANUEL', code: '4003058' },
    { name: 'SOLAZ TORRES, LUIS', code: '4001949' }
  ],

  // Configuración de localStorage keys
  STORAGE_KEYS: {
    CURRENT_SQUAD_LEAD: 'current-squad-lead',
    SQUAD_DASHBOARD_ORDER: 'squad-dashboard-order',
    SQUAD_HOLIDAYS_COLUMNS: 'squad-lead-holidays-columns-config'
  }
} as const;

// Tipos para mejor tipado
export type AppRole = typeof APP_CONFIG.AUTH.ROLES[keyof typeof APP_CONFIG.AUTH.ROLES];
export type AssignmentType = typeof APP_CONFIG.DATABASE.ASSIGNMENT_TYPES[number];
export type AssignmentStatus = typeof APP_CONFIG.DATABASE.ASSIGNMENT_STATUSES[number];
export type TaskStatus = typeof APP_CONFIG.DATABASE.TASK_STATUSES[number];
export type PriorityLevel = typeof APP_CONFIG.DATABASE.PRIORITY_LEVELS[number];
export type NotificationType = typeof APP_CONFIG.NOTIFICATIONS.TYPES[keyof typeof APP_CONFIG.NOTIFICATIONS.TYPES];

// Helper functions para validación
export const isValidRole = (role: string): role is AppRole => {
  return Object.values(APP_CONFIG.AUTH.ROLES).includes(role as AppRole);
};

export const isValidAssignmentType = (type: string): type is AssignmentType => {
  return APP_CONFIG.DATABASE.ASSIGNMENT_TYPES.includes(type as AssignmentType);
};

export const isValidAssignmentStatus = (status: string): status is AssignmentStatus => {
  return APP_CONFIG.DATABASE.ASSIGNMENT_STATUSES.includes(status as AssignmentStatus);
};