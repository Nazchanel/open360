import { useState, useEffect, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';

interface PeerData {
  id: string;
  username: string;
  position: [number, number];
}

export const usePeerConnection = (groupId: string, username: string) => {
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);

  const sendLocation = useCallback((position: [number, number]) => {
    if (!peerInstance) return;
    
    const data = {
      type: 'location',
      id: peerInstance.id,
      username,
      position
    };

    connections.forEach(conn => {
      conn.send(data);
    });
  }, [peerInstance, connections, username]);

  useEffect(() => {
    if (!groupId) return;

    const peer = new Peer(`${groupId}-${Math.random().toString(36).substr(2, 8)}`);
    
    peer.on('connection', (conn) => {
      conn.on('data', (data: any) => {
        if (data.type === 'location') {
          setPeers(prev => {
            const existing = prev.find(p => p.id === data.id);
            if (existing) {
              return prev.map(p => 
                p.id === data.id ? { ...p, position: data.position } : p
              );
            }
            return [...prev, {
              id: data.id,
              username: data.username,
              position: data.position
            }];
          });
        }
      });

      conn.on('open', () => {
        setConnections(prev => [...prev, conn]);
        // Send initial location if available
        if (peers.some(p => p.id === peer.id)) {
          const me = peers.find(p => p.id === peer.id);
          if (me) {
            conn.send({
              type: 'location',
              id: me.id,
              username: me.username,
              position: me.position
            });
          }
        }
      });

      conn.on('close', () => {
        setConnections(prev => prev.filter(c => c !== conn));
        setPeers(prev => prev.filter(p => p.id !== conn.peer));
      });
    });

    setPeerInstance(peer);

    return () => {
      peer.destroy();
    };
  }, [groupId]);

  return { peers, sendLocation };
};
