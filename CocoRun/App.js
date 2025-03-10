// filepath: /c:/Users/gabod/Proyectos/CocoRun/CocoRun/App.js
import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef, useNavigationState } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import RecordsScreen from './screens/RecordsScreen';
import DetailScreen from './screens/DetailScreen';
import { Ionicons } from '@expo/vector-icons';
import './backgroundTask'; // Import the background task
import PushNotification from 'react-native-push-notification';

const Stack = createStackNavigator();

const Navbar = ({ navigationRef }) => {
  const state = useNavigationState(state => state);
  const activeIndex = state ? state.index : 0; // Default to 0 if state is undefined
  return (
    <View style={styles.navbar}>
      <TouchableOpacity
        style={[styles.navButton, activeIndex === 0 && styles.activeNavButton]}
        onPress={() => navigationRef.current?.navigate('Home')}
      >
        <Ionicons
          name="home"
          size={30}
          color={activeIndex === 0 ? '#FF6B6B' : '#666'}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.navButton, activeIndex === 1 && styles.activeNavButton]}
        onPress={() => navigationRef.current?.navigate('Records')}
      >
        <Ionicons
          name="list"
          size={30}
          color={activeIndex === 1 ? '#FF6B6B' : '#666'}
        />
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    PushNotification.createChannel(
      {
        channelId: 'trot-channel',
        channelName: 'Trot Channel',
        channelDescription: 'A channel to manage trot notifications',
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`createChannel returned '${created}'`)
    );
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Records" component={RecordsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      <Navbar navigationRef={navigationRef} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    paddingBottom: 30,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeNavButton: {
    backgroundColor: '#F0F0F0',
  },
});