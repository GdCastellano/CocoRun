// HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { startLocationUpdates, stopLocationUpdates } from '../backgroundTask';
import { showTrotNotification, updateTrotNotification, cancelTrotNotification } from '../PushNotificationConfig';
import { Accelerometer } from 'expo-sensors';
import { setStopTrotCallback } from '../globalFunctions';

export default function HomeScreen({ navigation }) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [route, setRoute] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);
  const accelSubscription = useRef(null);

  useEffect(() => {
    requestPermissions();
    checkOngoingTrot();
    setStopTrotCallback(stopTrot);
    return () => {
      setStopTrotCallback(() => {});
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (accelSubscription.current) accelSubscription.current.remove();
    };
  }, [stopTrot]);

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos de ubicación');
      console.error('Permisos de ubicación no otorgados');
    } else {
      console.log('Permisos de ubicación otorgados');
    }
  };

  const checkOngoingTrot = async () => {
    const storedStartTime = await AsyncStorage.getItem('startTime');
    if (storedStartTime) {
      setIsRunning(true);
      setStartTime(new Date(storedStartTime));
      const storedRoute = await AsyncStorage.getItem('currentRoute');
      const parsedRoute = storedRoute ? JSON.parse(storedRoute) : [];
      setRoute(parsedRoute.filter(point => point && typeof point.latitude === 'number' && typeof point.longitude === 'number'));
      const storedElapsedTime = await AsyncStorage.getItem('elapsedTime');
      setElapsedTime(storedElapsedTime ? parseInt(storedElapsedTime, 10) : 0);
      console.log('Trote en curso recuperado:', { storedRouteLength: parsedRoute.length });
    }
  };

  const startTrot = async () => {
    console.log('Iniciando trote...');
    setIsRunning(true);
    const currentTime = new Date();
    setStartTime(currentTime);
    setRoute([]);
    setElapsedTime(0);

    await AsyncStorage.setItem('startTime', currentTime.toISOString());
    await AsyncStorage.setItem('currentRoute', JSON.stringify([]));
    await AsyncStorage.setItem('elapsedTime', '0');

    // Iniciar acelerómetro
    Accelerometer.setUpdateInterval(1000); // Actualiza cada segundo
    accelSubscription.current = Accelerometer.addListener(handleAccelerometerData);
    startLocationUpdates();

    const initialDistance = calculateDistance(route);
    showTrotNotification(elapsedTime, initialDistance, calculateSpeed(route, elapsedTime));

    const timeId = setInterval(async () => {
      setElapsedTime((prev) => {
        const newElapsedTime = prev + 1;
        AsyncStorage.setItem('elapsedTime', newElapsedTime.toString());
        AsyncStorage.getItem('currentRoute').then(storedRoute => {
          const parsedRoute = storedRoute ? JSON.parse(storedRoute) : [];
          setRoute(parsedRoute.filter(point => point && typeof point.latitude === 'number' && typeof point.longitude === 'number'));
        });
        const currentDistance = calculateDistance(route);
        const currentSpeed = calculateSpeed(route, newElapsedTime);

        if (newElapsedTime % 5 === 0) {
          updateTrotNotification(newElapsedTime, currentDistance, currentSpeed);
        }

        console.log('Datos del trote:', {
          elapsedTime: `${Math.floor(newElapsedTime / 60)}:${newElapsedTime % 60 < 10 ? '0' : ''}${newElapsedTime % 60}s`,
          distance: `${currentDistance.toFixed(2)} km`,
          speed: `${currentSpeed.toFixed(2)} km/h`,
          routeLength: route.length,
        });

        return newElapsedTime;
      });
    }, 1000);

    intervalRef.current = timeId;
    console.log('Intervalo iniciado con ID:', timeId);
  };

  const stopTrot = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Intervalo detenido');
    }
    if (accelSubscription.current) {
      accelSubscription.current.remove();
      accelSubscription.current = null;
    }
    stopLocationUpdates();
    setIsRunning(false);
    const endTime = new Date();
    const totalTime = elapsedTime;
    const storedRoute = await AsyncStorage.getItem('currentRoute');
    const finalRoute = storedRoute ? JSON.parse(storedRoute) : [];
    const distance = calculateDistance(finalRoute);

    if (distance >= 0) {
      const pace = totalTime / 60 / (distance > 0 ? distance : 0.001);
      const speed = distance / (totalTime / 3600) || 0;
      const intervalDistance = calculateIntervalDistance(finalRoute, 5);
      const validRoute = finalRoute.filter(point => point && typeof point.latitude === 'number' && typeof point.longitude === 'number');

      const trot = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        time: totalTime / 60,
        distance,
        pace,
        speed,
        route: validRoute,
        intervalDistance,
      };

      await saveTrot(trot);
      console.log('Trote guardado:', trot);
      console.log('Ruta antes de guardar:', finalRoute);
    } else {
      console.log('Trote no guardado: distancia negativa o no calculada');
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

  const handleAccelerometerData = ({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const threshold = 1.5; // Ajusta según pruebas
    if (magnitude > threshold) {
      console.log('Movimiento detectado, capturando ubicación...');
      captureLocation();
    }
  };

  const captureLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newPoint = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      let currentRoute = await AsyncStorage.getItem('currentRoute');
      currentRoute = currentRoute ? JSON.parse(currentRoute) : [];
      currentRoute.push(newPoint);
      await AsyncStorage.setItem('currentRoute', JSON.stringify(currentRoute));
      console.log('Ubicación capturada:', newPoint);
    } catch (error) {
      console.error('Error al capturar ubicación:', error);
    }
  };

  const calculateDistance = (points) => {
    if (!points || points.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (prev && curr && typeof prev.latitude === 'number' && typeof prev.longitude === 'number' && typeof curr.latitude === 'number' && typeof curr.longitude === 'number') {
        totalDistance += haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      }
    }
    return totalDistance / 1000;
  };

  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateIntervalDistance = (points, intervalMinutes) => {
    if (!points || points.length < 2) return [];
    const intervalMs = intervalMinutes * 60 * 1000;
    let currentIntervalStart = points[0]?.timestamp || Date.now();
    let currentDistance = 0;
    const intervals = [];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (prev && curr && typeof prev.latitude === 'number' && typeof prev.longitude === 'number' && typeof curr.latitude === 'number' && typeof curr.longitude === 'number') {
        const segmentDistance = haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude) / 1000;
        if ((curr.timestamp || Date.now()) - currentIntervalStart >= intervalMs) {
          intervals.push(currentDistance);
          currentDistance = segmentDistance;
          currentIntervalStart = curr.timestamp || Date.now();
        } else {
          currentDistance += segmentDistance;
        }
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
      console.error('Error al guardar el trote:', error);
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