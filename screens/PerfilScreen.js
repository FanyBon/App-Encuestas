import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { cerrarSesion, obtenerPlantillas, eliminarPlantilla, obtenerEncuestasContestadas } from '../services/encuestaService';
import { SUCURSALES as SUCURSALES_FALLBACK } from '../constants/sucursales';
import perfilStyles from '../styles/perfilStyles';
import { deleteDoc, doc } from 'firebase/firestore';
import { Modal } from 'react-native';
import CrearEncuestaScreen from './CrearEncuestaScreen';


const AZUL    = '#3d263a';
const SALMON  = '#ff9e71';
const MORADO  = '#6b3a52';
const COCINA  = '#c4607a';
const VERDE   = '#00B894';
const FONDO   = '#fdf8f6';
const BLANCO  = '#FFFFFF';
const GRIS    = '#8E8E93';
const BORDE   = '#e8d8e4';

const rolColor = (rol) => {
  if (!rol) return '#6b3a52';
  const r = rol.toLowerCase();
  if (r === 'cocina') return COCINA;
  if (r === 'admin')  return '#3d263a';
  if (r === 'usuario') return SALMON;
  return '#6b3a52';
};

const rolLabel = (rol) => {
  if (!rol) return 'Usuario';
  const r = rol.toLowerCase();
  if (r === 'cocina')  return 'Cocina';
  if (r === 'admin')   return 'Administrador';
  if (r === 'usuario') return 'Empleado General';
  return rol.charAt(0).toUpperCase() + rol.slice(1);
};

export default function PerfilScreen({ perfil, onLogout, embedded, onRefreshPlantillas, sucursales = [] }) {
  const SUCURSALES = sucursales.length > 0 ? sucursales : SUCURSALES_FALLBACK;
  const [fotoLocal, setFotoLocal] = useState(null);
  const [historialEncuestas, setHistorialEncuestas] = useState([]);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);
  const [historialReportes, setHistorialReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [seccion, setSeccion] = useState('encuestas'); // 'encuestas' | 'reportes'
  const [encuestaEditar, setEncuestaEditar] = useState(null);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  const uid = auth.currentUser?.uid;
  const sucursal = SUCURSALES.find(s => s.id === perfil?.sucursalId);
  const color = rolColor(perfil?.rol);

  useEffect(() => { cargarHistorial(); }, []);

  const cargarHistorial = async () => {
    if (!uid) {
      setCargando(false);
      return;
    }

    try {
      let encuestas = [];

      if (perfil?.rol === 'gestor' || perfil?.rol === 'admin') {
        const todasPlantillas = await obtenerPlantillas(perfil.sucursalId);
        encuestas = todasPlantillas.filter(p => p.creadoPor === uid);
      } else {
        encuestas = await obtenerEncuestasContestadas(uid);
      }

      const repSnap = await getDocs(
        query(
          collection(db, 'reportes'),
          where('userId', '==', uid),
          orderBy('fecha', 'desc')
        )
      );

      setHistorialEncuestas(encuestas);
      setHistorialReportes(
        repSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      );

    } catch (e) {
      console.log('Error:', e);
    } finally {
      setCargando(false);
    }
  };

  const elegirFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFotoLocal(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Cerrar sesion', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => { await cerrarSesion(); onLogout?.(); }
      },
    ]);
  };

