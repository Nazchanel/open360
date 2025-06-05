import { useEffect, useState, useCallback } from 'react';
import { GroupData, GroupMember } from '../types/types';
import Peer, { DataConnection } from 'peerjs';

export const usePeerConnection = (groupId: string, userName: string) => {
    const [peer, setPeer] = useState<Peer | null>(null);
    const [connections, setConnections] = useState<DataConnection[]>([]);
    const [groupData, setGroupData] = useState<GroupData>({
        groupId,
        members: {},
    });
    const [myId, setMyId] = useState<string>('');
    
    const updateLocation = useCallback((location: [number, number]) => {
        if (!peer) return;
        
        const myMemberData: GroupMember = {
            id: myId,
            name: userName,
            location,
            lastUpdated: Date.now(),
        };
        
        setGroupData((prev) => ({
            ...prev,
            members: {
                ...prev.members,
                [myId]: myMemberData,
            },
        }));
        
        connections.forEach((conn) => {
            conn.send({
                type: 'member-update',
                member: myMemberData,
            });
        });
    }, [peer, myId, userName, connections]);
    
    useEffect(() => {
        if (!groupId) return;
        
        const newPeer = new Peer(`${groupId}-${Math.random().toString(36).substr(2, 9)}`);
        
        newPeer.on('open', (id) => {
            setMyId(id);
            console.log('My peer ID is: ', id);
        });
        
        newPeer.on('connection', (conn) => {
            conn.on('open', () => {
                setConnections((prev) => [...prev, conn]);
                
                // Send current group data to new connection
                conn.send({
                    type: 'group-data',
                    data: groupData,
                });
            });
            
            conn.on('data', (data: any) => {
                if (data.type === 'group-data') {
                    setGroupData(data.data);
                } else if (data.type === 'member-update') {
                    setGroupData((prev) => ({
                        ...prev,
                        members: {
                            ...prev.members,
                            [data.member.id]: data.member,
                        },
                    }));
                }
            });
            
            conn.on('close', () => {
                setConnections((prev) => prev.filter((c) => c !== conn));
            });
        });
        
        setPeer(newPeer);
        
        return () => {
            newPeer.destroy();
        };
    }, [groupId]);
    
    const connectToPeer = useCallback((peerId: string) => {
        if (!peer) return;
        
        const conn = peer.connect(peerId);
        conn.on('open', () => {
            setConnections((prev) => [...prev, conn]);
            
            conn.send({
                type: 'group-data',
                data: groupData,
            });
        });
        
        conn.on('data', (data: any) => {
            if (data.type === 'group-data') {
                setGroupData(data.data);
            } else if (data.type === 'member-update') {
                setGroupData((prev) => ({
                    ...prev,
                    members: {
                        ...prev.members,
                        [data.member.id]: data.member,
                    },
                }));
            }
        });
        
        conn.on('close', () => {
            setConnections((prev) => prev.filter((c) => c !== conn));
        });
    }, [peer, groupData]);
    
    return { peer, connections, groupData, updateLocation, connectToPeer };
};
