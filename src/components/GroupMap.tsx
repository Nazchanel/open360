import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGroups } from '../hooks/useGroups';

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
  const { members, updateLocation, loading, joinGroup } = useGroups(groupId);

  useEffect(() => {
    if (!user?.id) return;

    // Join group on mount
    const join = async () => {
      await joinGroup(user.id, user.username);
    };
    join();
  }, [groupId, user]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setPosition(newPos);
        updateLocation(newPos);
        setLocationError(null);
      },
      (err) => {
        setLocationError('Location access denied');
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [updateLocation]);

  if (loading) return <div>Loading group data...</div>;

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
          {members.map((member) => (
            <div key={member.id} className="member-item">
              <div className={`member-icon ${member.id === user?.id ? 'you' : ''}`}>
                {member.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <span>{member.name}{member.id === user?.id ? ' (You)' : ''}</span>
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

        {members.filter(m => m.id !== user?.id).map((member) => (
          <Marker
            key={member.id}
            position={member.position}
            icon={createCustomIcon(member.name?.charAt(0) || '?')}
          >
            <Popup>
              <div>
                <strong>{member.name}</strong>
                <div>Last updated: {new Date(member.lastUpdated).toLocaleTimeString()}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default GroupMap;
