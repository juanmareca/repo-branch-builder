# Manual Técnico - Sistema de Gestión de Recursos y Asignaciones

## Tabla de Contenidos
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos](#base-de-datos)
5. [Configuración](#configuración)
6. [Componentes Principales](#componentes-principales)
7. [Hooks Personalizados](#hooks-personalizados)
8. [Tipos de Datos](#tipos-de-datos)
9. [Autenticación y Roles](#autenticación-y-roles)
10. [APIs y Servicios](#apis-y-servicios)
11. [Despliegue](#despliegue)

## Arquitectura del Sistema

### Diagrama de Arquitectura
```
Frontend (React + TypeScript)
    ↓
Router (React Router DOM)
    ↓
State Management (React Query + Local State)
    ↓
API Layer (Supabase Client)
    ↓
Backend (Supabase)
    ↓
PostgreSQL Database
```

### Principios de Diseño
- **Separación de responsabilidades**: Cada componente tiene una responsabilidad específica
- **Configuración centralizada**: Todos los valores están en `src/config/constants.ts`
- **Reutilización de componentes**: UI components basados en shadcn/ui
- **Tipado fuerte**: TypeScript en todo el proyecto
- **Clean Code**: Código legible y mantenible

## Stack Tecnológico

### Frontend
- **React 18.3.1**: Framework principal
- **TypeScript**: Tipado estático
- **Vite**: Build tool y desarrollo
- **Tailwind CSS**: Framework de estilos
- **shadcn/ui**: Sistema de componentes UI

### Backend
- **Supabase**: Backend as a Service
- **PostgreSQL**: Base de datos
- **Row Level Security (RLS)**: Seguridad a nivel de fila

### Librerías Principales
- **React Router DOM**: Navegación
- **React Query**: Gestión de estado servidor
- **React Hook Form**: Gestión de formularios
- **Zod**: Validación de esquemas
- **Lucide React**: Iconos
- **ExcelJS**: Manipulación de archivos Excel
- **jsPDF**: Generación de PDFs
- **Chart.js**: Gráficos y visualizaciones

## Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes base de shadcn/ui
│   ├── FileUpload/      # Componentes de carga de archivos
│   └── *.tsx            # Componentes específicos del dominio
├── config/              # Configuración centralizada
│   └── constants.ts     # Constantes de la aplicación
├── hooks/               # Hooks personalizados
├── integrations/        # Integraciones externas
│   └── supabase/        # Cliente y tipos de Supabase
├── lib/                 # Utilidades
├── pages/               # Páginas de la aplicación
├── types/               # Definiciones de tipos
└── assets/              # Recursos estáticos
```

## Base de Datos

### Tablas Principales

#### persons
```sql
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cex TEXT NOT NULL,
  num_pers TEXT NOT NULL,
  fecha_incorporacion TEXT NOT NULL,
  mail_empresa TEXT NOT NULL,
  grupo TEXT NOT NULL,
  categoria TEXT NOT NULL,
  oficina TEXT NOT NULL,
  squad_lead TEXT NOT NULL,
  origen TEXT DEFAULT 'Fichero',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### assignments
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  hours_allocated NUMERIC DEFAULT 8,
  hours_worked NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 100,
  type TEXT DEFAULT 'project',
  status TEXT DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### holidays
```sql
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  type TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Políticas RLS
Todas las tablas tienen Row Level Security habilitado con políticas que permiten:
- Lectura completa para todos los usuarios autenticados
- Escritura solo para usuarios con roles apropiados

## Configuración

### Constants (src/config/constants.ts)
```typescript
export const APP_CONFIG = {
  AUTH: {
    ADMIN_CREDENTIALS: { /* credenciales admin */ },
    ROLES: { /* roles de usuario */ }
  },
  WORK: { /* configuración de trabajo */ },
  DATA_SOURCES: { /* fuentes de datos */ },
  UI: { /* configuración de interfaz */ },
  DATABASE: { /* configuración de base de datos */ },
  NOTIFICATIONS: { /* configuración de notificaciones */ },
  SQUAD_LEADS: [ /* lista de squad leads */ ],
  STORAGE_KEYS: { /* claves de localStorage */ }
};
```

### Variables de Entorno
- No se utilizan variables de entorno en el frontend
- Toda la configuración está centralizada en `constants.ts`

## Componentes Principales

### Páginas de Administrador
- **AdminDashboard**: Panel principal del administrador
- **ResourcesManagement**: Gestión de recursos/personas
- **ProjectsManagement**: Gestión de proyectos
- **HolidaysManagement**: Gestión de festivos
- **CapacitiesManagement**: Gestión de capacidades
- **ConfigurationManagement**: Gestión de configuración del sistema

### Páginas de Squad Lead
- **SquadLeadDashboard**: Panel del jefe de squad
- **SquadAssignments**: Asignaciones del squad
- **SquadLeadHolidaysManagement**: Gestión de festivos del squad

### Componentes de UI
- **PersonTable**: Tabla de personas con filtros y acciones
- **TeamAssignmentSummary**: Resumen de asignaciones por equipo
- **SpainHolidaysMap**: Mapa de festivos de España
- **StaffingReport**: Informes de staffing

### Componentes de Carga de Archivos
- **ResourcesUpload**: Carga de recursos
- **ProjectsUpload**: Carga de proyectos
- **AssignmentsUpload**: Carga de asignaciones
- **HolidaysUpload**: Carga de festivos
- **CapacitiesUpload**: Carga de capacidades

## Hooks Personalizados

### useCurrentUser
```typescript
// Gestiona el usuario actual y sus permisos
const { currentUser, isLoading, error } = useCurrentUser();
```

### useSquadData
```typescript
// Obtiene datos específicos del squad
const { squadMembers, assignments, loading } = useSquadData(squadLeadName);
```

### useAdminStats
```typescript
// Estadísticas para el panel de administrador
const { stats, loading } = useAdminStats();
```

## Tipos de Datos

### Person
```typescript
interface Person {
  id?: string;
  nombre: string;
  cex: string;
  num_pers: string;
  fecha_incorporacion: string;
  mail_empresa: string;
  grupo: string;
  categoria: string;
  oficina: string;
  squad_lead: string;
  origen?: string;
  created_at?: string;
  updated_at?: string;
}
```

### SquadLead
```typescript
interface SquadLead {
  id: string;
  name: string;
  email?: string;
  squad_name?: string;
  created_at?: string;
}
```

## Autenticación y Roles

### Sistema de Autenticación
- **Mock Authentication**: Sistema simulado para demo
- **Roles disponibles**:
  - `admin`: Acceso completo al sistema
  - `squad_lead`: Acceso a funciones de jefe de squad
  - `operations`: Acceso a operaciones (futuro)

### Flujo de Autenticación
1. Usuario ingresa credenciales en SplashScreen
2. Se valida contra configuración en constants.ts
3. Se establece el rol y datos de usuario
4. Redirección automática según rol
5. Protección de rutas basada en roles

### Protección de Rutas
```typescript
// Ejemplo de ruta protegida
<Route 
  path="/admin" 
  element={userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} 
/>
```

## APIs y Servicios

### Supabase Client
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Operaciones CRUD
```typescript
// Ejemplo: Obtener personas
const { data: persons, error } = await supabase
  .from('persons')
  .select('*')
  .order('nombre');

// Ejemplo: Insertar persona
const { data, error } = await supabase
  .from('persons')
  .insert(newPerson)
  .select()
  .single();
```

## Despliegue

### Desarrollo
```bash
npm run dev
```

### Construcción
```bash
npm run build
```

### Vista previa
```bash
npm run preview
```

### Despliegue en Producción
- Build automático en Lovable
- Deploy automático al hacer cambios
- Integración continua habilitada

## Mejores Prácticas

### Código
- Usar TypeScript en todo el proyecto
- Componentes funcionales con hooks
- Props tipadas e interfaces claras
- Comentarios en español para contexto de negocio

### Estado
- React Query para estado del servidor
- useState para estado local del componente
- localStorage para persistencia simple

### Estilos
- Tailwind CSS con tokens semánticos
- Sistema de diseño consistente
- Responsive design por defecto
- Dark/Light mode soportado

### Performance
- Lazy loading de rutas y componentes
- Memoización donde sea apropiado
- Optimización de re-renders
- Bundle splitting automático con Vite

### Seguridad
- Validación de inputs con Zod
- Sanitización de datos
- Row Level Security en Supabase
- Protección de rutas por roles

## Troubleshooting

### Problemas Comunes
1. **Error de tipos Supabase**: Regenerar tipos con `supabase gen types typescript`
2. **Error de autenticación**: Verificar credenciales en constants.ts
3. **Error de rutas**: Verificar configuración en App.tsx
4. **Error de estilos**: Verificar configuración de Tailwind

### Logs y Debugging
- Console logs en desarrollo
- React Query DevTools
- Supabase Dashboard para logs de BD
- Network tab para requests HTTP

### Monitoreo
- Error boundaries para captura de errores
- Toast notifications para feedback de usuario
- Loading states para mejor UX
- Audit logs para trazabilidad (futuro)

---

*Última actualización: 2025-01-24*
*Versión: 1.0.0*