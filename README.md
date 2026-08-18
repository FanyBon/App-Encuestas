# Encuesta PROCOMIN

Sistema de encuestas y reportes internos de PROCOMIN. El repositorio contiene **dos aplicaciones independientes** que comparten el mismo proyecto de Firebase:

| App | Carpeta | Tecnología | Para quién |
|---|---|---|---|
| **App móvil** | raíz del repo (`App.js`, `screens/`, `services/`, `styles/`, `constants/`) | Expo / React Native | Empleados de sucursal (llenan encuestas, ven reportes) y gestores/admin desde el celular |
| **Panel web** | `admin-web/` | Vite + React | Administradores y gestores desde el navegador (dashboard, usuarios, sucursales, plantillas) |

Ambas leen y escriben en las mismas colecciones de Firestore, así que un cambio de datos en una se refleja en la otra.

> **Base de datos:** este proyecto usa **Firebase (Firestore + Auth)**, no SQL Server. No hay una base de datos relacional detrás de ninguna de las dos apps.

---

## Estructura del proyecto

```
encuesta-PROCOMIN_copia2/
├── App.js                     # Entry point de la app móvil, enrutamiento por rol
├── index.js                   # registerRootComponent (Expo)
├── app.json                   # Configuración de Expo
│
├── screens/                   # Pantallas de la app MÓVIL (una por archivo)
│   ├── LoginScreen.js
│   ├── SurveyScreen.js        # Encuesta que llena el empleado
│   ├── ThanksScreen.js        # Pantalla de agradecimiento post-envío
│   ├── AdminScreen.js         # Vista de administrador
│   ├── GestorScreen.js        # Vista de gestor de sucursal
│   ├── CrearEncuestaScreen.js
│   ├── CrearUsuarioScreen.js
│   ├── ReportesScreen.js
│   ├── NotificacionesScreen.js
│   └── PerfilScreen.js
│
├── services/
│   ├── firebase.js            # Inicialización de Firebase (Auth + Firestore) para la app móvil
│   └── encuestaService.js     # Toda la lógica de datos: login, encuestas, reportes, plantillas, notificaciones push, usuarios
│
├── styles/                    # Un archivo de estilos StyleSheet por screen
├── constants/
│   ├── colors.js               # Paleta de colores de la app móvil
│   ├── cloudinary.js           # Config de subida de fotos (Cloudinary)
│   ├── preguntas.js            # ⚠️ Placeholder — no son las preguntas definitivas, se van a reemplazar
│   └── sucursales.js           # ⚠️ Placeholder — coordenadas fijas de prueba, se van a reemplazar
├── models/
│   └── Encuesta.js             # Factory que arma el objeto "encuesta" antes de guardarlo
│
└── admin-web/                  # Panel WEB (proyecto independiente, su propio package.json)
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx              # TODO el panel vive aquí: Login, Dashboard, Usuarios,
        │                        # Sucursales, Encuestas, Plantillas, Reportes
        │                        # (cada uno es un componente dentro del mismo archivo)
        ├── styles.css
        ├── services/firebase.js
        └── constants/
            ├── preguntas.js
            └── sucursales.js
```

> Nota para quien busque una pantalla del panel web: `admin-web` no separa cada vista en archivos como `screens/`. Todas las páginas del panel (`LoginPage`, `Dashboard`, `UsersPage`, `BranchesPage`, `SurveysPage`, `TemplatesPage`, `ReportsPage`, etc.) son funciones definidas dentro de `admin-web/src/App.jsx`.

---

## Qué hace el sistema

- **Empleados** (`cocina` / `usuario`) inician sesión desde la app móvil y contestan una encuesta diaria por sucursal, con opción de adjuntar foto y ubicación GPS.
- **Gestores** ven las encuestas y reportes de su propia sucursal (filtrados por `sucursalId`), pueden crear plantillas de encuesta y responder reportes.
- **Administradores** ven todo el sistema, gestionan usuarios y sucursales, y tienen acceso al dashboard con métricas — tanto desde la app móvil (`AdminScreen`) como desde el panel web (`admin-web`).
- Las notificaciones push se registran vía `expo-notifications` y se guardan por usuario en Firestore.

