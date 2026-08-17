import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from './screens/LoginScreen';
import SurveyScreen from './screens/SurveyScreen';
import ThanksScreen from './screens/ThanksScreen';
import AdminScreen from './screens/AdminScreen';
import GestorScreen from './screens/GestorScreen';
import { auth } from './services/firebase';
import { obtenerPerfil, guardarTokenPush, obtenerSucursales } from './services/encuestaService';
import * as Notifications from 'expo-notifications';

// Sucursales de respaldo por si Firestore falla
const SUCURSALES_FALLBACK = [
  {
    id: 'sucursal_1',
    nombre: 'Sucursal 1 PROCOMIN',
    direccion: 'Pendiente confirmar',
    latitud: 19.112389510405684,
    longitud: -98.20000515326635,
    radioMetros: 200,
    activa: true,
  },
  {
    id: 'sucursal_2',
    nombre: 'Sucursal 2 PROCOMIN',
    direccion: 'Pendiente confirmar',
    latitud: 19.087169335025138,
    longitud: -98.19158949100982,
    radioMetros: 200,
    activa: true,
  },
];

const ROLES_EMPLEADO = ['cocina', 'usuario'];

const getPantalla = (rol) => {
  if (rol === 'admin') return 'admin';
  if (ROLES_EMPLEADO.includes(rol)) return 'survey';
  return 'gestor';
};

export default function App() {
  const [pantalla, setPantalla] = useState('login');
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sucursales, setSucursales] = useState(SUCURSALES_FALLBACK);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const [datosPerfil, sucursalesDB] = await Promise.all([
            obtenerPerfil(user.uid),
            obtenerSucursales(),
          ]);
          setPerfil(datosPerfil);
          if (sucursalesDB.length > 0) setSucursales(sucursalesDB);
          setPantalla(getPantalla(datosPerfil.rol));

          // Registrar token push
          try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
              const token = (await Notifications.getExpoPushTokenAsync()).data;
              await guardarTokenPush(user.uid, token);
            }
          } catch (_) {}

        } catch {
          setPantalla('login');
        }
      } else {
        setPantalla('login');
        setPerfil(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3d263a' }}>
        <ActivityIndicator size="large" color="#ff9e71" />
      </View>
    );
  }

  if (pantalla === 'login') {
    return <LoginScreen onLogin={() => {}} />;
  }

  if (pantalla === 'admin') {
    return <AdminScreen perfil={perfil} sucursales={sucursales} onLogout={() => setPantalla('login')} />;
  }

  if (pantalla === 'gestor') {
    return <GestorScreen perfil={perfil} sucursales={sucursales} onLogout={() => setPantalla('login')} />;
  }

  if (pantalla === 'survey') {
    return (
      <SurveyScreen
        perfil={perfil}
        sucursales={sucursales}
        onSubmit={() => setPantalla('thanks')}
      />
    );
  }

  if (pantalla === 'thanks') {
    return (
      <ThanksScreen
        sucursalNombre={sucursales.find(s => s.id === perfil?.sucursalId)?.nombre ?? 'Sucursal'}
        onReset={() => setPantalla('login')}
      />
    );
  }
}
