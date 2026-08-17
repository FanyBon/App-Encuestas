import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import { SUCURSALES as SUCURSALES_FALLBACK } from '../constants/sucursales';
import {
  cerrarSesion, obtenerReportesPorArea, obtenerReportes,
  eliminarEncuesta, obtenerTodasPlantillas, eliminarPlantilla,
} from '../services/encuestaService';
import styles from '../styles/adminStyles';
import CrearUsuarioScreen from './CrearUsuarioScreen';
import CrearEncuestaScreen from '../screens/CrearEncuestaScreen';

const MORADO  = '#3d263a';
const SALMON  = '#ff9e71';
const MEDIO   = '#6b3a52';
const MORADO2 = '#7c5cbf';
const VERDE   = '#00B894';
const GRIS    = '#8E8E93';
const BLANCO  = '#FFFFFF';

const GraficaBarras = ({ datos }) => {
  if (!datos || datos.length === 0) return null;
  const max = Math.max(...datos.map(d => d.valor), 1);
  return (
    <View style={{ marginTop: 12 }}>
      {datos.map((d, i) => (
        <View key={i} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: '#8E8E93', flex: 1 }} numberOfLines={1}>{d.label}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: MORADO }}>{d.valor}</Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#F0E9EE', borderRadius: 4 }}>
            <View style={{
              height: 8,
              width: `${(d.valor / max) * 100}%`,
              backgroundColor: i % 3 === 0 ? SALMON : i % 3 === 1 ? MORADO : MORADO2,
              borderRadius: 4,
            }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// ── REPORTES ADMIN ───────────────────────────────────────────────
const ReportesAdminVista = ({ perfil, reportesData, sucursales = [] }) => {
  const SUCURSALES = sucursales.length > 0 ? sucursales : SUCURSALES_FALLBACK;
  const [vistaAdmin, setVistaAdmin] = useState('area');
  const [sucursalFiltro, setSucursalFiltro] = useState('todas');
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [imagenGrande, setImagenGrande] = useState(null);

  const formatearFecha = (ts) => {
    if (!ts?.toDate) return '';
    return ts.toDate().toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const reportesFiltrados = sucursalFiltro === 'todas'
    ? reportesData
    : reportesData.filter(r => r.sucursalId === sucursalFiltro);

  const porArea = reportesFiltrados.reduce((acc, r) => {
    const area = r.rol || 'general';
    if (!acc[area]) acc[area] = [];
    acc[area].push(r);
    return acc;
  }, {});

  const ReporteCard = ({ r }) => (
    <TouchableOpacity style={styles.encuestaCardDetalle} onPress={() => setReporteSeleccionado(r)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.encuestaNombre}>{r.esAnonimo ? 'Anonimo' : r.userName}</Text>
        <Text style={styles.encuestaFecha} numberOfLines={2}>{r.texto}</Text>
        {r.plantillaId && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <Ionicons name="document-text-outline" size={12} color={MORADO2} />
            <Text style={{ fontSize: 11, color: MORADO2 }}>De encuesta</Text>
          </View>
        )}
        <Text style={{ fontSize: 11, color: '#AEAEB2', marginTop: 4 }}>{formatearFecha(r.fecha)}</Text>
      </View>
      {r.fotoUrl && <Image source={{ uri: r.fotoUrl }} style={{ width: 50, height: 50, borderRadius: 10 }} />}
      <Ionicons name="chevron-forward" size={16} color={GRIS} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  return (
    <>
      {/* Filtro por sucursal */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
          {[{ id: 'todas', nombre: 'Todas' }, ...SUCURSALES].map(s => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.filtroChip,
                {
                  backgroundColor: sucursalFiltro === s.id ? MORADO : BLANCO,
                  borderColor: sucursalFiltro === s.id ? MORADO : '#EDE4E9',
                }
              ]}
              onPress={() => setSucursalFiltro(s.id)}
            >
              <Text style={[styles.filtroChipTexto, { color: sucursalFiltro === s.id ? '#fff' : '#8E8E93' }]}>
                {s.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Toggle por área / todos */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 16, shadowColor: MORADO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 }}>
        {['area', 'general'].map(v => (
          <TouchableOpacity
            key={v}
            style={{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9, backgroundColor: vistaAdmin === v ? MORADO : 'transparent' }}
            onPress={() => setVistaAdmin(v)}
          >
            <Text style={{ fontSize: 13, color: vistaAdmin === v ? '#fff' : '#8E8E93', fontWeight: '600' }}>
              {v === 'area' ? 'Por area' : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {vistaAdmin === 'area' && (
        Object.keys(porArea).length === 0
          ? <Text style={styles.sinDatos}>No hay reportes</Text>
          : Object.entries(porArea).map(([area, items]) => {
            const deEncuesta = items.filter(r => r.plantillaId);
            const generales = items.filter(r => !r.plantillaId);
            return (
              <View key={area}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 12, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: SALMON }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#cc6a3a', letterSpacing: 1 }}>{area.toUpperCase()}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: MORADO }}>{items.length}</Text>
                </View>
                {deEncuesta.length > 0 && (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6, marginLeft: 4 }}>
                      <Ionicons name="document-text-outline" size={13} color={MORADO2} />
                      <Text style={{ fontSize: 11, color: MORADO2, fontWeight: '700' }}>
                        DE ENCUESTA ({deEncuesta.length})
                      </Text>
                    </View>
                    {deEncuesta.map(r => <ReporteCard key={r.id} r={r} />)}
                  </>
                )}
                {generales.length > 0 && (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6, marginTop: 8, marginLeft: 4 }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color={GRIS} />
                      <Text style={{ fontSize: 11, color: GRIS, fontWeight: '700' }}>
                        GENERALES ({generales.length})
                      </Text>
                    </View>
                    {generales.map(r => <ReporteCard key={r.id} r={r} />)}
                  </>
                )}
              </View>
            );
          })
      )}

      {vistaAdmin === 'general' && (
        reportesFiltrados.length === 0
          ? <Text style={styles.sinDatos}>No hay reportes</Text>
          : reportesFiltrados.map(r => <ReporteCard key={r.id} r={r} />)
      )}

      {/* Modal detalle de reporte */}
      <Modal visible={!!reporteSeleccionado} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: '#fdf8f6',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '75%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: MORADO }}>Detalle del reporte</Text>
              <TouchableOpacity onPress={() => setReporteSeleccionado(null)}>
                <Ionicons name="close" size={22} color={GRIS} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SALMON }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: MORADO }}>
                    {reporteSeleccionado?.esAnonimo ? 'Anonimo' : reporteSeleccionado?.userName}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: GRIS }}>
                  {reporteSeleccionado?.fecha?.toDate
                    ? reporteSeleccionado.fecha.toDate().toLocaleString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : '—'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {reporteSeleccionado?.rol && (
                  <View style={{ backgroundColor: 'rgba(108,58,82,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: MEDIO, textTransform: 'capitalize' }}>{reporteSeleccionado.rol}</Text>
                  </View>
                )}
                {reporteSeleccionado?.plantillaId && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(124,92,191,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                    <Ionicons name="document-text-outline" size={12} color={MORADO2} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: MORADO2 }}>De encuesta</Text>
                  </View>
                )}
              </View>

              <View style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 14,
                borderWidth: 0.5,
                borderColor: '#e8d8e4',
                marginBottom: 12,
              }}>
                <Text style={{ fontSize: 14, color: MORADO, lineHeight: 22 }}>
                  {reporteSeleccionado?.texto || 'Sin contenido'}
                </Text>
              </View>

              {reporteSeleccionado?.fotoUrl && (
                <TouchableOpacity onPress={() => setImagenGrande(reporteSeleccionado.fotoUrl)}>
                  <Image
                    source={{ uri: reporteSeleccionado.fotoUrl }}
                    style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 6 }}
                    resizeMode="cover"
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    <Ionicons name="expand-outline" size={13} color={SALMON} />
                    <Text style={{ fontSize: 11, color: SALMON }}>Toca para ver en grande</Text>
                  </View>
                </TouchableOpacity>
              )}

              {reporteSeleccionado?.esAnonimo && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: '#fff8f0', padding: 10, borderRadius: 10,
                }}>
                  <Ionicons name="eye-off-outline" size={14} color={SALMON} />
                  <Text style={{ fontSize: 12, color: MEDIO, fontWeight: '500' }}>
                    Enviado anonimamente
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal imagen en grande */}
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
    </>
  );
};

