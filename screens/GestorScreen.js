import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  obtenerPlantillas, obtenerReportesPorGestor, cerrarSesion,
  obtenerRespuestasPorPlantilla, obtenerReportesPorUsuario, obtenerNotificaciones,
} from '../services/encuestaService';
import { auth } from '../services/firebase';
import CrearEncuestaScreen from './CrearEncuestaScreen';
import ReportesScreen from './ReportesScreen';
import PerfilScreen from './PerfilScreen';
import gestorStyles from '../styles/gestorStyles';
import NotificacionesScreen from './NotificacionesScreen';


const SALMON = '#ff9e71';
const MORADO = '#3d263a';
const MEDIO  = '#6b3a52';
const VERDE  = '#00B894';
const FONDO  = '#fdf8f6';
const GRIS   = '#8E8E93';

export default function GestorScreen({ perfil, onLogout, sucursales = [] }) {
  const [tabActivo, setTabActivo] = useState('inicio');
  const [pantalla, setPantalla] = useState(null);
  const [plantillas, setPlantillas] = useState([]);
  const [totalReportes, setTotalReportes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respuestasPorPlantilla, setRespuestasPorPlantilla] = useState({});
  const [plantillaDetalle, setPlantillaDetalle] = useState(null);
  const [respuestasDetalle, setRespuestasDetalle] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [modalKpi, setModalKpi] = useState(null); // 'encuestas' | 'reportes' | 'respuestas'
  const [misReportes, setMisReportes] = useState([]);
  const [imagenGrande, setImagenGrande] = useState(null);
  const [reportesRecibidos, setReportesRecibidos] = useState([]);

  useEffect(() => { cargarDatos(); }, []);

    const cargarDatos = async () => {
    try {
        const uid = auth.currentUser?.uid;
        const [plantillasData, reportesRecibidosData, misReportesData] = await Promise.all([
        obtenerPlantillas(perfil.sucursalId),
        obtenerReportesPorGestor(uid),      // reportes que empleados enviaron al gestor
        obtenerReportesPorUsuario(uid),     // reportes que el gestor envió al admin
        ]);
        setPlantillas(plantillasData);
        setTotalReportes(reportesRecibidosData.length);
        setReportesRecibidos(reportesRecibidosData);
        setMisReportes(misReportesData);
        const conteos = {};
        await Promise.all(plantillasData.map(async (pl) => {
        const resps = await obtenerRespuestasPorPlantilla(pl.id);
        conteos[pl.id] = resps.length;
        }));
        setRespuestasPorPlantilla(conteos);
        } catch (e) {
            console.log('Error:', e.message);
        } finally {
            setCargando(false);
            setRefreshing(false);
        }
    };

  const verDetallePlantilla = async (plantilla) => {
    setPlantillaDetalle(plantilla);
    setCargandoDetalle(true);
    try {
      const resps = await obtenerRespuestasPorPlantilla(plantilla.id);
      setRespuestasDetalle(resps);
    } catch (e) {
      console.log('Error cargando respuestas:', e);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const [notifCount, setNotifCount] = useState(0);
  useEffect(() => {
    const cargarNotifs = async () => {
      const notifs = await obtenerNotificaciones(auth.currentUser?.uid);
      setNotifCount(notifs.filter(n => !n.leida).length);
    };
    cargarNotifs();
  }, []);

  const onRefresh = () => { setRefreshing(true); cargarDatos(); };

  if (pantalla === 'crearEncuesta') {
    return (
      <CrearEncuestaScreen
        perfil={perfil}
        onVolver={() => setPantalla(null)}
        onGuardado={() => { setPantalla(null); cargarDatos(); }}
      />
    );
  }

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: FONDO }}>
        <ActivityIndicator size="large" color={SALMON} />
      </View>
    );
  }

  if (plantillaDetalle) {
    return (
      <View style={{ flex: 1, backgroundColor: FONDO }}>
        <View style={gestorStyles.detalleHeader}>
          <TouchableOpacity
            style={gestorStyles.detalleVolver}
            onPress={() => { setPlantillaDetalle(null); setRespuestasDetalle([]); }}
          >
            <Ionicons name="arrow-back" size={15} color="#fff" />
            <Text style={gestorStyles.detalleVolverTexto}>Volver</Text>
          </TouchableOpacity>
          <Text style={gestorStyles.detalleNombre}>{plantillaDetalle.titulo}</Text>
          <Text style={gestorStyles.detalleSub}>
            {respuestasDetalle.length} respuesta{respuestasDetalle.length !== 1 ? 's' : ''} recibida{respuestasDetalle.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {cargandoDetalle ? (
            <ActivityIndicator size="large" color={SALMON} style={{ marginTop: 40 }} />
          ) : respuestasDetalle.length === 0 ? (
            <Text style={{ textAlign: 'center', color: GRIS, marginTop: 40, fontSize: 14 }}>
              Nadie ha respondido esta encuesta aun
            </Text>
          ) : respuestasDetalle.map(r => (
            <View key={r.id} style={gestorStyles.respuestaCard}>
              <View style={gestorStyles.respuestaCardHeader}>
                <View style={gestorStyles.respuestaAvatar}>
                  <Text style={gestorStyles.respuestaAvatarLetra}>
                    {r.userName?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={gestorStyles.respuestaNombre}>{r.userName}</Text>
                  <Text style={gestorStyles.respuestaRol}>{r.rol}</Text>
                </View>
                <Text style={gestorStyles.respuestaFecha}>
                  {r.fechaEnvio?.toDate
                    ? r.fechaEnvio.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                    : ''}
                </Text>
              </View>

              {Object.entries(r.respuestas || {}).map(([id, valor], idx) => (
                <View key={id} style={gestorStyles.preguntaItem}>
                  <Text style={gestorStyles.preguntaNum}>Pregunta {idx + 1}</Text>
                  <Text style={gestorStyles.preguntaTexto}>
                    {plantillaDetalle?.preguntas?.find(preg => preg.id === id)?.texto ?? id}
                  </Text>
                  <View style={gestorStyles.respuestaValorWrap}>
                    <Text style={gestorStyles.respuestaValor}>{valor}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const renderContenido = () => {
    if (tabActivo === 'perfil') {
        return (
            <PerfilScreen
            perfil={perfil}
            onLogout={onLogout}
            embedded
            sucursales={sucursales}
            onRefreshPlantillas={cargarDatos}
            />
        );
    }

    if (tabActivo === 'notificaciones') {
      return (
        <NotificacionesScreen
          onVolver={() => setTabActivo('inicio')}
          onAbrir={() => setNotifCount(0)} // resetea el badge al abrir
        />
      );
    }
    if (tabActivo === 'reportes') {
      return (
        <ReportesScreen
          perfil={perfil}
          onVolver={() => setTabActivo('inicio')}
          soloLectura={false}
          gestorId={auth.currentUser?.uid}
          embedded
        />
      );
    }

    return (
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={gestorStyles.bienvenida}>Hola, {perfil?.nombre} </Text>
        <Text style={gestorStyles.bienvenidaSub}>Panel de gestion</Text>

        <View style={gestorStyles.kpiRow}>
          <TouchableOpacity style={[gestorStyles.kpiCard, { borderTopColor: SALMON }]} onPress={() => setModalKpi('encuestas')}>
            <Text style={gestorStyles.kpiNum}>{plantillas.length}</Text>
            <Text style={gestorStyles.kpiLabel}>Encuestas{'\n'}creadas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[gestorStyles.kpiCard, { borderTopColor: MORADO }]} onPress={() => setModalKpi('reportes')}>
            <Text style={gestorStyles.kpiNum}>{totalReportes}</Text>
            <Text style={gestorStyles.kpiLabel}>Reportes{'\n'}recibidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[gestorStyles.kpiCard, { borderTopColor: VERDE }]} onPress={() => setModalKpi('respuestas')}>
            <Text style={gestorStyles.kpiNum}>
              {Object.values(respuestasPorPlantilla).reduce((a, b) => a + b, 0)}
            </Text>
            <Text style={gestorStyles.kpiLabel}>Respuestas{'\n'}totales</Text>
          </TouchableOpacity>
        </View>

        <Text style={gestorStyles.seccionTitle}>Acciones rápidas</Text>
        <View style={gestorStyles.accionesRow}>
          <TouchableOpacity
            style={gestorStyles.accionBtn}
            onPress={() => setPantalla('crearEncuesta')}
          >
            <View style={[gestorStyles.accionIconWrap, { backgroundColor: 'rgba(255,158,113,0.18)' }]}>
              <Ionicons name="document-text-outline" size={22} color="#cc6a3a" />
            </View>
            <View style={gestorStyles.accionTextWrap}>
              <Text style={gestorStyles.accionTexto}>Nueva encuesta</Text>
              <Text style={gestorStyles.accionSub}>Crea preguntas personalizadas</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GRIS} />
          </TouchableOpacity>
          <TouchableOpacity
            style={gestorStyles.accionBtn}
            onPress={() => setTabActivo('reportes')}
          >
            <View style={[gestorStyles.accionIconWrap, { backgroundColor: 'rgba(61,38,58,0.08)' }]}>
              <Ionicons name="mail-outline" size={22} color={MORADO} />
            </View>
            <View style={gestorStyles.accionTextWrap}>
              <Text style={gestorStyles.accionTexto}>Ver reportes</Text>
              <Text style={gestorStyles.accionSub}>Quejas y notas del equipo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={GRIS} />
          </TouchableOpacity>
        </View>

        {plantillas.length > 0 && (
          <>
            <Text style={gestorStyles.seccionTitle}>Mis encuestas</Text>
            {plantillas.map(p => (
              <TouchableOpacity
                key={p.id}
                style={gestorStyles.encuestaCard}
                onPress={() => verDetallePlantilla(p)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={gestorStyles.encuestaTitulo}>{p.titulo}</Text>
                  <Text style={gestorStyles.encuestaSub}>
                    {p.preguntas?.length} preguntas · {
                      p.fechaCreacion?.toDate
                        ? p.fechaCreacion.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''
                    }
                  </Text>
                </View>
                <View style={gestorStyles.respBadge}>
                  <Text style={gestorStyles.respBadgeTexto}>
                    {respuestasPorPlantilla[p.id] ?? 0} resp.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={GRIS} />
              </TouchableOpacity>
            ))}
          </>
        )}

      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: FONDO }}>
    {tabActivo !== 'perfil' && tabActivo !== 'reportes' && tabActivo !== 'notificaciones' && (      <View style={gestorStyles.header}>
        <Text style={gestorStyles.headerTitle}>
          Panel de{'\n'}Gestion
        </Text>

        {!!perfil?.rol && (
          <View style={gestorStyles.rolBadge}>
            <Text style={gestorStyles.rolBadgeText}>
              {perfil.rol.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    )}
      <View style={{ flex: 1 }}>{renderContenido()}</View>
          <View style={gestorStyles.navBar}>
            {[
              { key: 'inicio',          label: 'Inicio',          icon: 'home-outline',          iconActivo: 'home' },
              { key: 'reportes',        label: 'Reportes',        icon: 'mail-outline',          iconActivo: 'mail' },
              { key: 'notificaciones',  label: 'Notificaciones',  icon: 'notifications-outline', iconActivo: 'notifications' },
              { key: 'perfil',          label: 'Perfil',          icon: 'person-outline',        iconActivo: 'person' },
            ].map(tab => {
              const activo = tabActivo === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={gestorStyles.navItem}
                  onPress={() => setTabActivo(tab.key)}
                >
                  <View style={{ position: 'relative' }}>
                    <Ionicons
                      name={activo ? tab.iconActivo : tab.icon}
                      size={22}
                      color={activo ? MORADO : GRIS}
                    />
                    {tab.key === 'notificaciones' && notifCount > 0 && (
                      <View style={{
                        position: 'absolute', top: -4, right: -4,
                        backgroundColor: '#FF3B30', borderRadius: 10,
                        minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{notifCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[gestorStyles.navLabel, activo && gestorStyles.navLabelActivo]}>
                    {tab.label}
                  </Text>
                  {activo && <View style={gestorStyles.navIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <Modal visible={!!imagenGrande} transparent animationType="fade">
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}
        onPress={() => setImagenGrande(null)}
        >
            <Image
            source={{ uri: imagenGrande }}
            style={{ width: '95%', height: '70%', borderRadius: 12 }}
            resizeMode="contain"
            />
            <Text style={{ color: '#fff', marginTop: 16, opacity: 0.6, fontSize: 13 }}>Toca para cerrar</Text>
        </TouchableOpacity>
        </Modal>
      {!!modalKpi && (
      <Modal visible={!!modalKpi} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fdf8f6', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '75%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: MORADO }}>
                {modalKpi === 'encuestas' ? 'Mis encuestas creadas' : modalKpi === 'reportes' ? 'Reportes recibidos' : 'Respuestas totales'}
              </Text>
              <TouchableOpacity onPress={() => setModalKpi(null)}>
                <Ionicons name="close" size={24} color={GRIS} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {modalKpi === 'encuestas' && (
                plantillas.length === 0
                    ? <Text style={{ color: MORADO }}>No has creado encuestas aun</Text>
                    : plantillas.map(p => (
                    <TouchableOpacity
                        key={p.id}
                        style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: MORADO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
                        onPress={() => { setModalKpi(null); verDetallePlantilla(p); }}
                    >
                        <Text style={{ fontSize: 15, fontWeight: '700', color: MORADO }}>{p.titulo}</Text>
                        <Text style={{ fontSize: 12, color: GRIS, marginTop: 4 }}>
                        {p.preguntas?.length} preguntas · {respuestasPorPlantilla[p.id] ?? 0} respuestas
                        </Text>
                        <Text style={{ fontSize: 11, color: SALMON, marginTop: 6 }}>Toca para ver respuestas →</Text>
                    </TouchableOpacity>
                    ))
                )}
              {modalKpi === 'reportes' && (
                reportesRecibidos.length === 0
                    ? <Text style={{ color: GRIS, textAlign: 'center', marginTop: 20 }}>No has recibido reportes aun</Text>
                    : reportesRecibidos.map(r => (
                    <TouchableOpacity
                        key={r.id}
                        style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: MORADO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}
                        onPress={() => { setModalKpi(null); setTabActivo('reportes'); }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: MORADO }}>
                            {r.esAnonimo ? 'Anonimo' : r.userName}
                        </Text>
                        <Text style={{ fontSize: 11, color: GRIS }}>
                            {r.fecha?.toDate ? r.fecha.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}
                        </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#444', lineHeight: 18 }} numberOfLines={2}>{r.texto}</Text>
                        {r.fotoUrl && (
                        <Text style={{ fontSize: 11, color: SALMON, marginTop: 4 }}>📎 Tiene foto adjunta</Text>
                        )}
                    </TouchableOpacity>
                    ))
                )}
              {modalKpi === 'respuestas' && (
                <View>
                  {plantillas.map(p => (
                    <View key={p.id} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: MORADO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: MORADO }}>{p.titulo}</Text>
                      <Text style={{ fontSize: 13, color: SALMON, fontWeight: '600', marginTop: 4 }}>
                        {respuestasPorPlantilla[p.id] ?? 0} respuesta{respuestasPorPlantilla[p.id] !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ))}
                  <Text style={{ textAlign: 'center', color: GRIS, marginTop: 8, fontSize: 12 }}>
                    Total: {Object.values(respuestasPorPlantilla).reduce((a, b) => a + b, 0)}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    )}
  </View>
);
}