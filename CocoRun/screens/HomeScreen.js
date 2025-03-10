// filepath: /c:/Users/gabod/Proyectos/CocoRun/CocoRun/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { startLocationUpdates, stopLocationUpdates } from '../backgroundTask';
import * as Notifications from 'expo-notifications';
import { showTrotNotification, cancelTrotNotification, stopTrot } from '../PushNotificationConfig';

export default function HomeScreen({ navigation }) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [route, setRoute] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    requestPermissions();
    checkOngoingTrot();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos de ubicación');
    }
  };

  const checkOngoingTrot = async () => {
    const storedStartTime = await AsyncStorage.getItem('startTime');
    if (storedStartTime) {
      setIsRunning(true);
      setStartTime(new Date(storedStartTime));
      const storedRoute = await AsyncStorage.getItem('currentRoute');
      setRoute(storedRoute ? JSON.parse(storedRoute) : []);
      const storedElapsedTime = await AsyncStorage.getItem('elapsedTime');
      setElapsedTime(storedElapsedTime ? parseInt(storedElapsedTime, 10) : 0);
    }
  };

  const startTrot = async () => {
    setIsRunning(true);
    const currentTime = new Date();
    setStartTime(currentTime);
    setRoute([]);
    setElapsedTime(0);
  
    await AsyncStorage.setItem('startTime', currentTime.toISOString());
    await AsyncStorage.setItem('currentRoute', JSON.stringify([]));
    await AsyncStorage.setItem('elapsedTime', '0');
  
    startLocationUpdates();
  
    const timeId = setInterval(() => {
      setElapsedTime((prev) => {
        const newElapsedTime = prev + 1;
        AsyncStorage.setItem('elapsedTime', newElapsedTime.toString());
        showTrotNotification(newElapsedTime, calculateDistance(route), calculateSpeed(route, newElapsedTime));
        return newElapsedTime;
      });
    }, 1000);
  
    // Manejar respuesta de notificación
    Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data.action === 'StopTrot') {
        stopTrot(); // Implementa la lógica de detener aquí si es necesario
      }
    });
  };
  
  const stopTrot = async () => {
    stopLocationUpdates();
    setIsRunning(false);
    const endTime = new Date();
    const totalTime = (endTime - startTime) / 60000;
    const distance = calculateDistance(route);
  
    if (distance > 0) {
      const pace = totalTime / distance;
      const speed = distance / (totalTime / 60);
      const intervalDistance = calculateIntervalDistance(route, 5);
  
      const trot = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        time: totalTime,
        distance,
        pace,
        speed,
        route,
        intervalDistance,
      };
  
      await saveTrot(trot);
    } else {
      alert('La distancia recorrida es cero. No se guardará el trote.');
    }
  
    await AsyncStorage.removeItem('startTime');
    await AsyncStorage.removeItem('currentRoute');
    await AsyncStorage.removeItem('elapsedTime');
    setStartTime(null);
    setRoute([]);
    setElapsedTime(0);
    cancelTrotNotification();
    navigation.navigate('Records');
  };
  
  // Lógica para detener desde la notificación (puedes ajustarla)
  const handleStopFromNotification = () => {
    stopTrot();
  };

  const calculateDistance = (points) => {
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      totalDistance += haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
    return totalDistance / 1000;
  };

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateIntervalDistance = (points, intervalMinutes) => {
    const intervalMs = intervalMinutes * 60 * 1000;
    let currentIntervalStart = points[0].timestamp;
    let currentDistance = 0;
    const intervals = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const segmentDistance = haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude) / 1000;
      if (curr.timestamp - currentIntervalStart >= intervalMs) {
        intervals.push(currentDistance);
        currentDistance = segmentDistance;
        currentIntervalStart = curr.timestamp;
      } else {
        currentDistance += segmentDistance;
      }
    }
    if (currentDistance > 0) intervals.push(currentDistance);
    return intervals;
  };

  const saveTrot = async (trot) => {
    try {
      const existingTrots = await AsyncStorage.getItem('trots');
      const trots = existingTrots ? JSON.parse(existingTrots) : [];
      trots.push(trot);
      await AsyncStorage.setItem('trots', JSON.stringify(trots));
    } catch (error) {
      console.error(error);
    }
  };

  const calculateSpeed = (route, elapsedTime) => {
    const distance = calculateDistance(route);
    return route.length > 1 ? (distance / (elapsedTime / 3600)) : 0;
  };

  const currentDistance = calculateDistance(route);
  const currentSpeed = calculateSpeed(route, elapsedTime);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CocoRun</Text>
      <Text style={styles.status}>{isRunning ? 'Trotando...' : 'Listo para trotar'}</Text>
      {isRunning && (
        <View style={styles.statsContainer}>
          <Text style={styles.stat}>Tiempo: {Math.floor(elapsedTime / 60)}:{elapsedTime % 60 < 10 ? '0' : ''}{elapsedTime % 60}s</Text>
          <Text style={styles.stat}>Distancia: {currentDistance.toFixed(2)} km</Text>
          <Text style={styles.stat}>Velocidad: {currentSpeed.toFixed(2)} km/h</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={isRunning ? stopTrot : startTrot}>
        <Ionicons name={isRunning ? 'stop' : 'play'} size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>{isRunning ? 'Detener' : 'Iniciar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Records')}>
        <Ionicons name="list" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Registros</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 20,
  },
  status: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  stat: {
    fontSize: 18,
    color: '#2E7D32',
    marginVertical: 5,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
});