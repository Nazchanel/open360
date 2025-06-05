import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JoinGroupProps {
  onJoin: (groupId: string, userName: string) => void;
}

const JoinGroup: React.FC<JoinGroupProps> = ({ onJoin }) => {
  const [groupId, setGroupId] = useState('');
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupId.trim() && userName.trim()) {
      onJoin(groupId, userName);
      navigate(`/group/${groupId}`);
    }
  };

  return (
    <div className="container">
      <h2>Join Group</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="groupId">Group Code:</label>
          <input
            type="text"
            id="groupId"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="userName">Your Name:</label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Join Group</button>
      </form>
    </div>
  );
};

export default JoinGroup;
