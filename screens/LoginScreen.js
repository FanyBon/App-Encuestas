import React, { useState } from 'react';
import {
View,
Text,
TextInput,
TouchableOpacity,
ScrollView,
ActivityIndicator,
KeyboardAvoidingView,
Platform,
Alert
} from 'react-native';
import { loginUsuario } from '../services/encuestaService';
import styles from '../styles/loginStyles';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';



export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verPassword, setVerPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Ingresa tu correo y contrasena');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await loginUsuario(email.trim().toLowerCase(), password);
      onLogin();
    } catch (e) {
      setError('Correo o contrasena incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const recuperarPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Correo requerido',
        'Escribe tu correo para recuperar la contraseña.'
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      Alert.alert(
        'Correo enviado',
        'Revisa tu bandeja de entrada y sigue las instrucciones.'
      );
    } catch (error) {
      console.log('RESET ERROR:', error.code);

      Alert.alert(
        'Error',
        error.message
      );
    
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.background}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoTexto}>P</Text>
            </View>
            <Text style={styles.logoNombre}>PROCOMIN</Text>
            <Text style={styles.logoSlogan}>Sabor que impulsa</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.divider} />
            <Text style={styles.welcomeTitle}>Bienvenido de vuelta</Text>
            <Text style={styles.welcomeSub}>
              Ingresa tus credenciales para continuar
            </Text>

            <Text style={styles.label}>Correo corporativo</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="tu@procomin.mx"
                placeholderTextColor="#b49cb0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.iconBtn}>
                <Text style={styles.iconText}>@</Text>
              </View>
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#b49cb0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!verPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setVerPassword(!verPassword)}
              >
                <Text style={styles.iconText}>
                  {verPassword ? 'Ocultar' : 'Ver'}
                </Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnPrimaryText}>Iniciar sesion</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={recuperarPassword}
              style={{
                marginTop: 12,
                alignSelf: 'center'
              }}
            >
              <Text
                style={{
                  color: '#b49cb0',
                  fontWeight: '600'
                }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}