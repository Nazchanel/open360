import React from 'react';
import { useParams } from 'react-router-dom';
import { usePeerConnection } from '../hooks/usePeerConnection';
import GroupMap from './GroupMap';

interface PeerConnectionProps {
  userName: string;
}

const PeerConnection: React.FC<PeerConnectionProps> = ({ userName }) => {
  const { groupId } = useParams<{ groupId: string }>();
  const { groupData, updateLocation } = usePeerConnection(groupId || '', userName);

  return (
    <div style={{ height: '100vh' }}>
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
        <h3>Group: {groupId}</h3>
        <p>Members:</p>
        <ul>
          {Object.values(groupData.members).map((member) => (
            <li key={member.id}>{member.name}</li>
          ))}
        </ul>
      </div>
      <GroupMap members={groupData.members} onLocationUpdate={updateLocation} />
    </div>
  );
};

export default PeerConnection;