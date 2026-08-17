import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { crearUsuarioGestor } from '../services/encuestaService';
import { SUCURSALES } from '../constants/sucursales';

const MORADO = '#3d263a';
const SALMON = '#ff9e71';

export default function CrearUsuarioScreen({ onVolver, onCreado }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [rol, setRol] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleCrear = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmar.trim() || !rol.trim() || !sucursalId) {
      Alert.alert('Campos incompletos', 'Llena todos los campos antes de continuar.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmar) {
      Alert.alert('Las contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return;
    }
    setGuardando(true);
    try {
      await crearUsuarioGestor(email.trim(), password, nombre.trim(), rol.trim().toLowerCase(), sucursalId);
      Alert.alert('✅ Usuario creado', `${nombre} fue registrado como gestor de ${rol}.`, [
        { text: 'OK', onPress: onCreado }
      ]);
    } catch (e) {
      const msg = e.message?.includes('EMAIL_EXISTS')
        ? 'Ese correo ya está registrado.'
        : e.message ?? 'No se pudo crear el usuario.';
      Alert.alert('Error', msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onVolver}>
          <Text style={s.back}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nuevo usuario gestor</Text>
        <Text style={s.headerSub}>Este usuario podrá crear encuestas y ver reportes</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        <Text style={s.label}>Nombre completo</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: María López"
          placeholderTextColor="#b49cb0"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={s.label}>Correo electrónico</Text>
        <TextInput
          style={s.input}
          placeholder="correo@empresa.com"
          placeholderTextColor="#b49cb0"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={s.label}>Contraseña temporal</Text>
        <View style={s.passRow}>
          <TextInput
            style={[s.input, s.passInput]}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#b49cb0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!verPass}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setVerPass(!verPass)}>
            <Text style={s.eyeTexto}>{verPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Confirmar contraseña</Text>
        <View style={s.passRow}>
          <TextInput
            style={[s.input, s.passInput, confirmar && password !== confirmar && s.inputError]}
            placeholder="Repite la contraseña"
            placeholderTextColor="#b49cb0"
            value={confirmar}
            onChangeText={setConfirmar}
            secureTextEntry={!verConfirmar}
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setVerConfirmar(!verConfirmar)}>
            <Text style={s.eyeTexto}>{verConfirmar ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {confirmar.length > 0 && password !== confirmar && (
          <Text style={s.errorTexto}>Las contraseñas no coinciden</Text>
        )}

        <Text style={s.label}>Rol / Área</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: calidad, movilidad, logística..."
          placeholderTextColor="#b49cb0"
          value={rol}
          onChangeText={setRol}
          autoCapitalize="none"
        />

        <Text style={s.label}>Sucursal</Text>
        <View style={s.sucursalesWrap}>
          {SUCURSALES.map(suc => (
            <TouchableOpacity
              key={suc.id}
              style={[s.sucBtn, sucursalId === suc.id && s.sucBtnActivo]}
              onPress={() => setSucursalId(suc.id)}
            >
              <Text style={[s.sucBtnTexto, sucursalId === suc.id && s.sucBtnTextoActivo]}>
                {suc.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.crearBtn, guardando && s.crearBtnDisabled]}
          onPress={handleCrear}
          disabled={guardando}
        >
          {guardando
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.crearBtnTexto}>Crear usuario</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f6' },
  header: {
    backgroundColor: MORADO,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    gap: 6,
  },
  back: { color: SALMON, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12, fontWeight: '700', color: MORADO,
    marginBottom: 6, marginTop: 14, letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5,
    borderColor: '#e8d8e4', borderRadius: 8,
    padding: 12, fontSize: 14, color: MORADO,
  },
  inputError: { borderColor: '#c4607a' },
  errorTexto: { fontSize: 12, color: '#c4607a', marginTop: 4 },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passInput: { flex: 1 },
  eyeBtn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8d8e4',
    borderRadius: 8, padding: 12, justifyContent: 'center', alignItems: 'center',
  },
  eyeTexto: { fontSize: 18 },
  sucursalesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  sucBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#e8d8e4', backgroundColor: '#fff',
  },
  sucBtnActivo: { backgroundColor: MORADO, borderColor: MORADO },
  sucBtnTexto: { fontSize: 13, color: '#7a5f76' },
  sucBtnTextoActivo: { color: '#fff', fontWeight: '600' },
  crearBtn: {
    backgroundColor: MORADO, borderRadius: 12,
    padding: 15, alignItems: 'center', marginTop: 28,
    shadowColor: MORADO, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  crearBtnDisabled: { opacity: 0.6 },
  crearBtnTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
});