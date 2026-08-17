import { StyleSheet, Platform } from 'react-native';

const MORADO  = '#3d263a';
const SALMON  = '#ff9e71';
const MEDIO   = '#6b3a52';
const MORADO2 = '#7c5cbf';
const VERDE   = '#00B894';
const FONDO   = '#fdf8f6';
const BLANCO  = '#FFFFFF';
const GRIS    = '#8E8E93';
const BORDE   = '#EDE4E9';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: FONDO },
  cargando: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: FONDO },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // ── HEADER ──
  header: {
    backgroundColor: MORADO,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 22,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '700', color: BLANCO, letterSpacing: 0.2, lineHeight: 26 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  crearBtn: {
    backgroundColor: SALMON,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: SALMON,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  crearBtnTexto: { color: MORADO, fontWeight: '700', fontSize: 13 },

  // ── BIENVENIDA ──
  bienvenida: { fontSize: 19, fontWeight: '700', color: MORADO, marginTop: 4, marginBottom: 3 },
  bienvenidaSub: { fontSize: 13, color: GRIS, marginBottom: 20 },

  // ── KPIs ──
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: BLANCO,
    borderRadius: 18, padding: 16,
    borderTopWidth: 3, alignItems: 'flex-start',
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  kpiIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  kpiNum: { fontSize: 28, fontWeight: '800', color: MORADO, lineHeight: 32 },
  kpiLabel: { fontSize: 12, color: GRIS, marginTop: 4, fontWeight: '500' },

  // ── SECCIONES ──
  seccionTitle: { fontSize: 15, fontWeight: '700', color: MORADO, marginBottom: 12, marginTop: 4 },

  // ── ACTIVIDAD RECIENTE ──
  actividadCard: {
    backgroundColor: BLANCO, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  actividadAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: MORADO, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  actividadAvatarLetra: { color: BLANCO, fontWeight: '700', fontSize: 16 },
  actividadNombre: { fontSize: 14, fontWeight: '600', color: MORADO },
  actividadSub: { fontSize: 12, color: GRIS, marginTop: 2 },
  actividadFecha: { fontSize: 11, color: GRIS, textAlign: 'right' },

  // ── BUSQUEDA ──
  searchBox: {
    backgroundColor: BLANCO, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16, shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: MORADO },

  // ── GESTORES ──
  gestorCard: {
    backgroundColor: BLANCO, borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  gestorAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: MORADO, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  gestorAvatarLetra: { color: BLANCO, fontWeight: '800', fontSize: 18 },
  gestorInfo: { flex: 1 },
  gestorNombre: { fontSize: 15, fontWeight: '700', color: MORADO },
  gestorEmail: { fontSize: 12, color: GRIS, marginTop: 2 },
  gestorSucursal: {
    fontSize: 12, color: GRIS, marginTop: 3,
    flexDirection: 'row', alignItems: 'center',
  },
  gestorSucursalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  gestorEncuestas: { fontSize: 11, color: GRIS, marginTop: 4 },

  // ── PILLS ──
  rolPill: {
    backgroundColor: 'rgba(108,58,82,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  rolPillTexto: { fontSize: 11, fontWeight: '700', color: MEDIO, textTransform: 'capitalize' },
  activoPill: {
    backgroundColor: 'rgba(0,184,148,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  activoPillTexto: { fontSize: 11, fontWeight: '700', color: VERDE },

  // ── SUCURSALES ──
  sucursalesHeader: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sucursalesKpi: {
    flex: 1, backgroundColor: BLANCO,
    borderRadius: 18, padding: 18, alignItems: 'center',
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  sucursalesKpiNum: { fontSize: 28, fontWeight: '800', color: MORADO },
  sucursalesKpiLabel: { fontSize: 12, color: GRIS, marginTop: 4, textAlign: 'center', fontWeight: '500' },

  sucursalCardClick: {
    backgroundColor: BLANCO, borderRadius: 18, marginBottom: 12,
    overflow: 'hidden', shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  sucursalCardTop: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: BORDE,
    gap: 12,
  },
  sucursalNombre: { fontSize: 15, fontWeight: '700', color: MORADO },
  sucursalDireccion: { fontSize: 12, color: GRIS, marginTop: 2 },
  sucursalCardStats: { flexDirection: 'row', padding: 12, backgroundColor: FONDO },
  sucursalStatItem: { flex: 1, alignItems: 'center' },
  sucursalStatNum: { fontSize: 18, fontWeight: '800', color: MORADO },
  sucursalStatLabel: { fontSize: 10, color: GRIS, marginTop: 2 },
  sucursalStatDivider: { width: 1, backgroundColor: BORDE, marginVertical: 4 },

  // ── ENCUESTAS / REPORTES CARD ──
  encuestaCardDetalle: {
    backgroundColor: BLANCO, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  encuestaAvatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: MEDIO, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  encuestaNombre: { fontSize: 14, fontWeight: '600', color: MORADO, flexDirection: 'row', alignItems: 'center' },
  encuestaFecha: {
    fontSize: 11, color: GRIS, marginTop: 2,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },

  // ── DETALLE HEADER ──
  detalleHeader: {
    backgroundColor: MORADO,
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  detalleVolver: {
    color: BLANCO, fontWeight: '600', fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 13, paddingVertical: 6,
    borderRadius: 20, alignSelf: 'flex-start',
    marginBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  detalleVolverTexto: { color: BLANCO, fontWeight: '600', fontSize: 13 },
  detalleNombre: { fontSize: 19, fontWeight: '700', color: BLANCO },
  detalleSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },

  // ── PERFIL GESTOR (detalle) ──
  perfilHeroCard: {
    backgroundColor: BLANCO, borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  perfilHeroAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: MORADO, justifyContent: 'center',
    alignItems: 'center', marginRight: 16,
    borderWidth: 3, borderColor: SALMON,
  },
  perfilHeroLetra: { color: BLANCO, fontWeight: '800', fontSize: 26 },
  perfilHeroInfo: { flex: 1 },
  perfilHeroNombre: { fontSize: 18, fontWeight: '800', color: MORADO },
  perfilHeroEmail: { fontSize: 12, color: GRIS, marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statMini: {
    flex: 1, backgroundColor: BLANCO, borderRadius: 16,
    padding: 14, alignItems: 'center', borderTopWidth: 3,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  statMiniNum: { fontSize: 20, fontWeight: '800', color: MORADO },
  statMiniLabel: { fontSize: 10, color: GRIS, textAlign: 'center', marginTop: 4, lineHeight: 14 },

  sucursalInfoCard: {
    backgroundColor: BLANCO, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: SALMON,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  sucursalInfoNombre: { fontSize: 14, fontWeight: '700', color: MORADO },
  sucursalInfoDir: { fontSize: 12, color: GRIS, marginTop: 2 },

  // ── GRAFICA ──
  graficaCard: {
    backgroundColor: BLANCO, borderRadius: 18, padding: 18,
    marginBottom: 20, shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  graficaTitulo: { fontSize: 15, fontWeight: '700', color: MORADO },
  graficaSub: { fontSize: 12, color: GRIS, marginTop: 3, marginBottom: 4 },

  // ── USUARIO (lista en sucursal) ──
  usuarioCard: {
    backgroundColor: BLANCO, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  usuarioAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: MEDIO, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  usuarioAvatarLetra: { color: BLANCO, fontWeight: '800', fontSize: 17 },
  usuarioInfo: { flex: 1 },
  usuarioNombre: { fontSize: 14, fontWeight: '700', color: MORADO },
  usuarioEmail: { fontSize: 12, color: GRIS, marginTop: 2 },

  // ── ROL BADGE (detalle encuesta) ──
  rolBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  rolCocina: { backgroundColor: 'rgba(196,96,122,0.12)' },
  rolUsuario: { backgroundColor: 'rgba(255,158,113,0.12)' },
  rolTexto: { fontSize: 13, fontWeight: '700', color: MORADO },

  // ── RESPUESTAS ──
  respuestaCard: {
    backgroundColor: BLANCO, borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  respuestaPregunta: { fontSize: 13, color: GRIS, marginBottom: 6, fontWeight: '500' },
  respuestaValor: { fontSize: 15, fontWeight: '700', color: MORADO },
  fotoInline: { width: '100%', height: 180, borderRadius: 10, marginTop: 10 },
  fotoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  fotoGridItem: { width: '48%', height: 120, borderRadius: 10 },

  // ── FILTROS PILL ──
  filtroChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  filtroChipTexto: { fontSize: 12, fontWeight: '600' },

  // ── BOTON CERRAR SESION ──
  cerrarBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,59,48,0.2)',
  },
  cerrarBtnTexto: { color: '#FF3B30', fontWeight: '700', fontSize: 14 },
  sinDatos: { textAlign: 'center', color: GRIS, fontSize: 14, paddingVertical: 32 },

  // ── NAVBAR ──
  navBar: {
    flexDirection: 'row', backgroundColor: BLANCO,
    borderTopWidth: 1, borderTopColor: BORDE,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingTop: 10, shadowColor: MORADO,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 10,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', paddingVertical: 2 },
  navLabel: { fontSize: 10, color: GRIS, marginTop: 3, fontWeight: '500' },
  navLabelActivo: { color: MORADO, fontWeight: '700' },
  navIndicator: { position: 'absolute', top: -2, width: 4, height: 4, borderRadius: 2, backgroundColor: SALMON },
});