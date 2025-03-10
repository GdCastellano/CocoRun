import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';

export default function RecordsScreen({ navigation }) {
  const [trots, setTrots] = useState([]);

  useEffect(() => {
    loadTrots();
  }, []);

  const loadTrots = async () => {
    try {
      const existingTrots = await AsyncStorage.getItem('trots');
      const trots = existingTrots ? JSON.parse(existingTrots) : [];
      setTrots(trots);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTrot = async (id) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedTrots = trots.filter((trot) => trot.id !== id);
            setTrots(updatedTrots);
            await AsyncStorage.setItem('trots', JSON.stringify(updatedTrots));
          },
        },
      ]
    );
  };

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

  const renderRightActions = (progress, dragX, id) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => deleteTrot(id)}
    >
      <Ionicons name="trash" size={30} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {trots.length === 0 ? (
        <Text style={styles.noRecordsText}>No hay actividad física registrada</Text>
      ) : (
        <>
          <Text style={styles.title}>Trotes</Text>
          <FlatList
            data={trots}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}>
                <TouchableOpacity onPress={() => navigation.navigate('Detail', { trot: item })}>
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Trote #{index + 1}</Text>
                    <Text style={styles.cardText}>Fecha: {item.date}</Text>
                    <Text style={styles.cardText}>Tiempo: {formatTime(item.time)}</Text>
                    <Text style={styles.cardText}>Distancia: {item.distance.toFixed(2)} km</Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center', // Center vertically
  },
  noRecordsText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 20,
    marginTop: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '90%',
    borderRadius: 10,
    marginLeft: 10,
  },
});

