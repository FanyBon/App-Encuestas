import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import styles from '../styles/crearEncuestaStyles';
import {
  guardarPlantilla,
  actualizarPlantilla
} from '../services/encuestaService';

const TIPOS = ['opciones', 'texto', 'si/no'];

const preguntaVacia = () => ({
  id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  texto: '',
  tipo: 'opciones',
  opciones: ['', '', ''],
  requiereFoto: false,
});

export default function CrearEncuestaScreen({ perfil, onVolver, onGuardado, encuestaEditar = null, esAdmin = false }) {
  const [titulo, setTitulo] = useState(encuestaEditar?.titulo || '');
  const [preguntas, setPreguntas] = useState(encuestaEditar?.preguntas || [preguntaVacia()]);  
  const [guardando, setGuardando] = useState(false);
  const [paraTodasSucursales, setParaTodasSucursales] = useState(false);

  const actualizarPregunta = (index, campo, valor) => {
    setPreguntas(prev => {
      const nuevas = [...prev];
      nuevas[index] = { ...nuevas[index], [campo]: valor };
      return nuevas;
    });
  };

  const actualizarOpcion = (pregIndex, opcionIndex, valor) => {
    setPreguntas(prev => {
      const nuevas = [...prev];
      const opciones = [...nuevas[pregIndex].opciones];
      opciones[opcionIndex] = valor;
      nuevas[pregIndex] = { ...nuevas[pregIndex], opciones };
      return nuevas;
    });
  };

  const agregarPregunta = () => {
    setPreguntas(prev => [...prev, preguntaVacia()]);
  };

  const eliminarPregunta = (index) => {
    if (preguntas.length === 1) {
      Alert.alert('Minimo una pregunta', 'La encuesta debe tener al menos una pregunta.');
      return;
    }
    setPreguntas(prev => prev.filter((_, i) => i !== index));
  };

    const handleGuardar = async () => {
        if (!titulo.trim()) {
            Alert.alert('Titulo requerido', 'Ponle un titulo a la encuesta.');
            return;
        }
        const incompleta = preguntas.some(p => !p.texto.trim());
        if (incompleta) {
            Alert.alert('Preguntas incompletas', 'Todas las preguntas deben tener texto.');
            return;
        }
     setGuardando(true);
     try {
        const preguntasLimpias = preguntas.map(p => ({
        ...p,
        opciones:
            p.tipo === 'si/no'
            ? ['Si', 'No']
            : p.tipo === 'texto'
            ? null
            : p.opciones.filter(o => o.trim()),
        }));
        if (encuestaEditar) {
               await actualizarPlantilla(
                encuestaEditar.id,
                titulo.trim(),
                preguntasLimpias
            );
            Alert.alert(
                'Actualizado',
                'La encuesta fue actualizada.',
                [
                    {
                        text: 'OK',
                        onPress: onGuardado
                    }
                ]
            );
        }
        } catch (e) {
            console.log(e);
            Alert.alert(
            'Error',
            encuestaEditar
                ? 'No se pudo actualizar la encuesta.'
                : 'No se pudo guardar la encuesta.'
            );
        } finally {
            setGuardando(false);
        }
    };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onVolver}>
          <Text style={styles.backTexto}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva encuesta</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Titulo de la encuesta</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Auditoria semanal de cocina"
          placeholderTextColor="#b49cb0"
          value={titulo}
          onChangeText={setTitulo}
        />
        {/* Toggle sucursal */}
        <Text style={[styles.label, { marginTop: 20 }]}>Alcance de la encuesta</Text>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: paraTodasSucursales ? '#7c5cbf' : '#3d263a',
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
          }}
          onPress={() => setParaTodasSucursales(!paraTodasSucursales)}
        >
          <Text style={{ fontSize: 24, marginRight: 12 }}>
            {paraTodasSucursales ? '🌐' : '🏢'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
              {paraTodasSucursales ? 'Todas las sucursales' : 'Solo mi sucursal'}
            </Text>
            <Text style={{ color: '#b49cb0', fontSize: 12, marginTop: 2 }}>
              {paraTodasSucursales
                ? 'Todos los empleados verán esta encuesta'
                : 'Solo los empleados de tu sucursal la verán'}
            </Text>
          </View>
          <Text style={{ color: '#b49cb0', fontSize: 12 }}>Toca para cambiar</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 0 }]}>Preguntas</Text>

        {preguntas.map((pregunta, index) => (
          <View key={pregunta.id} style={styles.preguntaCard}>
            <Text style={styles.preguntaNum}>Pregunta {index + 1}</Text>

            <TextInput
              style={styles.preguntaInput}
              placeholder="Escribe la pregunta..."
              placeholderTextColor="#b49cb0"
              value={pregunta.texto}
              onChangeText={(val) => actualizarPregunta(index, 'texto', val)}
              multiline
            />

            <View style={styles.tipoRow}>
              {TIPOS.map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.tipoBtn, pregunta.tipo === tipo && styles.tipoBtnActivo]}
                  onPress={() => actualizarPregunta(index, 'tipo', tipo)}
                >
                  <Text style={[styles.tipoBtnTexto, pregunta.tipo === tipo && styles.tipoBtnTextoActivo]}>
                    {tipo === 'opciones' ? 'Opciones' : tipo === 'texto' ? 'Texto libre' : 'Si / No'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {pregunta.tipo === 'opciones' && (
            <>
                {pregunta.opciones.map((opcion, oi) => (
                <TextInput
                    key={oi}
                    style={[styles.preguntaInput, { marginBottom: 4 }]}
                    placeholder={`Opción ${oi + 1}`}
                    placeholderTextColor="#b49cb0"
                    value={opcion}
                    onChangeText={(val) => actualizarOpcion(index, oi, val)}
                />
                ))}
                <TouchableOpacity
                onPress={() => {
                    const nuevas = [...preguntas];
                    nuevas[index].opciones.push('');
                    setPreguntas(nuevas);
                }}
                style={{
                    marginTop: 8,
                    padding: 10,
                    backgroundColor: '#7c5cbf20',
                    borderRadius: 10,
                    alignItems: 'center'
                }}
                >
                <Text style={{ color: '#7c5cbf', fontWeight: '700' }}>
                    + Agregar opción
                </Text>
                </TouchableOpacity>
            </>
            )}
            <TouchableOpacity
              style={styles.fotoToggle}
              onPress={() => actualizarPregunta(index, 'requiereFoto', !pregunta.requiereFoto)}
            >
              <Text style={[styles.fotoToggleTexto, pregunta.requiereFoto && styles.fotoToggleActivo]}>
                {pregunta.requiereFoto ? '📷 Requiere foto — toca para quitar' : '+ Agregar foto de evidencia'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.eliminarBtn} onPress={() => eliminarPregunta(index)}>
              <Text style={styles.eliminarTexto}>Eliminar pregunta</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.agregarPreguntaBtn} onPress={agregarPregunta}>
          <Text style={styles.agregarPreguntaTexto}>+ Agregar pregunta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guardarBtn} onPress={handleGuardar} disabled={guardando}>
          {guardando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.guardarBtnTexto}>Guardar encuesta</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}