const eliminarEncuesta = async (id) => {
  Alert.alert(
    'Eliminar encuesta',
    '¿Deseas eliminar esta encuesta?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarPlantilla(id);

            setHistorialEncuestas(prev =>
              prev.filter(e => e.id !== id)
            );

            onRefreshPlantillas?.();

            Alert.alert('Listo', 'Encuesta eliminada');
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        }
      }
    ]
  );
};

  const formatFecha = (timestamp) => {
    if (!timestamp?.toDate) return '—';
    return timestamp.toDate().toLocaleString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const fechaRelativa = (timestamp) => {
  if (!timestamp?.toDate) return '';

  const fecha = timestamp.toDate();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const antier = new Date(hoy);
  antier.setDate(antier.getDate() - 2);

  const fechaSolo = new Date(fecha);
  fechaSolo.setHours(0, 0, 0, 0);

  if (fechaSolo.getTime() === hoy.getTime()) {
    return 'Hoy';
  }

  if (fechaSolo.getTime() === ayer.getTime()) {
    return 'Ayer';
  }

  if (fechaSolo.getTime() === antier.getTime()) {
    return 'Antier';
  }

  return fecha.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long'
  });
};

  const inicial = perfil?.nombre?.charAt(0)?.toUpperCase() ?? '?';

  if (encuestaEditar) {
    return (
        <CrearEncuestaScreen
        perfil={perfil}
        encuestaEditar={encuestaEditar}
        onVolver={() => setEncuestaEditar(null)}
        onGuardado={() => {
            setEncuestaEditar(null);
            cargarHistorial();
            onRefreshPlantillas?.();
        }}
        />
    );
    }

  return (
    <View style={{ flex: 1, backgroundColor: FONDO }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: embedded ? 100 : 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO PERFIL ── */}
        <View style={perfilStyles.hero}>
          <View style={[perfilStyles.heroBg, { backgroundColor: color }]} />
          <TouchableOpacity style={perfilStyles.avatarWrap} onPress={elegirFoto}>
            {fotoLocal ? (
              <Image source={{ uri: fotoLocal }} style={perfilStyles.avatarImg} />
            ) : (
              <View style={[perfilStyles.avatarPlaceholder, { backgroundColor: color }]}>
                <Text style={perfilStyles.avatarLetra}>{inicial}</Text>
              </View>
            )}
            <View style={perfilStyles.camaraBtn}>
              <Ionicons name="camera" size={14} color={AZUL} />
            </View>
          </TouchableOpacity>

          <Text style={perfilStyles.nombre}>{perfil?.nombre ?? 'Sin nombre'}</Text>
          <Text style={perfilStyles.email}>{perfil?.email ?? ''}</Text>

          <View style={[perfilStyles.rolPill, { backgroundColor: color + '20', borderColor: color + '40' }]}>
            <Text style={[perfilStyles.rolTexto, { color }]}>{rolLabel(perfil?.rol)}</Text>
          </View>
        </View>

        {/* ── INFO CARDS ── */}
        <View style={perfilStyles.infoRow}>
            {perfil?.rol === 'usuario' && (
                <View style={perfilStyles.infoCard}>
                <Text style={perfilStyles.infoNum}>{historialEncuestas.length}</Text>
                <Text style={perfilStyles.infoLabel}>Encuestas{'\n'}contestadas</Text>
                </View>
          )}
        <View style={perfilStyles.infoCard}>
            <Text style={perfilStyles.infoNum}>{historialReportes.length}</Text>
            <Text style={perfilStyles.infoLabel}>Reportes{'\n'}enviados</Text>
        </View>
        {sucursal && (
            <View style={perfilStyles.infoCard}>
            <Text style={perfilStyles.infoNum} numberOfLines={1} adjustsFontSizeToFit>
                {sucursal.nombre.split(' ')[0]}
            </Text>
            <Text style={perfilStyles.infoLabel}>Sucursal{'\n'}asignada</Text>
            </View>
        )}
        </View>

        {sucursal && (
          <View style={perfilStyles.sucursalCard}>
            <Ionicons name="location" size={18} color={SALMON} style={{ marginRight: 10 }} />
            <View>
              <Text style={perfilStyles.sucursalNombre}>{sucursal.nombre}</Text>
              <Text style={perfilStyles.sucursalDir}>{sucursal.direccion}</Text>
            </View>
          </View>
        )}

        {/* ── TABS HISTORIAL ── */}
        <View style={perfilStyles.tabsRow}>
            {['encuestas', 'reportes'].map(t => (
            <TouchableOpacity
              key={t}
              style={[perfilStyles.tabBtn, seccion === t && { borderBottomColor: color, borderBottomWidth: 2 }]}
              onPress={() => setSeccion(t)}
            >
              <Text style={[perfilStyles.tabLabel, seccion === t && { color, fontWeight: '700' }]}>
                {t === 'encuestas' ? `Encuestas (${historialEncuestas.length})` : `Reportes (${historialReportes.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

       {cargando ? (
        <ActivityIndicator color={color} style={{ marginTop: 30 }} />
        ) : seccion === 'encuestas' ? (
        <View style={{ paddingHorizontal: 16 }}>
            {historialEncuestas.length === 0 ? (
            <Text style={perfilStyles.vacio}>
                Aún no has contestado ninguna encuesta
            </Text>
            ) : historialEncuestas.map(e => (
            <View
                key={e.id}
                style={perfilStyles.historialCard}
            >
                <View
                style={[
                    perfilStyles.historialDot,
                    { backgroundColor: color }
                ]}
                />

                <View style={{ flex: 1 }}>
                <Text style={perfilStyles.historialTitulo}>
                    {e.titulo}
                </Text>

                <Text style={perfilStyles.historialFecha}>
                    {formatFecha(
                    e.fechaCreacion || e.fechaEnvio
                    )}
                </Text>

                {(perfil?.rol === 'gestor' ||
                    perfil?.rol === 'admin') && (
                    <View
                    style={{
                        flexDirection: 'row',
                        marginTop: 10,
                        gap: 18
                    }}
                    >
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() =>
                        setEncuestaSeleccionada(e)
                        }
                    >
                        <Ionicons name="eye-outline" size={15} color="#7c5cbf" />
                        <Text style={{ color: '#7c5cbf', fontSize: 12, fontWeight: '600' }}>
                        Ver
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() => setEncuestaEditar(e)}
                    >
                        <Ionicons name="create-outline" size={15} color="#ff9e71" />
                        <Text style={{ color: '#ff9e71', fontSize: 12, fontWeight: '600' }}>
                            Editar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() =>
                        eliminarEncuesta(e.id)
                        }
                    >
                        <Ionicons name="trash-outline" size={15} color="#E25C5C" />
                        <Text style={{ color: '#E25C5C', fontSize: 12, fontWeight: '600' }}>
                        Eliminar
                        </Text>
                    </TouchableOpacity>
                    </View>
                )}
                </View>

                <View
                style={[
                    perfilStyles.checkBadge,
                    { backgroundColor: VERDE + '15' }
                ]}
                >
                <Ionicons name="checkmark" size={16} color={VERDE} />
                </View>
            </View>
            ))}
        </View>

        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {historialReportes.length === 0 ? (
              <Text style={perfilStyles.vacio}>Aun no has enviado ningun reporte</Text>
            ) : historialReportes.map(r => (
              <TouchableOpacity
                    key={r.id}
                    style={perfilStyles.historialCard}
                    onPress={() => setReporteSeleccionado(r)}
                    >
                <View style={[perfilStyles.historialDot, { backgroundColor: SALMON }]} />
                <View style={{ flex: 1 }}>
                  <Text style={perfilStyles.historialTitulo}>Reporte</Text>
                  <Text style={perfilStyles.historialFecha}>{formatFecha(r.fecha)}</Text>
                 {r.texto && (
                <Text
                    style={perfilStyles.historialSub}
                    numberOfLines={2}
                >
                    {r.texto}
                </Text>
                )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── CERRAR SESION ── */}
        <TouchableOpacity style={perfilStyles.logoutBtn} onPress={handleLogout}>
          <Text style={perfilStyles.logoutTexto}>Cerrar sesion</Text>
        </TouchableOpacity>
      </ScrollView>
        <Modal visible={!!encuestaSeleccionada} animationType="slide">
            <View style={{ flex: 1, backgroundColor: '#fdf8f6' }}>
                {/* Header */}
                <View style={{
                backgroundColor: '#3d263a',
                paddingTop: Platform.OS === 'ios' ? 54 : 40,
                paddingBottom: 16,
                paddingHorizontal: 16,
                }}>
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}
                    onPress={() => setEncuestaSeleccionada(null)}
                >
                    <Ionicons name="arrow-back" size={16} color="#ff9e71" />
                    <Text style={{ color: '#ff9e71', fontWeight: '600', fontSize: 13 }}>Volver</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
                    {encuestaSeleccionada?.titulo}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    {encuestaSeleccionada?.preguntas?.length} preguntas
                </Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {encuestaSeleccionada?.preguntas?.map((pregunta, index) => (
                    <View key={pregunta.id || index} style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 0.5,
                    borderColor: '#e8d8e4',
                    shadowColor: '#3d263a',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                    }}>
                    <Text style={{ fontSize: 11, color: '#ff9e71', fontWeight: '700', marginBottom: 6 }}>
                        Pregunta {index + 1}
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#3d263a', marginBottom: 10, lineHeight: 20 }}>
                        {pregunta.texto}
                    </Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#f3eef2',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        alignSelf: 'flex-start',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 11, color: '#6b3a52', fontWeight: '600' }}>
                        {pregunta.tipo === 'si/no' ? 'Si / No' : pregunta.tipo === 'texto' ? 'Texto libre' : 'Opciones'}
                        </Text>
                    </View>
                    {pregunta.opciones?.length > 0 && (
                        <View style={{ gap: 4 }}>
                        {pregunta.opciones.map((opcion, i) => (
                            <View key={i} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            backgroundColor: '#fdf8f6',
                            padding: 8,
                            borderRadius: 8,
                            }}>
                            <View style={{
                                width: 6, height: 6, borderRadius: 3,
                                backgroundColor: '#ff9e71',
                            }} />
                            <Text style={{ fontSize: 13, color: '#3d263a' }}>{opcion}</Text>
                            </View>
                        ))}
                        </View>
                    )}
                    {pregunta.requiereFoto && (
                        <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        marginTop: 8, backgroundColor: '#fff8f0',
                        padding: 8, borderRadius: 8,
                        }}>
                        <Ionicons name="camera-outline" size={14} color="#ff9e71" />
                        <Text style={{ fontSize: 12, color: '#6b3a52', fontWeight: '500' }}>
                            Requiere fotografía de evidencia
                        </Text>
                        </View>
                    )}
                    </View>
                ))}
                </ScrollView>
            </View>
        </Modal>
        <Modal visible={!!reporteSeleccionado} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{
                backgroundColor: '#fdf8f6',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                maxHeight: '70%',
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#3d263a' }}>Detalle del reporte</Text>
                    <TouchableOpacity onPress={() => setReporteSeleccionado(null)}>
                    <Ionicons name="close" size={22} color="#8E8E93" />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff9e71' }} />
                    <Text style={{ fontSize: 12, color: '#8E8E93' }}>
                    {reporteSeleccionado?.fecha?.toDate
                        ? reporteSeleccionado.fecha.toDate().toLocaleString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })
                        : '—'}
                    </Text>
                </View>

                <View style={{
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 0.5,
                    borderColor: '#e8d8e4',
                    marginBottom: 12,
                }}>
                    <Text style={{ fontSize: 14, color: '#3d263a', lineHeight: 22 }}>
                    {reporteSeleccionado?.texto || 'Sin contenido'}
                    </Text>
                </View>

                {reporteSeleccionado?.fotoUrl && (
                    <Image
                    source={{ uri: reporteSeleccionado.fotoUrl }}
                    style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12 }}
                    resizeMode="cover"
                    />
                )}

                {reporteSeleccionado?.esAnonimo && (
                    <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: '#fff8f0', padding: 8, borderRadius: 8,
                    }}>
                    <Ionicons name="eye-off-outline" size={14} color="#ff9e71" />
                    <Text style={{ fontSize: 12, color: '#6b3a52', fontWeight: '500' }}>
                        Enviado anonimamente
                    </Text>
                    </View>
                )}
                </View>
            </View>
        </Modal>
    </View>
  );
}