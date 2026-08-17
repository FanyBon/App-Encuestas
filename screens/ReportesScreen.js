import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { guardarReporte, obtenerReportes, obtenerReportesPorGestor, 
  obtenerReportesPorArea, subirFoto, obtenerPlantillas, 
  obtenerRespuestasPorPlantilla, obtenerReportesPorUsuario } from '../services/encuestaService';
import { auth } from '../services/firebase';
import styles from '../styles/reportesStyles';

const MORADO = '#3d263a';
const SALMON = '#ff9e71';

export default function ReportesScreen({ perfil, onVolver, soloLectura, plantillaId, gestorId }) {
  const [texto, setTexto] = useState('');
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [fotoUri, setFotoUri] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [reportesPorArea, setReportesPorArea] = useState({});
  const [cargando, setCargando] = useState(true);
  const [vistaAdmin, setVistaAdmin] = useState('area');
  const [imagenGrande, setImagenGrande] = useState(null);

  // Para vista gestor: encuestas con sus reportes
  const [plantillasGestor, setPlantillasGestor] = useState([]);
  const [encuestaAbierta, setEncuestaAbierta] = useState(null); // id de la encuesta expandida
  const [reportesPorPlantilla, setReportesPorPlantilla] = useState({}); // { plantillaId: [reportes] }
  const [cargandoReportes, setCargandoReportes] = useState({});

  const esAdmin = perfil?.rol === 'admin';
  const esGestor = !!gestorId;

  useEffect(() => { cargarReportes(); }, []);

  const cargarReportes = async () => {
    try {
      if (esAdmin) {
        const porArea = await obtenerReportesPorArea();
        setReportesPorArea(porArea);
        const generales = await obtenerReportes(perfil.sucursalId, true);
        setReportes(generales);
      } else if (esGestor) {
        // Carga las plantillas del gestor
        const plantas = await obtenerPlantillas(perfil.sucursalId);
        // Solo las que creó este gestor
        const miasPlantillas = plantas.filter(p => p.creadoPor === gestorId);
        setPlantillasGestor(miasPlantillas);
      } else {
        const datos = await obtenerReportesPorUsuario(auth.currentUser?.uid);
        setReportes(datos);
      }
    } catch (e) {
      console.log('Error cargando reportes:', e);
    } finally {
      setCargando(false);
    }
  };

  const toggleEncuesta = async (plantillaId) => {
    // Si ya está abierta, la cierra
    if (encuestaAbierta === plantillaId) {
      setEncuestaAbierta(null);
      return;
    }
    setEncuestaAbierta(plantillaId);
    // Si ya los cargamos, no volver a cargar
    if (reportesPorPlantilla[plantillaId]) return;

    setCargandoReportes(prev => ({ ...prev, [plantillaId]: true }));
    try {
      const q = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      const snap = await q.getDocs(q.query(
        q.collection(db, 'reportes'),
        q.where('plantillaId', '==', plantillaId),
        q.orderBy('fecha', 'desc')
      ));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReportesPorPlantilla(prev => ({ ...prev, [plantillaId]: data }));
    } catch (e) {
      console.log('Error cargando reportes de plantilla:', e);
    } finally {
      setCargandoReportes(prev => ({ ...prev, [plantillaId]: false }));
    }
  };

  const tomarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la camara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) setFotoUri(result.assets[0].uri);
  };

  const handleEnviar = async () => {
    if (!texto.trim()) {
      Alert.alert('Campo vacio', 'Escribe tu reporte antes de enviar.');
      return;
    }
    setEnviando(true);
    try {
      let urlFoto = null;
      if (fotoUri) urlFoto = await subirFoto(fotoUri);
      await guardarReporte(perfil, texto.trim(), esAnonimo, urlFoto, plantillaId || null, gestorId || null);
      setTexto('');
      setEsAnonimo(false);
      setFotoUri(null);
      Alert.alert('Enviado', 'Tu reporte fue registrado correctamente.');
      cargarReportes();
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar el reporte.');
    } finally {
      setEnviando(false);
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const ReporteCard = ({ reporte }) => (
    <View style={styles.reporteCard}>
      <View style={styles.reporteHeader}>
        <Text style={styles.reporteNombre}>
          {reporte.esAnonimo ? 'Anonimo' : reporte.userName}
        </Text>
        <Text style={styles.reporteFecha}>{formatearFecha(reporte.fecha)}</Text>
      </View>
      {reporte.rol && (
        <View style={styles.areaBadge}>
          <Text style={styles.areaBadgeTexto}>{reporte.rol}</Text>
        </View>
      )}
      <Text style={styles.reporteTexto}>{reporte.texto}</Text>
      {reporte.fotoUrl && (
        <TouchableOpacity onPress={() => setImagenGrande(reporte.fotoUrl)}>
          <Image source={{ uri: reporte.fotoUrl }} style={styles.reporteFoto} resizeMode="cover" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="expand-outline" size={13} color={SALMON} />
            <Text style={{ fontSize: 11, color: SALMON }}>Toca para ver en grande</Text>
          </View>
        </TouchableOpacity>
      )}
      {reporte.esAnonimo && (
        <View style={styles.anonimoBadge}>
          <Text style={styles.anonimoBadgeTexto}>Enviado anonimamente</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onVolver}>
          <Ionicons name="arrow-back" size={15} color={SALMON} />
          <Text style={styles.backTexto}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {esAdmin ? 'Todos los Reportes' : esGestor ? 'Reportes de mis encuestas' : 'Reportes y Notas'}
        </Text>
      </View>

      {cargando ? (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color="#ff9e71" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Formulario — solo si no es solo lectura y no es admin */}
          {!soloLectura && !esAdmin && !esGestor && (
            <View style={styles.nuevaCard}>
              <Text style={styles.nuevaTitle}>
                {plantillaId ? 'Reporte de esta encuesta' : 'Nuevo reporte general'}
              </Text>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Escribe tu reporte, queja o sugerencia..."
                placeholderTextColor="#b49cb0"
                value={texto}
                onChangeText={setTexto}
              />
              <TouchableOpacity
                style={[styles.fotoBtn, fotoUri && styles.fotoBtnDone]}
                onPress={tomarFoto}
              >
                {fotoUri ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                    <Text style={[styles.fotoBtnTexto, styles.fotoBtnTextoDone]}>Foto adjunta</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="camera-outline" size={16} color="#9b8398" />
                    <Text style={styles.fotoBtnTexto}>Agregar foto (opcional)</Text>
                  </View>
                )}
              </TouchableOpacity>
              {fotoUri && <Image source={{ uri: fotoUri }} style={styles.fotoPreview} resizeMode="cover" />}
              <View style={styles.anonimRow}>
                <TouchableOpacity
                  style={[styles.anonimToggle, esAnonimo && styles.anonimToggleOn]}
                  onPress={() => setEsAnonimo(!esAnonimo)}
                >
                  <View style={[styles.anonimCircle, esAnonimo && styles.anonimCircleOn]} />
                </TouchableOpacity>
                <Text style={[styles.anonimTexto, esAnonimo && styles.anonimTextoOn]}>
                  {esAnonimo ? 'Envio anonimo' : 'Enviar con mi nombre'}
                </Text>
              </View>
              <TouchableOpacity style={styles.enviarBtn} onPress={handleEnviar} disabled={enviando}>
                {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.enviarBtnTexto}>Enviar reporte</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Vista Admin */}
          {esAdmin && (
            <>
              <View style={styles.tabsAdmin}>
                <TouchableOpacity
                  style={[styles.tabAdmin, vistaAdmin === 'area' && styles.tabAdminActivo]}
                  onPress={() => setVistaAdmin('area')}
                >
                  <Text style={[styles.tabAdminTexto, vistaAdmin === 'area' && styles.tabAdminTextoActivo]}>Por area</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabAdmin, vistaAdmin === 'general' && styles.tabAdminActivo]}
                  onPress={() => setVistaAdmin('general')}
                >
                  <Text style={[styles.tabAdminTexto, vistaAdmin === 'general' && styles.tabAdminTextoActivo]}>Generales</Text>
                </TouchableOpacity>
              </View>
              {vistaAdmin === 'area' && (
                Object.keys(reportesPorArea).length === 0
                  ? <Text style={styles.sinReportes}>No hay reportes aun</Text>
                  : Object.entries(reportesPorArea).map(([area, items]) => (
                    <View key={area}>
                      <View style={styles.areaHeader}>
                        <Text style={styles.areaTitulo}>{area.toUpperCase()}</Text>
                        <Text style={styles.areaCount}>{items.length}</Text>
                      </View>
                      {items.map(r => <ReporteCard key={r.id} reporte={r} />)}
                    </View>
                  ))
              )}
              {vistaAdmin === 'general' && (
                reportes.length === 0
                  ? <Text style={styles.sinReportes}>No hay reportes generales</Text>
                  : reportes.map(r => <ReporteCard key={r.id} reporte={r} />)
              )}
            </>
          )}

          {/* Vista Gestor — encuestas colapsables con sus reportes */}
          {esGestor && (
            <>
              {/* Formulario para que el gestor envíe su propio reporte al admin */}
              {!soloLectura && (
                <View style={styles.nuevaCard}>
                  <Text style={styles.nuevaTitle}>Nuevo reporte general</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder="Escribe tu reporte, queja o sugerencia..."
                    placeholderTextColor="#b49cb0"
                    value={texto}
                    onChangeText={setTexto}
                  />
                  <TouchableOpacity
                    style={[styles.fotoBtn, fotoUri && styles.fotoBtnDone]}
                    onPress={tomarFoto}
                  >
                    {fotoUri ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={[styles.fotoBtnTexto, styles.fotoBtnTextoDone]}>Foto adjunta</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="camera-outline" size={16} color="#9b8398" />
                        <Text style={styles.fotoBtnTexto}>Agregar foto (opcional)</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {fotoUri && <Image source={{ uri: fotoUri }} style={styles.fotoPreview} resizeMode="cover" />}
                  <View style={styles.anonimRow}>
                    <TouchableOpacity
                      style={[styles.anonimToggle, esAnonimo && styles.anonimToggleOn]}
                      onPress={() => setEsAnonimo(!esAnonimo)}
                    >
                      <View style={[styles.anonimCircle, esAnonimo && styles.anonimCircleOn]} />
                    </TouchableOpacity>
                    <Text style={[styles.anonimTexto, esAnonimo && styles.anonimTextoOn]}>
                      {esAnonimo ? 'Envio anonimo' : 'Enviar con mi nombre'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.enviarBtn} onPress={handleEnviar} disabled={enviando}>
                    {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.enviarBtnTexto}>Enviar reporte</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* Lista de encuestas colapsables */}
              <Text style={styles.seccionTitle}>REPORTES DE TUS ENCUESTAS</Text>
              {plantillasGestor.length === 0 ? (
                <Text style={styles.sinReportes}>No tienes encuestas creadas aun</Text>
              ) : plantillasGestor.map(p => (
                <View key={p.id}>
                  {/* Card de la encuesta — toca para expandir */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: encuestaAbierta === p.id ? 0 : 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderLeftWidth: 4,
                      borderLeftColor: '#ff9e71',
                      shadowColor: MORADO, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
                      borderBottomLeftRadius: encuestaAbierta === p.id ? 0 : 14,
                      borderBottomRightRadius: encuestaAbierta === p.id ? 0 : 14,
                    }}
                    onPress={() => toggleEncuesta(p.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: MORADO }}>{p.titulo}</Text>
                      <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 3 }}>
                        {reportesPorPlantilla[p.id]?.length ?? '...'} reportes recibidos
                      </Text>
                    </View>
                    <Ionicons
                      name={encuestaAbierta === p.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#ff9e71"
                    />
                  </TouchableOpacity>

                  {/* Reportes de esta encuesta */}
                  {encuestaAbierta === p.id && (
                    <View style={{
                      backgroundColor: '#faf8f8',
                      borderRadius: 14,
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      padding: 12,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderTopWidth: 0,
                      borderColor: '#f0eaea',
                    }}>
                      {cargandoReportes[p.id] ? (
                        <ActivityIndicator color="#ff9e71" style={{ marginVertical: 16 }} />
                      ) : !reportesPorPlantilla[p.id] || reportesPorPlantilla[p.id].length === 0 ? (
                        <Text style={{ color: '#8E8E93', textAlign: 'center', padding: 16, fontSize: 13 }}>
                          No hay reportes para esta encuesta
                        </Text>
                      ) : reportesPorPlantilla[p.id].map(r => (
                        <ReporteCard key={r.id} reporte={r} />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Vista Usuario normal */}
          {!esAdmin && !esGestor && (
            <>
              <Text style={styles.seccionTitle}>Mis reportes</Text>
              {reportes.length === 0
                ? <Text style={styles.sinReportes}>No hay reportes aun</Text>
                : reportes.map(r => <ReporteCard key={r.id} reporte={r} />)
              }
            </>
          )}

        </ScrollView>
      )}

      {/* Modal imagen grande — DENTRO del return */}
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
    </View>
  );
}