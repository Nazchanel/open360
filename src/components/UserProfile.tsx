import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [showRecovery, setShowRecovery] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      
      <div className="profile-info">
        <div className="profile-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-details">
          <h3>{user.username}</h3>
          <p>Member of {user.groups.length} groups</p>
        </div>
      </div>

      <div className="recovery-phrase">
        <button 
          onClick={() => setShowRecovery(!showRecovery)}
          className="secondary-button"
        >
          {showRecovery ? 'Hide Recovery Phrase' : 'Show Recovery Phrase'}
        </button>
        
        {showRecovery && (
          <div className="recovery-phrase-display">
            <p>Save this phrase to recover your account:</p>
            <code>{user.recoveryPhrase}</code>
            <p className="warning">Never share this phrase with anyone!</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          logout();
          navigate('/');
        }}
        className="primary-button logout-button"
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfile;