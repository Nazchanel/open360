import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GroupMember } from '../types/types';

interface GroupMapProps {
  members: Record<string, GroupMember>;
  onLocationUpdate: (location: [number, number]) => void;
}

const createCustomIcon = (initial: string) => {
  return L.divIcon({
    html: `<div style="background-color: #4a90e2; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${initial}</div>`,
    className: '',
    iconSize: [30, 30],
  });
};

const GroupMap: React.FC<GroupMapProps> = ({ members, onLocationUpdate }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCurrentLocation(newLocation);
          onLocationUpdate(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [onLocationUpdate]);

  useEffect(() => {
    if (map && currentLocation[0] !== 0 && currentLocation[1] !== 0) {
      map.flyTo(currentLocation, 15);
    }
  }, [currentLocation, map]);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={currentLocation}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        ref={setMap}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Object.values(members).map((member: GroupMember) => (
          <Marker
            key={member.id}
            position={member.location}
            icon={createCustomIcon(member.name.charAt(0).toUpperCase())}
          >
            <Popup>{member.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default GroupMap;