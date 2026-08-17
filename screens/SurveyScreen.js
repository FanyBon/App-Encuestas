import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  guardarEncuesta, subirFoto, yaContesoUltimas24h,
  obtenerPlantillas, guardarRespuestaPlantilla, yaContesoPlantilla,
  guardarReporte,
} from '../services/encuestaService';
import { PREGUNTAS_COCINA, PREGUNTAS_USUARIO } from '../constants/preguntas';

import { auth } from '../services/firebase';
import styles from '../styles/surveyStyles';
import PerfilScreen from './PerfilScreen';
import ReportesScreen from './ReportesScreen';
import { surveyTabStyles, navStyles } from '../styles/surveyTabStyles';


const SALMON = '#ff9e71';
const PLUM = '#2a1a2e';
const MORADO = '#7c5cbf';
const MORADO_OSC = '#3d263a';
const COCINA_COLOR = '#c4607a';
const VERDE = '#00B894';
const GRIS = '#8E8E93';

const getDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const detectarSucursal = (lat, lon) => {
  for (const sucursal of SUCURSALES) {
    const distancia = getDistancia(lat, lon, sucursal.latitud, sucursal.longitud);
    if (distancia <= sucursal.radioMetros) return sucursal;
  }
  return null;
};

export default function SurveyScreen({ perfil, onSubmit, onLogout, sucursales = [] }) {
  const [mostrarReporteEncuesta, setMostrarReporteEncuesta] = useState(false);
  const [tabActivo, setTabActivo] = useState('encuestas');
  const [gpsEstado, setGpsEstado] = useState('detectando');
  const [sucursal, setSucursal] = useState(null);
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [fotos, setFotos] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [yaConteso, setYaConteso] = useState(false);
  const [plantillas, setPlantillas] = useState([]);
  const [plantillaActiva, setPlantillaActiva] = useState(null);
  const [vistaEncuesta, setVistaEncuesta] = useState(false);
  const [respuestasPlantilla, setRespuestasPlantilla] = useState({});
  const [enviandoPlantilla, setEnviandoPlantilla] = useState(false);
  const [plantillasContestadas, setPlantillasContestadas] = useState({});
  const [mostrarReporteEnPlantilla, setMostrarReporteEnPlantilla] = useState(false);
  const [textoReporte, setTextoReporte] = useState('');
  const [fotoReporteUri, setFotoReporteUri] = useState(null);
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  const preguntas = perfil?.rol === 'cocina' ? PREGUNTAS_COCINA : PREGUNTAS_USUARIO;
  const todasRespondidas = preguntas.every(p => respuestas[p.id]);

  useEffect(() => { verificarYDetectar(); }, []);

  const verificarYDetectar = async () => {
    try {
    const contesto = await yaContesoUltimas24h(auth.currentUser?.uid);
    setYaConteso(contesto); // siempre actualiza el estado
    } catch (e) { console.log('Error verificando:', e); }
    detectarUbicacion(); // siempre detecta ubicación para cargar plantillas
  };

  const detectarUbicacion = async () => {
    setGpsEstado('detectando');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setGpsEstado('error'); return; }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setLatitud(latitude);
      setLongitud(longitude);
      const encontrada = detectarSucursal(latitude, longitude);
      if (encontrada) {
        setSucursal(encontrada);
        setGpsEstado('encontrado');
        cargarPlantillas(perfil.sucursalId);
      } else setGpsEstado('bloqueado');
    } catch { setGpsEstado('error'); }
  };

  const cargarPlantillas = async (sucursalId) => {
    try {
      const resultado = await obtenerPlantillas(sucursalId);
      setPlantillas(resultado);
      const uid = auth.currentUser?.uid;
      const contestadas = {};
      await Promise.all(resultado.map(async (pl) => {
        contestadas[pl.id] = await yaContesoPlantilla(uid, pl.id);
      }));
      setPlantillasContestadas(contestadas);
    } catch (e) {
      console.log('❌ Error cargando plantillas:', e.message);
    }
  };

  const seleccionarOpcion = (preguntaId, opcion) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: opcion }));
  };

  const tomarFoto = async (preguntaId) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a la camara'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      setFotos(prev => ({ ...prev, [preguntaId]: result.assets[0].uri }));
    }
  };

  const handleEnviar = async () => {
    if (!todasRespondidas) {
      Alert.alert('Encuesta incompleta', 'Debes responder todas las preguntas antes de enviar.');
      return;
    }
    setEnviando(true);
    try {
      const fotosUrls = {};
      for (const [preguntaId, uri] of Object.entries(fotos)) {
        const url = await subirFoto(uri);
        fotosUrls[preguntaId] = url;
      }
      await guardarEncuesta(perfil, sucursal, respuestas, fotosUrls, latitud, longitud);
      onSubmit?.();
    } catch (e) {
      Alert.alert('Error', 'No se pudo enviar. Revisa tu conexion.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarPlantilla = async () => {
    const pregsPlantilla = plantillaActiva.preguntas;
    const todasOk = pregsPlantilla.every(p => respuestasPlantilla[p.id]);
    if (!todasOk) {
      Alert.alert('Encuesta incompleta', 'Responde todas las preguntas antes de enviar.');
      return;
    }
    setEnviandoPlantilla(true);
    try {
      await guardarRespuestaPlantilla(
        perfil, plantillaActiva.id, plantillaActiva.titulo, sucursal, respuestasPlantilla
      );
      Alert.alert('Enviada', 'Tu respuesta fue registrada.', [{
        text: 'OK', onPress: () => {
          setPlantillaActiva(null);
          setRespuestasPlantilla({});
          cargarPlantillas(sucursal.id);
        }
      }]);
    } catch {
      Alert.alert('Error', 'No se pudo enviar.');
    } finally {
      setEnviandoPlantilla(false);
    }
  };

  const handleEnviarReportePlantilla = async () => {
  if (!textoReporte.trim()) {
    Alert.alert('Campo vacio', 'Escribe tu reporte antes de enviar.');
    return;
    }
    setEnviandoReporte(true);
    try {
      let urlFoto = null;
      if (fotoReporteUri) {
        urlFoto = await subirFoto(fotoReporteUri);
      }
      await guardarReporte(
        perfil,
        textoReporte.trim(),
        false,
        urlFoto,
        plantillaActiva.id,
        plantillaActiva.creadoPor,
      );
      setTextoReporte('');
      setFotoReporteUri(null);
      setMostrarReporteEnPlantilla(false);
      Alert.alert('Reporte enviado', 'Tu reporte fue registrado correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el reporte.');
    } finally {
      setEnviandoReporte(false);
    }
  };

  const tomarFotoReporte = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la camara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      setFotoReporteUri(result.assets[0].uri);
    }
  };

  const progreso = Object.keys(respuestas).length / preguntas.length;
  const bloques = preguntas.reduce((acc, p) => {
    if (!acc[p.bloque]) acc[p.bloque] = [];
    acc[p.bloque].push(p);
    return acc;
  }, {});

  const isCocina = perfil?.rol === 'cocina';
  const accentColor = isCocina ? COCINA_COLOR : SALMON;

  // ── ESTADOS ESPECIALES ──────────────────────────────────────────
  if (gpsEstado === 'detectando') {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={SALMON} />
        <Text style={styles.detectingTitle}>Detectando ubicacion...</Text>
        <Text style={styles.detectingSubtitle}>Verificando en que sucursal te encuentras</Text>
      </View>
    );
  }

  if (gpsEstado === 'bloqueado' || gpsEstado === 'error') {
    return (
      <View style={styles.centerScreen}>
        <Ionicons name="location-outline" size={48} color={MORADO_OSC} />
        <Text style={styles.blockedTitle}>Ubicacion no valida</Text>
        <Text style={styles.blockedMessage}>
          {gpsEstado === 'error'
            ? 'Activa los permisos de ubicacion en tu celular.'
            : 'No estas en ninguna sucursal registrada.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={detectarUbicacion}>
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── RESPONDER PLANTILLA ─────────────────────────────────────────
  if (plantillaActiva) {
    const pregsPlantilla = plantillaActiva.preguntas;
    const todasOk = pregsPlantilla.every(p => respuestasPlantilla[p.id]);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.sucursal}>{plantillaActiva.titulo}</Text>
            <Text style={styles.fecha}>{sucursal?.nombre}</Text>
          </View>
          <TouchableOpacity
            style={styles.volverBtn}
            onPress={() => { setPlantillaActiva(null); setRespuestasPlantilla({}); }}
          >
            <Ionicons name="arrow-back" size={15} color={accentColor} />
            <Text style={[styles.volverBtnTexto, { color: accentColor }]}>Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${(Object.keys(respuestasPlantilla).length / pregsPlantilla.length) * 100}%`,
            backgroundColor: MORADO,
          }]} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {pregsPlantilla.map((pregunta, i) => (
            <View key={pregunta.id} style={styles.card}>
              <Text style={styles.numPregunta}>{i + 1} / {pregsPlantilla.length}</Text>
              <Text style={styles.textoPregunta}>
                {pregunta.texto} <Text style={{ color: COCINA_COLOR }}>*</Text>
              </Text>
              {pregunta.opciones?.map(opcion => (
                <TouchableOpacity
                  key={opcion}
                  style={[styles.opcion, respuestasPlantilla[pregunta.id] === opcion && styles.opcionSeleccionada]}
                  onPress={() => setRespuestasPlantilla(prev => ({ ...prev, [pregunta.id]: opcion }))}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons
                      name={respuestasPlantilla[pregunta.id] === opcion ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={respuestasPlantilla[pregunta.id] === opcion ? MORADO : '#b49cb0'}
                    />
                    <Text style={[styles.opcionTexto, respuestasPlantilla[pregunta.id] === opcion && styles.opcionTextoSeleccionado]}>
                      {opcion}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {!pregunta.opciones && (
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Escribe tu respuesta..."
                  placeholderTextColor="#b49cb0"
                  onChangeText={text => setRespuestasPlantilla(prev => ({ ...prev, [pregunta.id]: text }))}
                />
              )}
            </View>
          ))}
          {/* Botón y formulario de reporte */}
          {!mostrarReporteEnPlantilla ? (
            <TouchableOpacity
              style={styles.reporteEncuestaBtn}
              onPress={() => setMostrarReporteEnPlantilla(true)}
            >
              <Ionicons name="mail-outline" size={16} color="#6b3a52" />
              <Text style={styles.reporteEncuestaBtnTexto}>Enviar reporte sobre esta encuesta</Text>
            </TouchableOpacity>
          ) : (
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              shadowColor: MORADO_OSC,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 3,
            }}>
              <Text style={{
                fontSize: 14, fontWeight: '700',
                color: '#3d263a', marginBottom: 10,
              }}>
                Reporte — {plantillaActiva.titulo}
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#fdf8f6',
                  borderWidth: 1.5,
                  borderColor: '#e8d8e4',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: '#3d263a',
                  minHeight: 100,
                  textAlignVertical: 'top',
                  marginBottom: 10,
                }}
                multiline
                placeholder="Describe el problema o incidencia..."
                placeholderTextColor="#b49cb0"
                value={textoReporte}
                onChangeText={setTextoReporte}
              />
              <TouchableOpacity
                style={[
                  styles.fotoBtn,
                  fotoReporteUri && styles.fotoBtnDone,
                ]}
                onPress={tomarFotoReporte}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={fotoReporteUri ? 'checkmark-circle' : 'camera-outline'}
                    size={16}
                    color={fotoReporteUri ? '#34C759' : '#7a5f76'}
                  />
                  <Text style={[
                    styles.fotoBtnTexto,
                    fotoReporteUri && styles.fotoBtnTextoDone,
                  ]}>
                    {fotoReporteUri ? 'Foto adjunta' : 'Agregar foto (opcional)'}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={{
                    flex: 1, padding: 12, borderRadius: 10,
                    backgroundColor: '#f3eef2', alignItems: 'center',
                  }}
                  onPress={() => {
                    setMostrarReporteEnPlantilla(false);
                    setTextoReporte('');
                    setFotoReporteUri(null);
                  }}
                >
                  <Text style={{ color: '#3d263a', fontWeight: '600', fontSize: 13 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 2, padding: 12, borderRadius: 10,
                    backgroundColor: '#3d263a', alignItems: 'center',
                  }}
                  onPress={handleEnviarReportePlantilla}
                  disabled={enviandoReporte}
                >
                  {enviandoReporte
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Enviar reporte</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.submitBtn, !todasOk && styles.submitBtnDisabled]}
            onPress={handleEnviarPlantilla}
            disabled={enviandoPlantilla || !todasOk}
          >
            {enviandoPlantilla
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnTexto}>
                  {todasOk ? 'Enviar respuestas' : 'Completa todas las preguntas'}
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (mostrarReporteEncuesta) {
    return (
      <ReportesScreen
        perfil={perfil}
        onVolver={() => setMostrarReporteEncuesta(false)}
        soloLectura={false}
        plantillaId={null}
        gestorId={null}
      />
    );
  }

  // ── ENCUESTA FIJA ───────────────────────────────────────────────
  if (vistaEncuesta) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.sucursal}>{sucursal?.nombre}</Text>
            <Text style={styles.fecha}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity style={styles.volverBtn} onPress={() => setVistaEncuesta(false)}>
            <Ionicons name="arrow-back" size={15} color={accentColor} />
            <Text style={[styles.volverBtnTexto, { color: accentColor }]}>Volver</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.rolBadge, isCocina ? styles.rolCocina : styles.rolUsuario]}>
          <Text style={styles.rolTexto}>
            {isCocina ? 'Auditoria de Cocina' : 'Evaluacion de Usuario'}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progreso * 100}%`, backgroundColor: accentColor }]} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {Object.entries(bloques).map(([nombreBloque, preguntasBloque]) => (
            <View key={nombreBloque}>
              <Text style={styles.bloqueTitle}>{nombreBloque}</Text>
              {preguntasBloque.map((pregunta) => (
                <View key={pregunta.id} style={styles.card}>
                  <Text style={styles.numPregunta}>
                    {preguntas.indexOf(pregunta) + 1} / {preguntas.length}
                  </Text>
                  <Text style={styles.textoPregunta}>
                    {pregunta.texto} <Text style={{ color: COCINA_COLOR }}>*</Text>
                  </Text>
                  {pregunta.opciones?.map((opcion) => (
                    <TouchableOpacity
                      key={opcion}
                      style={[styles.opcion, respuestas[pregunta.id] === opcion && styles.opcionSeleccionada]}
                      onPress={() => seleccionarOpcion(pregunta.id, opcion)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons
                          name={respuestas[pregunta.id] === opcion ? 'radio-button-on' : 'radio-button-off'}
                          size={16}
                          color={respuestas[pregunta.id] === opcion ? MORADO_OSC : '#b49cb0'}
                        />
                        <Text style={[styles.opcionTexto, respuestas[pregunta.id] === opcion && styles.opcionTextoSeleccionado]}>
                          {opcion}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {!pregunta.opciones && (
                    <TextInput
                      style={styles.textInput}
                      multiline
                      placeholder="Escribe tus observaciones..."
                      placeholderTextColor="#b49cb0"
                      onChangeText={(text) => seleccionarOpcion(pregunta.id, text)}
                    />
                  )}
                  {pregunta.requiereFoto && (
                    <TouchableOpacity
                      style={[styles.fotoBtn, fotos[pregunta.id] && styles.fotoBtnDone]}
                      onPress={() => tomarFoto(pregunta.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons
                          name={fotos[pregunta.id] ? 'checkmark-circle' : 'camera-outline'}
                          size={16}
                          color={fotos[pregunta.id] ? '#34C759' : '#7a5f76'}
                        />
                        <Text style={[styles.fotoBtnTexto, fotos[pregunta.id] && styles.fotoBtnTextoDone]}>
                          {fotos[pregunta.id] ? 'Foto tomada' : 'Tomar evidencia fotografica'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  {!respuestas[pregunta.id] && (
                    <Text style={styles.obligatorioTexto}>* Campo obligatorio</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
          <TouchableOpacity
            style={styles.reporteEncuestaBtn}
            onPress={() => setMostrarReporteEncuesta(true)}
          >
            <Ionicons name="mail-outline" size={16} color="#6b3a52" />
            <Text style={styles.reporteEncuestaBtnTexto}>Enviar reporte sobre esta encuesta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !todasRespondidas && styles.submitBtnDisabled]}
            onPress={handleEnviar}
            disabled={enviando || !todasRespondidas}
          >
            {enviando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnTexto}>
                  {todasRespondidas ? 'Enviar encuesta' : 'Completa todas las preguntas'}
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── TABS: ENCUESTAS / REPORTES / PERFIL ─────────────────────────
  const renderTab = () => {
    if (tabActivo === 'perfil') {
      return (
        <PerfilScreen
          perfil={perfil}
          onLogout={onLogout}
          embedded
        />
      );
    }

    {tabActivo !== 'reportes' && (
      <View style={styles.header}>
        <View>
          <Text style={styles.sucursal}>{sucursal?.nombre ?? 'PROCOMIN'}</Text>
          <Text style={styles.fecha}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.gpsBadge}>
          <Ionicons name="location" size={12} color={SALMON} />
          <Text style={styles.gpsText}>GPS activo</Text>
        </View>
      </View>
    )}

    // Tab encuestas — tarjetas claras
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={surveyTabStyles.instruccion}>
          Selecciona una encuesta para responder
        </Text>

        {/* Tarjeta encuesta fija */}
        {!yaConteso ? (
          <TouchableOpacity
            style={[surveyTabStyles.tarjeta, { borderLeftColor: accentColor }]}
            onPress={() => setVistaEncuesta(true)}
          >
            <View style={[surveyTabStyles.tarjetaIcono, { backgroundColor: accentColor + '1F' }]}>
              <Ionicons name={isCocina ? 'restaurant-outline' : 'clipboard-outline'} size={24} color={isCocina ? COCINA_COLOR : '#cc6a3a'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={surveyTabStyles.tarjetaTitulo}>
                {isCocina ? 'Auditoria de Cocina' : 'Evaluacion General'}
              </Text>
              <Text style={surveyTabStyles.tarjetaSub}>
                {isCocina ? 'Cocina' : 'Evaluacion'} · {preguntas.length} preguntas
              </Text>
              <View style={[surveyTabStyles.badge, { backgroundColor: accentColor + '20' }]}>
                <Text style={[surveyTabStyles.badgeTexto, { color: isCocina ? COCINA_COLOR : '#cc6a3a' }]}>Pendiente</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isCocina ? COCINA_COLOR : '#cc6a3a'} style={surveyTabStyles.arrow} />
          </TouchableOpacity>
        ) : (
          <View style={[surveyTabStyles.tarjeta, { borderLeftColor: VERDE, opacity: 0.7 }]}>
            <View style={[surveyTabStyles.tarjetaIcono, { backgroundColor: VERDE + '1F' }]}>
              <Ionicons name="checkmark-circle" size={24} color={VERDE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={surveyTabStyles.tarjetaTitulo}>
                {isCocina ? 'Auditoria de Cocina' : 'Evaluacion General'}
              </Text>
              <Text style={surveyTabStyles.tarjetaSub}>Ya contestada hoy</Text>
              <View style={[surveyTabStyles.badge, { backgroundColor: VERDE + '20' }]}>
                <Text style={[surveyTabStyles.badgeTexto, { color: VERDE }]}>Completada</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tarjetas plantillas del gestor */}
        {plantillas.length > 0 && (
          <>
            <Text style={surveyTabStyles.seccion}>Encuestas adicionales</Text>
            {plantillas.map(pl => {
              const contestada = plantillasContestadas[pl.id];
              return (
                <TouchableOpacity
                  key={pl.id}
                  style={[surveyTabStyles.tarjeta, { borderLeftColor: MORADO }, contestada && { opacity: 0.6 }]}
                  onPress={() => {
                    if (contestada) { Alert.alert('Ya respondida', 'Ya contestaste esta encuesta.'); return; }
                    setPlantillaActiva(pl);
                  }}
                >
                  <View style={[surveyTabStyles.tarjetaIcono, { backgroundColor: MORADO + '15' }]}>
                    <Ionicons name="document-text-outline" size={24} color={MORADO} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={surveyTabStyles.tarjetaTitulo}>{pl.titulo}</Text>
                    <Text style={surveyTabStyles.tarjetaSub}>
                      {pl.rolCreador} · {pl.preguntas?.length} preguntas
                    </Text>
                    <View style={[surveyTabStyles.badge, {
                      backgroundColor: contestada ? VERDE + '20' : MORADO + '20',
                    }]}>
                      <Text style={[surveyTabStyles.badgeTexto, {
                        color: contestada ? VERDE : MORADO,
                      }]}>
                        {contestada ? 'Completada' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                  {!contestada && <Ionicons name="chevron-forward" size={20} color={MORADO} style={surveyTabStyles.arrow} />}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fdf8f6' }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sucursal}>{sucursal?.nombre ?? 'PROCOMIN'}</Text>
          <Text style={styles.fecha}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={styles.gpsBadge}>
          <Ionicons name="location" size={12} color={SALMON} />
          <Text style={styles.gpsText}>GPS activo</Text>
        </View>
      </View>

      {/* Contenido del tab */}
      <View style={{ flex: 1 }}>{renderTab()}</View>

      {/* Navbar inferior */}
      <View style={navStyles.navBar}>
        {[
          { key: 'encuestas', label: 'Encuestas', icon: 'document-text-outline', iconActivo: 'document-text' },
          { key: 'reportes', label: 'Reportes', icon: 'mail-outline', iconActivo: 'mail' },
          { key: 'perfil', label: 'Perfil', icon: 'person-outline', iconActivo: 'person' },
        ].map(tab => {
          const activo = tabActivo === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={navStyles.navItem}
              onPress={() => setTabActivo(tab.key)}
            >
              <Ionicons
                name={activo ? tab.iconActivo : tab.icon}
                size={21}
                color={activo ? MORADO_OSC : GRIS}
              />
              <Text style={[navStyles.navLabel, activo && navStyles.navLabelActivo]}>
                {tab.label}
              </Text>
              {activo && <View style={[navStyles.navIndicator, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}