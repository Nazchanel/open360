import React, { useEffect, useState, useRef } from 'react';
import {
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { LeafletView } from 'react-native-leaflet-view';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import firestore from '@react-native-firebase/firestore';

type LatLng = { lat: number; lng: number };
type MapScreenRouteProp = RouteProp<RootStackParamList, 'Map'>;

interface MemberLocation {
  geopoint?: { latitude: number; longitude: number };
  timestamp?: { toDate: () => Date };
}

const MapScreen = () => {
  const route = useRoute<MapScreenRouteProp>();
  const { username, groupName, members } = route.params;

  const [location, setLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [zoom, setZoom] = useState(10);
  const [memberLocations, setMemberLocations] = useState<Record<string, MemberLocation>>({});
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

  const getGroupLocations = async (group: string): Promise<Record<string, MemberLocation>> => {
    try {
      const doc = await firestore().collection('groups').doc(group).get();
      const locations = doc.get('locations');
      if (locations && typeof locations === 'object' && !Array.isArray(locations)) {
        return locations as Record<string, MemberLocation>;
      } else {
        return {};
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      return {};
    }
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
        { enableHighAccuracy: true, distanceFilter: 0, interval: 5000, fastestInterval: 5000 }
      );
    };

    requestLocationPermission();

    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadLocations = async () => {
      const locs = await getGroupLocations(groupName);
      setMemberLocations(locs);
    };
    loadLocations();
  }, [groupName]);

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

      {/* Floating group name header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{groupName}</Text>
      </View>

      {/* Members panel with coordinates and time */}
      <View style={styles.membersPanel}>
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          {members.map((member, index) => {
            const memberLoc = memberLocations[member];
            const coords = memberLoc?.geopoint;
            const time = memberLoc?.timestamp?.toDate?.();

            return (
              <TouchableOpacity key={index} style={styles.memberButton}>
                <Text style={styles.pinEmoji}>📍</Text>
                <View>
                  <Text style={styles.memberText}>{member}</Text>
                  {coords ? (
                    <Text style={styles.coordText}>
                      ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                    </Text>
                  ) : (
                    <Text style={styles.coordText}>Location unknown</Text>
                  )}
                  {time ? (
                    <Text style={styles.timeText}>{time.toLocaleTimeString()}</Text>
                  ) : (
                    <Text style={styles.timeText}>No update time</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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

  headerContainer: {
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  headerText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  membersPanel: {
    position: 'absolute',
    top: 50,
    left: 10,
    width: 180,
    maxHeight: 400,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  memberButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  pinEmoji: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 4,
  },
  memberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  coordText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
});

export default MapScreen;
