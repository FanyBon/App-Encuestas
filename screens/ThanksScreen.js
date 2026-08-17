import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { cerrarSesion } from '../services/encuestaService';

export default function ThanksScreen() {
  const [cuenta, setCuenta] = useState(3);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setCuenta(prev => prev - 1);
    }, 1000);

    const timer = setTimeout(async () => {
      await cerrarSesion();
      BackHandler.exitApp();
    }, 3000);

    return () => {
      clearInterval(intervalo);
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Encuesta enviada</Text>
      <Text style={styles.subtitle}>
        Tu respuesta fue registrada correctamente.{'\n'}
        Gracias por tu participacion.
      </Text>
      <Text style={styles.countdown}>Cerrando en {cuenta} segundos...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 24, fontWeight: '700',
    color: '#fff', marginBottom: 12,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  countdown: {
    fontSize: 13, color: '#FF9D00',
  },
});