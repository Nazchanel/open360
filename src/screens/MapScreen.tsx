import React, { useEffect, useState, useRef } from 'react';
import {
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { LeafletView } from 'react-native-leaflet-view';

type LatLng = { lat: number; lng: number };

const MapScreen = () => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [zoom, setZoom] = useState(10);
  const watchId = useRef<number | null>(null);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(loc);
        setMapCenter(loc);
        setZoom(18);
      },
      error => {
        console.error('Error getting location:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Location permission denied');
          return;
        }
      }

      getCurrentLocation();

      // Start watching location every 2 seconds (2000 ms)
      watchId.current = Geolocation.watchPosition(
        position => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
        },
        error => {
          console.error('Error watching location:', error);
        },
        { enableHighAccuracy: true, distanceFilter: 0, interval: 2000, fastestInterval: 2000 }
      );
    };

    requestLocationPermission();

    // Clean up the watcher on unmount
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  if (!location || !mapCenter) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentLocationMarker = {
    id: 'currentLocation',
    position: location,
    icon: '📍',
    iconColor: 'blue',
    iconSize: [20, 20],
  };

  return (
    <View style={{ flex: 1 }}>
      <LeafletView mapCenterPosition={mapCenter} mapMarkers={[currentLocationMarker]} zoom={zoom} />
      <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
        <Text style={styles.buttonText}>Zoom to Current Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    elevation: 4,
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 14 },
});

export default MapScreen;
