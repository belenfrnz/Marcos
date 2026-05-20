# Prof. Marcos · Tutor de Psiquiatría

Tu tutor socrático personalizado para la residencia de psiquiatría.

## Setup en 15 minutos

### 1. Supabase

1. Entrá a [supabase.com](https://supabase.com) → New project
2. Elegí nombre: `prof-marcos` | Región: South America (São Paulo)
3. Esperá que termine de crear (~2 min)
4. Andá a **SQL Editor → New query**
5. Pegá todo el contenido de `schema.sql` y hacé click en **Run**
6. Verificá que aparezcan las 3 tablas: documents, messages, tasks

### 2. Variables de entorno

Copiá `.env.example` como `.env`:

```
cp .env.example .env
```

Completá con tus datos:
- `VITE_SUPABASE_URL` → Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY` → Settings → API → anon public key
- `VITE_ANTHROPIC_KEY` → console.anthropic.com → API Keys

### 3. Deploy en Netlify

**Opción A: desde GitHub (recomendado)**
1. Subí esta carpeta a un repo de GitHub
2. netlify.com → Add new site → Import from Git
3. Elegí el repo
4. En **Environment variables** agregá las 3 variables del `.env`
5. Deploy (Netlify detecta el `netlify.toml` automáticamente)

**Opción B: drag & drop**
1. `npm install && npm run build`
2. Arrastrá la carpeta `dist/` a netlify.com/drop

### 4. Primera vez

1. Abrís la URL de tu sitio
2. Creás tu cuenta con email y contraseña
3. ¡Listo! Subí tu primer PDF y empezá con el Prof. Marcos

---

## Estructura del proyecto

```
src/
  lib/
    supabase.js      → cliente Supabase
    claude.js        → llamadas a la API de Anthropic
    prompts.js       → system prompts del mentor
    curriculum.js    → programa curricular + roles del mentor
  hooks/
    useAuth.jsx      → contexto de autenticación
  components/
    UI.jsx           → componentes reutilizables (Btn, Card, Badge...)
    Sidebar.jsx      → navegación lateral
  pages/
    Login.jsx        → pantalla de login/registro
    Dashboard.jsx    → inicio con saludo y tareas pendientes
    MyPDFs.jsx       → gestión de documentos
    Chat.jsx         → sesión de chat con mentor + PDF
    Tasks.jsx        → tareas con corrección automática
    ProgramAndSearch.jsx → programa curricular + buscador
  App.jsx            → routing principal
  main.jsx           → entry point
schema.sql           → tablas y políticas de Supabase
```

## Funcionalidades

- 🔐 Autenticación con Supabase (email/password)
- 📄 Subida de PDFs con rol de mentor personalizable
- 💬 Chat socrático persistente en la nube por documento
- ✍️ Tareas asignadas por el mentor, con corrección y calificación automática
- 📚 Programa curricular guiado para la residencia
- 🔍 Búsqueda global en PDFs, chats y tareas
- 📱 Acceso desde cualquier dispositivo (datos en la nube)
