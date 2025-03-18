// backgroundTask.js
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const startLocationUpdates = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.error('Permisos de ubicación no otorgados');
    return;
  }
  const intervalId = setInterval(async () => {
    const location = await Location.getCurrentPositionAsync({});
    let currentRoute = await AsyncStorage.getItem('currentRoute');
    currentRoute = currentRoute ? JSON.parse(currentRoute) : [];
    currentRoute.push({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    await AsyncStorage.setItem('currentRoute', JSON.stringify(currentRoute));
    console.log('Ubicación registrada:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }, 5000); // Registra cada 5 segundos
  await AsyncStorage.setItem('locationIntervalId', intervalId.toString());
};

export const stopLocationUpdates = async () => {
  const intervalId = await AsyncStorage.getItem('locationIntervalId');
  if (intervalId) {
    clearInterval(parseInt(intervalId));
    await AsyncStorage.removeItem('locationIntervalId');
    console.log('Deteniendo actualización de ubicación');
  }
};