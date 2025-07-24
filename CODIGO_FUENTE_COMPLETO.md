# Código Fuente Completo - Sistema de Gestión de Recursos y Asignaciones

## Índice
1. [Archivos de Configuración](#archivos-de-configuración)
2. [Componentes Principales](#componentes-principales)
3. [Páginas](#páginas)
4. [Hooks Personalizados](#hooks-personalizados)
5. [Tipos y Configuración](#tipos-y-configuración)
6. [Base de Datos](#base-de-datos)

---

## Archivos de Configuración

### package.json
```json
{
  "name": "gestión-recursos",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@supabase/supabase-js": "^2.52.0",
    "@tanstack/react-query": "^5.56.2",
    "@types/react-beautiful-dnd": "^13.1.8",
    "chart.js": "^4.5.0",
    "chartjs-adapter-date-fns": "^3.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.3.0",
    "exceljs": "^4.4.0",
    "input-otp": "^1.2.4",
    "jspdf": "^3.0.1",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-beautiful-dnd": "^13.1.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-resizable-panels": "^2.1.3",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.3",
    "xlsx": "^0.18.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### vite.config.ts
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## Componentes Principales

### src/App.tsx
```typescript
import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SplashScreen from "./pages/SplashScreen";
import LoadingScreen from "./pages/LoadingScreen";
import AdminDashboard from "./pages/AdminDashboard";
import SquadLeadDashboard from "./pages/SquadLeadDashboard";
import SquadAssignments from "./pages/SquadAssignments";
import HolidaysManagement from "./pages/HolidaysManagement";
import SquadLeadHolidaysManagement from "./pages/SquadLeadHolidaysManagement";
import BackupsManagement from "./pages/BackupsManagement";
import AuditLogs from "./pages/AuditLogs";
import CapacitiesManagement from "./pages/CapacitiesManagement";
import ProjectsManagement from "./pages/ProjectsManagement";
import ResourcesManagement from "./pages/ResourcesManagement";
import ConfigurationManagement from "./pages/ConfigurationManagement";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);

  const handleLogin = (role: string, userData?: any) => {
    console.log('App - handleLogin called with role:', role);
    setUserRole(role);
    setUserData(userData);
    setIsLoading(true);
  };

  const handleLoadingComplete = () => {
    console.log('App - Loading complete. UserRole is:', userRole);
    setIsLoading(false);
    setIsAuthenticated(true);
    
    // Limpiar el historial del navegador y forzar redirección correcta
    if (userRole === 'admin') {
      window.history.replaceState(null, '', '/admin');
    } else if (userRole === 'squad_lead') {
      window.history.replaceState(null, '', '/squad-dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    setUserData(null);
  };

  console.log('App render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'userRole:', userRole);

  if (!isAuthenticated && !isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SplashScreen onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoadingScreen onComplete={handleLoadingComplete} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Cuando está autenticado, mostrar la aplicación con routing normal

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              userRole === 'admin' ? <Navigate to="/admin" replace /> : 
              userRole === 'squad_lead' ? <Navigate to="/squad-dashboard" replace /> :
              <Index />
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" replace />} />
            <Route path="/holidays" element={userRole === 'admin' ? <HolidaysManagement /> : <Navigate to="/" replace />} />
            <Route path="/backups" element={userRole === 'admin' ? <BackupsManagement /> : <Navigate to="/" replace />} />
            <Route path="/audit-logs" element={userRole === 'admin' ? <AuditLogs /> : <Navigate to="/" replace />} />
            <Route path="/capacities" element={userRole === 'admin' ? <CapacitiesManagement /> : <Navigate to="/" replace />} />
            <Route path="/resources" element={userRole === 'admin' ? <ResourcesManagement /> : <Navigate to="/" replace />} />
            <Route path="/projects" element={userRole === 'admin' ? <ProjectsManagement /> : <Navigate to="/" replace />} />
            <Route path="/configuration" element={userRole === 'admin' ? <ConfigurationManagement /> : <Navigate to="/" replace />} />
            
            {/* Squad Lead Routes */}
            <Route path="/squad-dashboard" element={userRole === 'squad_lead' ? <SquadLeadDashboard /> : <Navigate to="/" replace />} />
            <Route path="/squad-assignments" element={userRole === 'squad_lead' ? <SquadAssignments /> : <Navigate to="/" replace />} />
            <Route path="/squad-team" element={userRole === 'squad_lead' ? <Index /> : <Navigate to="/" replace />} />
            <Route path="/squad-projects" element={userRole === 'squad_lead' ? <ProjectsManagement /> : <Navigate to="/" replace />} />
            <Route path="/squad-capacities" element={userRole === 'squad_lead' ? <CapacitiesManagement /> : <Navigate to="/" replace />} />
            <Route path="/squad-holidays" element={userRole === 'squad_lead' ? <SquadLeadHolidaysManagement /> : <Navigate to="/" replace />} />
            <Route path="/squad-availability" element={userRole === 'squad_lead' ? <Index /> : <Navigate to="/" replace />} />
            <Route path="/squad-reports" element={userRole === 'squad_lead' ? <Index /> : <Navigate to="/" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
```

---

## Tipos y Configuración

### src/config/constants.ts
```typescript
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
```

### src/types/index.ts
```typescript
export interface Person {
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

export interface SquadLead {
  id: string;
  name: string;
  email?: string;
  squad_name?: string;
  created_at?: string;
}
```

---

## Hooks Personalizados

### src/hooks/useCurrentUser.ts
```typescript
import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/constants';

interface CurrentUser {
  name: string;
  role: string;
  code?: string;
}

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga del usuario actual desde localStorage o contexto
    const savedUser = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.CURRENT_SQUAD_LEAD);
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser({
          name: userData.name,
          role: 'squad_lead',
          code: userData.code
        });
      } catch (error) {
        console.error('Error parsing saved user:', error);
      }
    }
    
    setIsLoading(false);
  }, []);

  return {
    currentUser,
    isLoading,
    error: null
  };
};
```

### src/hooks/useSquadData.ts
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSquadData = (squadLeadName?: string) => {
  return useQuery({
    queryKey: ['squadData', squadLeadName],
    queryFn: async () => {
      if (!squadLeadName) return { members: [], assignments: [] };

      // Obtener miembros del squad
      const { data: members, error: membersError } = await supabase
        .from('persons')
        .select('*')
        .eq('squad_lead', squadLeadName);

      if (membersError) throw membersError;

      // Obtener asignaciones de los miembros
      const memberIds = members?.map(m => m.id) || [];
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          person:persons(*),
          project:projects(*)
        `)
        .in('person_id', memberIds);

      if (assignmentsError) throw assignmentsError;

      return {
        members: members || [],
        assignments: assignments || []
      };
    },
    enabled: !!squadLeadName
  });
};
```

### src/hooks/useAdminStats.ts
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      // Obtener estadísticas generales
      const [personsResult, projectsResult, assignmentsResult, holidaysResult] = await Promise.all([
        supabase.from('persons').select('id', { count: 'exact' }),
        supabase.from('projects').select('id', { count: 'exact' }),
        supabase.from('assignments').select('id', { count: 'exact' }).eq('status', 'assigned'),
        supabase.from('holidays').select('*').gte('date', new Date().toISOString().split('T')[0]).limit(5)
      ]);

      return {
        totalPersons: personsResult.count || 0,
        totalProjects: projectsResult.count || 0,
        activeAssignments: assignmentsResult.count || 0,
        upcomingHolidays: holidaysResult.data || []
      };
    }
  });
};
```

