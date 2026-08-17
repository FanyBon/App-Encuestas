# PROCOMIN Admin Web

Panel administrativo web conectado al mismo proyecto Firebase que la app Expo.

## Ejecutar local

```bash
cd admin-web
npm install
npm run dev
```

Abre:

```txt
http://localhost:5173
```

## Firebase

Usa las colecciones actuales:

- `usuarios`
- `encuestas`
- `plantillas`
- `reportes`
- `notificaciones`

Y agrega la nueva coleccion:

- `sucursales`

Si `sucursales` todavia esta vacia, el panel usa como respaldo las dos sucursales que existian en `constants/sucursales.js`. Desde la pantalla `Sucursales` puedes presionar `Sincronizar sucursales base` para guardar esos documentos en Firestore.

## Permisos

El panel permite entrar a perfiles con rol:

- `admin`
- `gestor`

Los gestores ven datos filtrados por su `sucursalId`. Los administradores ven todo y pueden crear usuarios/sucursales.
