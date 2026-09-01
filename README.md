# GYM SHIMOKAWA — Sistema de Gestión

Sistema web integral para la administración del gimnasio GYM SHIMOKAWA. Control de clientes, membresías, ventas, asistencia, finanzas y más.

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4
- **Build:** Vite
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel
- **Gráficos:** Recharts

## Módulos

| Módulo | Función |
|--------|---------|
| **Dashboard** | Resumen general con estadísticas y gráficos |
| **Clientes** | Alta, baja, edición, filtro por membresía, DNI/carné extranjería |
| **Membresías** | Crear, editar, eliminar membresías con precios y duración |
| **Asistencia** | Registro de entrada/salida de clientes |
| **Ventas** | Registro de ventas de productos y membresías |
| **Productos** | Inventario de productos del gimnasio |
| **Caja** | Control de apertura/cierre de caja diario |
| **Egresos** | Registro de gastos operativos |
| **Fiados** | Control de créditos a clientes |
| **Descuentos** | Gestión de descuentos aplicables |
| **Promociones** | Crear y gestionar promociones activas |
| **Personal** | Administración de empleados |
| **Usuarios** | CRUD de usuarios del sistema (solo admin) |
| **Recordatorios** | Alertas de vencimiento de membresías |
| **Reportes** | Reportes financieros y de asistencia |
| **Exportar** | Exportación de datos a Excel (.xlsx) |

## Seguridad

- **RLS (Row Level Security)** habilitado en todas las tablas
- **Funciones SECURITY DEFINER** para operaciones sensibles (eliminar usuarios/clientes)
- **Autenticación** por email + contraseña via Supabase Auth
- **Roles:** admin, recepcionista, supervisor, vendedor
- **Protección de rutas** según permisos por sección

## Variables de entorno

Crear archivo `.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy a Vercel

1. Conectar el repo en [vercel.com](https://vercel.com)
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Las variables de entorno se configuran en el dashboard de Vercel

## Estructura

```
src/
├── components/       # Componentes reutilizables (UI, gráficos, tablas)
├── hooks/            # Custom hooks (useUserRole)
├── layouts/          # Layout del dashboard con sidebar
├── lib/
│   ├── api/          # Funciones de acceso a Supabase por módulo
│   ├── supabase.ts   # Cliente Supabase
│   ├── types.ts      # Definiciones TypeScript
│   └── utils.ts      # Utilidades
├── pages/            # Páginas por ruta
│   ├── dashboard/    # Todas las secciones del sistema
│   └── login.tsx     # Pantalla de login
├── providers/        # Context providers (Query, Supabase)
├── App.tsx           # Rutas y lazy loading
└── main.tsx          # Entry point
```
