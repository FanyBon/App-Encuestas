import { StyleSheet, Platform } from 'react-native';

const MORADO = '#3d263a';
const SALMON = '#ff9e71';
const MEDIO  = '#6b3a52';
const BLANCO = '#FFFFFF';
const GRIS   = '#8E8E93';
const BORDE  = '#EDE4E9';
const FONDO  = '#fdf8f6';

export const surveyTabStyles = StyleSheet.create({
  instruccion: {
    fontSize: 13,
    color: GRIS,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  seccion: {
    fontSize: 12,
    fontWeight: '800',
    color: '#cc6a3a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: SALMON,
  },
  tarjeta: {
    backgroundColor: BLANCO,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: MORADO,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  tarjetaIcono: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: FONDO,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tarjetaTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: MORADO,
    marginBottom: 3,
  },
  tarjetaSub: {
    fontSize: 12,
    color: GRIS,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrow: {
    marginLeft: 8,
  },
});

export const navStyles = StyleSheet.create({
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
  },
});