---

## Base de Datos

### Migraciones Supabase

#### 20250719223305 - Tabla persons
```sql
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON public.persons
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.persons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.persons
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.persons
    FOR DELETE USING (auth.role() = 'authenticated');
```

#### 20250720071501 - Tabla projects
```sql
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    estado TEXT DEFAULT 'activo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON public.projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.projects
    FOR DELETE USING (auth.role() = 'authenticated');
```

#### 20250720124003 - Tabla assignments
```sql
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL,
    project_id UUID NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    hours_allocated NUMERIC DEFAULT 8,
    hours_worked NUMERIC DEFAULT 0,
    type TEXT DEFAULT 'project',
    status TEXT DEFAULT 'assigned',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id),
    FOREIGN KEY (person_id) REFERENCES public.persons (id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON public.assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.assignments
    FOR DELETE USING (auth.role() = 'authenticated');
```

#### 20250721173424 - Tabla holidays
```sql
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    type TEXT DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all authenticated users" ON public.holidays
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.holidays
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.holidays
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.holidays
    FOR DELETE USING (auth.role() = 'authenticated');
```

---

## Integración con Supabase

### src/integrations/supabase/client.ts
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://mgmpltplypfvhfrcgfez.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbXBsdHBseXBmdmhmcmNnZmV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0Mjg3NjIsImV4cCI6MjAzNzAwNDc2Mn0.N5HQRBNmLRVE8zGLwJ4yH5wQASUOTOhqCo7UvhxEASE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

---

## Utilidades

### src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Estilos

### src/index.css
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: "Inter", sans-serif;
  }
}
```

---

*Este archivo contiene el código fuente completo del sistema de gestión de recursos y asignaciones.*

**Notas importantes:**
- El código está organizado de manera modular y reutilizable
- Toda la configuración está centralizada en `constants.ts`
- Se siguen las mejores prácticas de React y TypeScript
- El sistema está preparado para escalabilidad futura
- La base de datos usa Supabase con Row Level Security habilitado

*Última actualización: 2025-01-24*
*Versión: 1.0.0*