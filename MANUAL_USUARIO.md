# Manual de Usuario - Sistema de Gestión de Recursos y Asignaciones

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Panel de Administrador](#panel-de-administrador)
4. [Panel de Squad Lead](#panel-de-squad-lead)
5. [Funcionalidades Principales](#funcionalidades-principales)
6. [Guías Paso a Paso](#guías-paso-a-paso)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

## Introducción

Bienvenido al Sistema de Gestión de Recursos y Asignaciones. Esta aplicación te permite gestionar personas, proyectos, asignaciones y festivos de manera eficiente y centralizada.

### ¿Qué puedes hacer con este sistema?
- ✅ Gestionar recursos humanos y sus datos
- ✅ Administrar proyectos y asignaciones
- ✅ Controlar festivos por ubicaciones geográficas
- ✅ Generar informes y estadísticas
- ✅ Importar/exportar datos masivamente
- ✅ Configurar parámetros del sistema

## Acceso al Sistema

### Pantalla de Inicio (SplashScreen)

![Pantalla de Login](ruta-a-screenshot-login)

Al acceder al sistema, verás la pantalla de autenticación con:
- **Campo Usuario**: Introduce tu nombre de usuario
- **Campo Contraseña**: Introduce tu contraseña
- **Botón Iniciar Sesión**: Accede al sistema

### Credenciales Disponibles
- **Administrador**:
  - Usuario: `admin`
  - Contraseña: `admin123`
  
- **Squad Lead**: Selecciona tu nombre de la lista de squad leads disponibles

### Pantalla de Carga
Después del login exitoso, verás una pantalla de carga que te preparará el acceso a tu panel correspondiente.

## Panel de Administrador

### Dashboard Principal

![Dashboard Admin](ruta-a-screenshot-admin-dashboard)

El panel de administración incluye las siguientes secciones:

#### 📊 Tarjetas de Estadísticas
- **Total Personas**: Número total de recursos registrados
- **Total Proyectos**: Proyectos activos en el sistema
- **Asignaciones Activas**: Asignaciones actualmente en curso
- **Próximos Festivos**: Festivos que se aproximan

#### 🛠️ Accesos Rápidos
- **Gestión de Recursos**: Administrar personas y equipos
- **Gestión de Proyectos**: Crear y editar proyectos
- **Gestión de Festivos**: Configurar festivos regionales
- **Gestión de Capacidades**: Controlar capacidades y habilidades
- **Gestión de Configuración**: Configurar parámetros del sistema
- **Copias de Seguridad**: Backup y restauración de datos
- **Registros de Auditoría**: Ver logs del sistema

### Gestión de Recursos

![Gestión de Recursos](ruta-a-screenshot-recursos)

#### Funcionalidades:
- **Vista de Tabla**: Lista completa de personas con filtros
- **Filtros Disponibles**:
  - Por nombre
  - Por squad lead
  - Por oficina
  - Por grupo

#### Acciones Disponibles:
- ➕ **Añadir Persona**: Crear nuevo registro manualmente
- 📁 **Importar Excel**: Cargar múltiples personas desde archivo
- ✏️ **Editar**: Modificar datos de una persona
- 🗑️ **Eliminar**: Remover persona del sistema
- 📊 **Exportar**: Descargar datos en Excel

#### Campos de Persona:
- **Nombre**: Nombre completo
- **CEX**: Código de empleado
- **Número Personal**: Identificador único
- **Fecha Incorporación**: Fecha de inicio
- **Email Empresa**: Correo corporativo
- **Grupo**: Departamento o área
- **Categoría**: Nivel profesional
- **Oficina**: Ubicación física
- **Squad Lead**: Jefe de equipo asignado

### Gestión de Proyectos

![Gestión de Proyectos](ruta-a-screenshot-proyectos)

#### Funcionalidades:
- **Lista de Proyectos**: Todos los proyectos del sistema
- **Estados**: Activo, Completado, Pausado, Cancelado
- **Filtros**: Por estado, fecha, nombre

#### Acciones:
- ➕ **Crear Proyecto**: Nuevo proyecto
- ✏️ **Editar Proyecto**: Modificar detalles
- 👥 **Ver Asignaciones**: Personas asignadas al proyecto
- 📊 **Estadísticas**: Métricas del proyecto

### Gestión de Festivos

![Gestión de Festivos](ruta-a-screenshot-festivos)

#### Mapa Interactivo de España:
- **Vista Geográfica**: Mapa de comunidades autónomas
- **Filtros por Región**: Selecciona ubicación específica
- **Tipos de Festivos**:
  - 🏛️ Nacionales
  - 🏘️ Autonómicos
  - 🏠 Locales

#### Gestión de Festivos:
- ➕ **Añadir Festivo**: Crear nueva fecha festiva
- 📅 **Calendario**: Vista mensual de festivos
- 🌍 **Por Ubicación**: Filtrar por provincia/región
- 📁 **Importar**: Cargar festivos desde Excel

### Gestión de Capacidades

![Gestión de Capacidades](ruta-a-screenshot-capacidades)

#### Funcionalidades:
- **Matriz de Habilidades**: Relación persona-habilidad
- **Niveles de Competencia**: Básico, Intermedio, Avanzado, Experto
- **Categorías**: Técnicas, Metodológicas, Personales

#### Acciones:
- ➕ **Asignar Capacidad**: Añadir habilidad a persona
- 📊 **Evaluar Nivel**: Actualizar competencia
- 🔍 **Buscar por Skill**: Encontrar personas con habilidad específica

### Configuración del Sistema

![Configuración](ruta-a-screenshot-configuracion)

#### Pestañas de Configuración:

##### 🛡️ Autenticación
- Usuario administrador
- Contraseña administrador

##### ⏰ Trabajo
- Horas por día por defecto (8)
- Porcentaje por defecto (100%)
- Tipo de asignación por defecto
- Estado por defecto

##### 🎨 Interfaz
- Colores de proyectos
- Texto de carga por defecto
- Tamaño de página
- Configuración de paginación

##### 🗄️ Base de Datos
- Tipos de asignación permitidos
- Estados de asignación
- Estados de tareas
- Niveles de prioridad

##### 📂 Fuentes de Datos
- Origen por defecto
- Origen administrador
- Origen sistema

## Panel de Squad Lead

### Dashboard de Squad Lead

![Dashboard Squad Lead](ruta-a-screenshot-squad-dashboard)

#### Vista General:
- **Mi Equipo**: Resumen de personas a cargo
- **Asignaciones Activas**: Proyectos en curso
- **Disponibilidad**: Estado de capacidad del equipo
- **Próximos Festivos**: Festivos que afectan al equipo

#### Accesos Rápidos:
- 👥 **Mi Equipo**: Ver detalles del equipo
- 📋 **Asignaciones**: Gestionar asignaciones
- 🏗️ **Proyectos**: Proyectos del squad
- ⚡ **Capacidades**: Habilidades del equipo
- 📅 **Festivos**: Festivos que afectan al squad
- 📊 **Disponibilidad**: Análisis de capacidad
- 📈 **Informes**: Reportes del squad

### Gestión de Asignaciones del Squad

![Asignaciones Squad](ruta-a-screenshot-squad-asignaciones)

#### Funcionalidades:
- **Vista por Persona**: Asignaciones de cada miembro
- **Vista por Proyecto**: Recursos asignados por proyecto
- **Línea de Tiempo**: Cronología de asignaciones

#### Acciones:
- ➕ **Nueva Asignación**: Asignar persona a proyecto
- ✏️ **Editar Asignación**: Modificar detalles
- 📊 **Ver Progreso**: Estado de avance
- ⏱️ **Registrar Tiempo**: Horas trabajadas

### Gestión de Festivos del Squad

![Festivos Squad](ruta-a-screenshot-squad-festivos)

#### Vista Personalizada:
- **Filtro por Ubicación**: Solo festivos relevantes para el equipo
- **Calendario del Squad**: Vista mensual personalizada
- **Impacto en Proyectos**: Cómo afectan los festivos a las entregas

## Funcionalidades Principales

### Importación de Datos

#### Formato Excel Requerido:
```
| nombre | cex | num_pers | fecha_incorporacion | mail_empresa | grupo | categoria | oficina | squad_lead |
|--------|-----|----------|-------------------|--------------|-------|-----------|---------|------------|
```

#### Pasos para Importar:
1. Descarga la plantilla Excel
2. Completa los datos siguiendo el formato
3. Haz clic en "Importar Excel"
4. Selecciona tu archivo
5. Revisa la vista previa
6. Confirma la importación

### Exportación de Datos

#### Formatos Disponibles:
- **Excel (.xlsx)**: Para edición externa
- **PDF**: Para informes y documentación

#### Opciones de Exportación:
- **Datos Filtrados**: Solo los elementos visibles
- **Datos Completos**: Toda la información
- **Resumen Ejecutivo**: Estadísticas y métricas

### Filtros y Búsquedas

#### Filtros Disponibles:
- **Por Texto**: Búsqueda en nombre, email, etc.
- **Por Fechas**: Rangos de fechas
- **Por Categorías**: Dropdown de opciones
- **Por Estados**: Activo, inactivo, etc.

#### Búsqueda Avanzada:
- Combinación de múltiples filtros
- Guardado de filtros frecuentes
- Filtros rápidos predefinidos

## Guías Paso a Paso

### Crear una Nueva Persona

1. Ve a **Gestión de Recursos**
2. Haz clic en **"➕ Añadir Persona"**
3. Completa el formulario:
   - Nombre completo
   - CEX (obligatorio)
   - Número personal (único)
   - Email empresa
   - Fecha de incorporación
   - Grupo y categoría
   - Oficina
   - Squad lead asignado
4. Haz clic en **"Guardar"**
5. ✅ Persona creada correctamente

### Asignar Persona a Proyecto

1. Ve a **Gestión de Proyectos**
2. Selecciona el proyecto deseado
3. Haz clic en **"👥 Ver Asignaciones"**
4. Clic en **"➕ Nueva Asignación"**
5. Selecciona:
   - Persona a asignar
   - Fechas de inicio y fin
   - Porcentaje de dedicación
   - Horas por día
   - Tipo de asignación
6. Añade notas si es necesario
7. Haz clic en **"Asignar"**
8. ✅ Asignación creada

### Configurar Festivos Regionales

1. Ve a **Gestión de Festivos**
2. Usa el mapa para seleccionar la región
3. Haz clic en **"➕ Añadir Festivo"**
4. Completa:
   - Nombre del festivo
   - Fecha
   - Ubicación específica
   - Tipo (nacional/autonómico/local)
5. Haz clic en **"Guardar"**
6. ✅ Festivo configurado

### Importar Datos Masivamente

1. Prepara tu archivo Excel con el formato correcto
2. Ve a la sección correspondiente (Recursos, Proyectos, etc.)
3. Haz clic en **"📁 Importar Excel"**
4. Selecciona tu archivo
5. Revisa la vista previa:
   - ✅ Registros válidos en verde
   - ❌ Errores en rojo con descripción
6. Corrige errores si es necesario
7. Haz clic en **"Confirmar Importación"**
8. ✅ Datos importados correctamente

## Preguntas Frecuentes

### ❓ ¿Cómo cambio la contraseña de administrador?
Ve a **Configuración del Sistema > Autenticación** y modifica la contraseña. Los cambios se aplican inmediatamente.

### ❓ ¿Puedo deshacer una importación de datos?
Actualmente no hay función de deshacer. Te recomendamos hacer una copia de seguridad antes de importaciones grandes.

### ❓ ¿Qué formato de fecha debo usar?
Usa el formato DD/MM/YYYY para todas las fechas en el sistema.

### ❓ ¿Cómo añado un nuevo squad lead?
Ve a **Configuración del Sistema > Base de Datos** y añade el nuevo squad lead a la lista.

### ❓ ¿Puedo filtrar por múltiples criterios?
Sí, todos los filtros se pueden combinar para búsquedas más específicas.

### ❓ ¿Cómo genero un informe de asignaciones?
Ve a la sección correspondiente y usa el botón **"📊 Exportar"** para generar informes en Excel o PDF.

### ❓ ¿Qué hago si no veo mis datos?
Verifica los filtros aplicados y asegúrate de tener los permisos necesarios para ver esa información.

### ❓ ¿Puedo personalizar los colores de los proyectos?
Sí, ve a **Configuración del Sistema > Interfaz > Colores de Proyectos** para personalizar la paleta.

### ❓ ¿Cómo contacto soporte técnico?
Para soporte técnico, contacta al administrador del sistema o revisa la documentación técnica.

---

*Última actualización: 2025-01-24*
*Versión: 1.0.0*

**¿Necesitas ayuda adicional?**
- 📖 Consulta este manual
- 🛠️ Revisa la configuración del sistema
- 👥 Contacta a tu administrador
- 💡 Usa los tooltips en la interfaz para ayuda contextual