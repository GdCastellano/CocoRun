import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import MapView, { Polyline } from 'expo-maps';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

export default function DetailScreen({ route }) {
  const { trot } = route.params;

  const formatNumber = (num) => (num != null ? num.toFixed(2) : 'N/A');

  const formatTime = (time) => {
    const hours = Math.floor(time / 60);
    const minutes = Math.floor(time % 60);
    const seconds = Math.round((time - Math.floor(time)) * 60);
    return hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
  };

  const formatPace = (pace) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Trote del ${trot.date}: ${formatNumber(trot.time)} min, ${formatNumber(trot.distance)} km, ritmo: ${formatNumber(trot.pace)} min/km, velocidad: ${formatNumber(trot.speed)} km/h`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del Trote</Text>
      <View style={styles.card}>
        <Text style={styles.text}>Fecha: {trot.date}</Text>
        <Text style={styles.text}>Tiempo: {formatTime(trot.time)}</Text>
        <Text style={styles.text}>Distancia: {trot.distance.toFixed(2)} km</Text>
        <Text style={styles.text}>Ritmo: {formatPace(trot.pace)}</Text>
        <Text style={styles.text}>Velocidad: {trot.speed.toFixed(2)} km/h</Text>
        <Text style={styles.text}>Intervalos (5 min):</Text>
        {trot.intervalDistance && trot.intervalDistance.map((dist, index) => (
          <Text key={index} style={styles.text}>Intervalo {index + 1}: {dist.toFixed(2)} km</Text>
        ))}
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: trot.route[0].latitude,
          longitude: trot.route[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline coordinates={trot.route} strokeWidth={3} strokeColor="#FF6B6B" />
      </MapView>
      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
        <Text style={styles.shareButtonText}>Compartir por WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginVertical: 5,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
});
