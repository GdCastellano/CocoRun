// DetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

export default function DetailScreen({ route: navigationRoute }) {
  const { trot } = navigationRoute.params || {};
  const { date, time, distance, pace, speed, route } = trot || {};

  // Filtrar puntos válidos de la ruta
  const validRoute = Array.isArray(route)
    ? route.filter(point => point && typeof point.latitude === 'number' && typeof point.longitude === 'number')
    : [];
  console.log('Ruta en DetailScreen:', validRoute);

  // Formatear el tiempo
  const formatTime = (minutes) => {
    if (!minutes || isNaN(minutes)) return '0 min';
    const totalSeconds = Math.round(minutes * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours > 0 ? hours + ' h ' : ''}${mins} min ${secs} s`;
  };

  // Formatear el ritmo
  const formatPace = (pace) => {
    if (!pace || isNaN(pace)) return '0 min/km';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins} min ${secs} s / km`;
  };

  // Región inicial para el mapa
  const initialRegion = validRoute.length > 0
    ? {
        latitude: validRoute[0].latitude,
        longitude: validRoute[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: -33.4489, // Coordenadas por defecto (Santiago, Chile)
        longitude: -70.6693,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detalles del Trote</Text>
      <Text style={styles.detail}>Fecha: {date || 'No disponible'}</Text>
      <Text style={styles.detail}>Tiempo: {formatTime(time)}</Text>
      <Text style={styles.detail}>Distancia: {(distance || 0).toFixed(2)} km</Text>
      <Text style={styles.detail}>Ritmo: {formatPace(pace)}</Text>
      <Text style={styles.detail}>Velocidad: {(speed || 0).toFixed(2)} km/h</Text>

      <Text style={styles.sectionTitle}>Ruta:</Text>
      {validRoute.length > 0 ? (
        <MapView style={styles.map} initialRegion={initialRegion}>
          <Polyline coordinates={validRoute} strokeColor="#FF6B6B" strokeWidth={3} />
        </MapView>
      ) : (
        <Text style={styles.noData}>No hay datos de ruta disponibles</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F7FA' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginVertical: 10 },
  detail: { fontSize: 18, color: '#2E7D32', marginVertical: 5 },
  map: { height: 300, marginVertical: 10 },
  noData: { fontSize: 16, color: '#666', textAlign: 'center', marginVertical: 10 },
});