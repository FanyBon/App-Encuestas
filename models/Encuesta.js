export const crearEncuesta = (userId, userName, rol, sucursal, respuestas, latitud, longitud) => ({
  userId,
  userName,
  rol,
  sucursalId: sucursal.id,
  sucursalNombre: sucursal.nombre,
  respuestas,
  latitud,
  longitud,
  fechaEnvio: new Date().toISOString(),
  fotoAprobada: null,
});