# Sistema de Control de Acceso al Restaurante Escolar

Aplicación web para el control de acceso al restaurante escolar de la Institución Educativa Nuevo Latir, diseñada específicamente para profesores.

## Características

- 🔐 **Autenticación con códigos de 6 caracteres** - Sistema seguro y fácil de usar
- 📱 **Diseño móvil optimizado** - Interfaz táctil con botones grandes
- ⚡ **Tiempo real** - Sincronización automática con Supabase
- 👥 **Gestión de profesores** - Dashboard administrativo completo
- 🎯 **Sistema de ciclos educativos** - Organización por 4 ciclos + modalidad técnica
- 🍽️ **Control de horarios de comida** - Gestión de turnos y asistencia

## Tecnologías

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Base de datos, Auth, Storage)
- **Styling**: Tailwind CSS v4 con sistema de colores personalizado
- **Build Tool**: Vite

## Configuración

1. **Clonar el repositorio**
   ```bash
   git clone [tu-repositorio]
   cd restaurant-access-control
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus credenciales de Supabase.

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

5. **Construir para producción**
   ```bash
   npm run build
   ```

## Deployment

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Deploy automático en cada push

### Netlify
1. Conecta tu repositorio a Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Configura las variables de entorno

### Otros proveedores
La aplicación es compatible con cualquier hosting que soporte aplicaciones React estáticas.

## Estructura del Proyecto

```
├── components/          # Componentes React
├── utils/              # Utilidades y hooks
├── styles/             # Estilos globales
├── supabase/           # Configuración backend
└── App.tsx             # Componente principal
```

## Configuración de Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Copia las credenciales del proyecto
3. Configura las variables de entorno
4. La aplicación creará automáticamente las tablas necesarias

## Ciclos Educativos

- **Ciclo 1**: Transición a 3° + Brújula 1 y 2
- **Ciclo 2**: 4°-5° + Aceleración 1 y 2  
- **Ciclo 3**: 6°-8° + CS1
- **Ciclo 4**: 9°-11° + CS2
- **Modalidad Técnica**: 6 programas técnicos

## Licencia

Propiedad de la Institución Educativa Nuevo Latir.