### Colecciones de Firestore en uso
`usuarios`, `encuestas`, `plantillas`, `reportes`, `notificaciones`, `sucursales`.

---

## Cómo levantar el proyecto en local

### Requisitos previos
- Node.js (LTS reciente)
- npm
- Para probar en dispositivo/emulador: la app **Expo Go**, o Android Studio / Xcode

### 1. App móvil (Expo)

```bash
# desde la raíz del repo
npm install
npm start          # abre el menú de Expo (QR, web, etc.)

# o directo a una plataforma:
npm run android
npm run ios
npm run web
```

Esto levanta Metro Bundler; escanea el QR con Expo Go o presiona `a` / `i` / `w` en la terminal para abrir en Android, iOS o navegador.

### 2. Panel web (Vite)

```bash
cd admin-web
npm install
npm run dev
```

Se sirve en `http://localhost:5173`.

Otros comandos disponibles dentro de `admin-web/`:

```bash
npm run build      # build de producción
npm run preview    # sirve el build de producción localmente
```

---

## Configuración / pendientes de seguridad

Actualmente las credenciales de **Firebase** (`services/firebase.js` y `admin-web/src/services/firebase.js`) y de **Cloudinary** (`constants/cloudinary.js`) están hardcodeadas directamente en el código fuente, no en variables de entorno.

**Pendiente recomendado:** migrar esos valores a un archivo `.env` (ya ignorado por `.gitignore` vía `.env*.local`) y consumirlos con `process.env.EXPO_PUBLIC_...` en la app móvil y `import.meta.env.VITE_...` en el panel web, para no exponerlos en el repositorio ni en la documentación.

---

## Permisos por rol

| Rol | App móvil | Panel web |
|---|---|---|
| `usuario` / `cocina` | Contesta encuesta diaria | — (no tiene acceso al panel) |
| `gestor` | Ve reportes/encuestas de su sucursal | Ve datos filtrados por `sucursalId` |
| `admin` | Acceso total (`AdminScreen`) | Acceso total: crear usuarios, sucursales, plantillas |

Si la colección `sucursales` está vacía en Firestore, ambas apps usan como respaldo las sucursales definidas en su respectivo `constants/sucursales.js`. Desde el panel web, la pantalla **Sucursales** tiene un botón "Sincronizar sucursales base" para persistir esas sucursales de respaldo en Firestore.

---

## Datos de prueba pendientes de reemplazar

Dos cosas quedaron hardcodeadas como placeholder y **se van a eliminar/reemplazar**, no son la versión final:

- **Preguntas** (`constants/preguntas.js` en ambas apps): no son las preguntas que finalmente se van a usar en la encuesta.
- **Ubicaciones de sucursales** (`constants/sucursales.js` en ambas apps, y `SUCURSALES_FALLBACK` en `App.js`): son coordenadas estáticas de prueba. El GPS es solo funcional (valida que el empleado esté dentro de un radio de la sucursal), no depende de que estas ubicaciones sean dinámicas.

---

## Notas para colaboradores

- Hay un `AGENTS.md` en la raíz que recuerda que **Expo cambió recientemente** — antes de tocar código de la app móvil, revisar la documentación versionada de Expo 54 (`https://docs.expo.dev/versions/v54.0.0/`).
- La lógica de datos de la app móvil está centralizada en `services/encuestaService.js` (login, encuestas, reportes, plantillas, notificaciones, usuarios) — es el primer lugar a revisar para entender el flujo de datos.
- El panel web, al ser un solo archivo (`App.jsx` de ~1400 líneas), conviene ubicarse por el nombre del componente (`Dashboard`, `UsersPage`, `BranchesPage`, `SurveysPage`, `TemplatesPage`, `ReportsPage`, `LoginPage`) antes de editar.