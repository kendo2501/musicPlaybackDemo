import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Audio } from 'expo-av';

interface DeviceItem {
  id: string;
  name: string;
  artists: string;
  image: string;
  audio_file: string;
}

function Devices() {
  const [items, setItems] = useState<DeviceItem[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUri, setCurrentUri] = useState<string | null>(null);

  // Hàm phát nhạc
  async function playSound(uri: string) {
    if (!uri) {
      Alert.alert("Error", "Audio file is not available.");
      return;
    }

    console.log("Audio URI:", uri);

    // Dừng âm thanh trước đó nếu đang phát
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setCurrentUri(uri);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentUri(null);
            newSound.unloadAsync();
          }
        } else if ('error' in status) {
          console.error(`Playback error: ${status.error}`);
          Alert.alert("Error", "Failed to play audio. Please try again.");
        }
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load audio file. Please check the file URL.");
    }
  }

  async function pauseSound() {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }

  const handlePlayPause = (item: DeviceItem) => {
    if (isPlaying && currentUri === item.audio_file) {
      pauseSound();
    } else {
      playSound(item.audio_file);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://10.106.18.79:3000/all');
        const sortedItems = response.data.sort((a: DeviceItem, b: DeviceItem) => Number(b.id) - Number(a.id));
        setItems(sortedItems);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch items. Please try again later.");
      }
    };

    fetchData();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.music}
          onPress={() => handlePlayPause(item)}
        >
          <View>
            <Text style={styles.playButton}>
              {isPlaying && currentUri === item.audio_file ? "Pause" : "Play"}
            </Text>
          </View>
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
          </View>
          <View style={styles.name}>
            <Text style={styles.songTitle}>{item.name}</Text>
            <Text style={styles.artistName}>{item.artists}</Text>
            <Text style={{ color: 'white' }}>{item.audio_file}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#000', paddingVertical: 10 },
  music: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, padding: 10, marginVertical: 5 },
  card: { marginRight: 10 },
  image: { width: 50, height: 50, borderRadius: 4 },
  name: { justifyContent: 'center', flex: 1 },
  songTitle: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
  artistName: { fontSize: 14, color: '#FFFFFF' },
  playButton: { fontSize: 16, color: 'white', marginRight: 10 }
});

export default Devices;
