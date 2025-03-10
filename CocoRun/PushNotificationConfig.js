// PushNotificationConfig.js
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const showTrotNotification = async (elapsedTime, distance, speed) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trote en curso',
      body: `Tiempo: ${Math.floor(elapsedTime / 60)}:${elapsedTime % 60 < 10 ? '0' : ''}${elapsedTime % 60}s, Distancia: ${distance.toFixed(2)} km, Velocidad: ${speed.toFixed(2)} km/h`,
      data: { action: 'StopTrot' },
    },
    trigger: null, // Notificación inmediata
  });
};

export const cancelTrotNotification = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const stopTrot = () => {
  console.log('Trote detenido desde notificación');
};