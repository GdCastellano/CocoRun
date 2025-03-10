import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const newLocation = locations[0];
    if (newLocation) {
      const storedRoute = await AsyncStorage.getItem('currentRoute');
      const route = storedRoute ? JSON.parse(storedRoute) : [];
      route.push({ ...newLocation.coords, timestamp: Date.now() });
      await AsyncStorage.setItem('currentRoute', JSON.stringify(route));
    }
  }
});

export const startLocationUpdates = async () => {
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
  });
};

export const stopLocationUpdates = async () => {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
};