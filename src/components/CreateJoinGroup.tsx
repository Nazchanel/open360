import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateGroupCode } from '../utils/generateCode';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import QRCodeScanner from './QRCodeScanner';
import { doc, setDoc } from 'firebase/firestore';
import { db, encryptData } from '../firebase/firebaseConfig';

const secretKey = process.env.REACT_APP_GROUP_SECRET_KEY || '';

const CreateJoinGroup = () => {
  const [groupCode, setGroupCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { user, addGroup, logout } = useAuth();
  const navigate = useNavigate();

  const createGroup = async () => {
    if (!user) return;
    
    const code = generateGroupCode();
    const encrypted = encryptData({
      id: code,
      name: `Group ${code}`,
      creatorId: user.id,
      members: [{
        id: user.id,
        name: user.username,
        position: [0, 0],
        lastUpdated: Date.now()
      }]
    }, secretKey);

    await setDoc(doc(db, 'web-groups', code), { encrypted });
    await addGroup(code, user.id);
    setGroupCode(code);
    setShowQR(true);
  };

  const joinGroup = async () => {
    if (!groupCode || !user) return;
    
    try {
      await addGroup(groupCode, user.id);
      navigate(`/group/${groupCode}`);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleScanSuccess = (code: string) => {
    setGroupCode(code);
    setShowScanner(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="group-container">
      <div className="group-header">
        <h2>Welcome, {user?.username}</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      {showScanner ? (
        <QRCodeScanner 
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      ) : (
        <>
          {user?.groups && user.groups.length > 0 && (
            <div className="group-section">
              <h3>Your Groups</h3>
              <div className="groups-list">
                {user.groups.map((groupId) => (
                  <div key={groupId} className="group-item">
                    <span>{groupId}</span>
                    <button 
                      onClick={() => navigate(`/group/${groupId}`)}
                      className="primary-button small"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="group-section">
            <h3>Create New Group</h3>
            <button onClick={createGroup} className="primary-button">
              Create Group
            </button>
            
            {showQR && groupCode && (
              <div className="qr-section">
                <QRCode value={groupCode} size={200} />
                <p>Group Code: {groupCode}</p>
                <button 
                  onClick={() => navigate(`/group/${groupCode}`)}
                  className="primary-button"
                >
                  Join Your Group
                </button>
              </div>
            )}
          </div>

          <div className="group-section">
            <h3>Join Existing Group</h3>
            <button 
              onClick={() => setShowScanner(true)}
              className="secondary-button"
            >
              Scan QR Code
            </button>
            
            <div className="input-group">
              <input
                placeholder="Enter Group Code"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
              />
              <button 
                onClick={joinGroup}
                className="primary-button"
                disabled={!groupCode}
              >
                Join Group
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateJoinGroup;