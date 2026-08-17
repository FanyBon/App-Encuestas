import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { crearEncuesta } from '../models/Encuesta';
import { CLOUDINARY_CONFIG } from '../constants/cloudinary';
import { collection, addDoc, getDocs, getDoc, query, where, orderBy, doc, setDoc, Timestamp } from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';



  export const loginUsuario = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  export const cerrarSesion = () => signOut(auth);

  export const obtenerPerfil = async (uid) => {
    const docRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return docSnap.data();
    throw new Error('Usuario no encontrado');
  };

  export const actualizarPlantilla = async (
    plantillaId,
    titulo,
    preguntas
    ) => {
      await updateDoc(
        doc(db, 'plantillas', plantillaId),
        {
          titulo,
          preguntas
        }
      );
    };

    export const obtenerEncuestasContestadas = async (userId) => {
    const q = query(
      collection(db, 'encuestas'),
      where('userId', '==', userId),
      orderBy('fechaEnvio', 'desc')
    );

    const snap = await getDocs(q);

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

// Verifica si el usuario ya contestó hoy
export const yaContesoHoy = async (userId) => {
  const hoy = new Date();
  hoy.setHours(9, 0, 0, 0);
  const q = query(
    collection(db, 'encuestas'),
    where('userId', '==', userId),
    where('fechaEnvio', '>=', Timestamp.fromDate(hoy))
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

export const subirFoto = async (uri) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `foto_${Date.now()}.jpg`,
  });
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();
  return data.secure_url;
};

export const guardarEncuesta = async (perfil, sucursal, respuestas, fotos, latitud, longitud) => {
  const encuesta = crearEncuesta(
    auth.currentUser?.uid,
    perfil.nombre,
    perfil.rol,
    sucursal,
    respuestas,
    latitud,
    longitud
  );
  await addDoc(collection(db, 'encuestas'), {
    ...encuesta,
    fotos: fotos || {},
    fechaEnvio: Timestamp.now(),
    tipo: 'fija',
  });
};

// ---- REPORTES / QUEJAS ----
// ---- REPORTES / QUEJAS ----
export const guardarReporte = async (perfil, texto, esAnonimo, fotoUrl = null, plantillaId = null, gestorId = null) => {
  await addDoc(collection(db, 'reportes'), {
    userId: esAnonimo ? 'anonimo' : auth.currentUser?.uid,
    userName: esAnonimo ? 'Anonimo' : perfil.nombre,
    rol: perfil.rol,
    sucursalId: perfil.sucursalId,
    texto,
    esAnonimo,
    fotoUrl: fotoUrl || null,
    plantillaId: plantillaId || null,
    gestorId: gestorId || null,
    fecha: Timestamp.now(),
    leido: false,
  });

  // Notificar al gestor si hay gestorId
  if (gestorId) {
    const gestorDoc = await getDoc(doc(db, 'usuarios', gestorId));
    const gestor = gestorDoc.data();
    const quien = esAnonimo ? 'Alguien' : perfil.nombre;
    await crearNotificacion(gestorId, '📬 Nuevo reporte', `${quien} envió un reporte en tu encuesta`, 'reporte');
    await enviarPushNotificacion(gestor?.pushToken, '📬 Nuevo reporte', `${quien} envió un reporte en tu encuesta`);
  }

  // Notificar al admin
  const adminsSnap = await getDocs(query(collection(db, 'usuarios'), where('rol', '==', 'admin')));
  await Promise.all(adminsSnap.docs.map(async adminDoc => {
    const admin = adminDoc.data();
    await crearNotificacion(adminDoc.id, '📬 Nuevo reporte', `${perfil.nombre} envió un reporte`, 'reporte');
    await enviarPushNotificacion(admin?.pushToken, '📬 Nuevo reporte', `${perfil.nombre} envió un reporte`);
  }));
};

export const obtenerReportes = async (sucursalId, soloAdmin = false) => {
  let q;
  if (soloAdmin) {
    q = query(collection(db, 'reportes'), orderBy('fecha', 'desc'));
  } else {
    q = query(
      collection(db, 'reportes'),
      where('sucursalId', '==', sucursalId),
      orderBy('fecha', 'desc')
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const obtenerReportesPorGestor = async (gestorId) => {
  const q = query(
    collection(db, 'reportes'),
    where('gestorId', '==', gestorId),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const obtenerReportesPorArea = async () => {
  const q = query(
    collection(db, 'reportes'),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  const todos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Agrupa por rol/área
  return todos.reduce((acc, r) => {
    const area = r.rol || 'general';
    if (!acc[area]) acc[area] = [];
    acc[area].push(r);
    return acc;
  }, {});
};

// ---- ENCUESTAS PERSONALIZADAS ----
export const guardarPlantilla = async (perfil, titulo, preguntas, sucursalId) => {
  await addDoc(collection(db, 'plantillas'), {
    creadoPor: auth.currentUser?.uid,
    creadoPorNombre: perfil.nombre,
    rolCreador: perfil.rol,
    sucursalId: sucursalId,
    titulo,
    preguntas,
    fechaCreacion: Timestamp.now(),
    activa: true,
  });
};

export const obtenerPlantillas = async (sucursalId) => {
  const [snapSucursal, snapTodas] = await Promise.all([
    getDocs(query(
      collection(db, 'plantillas'),
      where('sucursalId', '==', sucursalId),
      where('activa', '==', true),
      orderBy('fechaCreacion', 'desc')
    )),
    getDocs(query(
      collection(db, 'plantillas'),
      where('sucursalId', '==', 'todas'),
      where('activa', '==', true),
      orderBy('fechaCreacion', 'desc')
    )),
  ]);
  const resultados = [
    ...snapSucursal.docs.map(d => ({ id: d.id, ...d.data() })),
    ...snapTodas.docs.map(d => ({ id: d.id, ...d.data() })),
  ];
  return resultados;
};

// ---- BLOQUEO 24 HORAS EXACTAS ----
export const yaContesoUltimas24h = async (userId) => {
    const ahora = new Date();
    // El "día" empieza a las 10:00 AM
    const inicioHoy = new Date();
    inicioHoy.setHours(10, 0, 0, 0);
    // Si ahorita son antes de las 10 AM, el periodo que cuenta es desde las 10 AM de ayer
    if (ahora < inicioHoy) {
      inicioHoy.setDate(inicioHoy.getDate() - 1);
    }
    const q = query(
      collection(db, 'encuestas'),
      where('userId', '==', userId),
      where('fechaEnvio', '>=', Timestamp.fromDate(inicioHoy))
    );
    const snap = await getDocs(q);
    return !snap.empty;
};
// ---- RESPUESTAS A PLANTILLAS ----
export const guardarRespuestaPlantilla = async (perfil, plantillaId, titulo, sucursal, respuestas) => {
  await addDoc(collection(db, 'encuestas'), {
    userId: auth.currentUser?.uid,
    userName: perfil.nombre,
    rol: perfil.rol,
    sucursalId: sucursal.id,
    sucursalNombre: sucursal.nombre,
    plantillaId,
    titulo,
    respuestas,
    fotos: {},
    fechaEnvio: Timestamp.now(),
    tipo: 'plantilla',
  });

  // Buscar al gestor que creó esta plantilla y notificarlo
  const plantillaDoc = await getDoc(doc(db, 'plantillas', plantillaId));
  const plantilla = plantillaDoc.data();
  if (plantilla?.creadoPor) {
    const gestorDoc = await getDoc(doc(db, 'usuarios', plantilla.creadoPor));
    const gestor = gestorDoc.data();
    await crearNotificacion(plantilla.creadoPor, '📋 Nueva respuesta', `${perfil.nombre} contestó tu encuesta "${titulo}"`, 'encuesta');
    await enviarPushNotificacion(gestor?.pushToken, '📋 Nueva respuesta', `${perfil.nombre} contestó tu encuesta "${titulo}"`);
  }
};

export const obtenerRespuestasPorPlantilla = async (plantillaId) => {
  const q = query(
    collection(db, 'encuestas'),
    where('plantillaId', '==', plantillaId),
    orderBy('fechaEnvio', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const yaContesoPlantilla = async (userId, plantillaId) => {
  const ahora = new Date();
  const inicioHoy = new Date();
  inicioHoy.setHours(10, 0, 0, 0);
  if (ahora < inicioHoy) {
    inicioHoy.setDate(inicioHoy.getDate() - 1);
  }
  const q = query(
    collection(db, 'encuestas'),
    where('userId', '==', userId),
    where('plantillaId', '==', plantillaId),
    where('fechaEnvio', '>=', Timestamp.fromDate(inicioHoy))
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

// ---- CREAR USUARIO GESTOR (REST API, sin cerrar sesión del admin) ----
export const crearUsuarioGestor = async (email, password, nombre, rol, sucursalId) => {
  const FIREBASE_API_KEY = 'AIzaSyAt2AEzaUwV3felOGmh32KWX-d_rjilXjs';

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const nuevoUid = data.localId;

  // Guardamos perfil en Firestore — usando imports del top del archivo
  await setDoc(doc(db, 'usuarios', nuevoUid), {
    nombre,
    email,
    rol,
    sucursalId,
    creadoEn: Timestamp.now(),
  });

  return nuevoUid;
};

// ---- CRUD ENCUESTAS (ADMIN) ----
export const eliminarEncuesta = async (encuestaId) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'encuestas', encuestaId));
};

export const obtenerTodasPlantillas = async () => {
  const snap = await getDocs(query(collection(db, 'plantillas'), orderBy('fechaCreacion', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const eliminarPlantilla = async (plantillaId) => {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'plantillas', plantillaId));
};

// Agrega esta función al final del archivo
export const obtenerReportesPorUsuario = async (userId) => {
  const q = query(
    collection(db, 'reportes'),
    where('userId', '==', userId),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const actualizarEncuesta = async (encuestaId, campos) => {
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'encuestas', encuestaId), campos);
};

// Guardar token de push del dispositivo
export const guardarTokenPush = async (uid, token) => {
  await updateDoc(doc(db, 'usuarios', uid), { pushToken: token });
};

// Crear notificación en Firestore
export const crearNotificacion = async (uid, titulo, cuerpo, tipo) => {
  await addDoc(collection(db, 'notificaciones'), {
    uid,
    titulo,
    cuerpo,
    tipo, // 'reporte' | 'encuesta'
    leida: false,
    fecha: Timestamp.now(),
  });
};

// Obtener notificaciones de un usuario
export const obtenerNotificaciones = async (uid) => {
  const q = query(
    collection(db, 'notificaciones'),
    where('uid', '==', uid),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Marcar notificación como leída
export const marcarNotificacionLeida = async (notifId) => {
  await updateDoc(doc(db, 'notificaciones', notifId), { leida: true });
};

// Marcar todas como leídas
export const marcarTodasLeidas = async (uid) => {
  const { deleteDoc } = await import('firebase/firestore');
  const q = query(
    collection(db, 'notificaciones'),
    where('uid', '==', uid),
    where('leida', '==', false)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { leida: true })));
};

// Enviar push via Expo (desde el cliente, solo funciona con Expo Push Service)
export const enviarPushNotificacion = async (pushToken, titulo, cuerpo) => {
  if (!pushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      title: titulo,
      body: cuerpo,
      sound: 'default',
    }),
  });
};

// ---- SUCURSALES DESDE FIRESTORE ----
export const obtenerSucursales = async () => {
  try {
    const snap = await getDocs(
      query(collection(db, 'sucursales'), where('activa', '==', true))
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.log('Error obteniendo sucursales:', e.message);
    return [];
  }
};