// ── PANTALLA PRINCIPAL ───────────────────────────────────────────
export default function AdminScreen({ perfil, onLogout, sucursales: sucursalesProp = [] }) {
  const SUCURSALES = sucursalesProp.length > 0 ? sucursalesProp : SUCURSALES_FALLBACK;
  const [tabActivo, setTabActivo] = useState('dashboard');
  const [vista, setVista] = useState('inicio');
  const [encuestas, setEncuestas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [encuestaAbierta, setEncuestaAbierta] = useState(null);
  const [usuarioAbierto, setUsuarioAbierto] = useState(null);
  const [sucursalAbierta, setSucursalAbierta] = useState(null);
  const [busquedaGestor, setBusquedaGestor] = useState('');
  const [editandoEncuesta, setEditandoEncuesta] = useState(false);

  // Filtros encuestas
  const [encSucursalFiltro, setEncSucursalFiltro] = useState('todas');
  const [encTipoFiltro, setEncTipoFiltro] = useState('todas');

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [encSnap, usrSnap, reps, plants] = await Promise.all([
        getDocs(query(collection(db, 'encuestas'), orderBy('fechaEnvio', 'desc'))),
        getDocs(collection(db, 'usuarios')),
        obtenerReportes(null, true),
        obtenerTodasPlantillas(),
      ]);
      setEncuestas(encSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsuarios(usrSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(u => {
          const rol = u.rol?.toLowerCase?.();
          return rol !== 'admin' && rol !== 'cocina' && rol !== 'usuario';
        }));
      setReportes(reps);
      setPlantillas(plants);
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); cargarDatos(); };
  const handleLogout = async () => { await cerrarSesion(); onLogout(); };
  const encuestasPorSucursal = (id) => encuestas.filter(e => e.sucursalId === id);
  const usuariosPorSucursal = (id) => usuarios.filter(u => u.sucursalId === id);
  const encuestasPorUsuario = (uid) => encuestas.filter(e => e.userId === uid);
  const gestoresFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(busquedaGestor.toLowerCase()) ||
    u.email?.toLowerCase().includes(busquedaGestor.toLowerCase()) ||
    u.rol?.toLowerCase().includes(busquedaGestor.toLowerCase())
  );

  // Encuestas filtradas para tab encuestas
  const encuestasFiltradas = encuestas.filter(e => {
    const porSucursal = encSucursalFiltro === 'todas' || e.sucursalId === encSucursalFiltro;
    const porTipo = encTipoFiltro === 'todas' || e.rol === encTipoFiltro ||
      (encTipoFiltro === 'plantilla' && e.tipo === 'plantilla');
    return porSucursal && porTipo;
  });

  // Tipos únicos de encuestas
  const tiposUnicos = [...new Set(encuestas.map(e => e.tipo === 'plantilla' ? 'plantilla' : e.rol).filter(Boolean))];

  const handleEliminarEncuesta = (enc) => {
    Alert.alert(
      'Eliminar encuesta',
      `¿Seguro que quieres eliminar la encuesta de ${enc.userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await eliminarEncuesta(enc.id);
              setEncuestas(prev => prev.filter(e => e.id !== enc.id));
              if (encuestaAbierta?.id === enc.id) setEncuestaAbierta(null);
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          }
        }
      ]
    );
  };

  const handleEliminarPlantilla = (p) => {
    Alert.alert(
      'Eliminar plantilla',
      `¿Eliminar "${p.titulo}"? Los empleados ya no podrán responderla.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await eliminarPlantilla(p.id);
              setPlantillas(prev => prev.filter(pl => pl.id !== p.id));
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar.');
            }
          }
        }
      ]
    );
  };

  if (cargando) {
  return <View style={styles.cargando}><ActivityIndicator size="large" color={SALMON} /></View>;
}

