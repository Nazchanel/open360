import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams, useNavigate } from 'react-router-dom';
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

const AutoZoom = ({ locations }: { locations: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};

const GroupMap = () => {
  const { groupId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { members, updateLocation, loading, joinGroup } = useGroups(groupId);

  useEffect(() => {
    if (!user?.id) return;

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading) return <div className="loading-screen">Loading group data...</div>;

  const allPositions = members
    .filter(member => member.position[0] !== 0 && member.position[1] !== 0)
    .map(member => member.position);

  return (
    <div className="map-container">
      <div className="map-controls">
        <button onClick={() => navigate('/groups')} className="back-button">
          ← Back to Groups
        </button>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      {locationError && (
        <div className="location-error">
          {locationError}
        </div>
      )}
      
      <div className="group-info">
        <h3>Group: {groupId}</h3>
        <div className="members-list">
          <h4>Members ({members.length})</h4>
          {members.map((member) => (
            <div key={member.id} className={`member-item ${member.id === user?.id ? 'you' : ''}`}>
              <div className="member-icon">
                {member.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="member-details">
                <span className="member-name">{member.name}{member.id === user?.id ? ' (You)' : ''}</span>
                <span className="member-status">
                  Last updated: {new Date(member.lastUpdated).toLocaleTimeString()}
                </span>
                {member.position[0] !== 0 && member.position[1] !== 0 && (
                  <span className="member-location">
                    {member.position[0].toFixed(4)}, {member.position[1].toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100vh', width: '100%' }}
      >
        <AutoZoom locations={allPositions.length > 0 ? allPositions : [position]} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {members.map((member) => (
          member.position[0] !== 0 && member.position[1] !== 0 && (
            <Marker
              key={member.id}
              position={member.position}
              icon={createCustomIcon(
                member.name?.charAt(0) || '?', 
                member.id === user?.id
              )}
            >
              <Popup>
                <div>
                  <strong>{member.name}</strong>
                  <div>Last updated: {new Date(member.lastUpdated).toLocaleTimeString()}</div>
                  <div>
                    {member.position[0].toFixed(6)}, {member.position[1].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default GroupMap;