import React, { useEffect, useState, useRef } from 'react';
import {
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView
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
  
  const [location, setLocation] = useState<LatLng>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [zoom, setZoom] = useState(10);
  const [memberLocations, setMemberLocations] = useState<Record<string, MemberLocation>>({});
  const watchId = useRef<number | null>(null);
  
  // Function to slightly adjust positions that are too close
  const adjustClosePositions = (markers: any[]) => {
    const adjustedMarkers = [...markers];
    const MIN_DISTANCE = 0.0002; // Minimum distance between markers in degrees
    
    for (let i = 0; i < adjustedMarkers.length; i++) {
      for (let j = i + 1; j < adjustedMarkers.length; j++) {
        const m1 = adjustedMarkers[i];
        const m2 = adjustedMarkers[j];
        
        if (Math.abs(m1.position.lat - m2.position.lat) < MIN_DISTANCE && 
        Math.abs(m1.position.lng - m2.position.lng) < MIN_DISTANCE) {
          // Add small offsets to make them distinct
          adjustedMarkers[j].position = {
            lat: m2.position.lat + (MIN_DISTANCE * 0.7),
            lng: m2.position.lng + (MIN_DISTANCE * 0.7)
          };
        }
      }
    }
    
    return adjustedMarkers;
  };
  
  const getMapMarkers = () => {
    const markers = [];
    
    // Add current user's marker (blue)
    if (location.lat !== 0 && location.lng !== 0) {
      markers.push({
        id: 'currentLocation',
        position: location,
        icon: '📍',
        iconColor: 'blue',
        iconSize: [32, 32],
        size: [32, 32],
        title: `${username} (You)`
      });
    }
    
    // Add markers for other members (red)
    members.forEach(member => {
      if (member !== username && memberLocations[member]?.geopoint) {
        const coords = memberLocations[member].geopoint;
        markers.push({
          id: member,
          position: { lat: coords.latitude, lng: coords.longitude },
          icon: '📍',
          iconColor: 'red',
          iconSize: [32, 32],
          size: [32, 32],
          title: member
        });
      }
    });
    
    return adjustClosePositions(markers);
  };
  
  const hasMovedSignificantly = (loc1: LatLng | null, loc2: LatLng, threshold = 0.0001) => {
    if (!loc1) return true;
    const latDiff = Math.abs(loc1.lat - loc2.lat);
    const lngDiff = Math.abs(loc1.lng - loc2.lng);
    return latDiff > threshold || lngDiff > threshold;
  };
  
  const saveLocationToFirestore = async (lat: number, lng: number) => {
    try {
      const geopoint = new firestore.GeoPoint(lat, lng);
      await firestore()
      .collection('groups')
      .doc(groupName)
      .set(
        {
          locations: {
            [username]: {
              geopoint: geopoint,
              timestamp: firestore.FieldValue.serverTimestamp(),
            },
          },
        },
        { merge: true }
      );
      console.log('Location saved to Firestore');
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };
  
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
        saveLocationToFirestore(loc.lat, loc.lng);
      },
      error => {
        console.warn('High accuracy location failed:', error);
        
        Geolocation.getCurrentPosition(
          retryPos => {
            const loc = {
              lat: retryPos.coords.latitude,
              lng: retryPos.coords.longitude,
            };
            setLocation(loc);
            setMapCenter(loc);
            setZoom(18);
            saveLocationToFirestore(loc.lat, loc.lng);
          },
          retryError => {
            console.warn('Second high accuracy attempt failed, falling back:', retryError);
            
            Geolocation.getCurrentPosition(
              fallbackPos => {
                const fallbackLoc = {
                  lat: fallbackPos.coords.latitude,
                  lng: fallbackPos.coords.longitude,
                };
                setLocation(fallbackLoc);
                setMapCenter(fallbackLoc);
                setZoom(16);
              },
              fallbackError => {
                console.error('Fallback location also failed:', fallbackError);
              },
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            );
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
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
      
      watchId.current = Geolocation.watchPosition(
        position => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          saveLocationToFirestore(loc.lat, loc.lng);
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
    const fetchLocations = async () => {
      const locations = await getGroupLocations(groupName);
      setMemberLocations(locations);
    };
    
    fetchLocations();
    const intervalId = setInterval(fetchLocations, 3000);
    
    return () => clearInterval(intervalId);
  }, [groupName]);
  
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
  
  if (!location || !mapCenter) {
    return (
      <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
    <LeafletView 
    mapCenterPosition={mapCenter} 
    mapMarkers={getMapMarkers()} 
    zoom={zoom} 
    />
    
    <View style={styles.headerContainer}>
    <Text style={styles.headerText}>{groupName}</Text>
    </View>
    
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
      
      const handleMemberPress = () => {
        if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
          setMapCenter({ lat: coords.latitude, lng: coords.longitude });
          setZoom(18);
        }
      };
      
      return (
        <TouchableOpacity key={index} style={styles.memberButton} onPress={handleMemberPress}>
        <Text style={[styles.pinEmoji, member === username ? styles.bluePin : styles.redPin]}>📍</Text>
        <View>
        <Text style={styles.memberText}>
        {member === username ? `${member} (You)` : member}
        </Text>
        
        {coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number' ? (
          <Text style={styles.coordText}>
          ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
          </Text>
        ) : (
          <Text style={styles.coordText}>Location unknown</Text>
        )}
        
        {time instanceof Date && !isNaN(time.getTime()) ? (
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
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
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
  buttonText: { 
    color: 'white', 
    fontWeight: '600', 
    fontSize: 14 
  },
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
  bluePin: {
    color: 'blue',
  },
  redPin: {
    color: 'red',
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