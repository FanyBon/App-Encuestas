import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerNotificaciones, marcarTodasLeidas, marcarNotificacionLeida } from '../services/encuestaService';
import { auth } from '../services/firebase';

const MORADO = '#3d263a';
const SALMON = '#ff9e71';
const GRIS = '#8E8E93';

export default function NotificacionesScreen({ onVolver }) {
  const [notifs, setNotifs] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

    const cargar = async () => {
    try {
        const uid = auth.currentUser?.uid;
        console.log('uid:', uid);
        if (!uid) { setCargando(false); return; }
        const datos = await obtenerNotificaciones(uid);
        console.log('datos:', datos);
        setNotifs(datos);
    } catch (e) {
        console.log('ERROR:', e.message);
        // Si falla el índice, muestra vacío en vez de quedarse colgado
        setNotifs([]);
    } finally {
        setCargando(false);
    }
    };

  const handleMarcarTodas = async () => {
    await marcarTodasLeidas(auth.currentUser?.uid);
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const handleTocar = async (notif) => {
    if (!notif.leida) {
      await marcarNotificacionLeida(notif.id);
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n));
    }
  };

  const formatearFecha = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const noLeidas = notifs.filter(n => !n.leida).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F5F9' }}>
      <View style={{ backgroundColor: MORADO, padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onVolver} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14 }}>Volver</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Notificaciones {noLeidas > 0 ? `(${noLeidas})` : ''}</Text>
        {noLeidas > 0 ? (
          <TouchableOpacity onPress={handleMarcarTodas}>
            <Text style={{ color: SALMON, fontSize: 13 }}>Leer todas</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
      </View>

      {cargando ? (
        <ActivityIndicator color={SALMON} style={{ marginTop: 40 }} />
      ) : notifs.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="notifications-off-outline" size={48} color={GRIS} />
          <Text style={{ color: GRIS, marginTop: 12, fontSize: 15 }}>Sin notificaciones</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {notifs.map(n => (
            <TouchableOpacity
              key={n.id}
              onPress={() => handleTocar(n)}
              style={{
                backgroundColor: n.leida ? '#fff' : '#fdf0ea',
                borderRadius: 14,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: n.tipo === 'reporte' ? '#FF3B30' : SALMON,
                shadowColor: MORADO, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: MORADO }}>{n.titulo}</Text>
                {!n.leida && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SALMON }} />}
              </View>
              <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>{n.cuerpo}</Text>
              <Text style={{ fontSize: 11, color: GRIS }}>{formatearFecha(n.fecha)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}