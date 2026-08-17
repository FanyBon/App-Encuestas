import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  resumen: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  filaLabel: { fontSize: 13, color: COLORS.textSecondary },
  filaValor: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  mensaje: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  btnTexto: { color: '#fff', fontSize: 15, fontWeight: '600' },
});