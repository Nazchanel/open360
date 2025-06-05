import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface CreateGroupProps {
  onCreate: (groupId: string, userName: string) => void;
}

const CreateGroup: React.FC<CreateGroupProps> = ({ onCreate }) => {
  const [userName, setUserName] = useState('');
  const [groupId] = useState(uuidv4().substr(0, 8));
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onCreate(groupId, userName);
      navigate(`/group/${groupId}`);
    }
  };

  return (
    <div className="container">
      <h2>Create Group</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Group Code:</label>
          <input type="text" value={groupId} readOnly />
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
        <button type="submit">Create Group</button>
      </form>
    </div>
  );
};

export default CreateGroup;
