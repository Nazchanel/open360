import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePeerConnection } from '../hooks/usePeerConnection';

interface PeerData {
  id: string;
  username: string;
  position: [number, number];
}

const createCustomIcon = (initial: string, isCurrentUser: boolean = false) => {
  return L.divIcon({
    html: `<div style="
      background-color: ${isCurrentUser ? '#ff5722' : '#4a90e2'}; 
      color: white; 
      border-radius: 50%; 
      width: 32px; 
      height: 32px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
    ">${initial.toUpperCase()}</div>`,
    className: '',
    iconSize: [32, 32],
  });
};

const AutoZoom = ({ location }: { location: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    if (location[0] !== 0 && location[1] !== 0) {
      map.flyTo(location, 15, { duration: 1 });
    }
  }, [location, map]);

  return null;
};

const GroupMap = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { peers, sendLocation } = usePeerConnection(groupId || '', user?.username || 'Anonymous') as {
    peers: PeerData[];
    sendLocation: (position: [number, number]) => void;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        sendLocation(newPos);
        setLocationError(null);
      },
      (err) => {
        setLocationError('Location access denied');
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [sendLocation]);

  return (
    <div className="map-container">
      {locationError && (
        <div className="location-error">
          {locationError}
        </div>
      )}
      
      <div className="group-info">
        <h3>Group: {groupId}</h3>
        <div className="members-list">
          {peers.map(peer => (
            <div key={peer.id} className="member-item">
              <div className={`member-icon ${peer.id === user?.id ? 'you' : ''}`}>
                {peer.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <span>{peer.username}{peer.id === user?.id ? ' (You)' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100vh', width: '100%' }}
      >
        <AutoZoom location={position} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <Marker
          position={position}
          icon={createCustomIcon(user?.username?.charAt(0) || 'Y', true)}
        >
          <Popup>You are here</Popup>
        </Marker>

        {peers.map((peer) => (
          <Marker
            key={peer.id}
            position={peer.position}
            icon={createCustomIcon(peer.username?.charAt(0) || '?')}
          >
            <Popup>
              <div>
                <strong>{peer.username}</strong>
                <div>Last updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default GroupMap;