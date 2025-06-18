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
  useColorScheme,
  Animated,
  Easing,
  Dimensions,
  BackHandler,
  PanResponder
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
  icon?: string; // add icon property
}

const MapScreen = () => {
  const route = useRoute<MapScreenRouteProp>();
  const { username, groupName, members } = route.params;
  
  const [location, setLocation] = useState<LatLng>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [zoom, setZoom] = useState(10);
  const [memberLocations, setMemberLocations] = useState<Record<string, MemberLocation>>({});
  const watchId = useRef<number | null>(null);
  const colorScheme = useColorScheme();
  const [panelOpen, setPanelOpen] = useState(true);
  const panelAnim = useRef(new Animated.Value(0)).current; // 0=open, -200=closed
  const settingsPanelWidth = 220;
  const screenWidth = Dimensions.get('window').width;
  const settingsClosedX = settingsPanelWidth;
  const settingsOpenX = 0;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsAnim = useRef(new Animated.Value(settingsClosedX)).current;
  const [myEmoji, setMyEmoji] = useState('📍');
  const emojiOptions = ['😀','😎','🦄','🚀','🐱','🐶','🍕','🌟','🎸','🏀','🚗','🎮','🎲','🎯','🎹','📚','🧩','🍔','🍦','🏝️','🧑‍💻','🦊','🐼','🐸','🐵','🦁','🐯','🐨','🐻','🐷','🐸','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'];

  const panelPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes to the left
        return Math.abs(gestureState.dx) > 20 && gestureState.dx < 0;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -40) {
          setPanelOpen(false);
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.timing(panelAnim, {
      toValue: panelOpen ? 0 : -200,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [panelOpen]);

  useEffect(() => {
    Animated.timing(settingsAnim, {
      toValue: settingsOpen ? settingsOpenX : settingsClosedX,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onBack = () => {
      setSettingsOpen(false);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [settingsOpen]);

  useEffect(() => {
    const fetchMyEmoji = async () => {
      const doc = await firestore().collection('groups').doc(groupName).get();
      const icons = (doc.get('icons') || {}) as Record<string, string>;
      if (icons && typeof icons === 'object' && icons[username]) setMyEmoji(icons[username]);
    };
    fetchMyEmoji();
  }, [groupName, username]);

  const saveMyEmoji = async (emoji: string) => {
    await firestore().collection('groups').doc(groupName).set({
      icons: { [username]: emoji }
    }, { merge: true });
    setMyEmoji(emoji);
  };

  const isEmojiUnique = (emoji: string) => {
    const groupIcons = Object.values(memberLocations).map((m: MemberLocation) => m.icon).filter(Boolean);
    if (emoji === '📍') return true;
    return !groupIcons.includes(emoji);
  };

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
        icon: myEmoji || '📍',
        iconColor: myEmoji === '📍' ? 'red' : undefined,
        iconSize: [32, 32],
        size: [32, 32],
        title: `${username} (You)`
      });
    }
    
    // Add markers for other members (red)
    members.forEach(member => {
      if (member !== username && memberLocations[member]?.geopoint) {
        const coords = memberLocations[member].geopoint;
        const icon = memberLocations[member]?.icon || '📍';
        markers.push({
          id: member,
          position: { lat: coords.latitude, lng: coords.longitude },
          icon,
          iconColor: icon === '📍' ? 'red' : undefined,
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
      const iconsRaw = doc.get('icons');
      const icons: Record<string, string> = (iconsRaw && typeof iconsRaw === 'object' && !Array.isArray(iconsRaw)) ? iconsRaw as Record<string, string> : {};
      if (locations && typeof locations === 'object' && !Array.isArray(locations)) {
        const locs: Record<string, any> = locations as Record<string, any>;
        const result: Record<string, MemberLocation> = {};
        Object.keys(locs).forEach(member => {
          result[member] = { ...locs[member], icon: icons[member] };
        });
        return result;
      } else {
        return {};
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      return {};
    }
  };
  
  if (!location || location.lat === 0 || location.lng === 0) {
    // Only show loading if device location is not available
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // Don't block UI for member locations, render map as soon as device location is ready

  return (
    <View style={{ flex: 1 }}>
      <LeafletView 
        mapCenterPosition={mapCenter || location} // fallback to device location if mapCenter is null
        mapMarkers={getMapMarkers()} 
        zoom={zoom} 
        zoomControl={false}
      />
      {/* Hamburger button only when panel is closed */}
      {!panelOpen && (
        <TouchableOpacity
          style={{ position: 'absolute', top: 55, left: 10, zIndex: 20, backgroundColor: colorScheme === 'dark' ? '#222' : '#fff', borderRadius: 20, padding: 8, elevation: 4 }}
          onPress={() => setPanelOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 22, color: colorScheme === 'dark' ? '#fff' : '#333' }}>☰</Text>
        </TouchableOpacity>
      )}
      <Animated.View
        style={[styles.membersPanel, colorScheme === 'dark' && { backgroundColor: '#000' }, { transform: [{ translateX: panelAnim }] }]}
        {...panelPanResponder.panHandlers}
      > 
        {/* Close button inside panel when open */}
        {panelOpen && (
          <TouchableOpacity
            style={{ position: 'absolute', top: 4, right: 4, zIndex: 21, backgroundColor: colorScheme === 'dark' ? '#222' : '#fff', borderRadius: 16, padding: 8, elevation: 2 }}
            onPress={() => setPanelOpen(false)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 20, color: colorScheme === 'dark' ? '#fff' : '#333', textAlign: 'center' }}>×</Text>
          </TouchableOpacity>
        )}
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingVertical: 24 }} // add top padding for close button
        >
          {members.map((member, index) => {
            const memberLoc = memberLocations[member];
            const coords = memberLoc?.geopoint;
            let time = memberLoc?.timestamp?.toDate?.();
            // If this is the current user and no timestamp, use device time
            if (member === username && (!time || !(time instanceof Date) || isNaN(time.getTime()))) {
              time = new Date();
            }
            const handleMemberPress = () => {
              if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
                setMapCenter({ lat: coords.latitude, lng: coords.longitude });
                setZoom(18);
              }
            };
            return (
              <TouchableOpacity key={index} style={[styles.memberButton, colorScheme === 'dark' && { backgroundColor: '#222' }]} onPress={handleMemberPress}>
                <Text style={[styles.pinEmoji, member === username ? styles.bluePin : styles.redPin, colorScheme === 'dark' && { color: '#fff' }]}>{memberLoc?.icon || '📍'}</Text>
                <View>
                  <Text style={[styles.memberText, colorScheme === 'dark' && { color: '#fff' }]}> {member === username ? `${member} (You)` : member} </Text>
                  {coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number' ? (
                    <Text style={[styles.coordText, colorScheme === 'dark' && { color: '#ccc' }]}> ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}) </Text>
                  ) : (
                    <Text style={[styles.coordText, colorScheme === 'dark' && { color: '#ccc' }]}>Location unknown</Text>
                  )}
                  {time instanceof Date && !isNaN(time.getTime()) ? (
                    <Text style={[styles.timeText, colorScheme === 'dark' && { color: '#aaa' }]}> 
                      {time.toLocaleDateString()} {time.toLocaleTimeString()}
                    </Text>
                  ) : (
                    <Text style={[styles.timeText, colorScheme === 'dark' && { color: '#aaa' }]}>No update time</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
        <Text style={styles.buttonText}>Current Location</Text>
      </TouchableOpacity>

      <View style={{ position: 'absolute', top: 55, right: 10, zIndex: 30 }}>
        <TouchableOpacity
          style={{ backgroundColor: colorScheme === 'dark' ? '#222' : '#fff', borderRadius: 20, padding: 8, elevation: 4 }}
          onPress={() => setSettingsOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 22, color: colorScheme === 'dark' ? '#fff' : '#333' }}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: settingsPanelWidth,
          height: '100%',
          backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
          zIndex: 40,
          padding: 18,
          transform: [{ translateX: settingsAnim }],
          overflow: 'hidden',
          borderLeftWidth: settingsOpen ? 1 : 0,
          borderLeftColor: colorScheme === 'dark' ? '#222' : '#eee',
        }}
        pointerEvents={settingsOpen ? 'auto' : 'none'}
      >
        {settingsOpen && (
          <>
            <TouchableOpacity style={{ position: 'absolute', top: 4, right: 4, zIndex: 41, padding: 16, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.08)' }} onPress={() => setSettingsOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 28, color: colorScheme === 'dark' ? '#fff' : '#333', textAlign: 'center' }}>×</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colorScheme === 'dark' ? '#fff' : '#222' }}>Choose your icon</Text>
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {emojiOptions.map((emoji, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{ padding: 6, margin: 4, borderRadius: 8, backgroundColor: myEmoji === emoji ? '#007AFF' : (colorScheme === 'dark' ? '#222' : '#eee'), opacity: isEmojiUnique(emoji) || emoji === '📍' ? 1 : 0.3 }}
                  disabled={!(isEmojiUnique(emoji) || emoji === '📍')}
                  onPress={async () => { await saveMyEmoji(emoji); setSettingsOpen(false); }}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ marginTop: 10, color: colorScheme === 'dark' ? '#aaa' : '#555', fontSize: 13 }}>Red pin 📍 is the default and can be used by anyone.</Text>
          </>
        )}
      </Animated.View>
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