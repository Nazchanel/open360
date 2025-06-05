import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateGroupCode } from '../utils/generateCode';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import QRCodeScanner from './QRCodeScanner';

const CreateJoinGroup = () => {
  const [groupCode, setGroupCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [password, setPassword] = useState('');
  const { user, addGroup } = useAuth();
  const navigate = useNavigate();

  const createGroup = () => {
    const code = generateGroupCode();
    setGroupCode(code);
    setShowQR(true);
  };

  const joinGroup = () => {
    if (!groupCode) return;
    if (password && user) {
      addGroup(groupCode, password);
    }
    navigate(`/group/${groupCode}`);
  };

  const handleScanSuccess = (code: string) => {
    setGroupCode(code);
    setShowScanner(false);
  };

  return (
    <div className="group-container">
      {showScanner ? (
        <QRCodeScanner 
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      ) : (
        <>
          <h2>Groups</h2>
          
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
              {user && (
                <input
                  type="password"
                  placeholder="Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
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