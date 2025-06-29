# 📚 Linkeee - Aplicación de Bookmarks

Una aplicación moderna y elegante para gestionar tus enlaces favoritos, construida con Next.js, Supabase y autenticación con GitHub.

Nace de la necesidad de un bookmark manager personal que sea simple y alojable en Vercel.

## ✨ Características

- 🔐 **Autenticación con GitHub** - Inicia sesión de forma segura con tu cuenta de GitHub
- 📝 **Gestión de Bookmarks** - Añade, edita y elimina tus enlaces favoritos
- 🏷️ **Sistema de Tags** - Organiza tus bookmarks con etiquetas personalizadas
- 🔍 **Búsqueda y Filtrado** - Encuentra rápidamente tus bookmarks
- 📱 **Diseño Responsivo** - Funciona perfectamente en desktop y móvil
- 🌙 **Modo Oscuro/Claro** - Interfaz adaptable a tus preferencias
- 🔒 **Control de Acceso Opcional** - Restringe el acceso a usuarios específicos
- 📊 **Bookmarks Compartidos** - Comparte enlaces públicamente

## 🚀 Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn UI, Lucide.dev
- **Backend**: Supabase (PostgreSQL, Auth, API)
- **Autenticación**: GitHub OAuth
- **Formularios**: React Hook Form + Zod
- **Notificaciones**: Sonner

## 📋 Prerrequisitos

- Node.js 18+
- Cuenta de GitHub (para autenticación)
- Cuenta de Supabase (para la base de datos)

## 🛠️ Instalación

1. **Clona el repositorio**

   ```bash
   git clone <tu-repositorio>
   cd bookmarks-app
   ```

2. **Instala las dependencias**

   ```bash
   npm install
   # o
   pnpm install
   # o
   yarn install
   ```

3. **Configura las variables de entorno**

   ```bash
   cp env.example .env.local
   ```

4. **Configura Supabase**

   - Crea un nuevo proyecto en [Supabase](https://supabase.com)
   - Ejecuta el script SQL en `scripts/create-bookmarks-table.sql`
   - Copia las credenciales de tu proyecto

5. **Configura GitHub OAuth**

   - Ve a [GitHub Developer Settings](https://github.com/settings/developers)
   - Crea una nueva OAuth App
   - Configura la URL de callback: `http://localhost:3000/api/auth/callback/github`

6. **Actualiza las variables de entorno**
   Edita `.env.local` con tus credenciales:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

   # GitHub OAuth
   GITHUB_ID=tu-github-client-id
   GITHUB_SECRET=tu-github-client-secret

   # NextAuth
   NEXTAUTH_SECRET=tu-secret-aleatorio
   ```

7. **Ejecuta la aplicación**

   ```bash
   npm run dev
   ```

8. **Abre tu navegador**
   Visita [http://localhost:3000](http://localhost:3000)

## 🔐 Configuración de Control de Acceso (ALLOWED_EMAIL)

La aplicación incluye una funcionalidad opcional para restringir el acceso solo a usuarios específicos. Esto es útil si quieres que solo tú o un grupo selecto de personas puedan usar la aplicación.

### Cómo funciona

- **Sin configuración**: Cualquier usuario con GitHub puede acceder a la aplicación
- **Con configuración**: Solo el email especificado puede acceder

### Configuración

Para habilitar el control de acceso, añade estas variables a tu `.env.local`:

```env
# Email autorizado para acceder a la aplicación (OPCIONAL)
ALLOWED_EMAIL=tu-email@github.com
NEXT_PUBLIC_ALLOWED_EMAIL=tu-email@github.com
```

### Comportamiento

1. **Si NO configuras ALLOWED_EMAIL**:

   - Cualquier usuario con cuenta de GitHub puede registrarse e iniciar sesión
   - La aplicación funciona como una plataforma pública

2. **Si configuras ALLOWED_EMAIL**:
   - Solo el email especificado puede acceder
   - Si un usuario no autorizado intenta iniciar sesión, será automáticamente desconectado
   - El sistema verifica el email en cada cambio de estado de autenticación

### Ejemplo de uso

```env
# Permitir acceso solo a tu email de GitHub
ALLOWED_EMAIL=tu-nombre@github.com
NEXT_PUBLIC_ALLOWED_EMAIL=tu-nombre@github.com
```

### Seguridad

- El email debe coincidir exactamente con el email de tu cuenta de GitHub
- La verificación se realiza tanto en el frontend como en el backend
- Los usuarios no autorizados son automáticamente desconectados

## 📊 Estructura de la Base de Datos

La aplicación utiliza una tabla `bookmarks` con la siguiente estructura:

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Características de Seguridad

- **Row Level Security (RLS)** habilitado
- Los usuarios solo pueden acceder a sus propios bookmarks
- Los bookmarks compartidos son visibles públicamente
- Índices optimizados para mejor rendimiento

## 🎨 Personalización

### Temas

La aplicación soporta modo claro y oscuro automáticamente. Los temas se basan en las preferencias del sistema del usuario.

### Componentes UI

La aplicación utiliza componentes de Radix UI con estilos personalizados con Tailwind CSS. Puedes modificar los estilos en:

- `components/ui/` - Componentes base
- `app/globals.css` - Estilos globales
- `tailwind.config.ts` - Configuración de Tailwind

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Actualiza la URL de callback de GitHub OAuth
4. ¡Listo!

### Otros proveedores

La aplicación debería ser compatible con cualquier proveedor que soporte Next.js, dentro de ellas se me ocurren:

- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify
- Entre muchas otras…

Si la alojas en otro lugar que no sea Vercel cuentame como te fué.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de [Supabase](https://supabase.com/docs)
2. Consulta la documentación de [Next.js](https://nextjs.org/docs)
3. Abre un issue en el repositorio

---

¡Disfruta organizando tus bookmarks! 🎉
