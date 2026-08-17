import { StyleSheet, Platform } from 'react-native';

const MORADO  = '#3d263a';
const SALMON  = '#ff9e71';
const MEDIO   = '#6b3a52';
const BLANCO  = '#FFFFFF';
const GRIS    = '#8E8E93';
const BORDE   = '#EDE4E9';
const FONDO   = '#fdf8f6';

export default StyleSheet.create({
  // ── HEADER ──
  header: {
    backgroundColor: MORADO,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: BLANCO,
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // ── BIENVENIDA ──
  bienvenida: {
    fontSize: 19,
    fontWeight: '700',
    color: MORADO,
    marginBottom: 3,
    marginTop: 18,
  },
  bienvenidaSub: {
    fontSize: 13,
    color: GRIS,
    marginBottom: 20,
  },

  // ── KPIs ──
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: BLANCO,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderTopWidth: 3,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  kpiNum: {
    fontSize: 26,
    fontWeight: '800',
    color: MORADO,
    marginTop: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: GRIS,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
    fontWeight: '500',
  },

  // ── SECCIONES ──
  seccionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: MORADO,
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // ── ACCIONES RAPIDAS ──
  accionesRow: {
    gap: 10,
    marginBottom: 28,
  },
  accionBtn: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  accionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accionTextWrap: {
    flex: 1,
  },
  accionTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: MORADO,
  },
  accionSub: {
    fontSize: 12,
    color: GRIS,
    marginTop: 3,
  },
  accionArrow: {
    fontSize: 20,
    color: GRIS,
    fontWeight: '400',
  },

  // ── MIS ENCUESTAS ──
  encuestaCard: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  encuestaTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: MORADO,
  },
  encuestaSub: {
    fontSize: 12,
    color: GRIS,
    marginTop: 4,
  },
  respBadge: {
    backgroundColor: 'rgba(255,158,113,0.18)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 10,
  },
  respBadgeTexto: {
    color: '#cc6a3a',
    fontWeight: '700',
    fontSize: 12,
  },
  encuestaArrow: {
    color: GRIS,
    fontSize: 18,
    fontWeight: '400',
  },

  // ── DETALLE PLANTILLA ──
  detalleHeader: {
    backgroundColor: MORADO,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  detalleVolver: {
    color: BLANCO,
    fontWeight: '600',
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detalleVolverTexto: {
    color: BLANCO,
    fontWeight: '600',
    fontSize: 13,
  },
  detalleNombre: {
    fontSize: 19,
    fontWeight: '700',
    color: BLANCO,
  },
  detalleSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 4,
  },
  respuestaCard: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  respuestaNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: MORADO,
  },
  respuestaFecha: {
    fontSize: 11,
    color: GRIS,
  },
  preguntaLabel: {
    fontSize: 11,
    color: GRIS,
    marginBottom: 2,
  },
  respuestaValor: {
    fontSize: 14,
    fontWeight: '600',
    color: MORADO,
  },

  // ── NAVBAR ──
  navBar: {
    flexDirection: 'row',
    backgroundColor: BLANCO,
    borderTopWidth: 1,
    borderTopColor: BORDE,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingTop: 10,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10,
    color: GRIS,
    marginTop: 3,
    fontWeight: '500',
  },
  navLabelActivo: {
    color: MORADO,
    fontWeight: '700',
  },
  navIndicator: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: SALMON,
  },

  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: FONDO,
  },
  respuestaCard: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
  shadowColor: '#3d263a',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
},
respuestaCardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  marginBottom: 14,
  paddingBottom: 12,
  borderBottomWidth: 0.5,
  borderBottomColor: '#e8d8e4',
},
respuestaAvatar: {
  width: 38,
  height: 38,
  borderRadius: 19,
  backgroundColor: 'rgba(255,158,113,0.15)',
  alignItems: 'center',
  justifyContent: 'center',
},
respuestaAvatarLetra: {
  fontSize: 16,
  fontWeight: '800',
  color: '#ff9e71',
},
respuestaNombre: {
  fontSize: 14,
  fontWeight: '700',
  color: '#3d263a',
},
respuestaRol: {
  fontSize: 11,
  color: '#8E8E93',
  marginTop: 1,
},
respuestaFecha: {
  fontSize: 11,
  color: '#8E8E93',
  marginLeft: 'auto',
},
preguntaItem: {
  backgroundColor: '#fdf8f6',
  borderRadius: 10,
  padding: 10,
  marginBottom: 8,
  borderLeftWidth: 3,
  borderLeftColor: '#ff9e71',
},
preguntaNum: {
  fontSize: 10,
  color: '#8E8E93',
  fontWeight: '600',
  marginBottom: 3,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
preguntaTexto: {
  fontSize: 13,
  fontWeight: '700',
  color: '#3d263a',
  marginBottom: 6,
},
respuestaValorWrap: {
  backgroundColor: '#fff',
  borderRadius: 8,
  padding: 8,
  borderWidth: 0.5,
  borderColor: '#e8d8e4',
},
respuestaValor: {
  fontSize: 13,
  color: '#444',
},
});