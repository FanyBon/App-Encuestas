import { StyleSheet, Platform } from 'react-native';

const MORADO = '#3d263a';
const SALMON = '#ff9e71';
const MEDIO  = '#6b3a52';
const BLANCO = '#FFFFFF';
const GRIS   = '#8E8E93';
const BORDE  = '#EDE4E9';
const FONDO  = '#fdf8f6';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: FONDO },
  header: {
    backgroundColor: MORADO,
    paddingTop: Platform.OS === 'ios' ? 66 : 40,
    paddingBottom: 40,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,158,113,0.14)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,158,113,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backTexto: { color: SALMON, fontSize: 13, fontWeight: '600' },
  headerTitle: {
    fontSize: 21, fontWeight: '700',
    color: BLANCO, flex: 1,
  },
  cargando: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Formulario nuevo reporte
  nuevaCard: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  nuevaTitle: {
    fontSize: 14, fontWeight: '700',
    color: MORADO, marginBottom: 10,
  },
  textArea: {
    backgroundColor: FONDO,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: MORADO,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  // Foto
  fotoBtn: {
    borderWidth: 1.5,
    borderColor: BORDE,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: FONDO,
  },
  fotoBtnDone: {
    borderStyle: 'solid',
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  fotoBtnTexto: { fontSize: 13, color: '#9b8398' },
  fotoBtnTextoDone: { color: '#34C759', fontWeight: '600' },
  fotoPreview: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
  },

  // Toggle anonimo
  anonimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  anonimToggle: {
    width: 40, height: 22,
    borderRadius: 11,
    backgroundColor: BORDE,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  anonimToggleOn: { backgroundColor: SALMON },
  anonimCircle: {
    width: 18, height: 18,
    borderRadius: 9,
    backgroundColor: BLANCO,
  },
  anonimCircleOn: { alignSelf: 'flex-end' },
  anonimTexto: { fontSize: 13, color: '#9b8398' },
  anonimTextoOn: { color: MORADO, fontWeight: '600' },

  // Boton enviar
  enviarBtn: {
    backgroundColor: MORADO,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  enviarBtnTexto: { color: BLANCO, fontSize: 14, fontWeight: '700' },

  // Tabs admin
  tabsAdmin: {
    flexDirection: 'row',
    backgroundColor: BLANCO,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tabAdmin: {
    flex: 1, paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabAdminActivo: { backgroundColor: MORADO },
  tabAdminTexto: { fontSize: 13, color: '#9b8398', fontWeight: '500' },
  tabAdminTextoActivo: { color: BLANCO, fontWeight: '700' },

  // Area header
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 18,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: SALMON,
  },
  areaTitulo: {
    fontSize: 12, fontWeight: '800',
    color: '#cc6a3a', letterSpacing: 1,
  },
  areaCount: {
    fontSize: 12, fontWeight: '700',
    color: MORADO,
    backgroundColor: BLANCO,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Seccion title
  seccionTitle: {
    fontSize: 12, fontWeight: '800',
    color: '#cc6a3a', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
    marginTop: 4,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: SALMON,
  },

  // Reporte card
  reporteCard: {
    backgroundColor: BLANCO,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  reporteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reporteNombre: {
    fontSize: 13, fontWeight: '700', color: MORADO,
  },
  reporteFecha: {
    fontSize: 11, color: '#b49cb0',
  },
  areaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(108,58,82,0.08)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 6,
  },
  areaBadgeTexto: {
    fontSize: 11, fontWeight: '600', color: MEDIO,
  },
  reporteTexto: {
    fontSize: 13, color: '#5a3248',
    lineHeight: 20,
  },
  reporteFoto: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 10,
  },
  anonimoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,158,113,0.14)',
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 8,
  },
  anonimoBadgeTexto: {
    fontSize: 11, color: '#cc6a3a', fontWeight: '600',
  },

  sinReportes: {
    textAlign: 'center',
    color: '#b49cb0',
    fontSize: 14,
    marginTop: 40,
  },
});