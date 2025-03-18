// PushNotificationConfig.js
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldHandleNotificationResponse: true, // Permitir acciones
  }),
});

let notificationId = null;

export const showTrotNotification = async (elapsedTime, distance, speed) => {
  if (notificationId) {
    await cancelTrotNotification();
  }
  const notification = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Trote en curso',
      body: `Tiempo: ${Math.floor(elapsedTime / 60)}:${elapsedTime % 60 < 10 ? '0' : ''}${elapsedTime % 60}s, Distancia: ${distance.toFixed(2)} km`,
      data: { action: 'StopTrot' },
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Notificación inmediata y persistente
  });
  notificationId = notification;
  console.log('Notificación mostrada con ID:', notificationId);
};

export const updateTrotNotification = async (elapsedTime, distance, speed) => {
  if (notificationId) {
    await Notifications.updateNotificationAsync(notificationId, {
      content: {
        title: 'Trote en curso',
        body: `Tiempo: ${Math.floor(elapsedTime / 60)}:${elapsedTime % 60 < 10 ? '0' : ''}${elapsedTime % 60}s, Distancia: ${distance.toFixed(2)} km`,
        data: { action: 'StopTrot' },
      },
    });
    console.log('Notificación actualizada con ID:', notificationId);
  }
};

export const cancelTrotNotification = async () => {
  if (notificationId) {
    await Notifications.dismissNotificationAsync(notificationId);
    notificationId = null;
    console.log('Notificación cancelada');
  }
};

// Manejar acción de detener desde la notificación
// Reemplaza la última línea de addNotificationResponseReceivedListener
Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.actionIdentifier === 'StopTrot') {
      triggerStopTrot(); // Llamar a la función global
      console.log('Trote detenido desde notificación');
    }
  });

export const stopTrot = () => {
  // Esta función debe estar disponible globalmente o importada donde se use
  console.log('Lógica de stopTrot desde notificación no implementada aquí, asegúrate de definirla');
  // Para integrarla completamente, necesitarías una referencia al componente o una función global
};