if (vista === 'crearUsuario') {
  return (
    <CrearUsuarioScreen
      onVolver={() => setVista('inicio')}
      onCreado={() => { setVista('inicio'); cargarDatos(); }}
    />
  );
}

if (editandoEncuesta && encuestaAbierta) {
  const encuestaParaEditar = encuestaAbierta.esPlantilla
    ? {
        id: encuestaAbierta.id,
        titulo: encuestaAbierta.titulo,
        preguntas: encuestaAbierta.preguntas || [],
      }
    : {
        id: encuestaAbierta.id,
        titulo: encuestaAbierta.titulo ?? encuestaAbierta.userName,
        preguntas: Object.entries(encuestaAbierta.respuestas || {}).map(([texto, _], idx) => ({
          id: `p_${idx}`,
          texto,
          tipo: 'texto',
          opciones: [],
          requiereFoto: false,
        })),
      };
  return (
    <CrearEncuestaScreen
      perfil={perfil}
      onVolver={() => setEditandoEncuesta(false)}
      onGuardado={async () => {
        setEditandoEncuesta(false);
        await cargarDatos();
        setEncuestaAbierta(null);
      }}
      encuestaEditar={encuestaParaEditar}
      esAdmin={true}
    />
  );
}

if (encuestaAbierta) {
  const fotosObj = encuestaAbierta.fotos || {};
  return (
    <View style={styles.container}>
      <View style={styles.detalleHeader}>
        <TouchableOpacity style={styles.detalleVolver} onPress={() => setEncuestaAbierta(null)}>
          <Ionicons name="arrow-back" size={15} color="#fff" />
          <Text style={styles.detalleVolverTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.detalleNombre}>{encuestaAbierta.userName}</Text>
        <Text style={styles.detalleSub}>
          {encuestaAbierta.sucursalNombre} · {
            encuestaAbierta.fechaEnvio?.toDate
              ? encuestaAbierta.fechaEnvio.toDate().toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })
              : 'Sin fecha'
          }
        </Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.rolBadge, encuestaAbierta.rol === 'cocina' ? styles.rolCocina : styles.rolUsuario]}>
          {encuestaAbierta.tipo === 'plantilla' ? (
            <>
              <Ionicons name="document-text-outline" size={14} color={MORADO} />
              <Text style={styles.rolTexto}>{encuestaAbierta.titulo ?? 'Plantilla'}</Text>
            </>
          ) : (
            <>
              <Ionicons name={encuestaAbierta.rol === 'cocina' ? 'restaurant-outline' : 'person-outline'} size={14} color={MORADO} />
              <Text style={styles.rolTexto}>
                {encuestaAbierta.rol === 'cocina' ? 'Auditoria de Cocina' : 'Evaluacion de Usuario'}
              </Text>
            </>
          )}
        </View>
        {encuestaAbierta.esPlantilla ? (
          <>
            <Text style={styles.seccionTitle}>Preguntas de la plantilla</Text>
            {(encuestaAbierta.preguntas || []).map((p, i) => (
              <View key={i} style={styles.respuestaCard}>
                <Text style={styles.respuestaPregunta}>{p.texto}</Text>
                <Text style={styles.respuestaValor}>Tipo: {p.tipo}</Text>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.seccionTitle}>Respuestas</Text>
            {Object.entries(encuestaAbierta.respuestas || {}).map(([id, valor]) => {
              const fotoUri = fotosObj[id];
              return (
                <View key={id} style={styles.respuestaCard}>
                  <Text style={styles.respuestaPregunta}>{id}</Text>
                  <Text style={styles.respuestaValor}>{valor}</Text>
                  {fotoUri && <Image source={{ uri: fotoUri }} style={styles.fotoInline} resizeMode="cover" />}
                </View>
              );
            })}
          </>
        )}
        <Text style={styles.seccionTitle}>Respuestas</Text>
        {Object.entries(encuestaAbierta.respuestas || {}).map(([id, valor]) => {
          const fotoUri = fotosObj[id];
          return (
            <View key={id} style={styles.respuestaCard}>
              <Text style={styles.respuestaPregunta}>{id}</Text>
              <Text style={styles.respuestaValor}>{valor}</Text>
              {fotoUri && <Image source={{ uri: fotoUri }} style={styles.fotoInline} resizeMode="cover" />}
            </View>
          );
        })}

        {/* Botones Editar y Eliminar */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <TouchableOpacity
            style={[styles.cerrarBtn, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: MORADO2, borderColor: MORADO2 }]}
            onPress={() => setEditandoEncuesta(true)}          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={[styles.cerrarBtnTexto, { color: '#fff' }]}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cerrarBtn, { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#FF3B30', borderColor: '#FF3B30' }]}
            onPress={() => handleEliminarEncuesta(encuestaAbierta)}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={[styles.cerrarBtnTexto, { color: '#fff' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

  if (usuarioAbierto) {
    const susEncuestas = encuestasPorUsuario(usuarioAbierto.id);
    const sucursal = SUCURSALES.find(s => s.id === usuarioAbierto.sucursalId);
    return (
      <View style={styles.container}>
        <View style={styles.detalleHeader}>
          <TouchableOpacity style={styles.detalleVolver} onPress={() => setUsuarioAbierto(null)}>
            <Ionicons name="arrow-back" size={15} color="#fff" />
            <Text style={styles.detalleVolverTexto}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.detalleNombre}>Perfil del Gestor</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.perfilHeroCard}>
            <View style={styles.perfilHeroAvatar}>
              <Text style={styles.perfilHeroLetra}>{usuarioAbierto.nombre?.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.perfilHeroInfo}>
              <Text style={styles.perfilHeroNombre}>{usuarioAbierto.nombre}</Text>
              <Text style={styles.perfilHeroEmail}>{usuarioAbierto.email}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <View style={styles.rolPill}><Text style={styles.rolPillTexto}>{usuarioAbierto.rol}</Text></View>
                <View style={styles.activoPill}>
                  <Ionicons name="ellipse" size={8} color={VERDE} />
                  <Text style={styles.activoPillTexto}>Activo</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statMini, { borderTopColor: SALMON }]}>
              <Text style={styles.statMiniNum}>{susEncuestas.length}</Text>
              <Text style={styles.statMiniLabel}>Encuestas{'\n'}creadas</Text>
            </View>
            <View style={[styles.statMini, { borderTopColor: MORADO2 }]}>
              <Text style={styles.statMiniNum}>{susEncuestas.filter(e => e.tipo === 'plantilla').length}</Text>
              <Text style={styles.statMiniLabel}>Respuestas{'\n'}recibidas</Text>
            </View>
            <View style={[styles.statMini, { borderTopColor: VERDE }]}>
              <Text style={styles.statMiniNum}>{sucursal?.nombre?.split(' ')[0] ?? '—'}</Text>
              <Text style={styles.statMiniLabel}>Sucursal{'\n'}asignada</Text>
            </View>
          </View>
          {sucursal && (
            <View style={styles.sucursalInfoCard}>
              <Ionicons name="location" size={20} color={SALMON} style={{ marginRight: 12 }} />
              <View>
                <Text style={styles.sucursalInfoNombre}>{sucursal.nombre}</Text>
                <Text style={styles.sucursalInfoDir}>{sucursal.direccion}</Text>
              </View>
            </View>
          )}
          <Text style={styles.seccionTitle}>Encuestas ({susEncuestas.length})</Text>
          {susEncuestas.length === 0
            ? <Text style={styles.sinDatos}>Sin encuestas aún</Text>
            : susEncuestas.map(e => (
              <TouchableOpacity key={e.id} style={styles.encuestaCardDetalle}
                onPress={() => { setUsuarioAbierto(null); setEncuestaAbierta(e); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.encuestaNombre}>{e.titulo ?? e.userName ?? 'Encuesta'}</Text>
                  <Text style={styles.encuestaFecha}>
                    {e.fechaEnvio?.toDate ? e.fechaEnvio.toDate().toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={GRIS} />
              </TouchableOpacity>
            ))
          }
        </ScrollView>
      </View>
    );
  }

  if (sucursalAbierta) {
    const enc = encuestasPorSucursal(sucursalAbierta.id);
    const usrs = usuariosPorSucursal(sucursalAbierta.id);
    const graficaDatos = [
      { label: 'Cocina', valor: enc.filter(e => e.rol === 'cocina').length },
      { label: 'Usuario', valor: enc.filter(e => e.rol === 'usuario').length },
      { label: 'Gestores', valor: usrs.length },
    ];
    return (
      <View style={styles.container}>
        <View style={styles.detalleHeader}>
          <TouchableOpacity style={styles.detalleVolver} onPress={() => setSucursalAbierta(null)}>
            <Ionicons name="arrow-back" size={15} color="#fff" />
            <Text style={styles.detalleVolverTexto}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.detalleNombre}>{sucursalAbierta.nombre}</Text>
          <Text style={styles.detalleSub}>{sucursalAbierta.direccion}</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={[styles.statMini, { borderTopColor: SALMON }]}>
              <Text style={styles.statMiniNum}>{enc.length}</Text>
              <Text style={styles.statMiniLabel}>Encuestas{'\n'}totales</Text>
            </View>
            <View style={[styles.statMini, { borderTopColor: MORADO }]}>
              <Text style={styles.statMiniNum}>{usrs.length}</Text>
              <Text style={styles.statMiniLabel}>Gestores{'\n'}activos</Text>
            </View>
            <View style={[styles.statMini, { borderTopColor: VERDE }]}>
              <Text style={styles.statMiniNum}>{enc.filter(e => e.rol === 'cocina').length}</Text>
              <Text style={styles.statMiniLabel}>Auditorias{'\n'}cocina</Text>
            </View>
          </View>
          <View style={styles.graficaCard}>
            <Text style={styles.graficaTitulo}>Participación por tipo</Text>
            <Text style={styles.graficaSub}>Encuestas registradas en esta sucursal</Text>
            <GraficaBarras datos={graficaDatos} />
          </View>
          <Text style={styles.seccionTitle}>Gestores ({usrs.length})</Text>
          {usrs.length === 0
            ? <Text style={styles.sinDatos}>Sin gestores asignados</Text>
            : usrs.map(u => (
              <TouchableOpacity key={u.id} style={styles.usuarioCard}
                onPress={() => { setSucursalAbierta(null); setUsuarioAbierto(u); }}>
                <View style={styles.usuarioAvatar}>
                  <Text style={styles.usuarioAvatarLetra}>{u.nombre?.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.usuarioInfo}>
                  <Text style={styles.usuarioNombre}>{u.nombre}</Text>
                  <Text style={styles.usuarioEmail}>{u.email}</Text>
                </View>
                <View style={styles.rolPill}><Text style={styles.rolPillTexto}>{u.rol}</Text></View>
              </TouchableOpacity>
            ))
          }
          <Text style={styles.seccionTitle}>Encuestas ({enc.length})</Text>
          {enc.length === 0
            ? <Text style={styles.sinDatos}>Sin encuestas aún</Text>
            : enc.map(e => (
              <TouchableOpacity key={e.id} style={styles.encuestaCardDetalle}
                onPress={() => { setSucursalAbierta(null); setEncuestaAbierta(e); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.encuestaNombre}>{e.userName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name={e.rol === 'cocina' ? 'restaurant-outline' : 'person-outline'} size={12} color={GRIS} />
                    <Text style={styles.encuestaFecha}>
                      {e.rol === 'cocina' ? 'Cocina' : 'Usuario'} · {
                        e.fechaEnvio?.toDate ? e.fechaEnvio.toDate().toLocaleDateString('es-MX', {
                          day: 'numeric', month: 'short'
                        }) : ''
                      }
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={GRIS} />
              </TouchableOpacity>
            ))
          }
        </ScrollView>
      </View>
    );
  }

  const renderContenido = () => {
    switch (tabActivo) {

      case 'dashboard':
        return (
          <>
            <Text style={styles.bienvenida}>Buen día, {perfil?.nombre} 👋</Text>
            <Text style={styles.bienvenidaSub}>Resumen ejecutivo de hoy</Text>
            <View style={styles.kpiGrid}>
              {[
                { icon: 'people-outline', num: usuarios.length, label: 'Gestores', color: SALMON, tab: 'gestores' },
                { icon: 'document-text-outline', num: encuestas.length, label: 'Respuestas', color: MORADO2, tab: 'encuestas' },
                { icon: 'business-outline', num: SUCURSALES.length, label: 'Sucursales', color: VERDE, tab: 'sucursales' },
                { icon: 'alert-circle-outline', num: reportes.length, label: 'Reportes', color: MORADO, tab: 'reportes' },
              ].map((k, i) => (
                <TouchableOpacity key={i} style={[styles.kpiCard, { borderTopColor: k.color }]} onPress={() => setTabActivo(k.tab)}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: k.color + '1F' }]}>
                    <Ionicons name={k.icon} size={19} color={k.color === SALMON ? '#cc6a3a' : k.color} />
                  </View>
                  <Text style={styles.kpiNum}>{k.num}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.seccionTitle}>Actividad reciente</Text>
            {encuestas.slice(0, 6).map(e => (
              <TouchableOpacity key={e.id} style={styles.actividadCard} onPress={() => setEncuestaAbierta(e)}>
                <View style={styles.actividadAvatar}>
                  <Text style={styles.actividadAvatarLetra}>{e.userName?.charAt(0).toUpperCase() ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actividadNombre}>{e.userName}</Text>
                  <Text style={styles.actividadSub}>{e.sucursalNombre} · {e.rol === 'cocina' ? 'Cocina' : 'Usuario'}</Text>
                </View>
                <Text style={styles.actividadFecha}>
                  {e.fechaEnvio?.toDate ? e.fechaEnvio.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        );

      case 'gestores':
        return (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={GRIS} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar gestor..."
                placeholderTextColor="#AEAEB2"
                value={busquedaGestor}
                onChangeText={setBusquedaGestor}
              />
            </View>
            {gestoresFiltrados.length === 0
              ? <Text style={styles.sinDatos}>No hay gestores aún</Text>
              : gestoresFiltrados.map(u => (
                <TouchableOpacity key={u.id} style={styles.gestorCard} onPress={() => setUsuarioAbierto(u)}>
                  <View style={styles.gestorAvatar}>
                    <Text style={styles.gestorAvatarLetra}>{u.nombre?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.gestorInfo}>
                    <Text style={styles.gestorNombre}>{u.nombre}</Text>
                    <Text style={styles.gestorEmail}>{u.email}</Text>
                    <View style={styles.gestorSucursalRow}>
                      <Ionicons name="location-outline" size={12} color={GRIS} />
                      <Text style={styles.gestorSucursal}>
                        {SUCURSALES.find(s => s.id === u.sucursalId)?.nombre ?? 'Sin sucursal'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={styles.rolPill}><Text style={styles.rolPillTexto}>{u.rol}</Text></View>
                    <Text style={styles.gestorEncuestas}>{encuestasPorUsuario(u.id).length} enc.</Text>
                  </View>
                </TouchableOpacity>
              ))
            }
          </>
        );

      case 'sucursales':
        return (
          <>
            <View style={styles.sucursalesHeader}>
              <View style={styles.sucursalesKpi}>
                <Text style={styles.sucursalesKpiNum}>{SUCURSALES.length}</Text>
                <Text style={styles.sucursalesKpiLabel}>Sucursales</Text>
              </View>
              <View style={styles.sucursalesKpi}>
                <Text style={styles.sucursalesKpiNum}>{encuestas.length}</Text>
                <Text style={styles.sucursalesKpiLabel}>Encuestas realizadas</Text>
              </View>
            </View>
            <Text style={styles.seccionTitle}>Todas las sucursales</Text>
            {SUCURSALES.map(s => {
              const enc = encuestasPorSucursal(s.id);
              const usrs = usuariosPorSucursal(s.id);
              return (
                <TouchableOpacity key={s.id} style={styles.sucursalCardClick} onPress={() => setSucursalAbierta(s)}>
                  <View style={styles.sucursalCardTop}>
                    <Ionicons name="location" size={22} color={SALMON} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sucursalNombre}>{s.nombre}</Text>
                      <Text style={styles.sucursalDireccion}>{s.direccion}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={SALMON} />
                  </View>
                  <View style={styles.sucursalCardStats}>
                    <View style={styles.sucursalStatItem}>
                      <Text style={styles.sucursalStatNum}>{enc.length}</Text>
                      <Text style={styles.sucursalStatLabel}>encuestas</Text>
                    </View>
                    <View style={styles.sucursalStatDivider} />
                    <View style={styles.sucursalStatItem}>
                      <Text style={[styles.sucursalStatNum, { color: '#cc6a3a' }]}>{enc.filter(e => e.rol === 'cocina').length}</Text>
                      <Text style={styles.sucursalStatLabel}>cocina</Text>
                    </View>
                    <View style={styles.sucursalStatDivider} />
                    <View style={styles.sucursalStatItem}>
                      <Text style={[styles.sucursalStatNum, { color: MORADO2 }]}>{usrs.length}</Text>
                      <Text style={styles.sucursalStatLabel}>gestores</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        );

      case 'encuestas':
        return (
          <>
            {/* Filtro por sucursal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {[{ id: 'todas', nombre: 'Todas' }, ...SUCURSALES].map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.filtroChip,
                      {
                        backgroundColor: encSucursalFiltro === s.id ? MORADO : BLANCO,
                        borderColor: encSucursalFiltro === s.id ? MORADO : '#EDE4E9',
                      }
                    ]}
                    onPress={() => setEncSucursalFiltro(s.id)}
                  >
                    <Text style={[styles.filtroChipTexto, { color: encSucursalFiltro === s.id ? '#fff' : '#8E8E93' }]}>
                      {s.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Filtro por tipo */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                {['todas', ...tiposUnicos].map(tipo => {
                  const activo = encTipoFiltro === tipo;
                  const icon = tipo === 'todas' ? null : tipo === 'cocina' ? 'restaurant-outline' : tipo === 'usuario' ? 'person-outline' : 'document-text-outline';
                  const label = tipo === 'todas' ? 'Todos los tipos' : tipo === 'cocina' ? 'Cocina' : tipo === 'usuario' ? 'Usuario' : tipo;
                  return (
                    <TouchableOpacity
                      key={tipo}
                      style={[
                        styles.filtroChip,
                        {
                          backgroundColor: activo ? SALMON : BLANCO,
                          borderColor: activo ? SALMON : '#EDE4E9',
                        }
                      ]}
                      onPress={() => setEncTipoFiltro(tipo)}
                    >
                      {icon && <Ionicons name={icon} size={13} color={activo ? '#fff' : '#8E8E93'} />}
                      <Text style={[styles.filtroChipTexto, { color: activo ? '#fff' : '#8E8E93' }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 12, color: '#8E8E93', marginBottom: 10 }}>
              {encuestasFiltradas.length} encuesta{encuestasFiltradas.length !== 1 ? 's' : ''}
            </Text>

            {/* Plantillas del gestor (para eliminar) */}
            {encTipoFiltro === 'todas' || encTipoFiltro === 'plantilla' ? (
              <>
                {plantillas.filter(p => encSucursalFiltro === 'todas' || p.sucursalId === encSucursalFiltro).length > 0 && (
                  <>
                    <Text style={styles.seccionTitle}>Plantillas creadas por gestores</Text>
                    {plantillas
                      .filter(p => encSucursalFiltro === 'todas' || p.sucursalId === encSucursalFiltro)
                      .map(p => (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.encuestaCardDetalle, { flexDirection: 'row', alignItems: 'center' }]}
                          onPress={() => setEncuestaAbierta({ ...p, esPlantilla: true, respuestas: Object.fromEntries((p.preguntas || []).map(q => [q.texto, ''])) })}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Ionicons name="document-text-outline" size={14} color={MORADO} />
                              <Text style={styles.encuestaNombre}>{p.titulo}</Text>
                            </View>
                            <Text style={styles.encuestaFecha}>
                              {p.rolCreador} · {p.preguntas?.length} preguntas · {
                                SUCURSALES.find(s => s.id === p.sucursalId)?.nombre ?? p.sucursalId
                              }
                            </Text>
                            <Text style={styles.encuestaFecha}>
                              {p.fechaCreacion?.toDate ? p.fechaCreacion.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={{ padding: 8, backgroundColor: 'rgba(255,59,48,0.08)', borderRadius: 10 }}
                            onPress={(e) => { e.stopPropagation(); handleEliminarPlantilla(p); }}
                          >
                            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))
                    }
                  </>
                )}
              </>
            ) : null}

            {/* Respuestas de encuestas */}
            <Text style={styles.seccionTitle}>Respuestas ({encuestasFiltradas.length})</Text>
            {encuestasFiltradas.length === 0
              ? <Text style={styles.sinDatos}>No hay encuestas con estos filtros</Text>
              : encuestasFiltradas.map(e => (
                <TouchableOpacity key={e.id} style={styles.encuestaCardDetalle} onPress={() => setEncuestaAbierta(e)}>
                  <View style={styles.encuestaAvatarSmall}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{e.userName?.charAt(0).toUpperCase() ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.encuestaNombre}>{e.userName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons
                        name={e.tipo === 'plantilla' ? 'document-text-outline' : e.rol === 'cocina' ? 'restaurant-outline' : 'person-outline'}
                        size={12} color={GRIS}
                      />
                      <Text style={styles.encuestaFecha}>
                        {e.sucursalNombre} · {e.tipo === 'plantilla' ? (e.titulo ?? 'Plantilla') : e.rol === 'cocina' ? 'Cocina' : 'Usuario'}
                      </Text>
                    </View>
                    <Text style={styles.encuestaFecha}>
                      {e.fechaEnvio?.toDate ? e.fechaEnvio.toDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={GRIS} />
                </TouchableOpacity>
              ))
            }
          </>
        );

      case 'reportes':
        return <ReportesAdminVista perfil={perfil} reportesData={reportes} sucursales={SUCURSALES} />;

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Panel de{'\n'}Administrador</Text>
          <Text style={styles.headerSubtitle}>Bienvenido, {perfil?.nombre}</Text>
        </View>
        <TouchableOpacity style={styles.crearBtn} onPress={() => setVista('crearUsuario')}>
          <Ionicons name="add" size={15} color={MORADO} />
          <Text style={styles.crearBtnTexto}>Gestor</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderContenido()}
        <TouchableOpacity style={styles.cerrarBtn} onPress={handleLogout}>
          <Text style={styles.cerrarBtnTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.navBar}>
        {[
          { key: 'dashboard',  label: 'Dashboard',  icon: 'grid-outline',          iconActivo: 'grid' },
          { key: 'gestores',   label: 'Gestores',   icon: 'people-outline',        iconActivo: 'people' },
          { key: 'sucursales', label: 'Sucursales', icon: 'business-outline',      iconActivo: 'business' },
          { key: 'encuestas',  label: 'Encuestas',  icon: 'document-text-outline', iconActivo: 'document-text' },
          { key: 'reportes',   label: 'Reportes',   icon: 'alert-circle-outline',  iconActivo: 'alert-circle' },
        ].map(tab => {
          const activo = tabActivo === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.navItem} onPress={() => setTabActivo(tab.key)}>
              <Ionicons name={activo ? tab.iconActivo : tab.icon} size={21} color={activo ? MORADO : GRIS} />
              <Text style={[styles.navLabel, activo && styles.navLabelActivo]}>{tab.label}</Text>
              {activo && <View style={styles.navIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
