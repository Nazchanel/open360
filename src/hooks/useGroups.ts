import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, encryptData, decryptData } from '../firebase/firebaseConfig';

const GROUP_SECRET_KEY = process.env.REACT_APP_GROUP_SECRET_KEY || 'default_secret_key';

export const useGroups = (groupId?: string) => {
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'web-groups', groupId), async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        try {
          const decrypted = decryptData(data.encrypted, GROUP_SECRET_KEY);
          if (decrypted) {
            setGroup(decrypted);
            // Sort members by lastUpdated (newest first)
            const sortedMembers = [...(decrypted.members || [])].sort((a, b) => 
              b.lastUpdated - a.lastUpdated
            );
            setMembers(sortedMembers);
          }
        } catch (error) {
          console.error('Decryption error:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const updateLocation = async (position: [number, number]) => {
    if (!groupId || !auth.currentUser?.uid) return;
    
    const userRef = doc(db, 'web-groups', groupId);
    const groupDoc = await getDoc(userRef);
    
    if (!groupDoc.exists()) return;
    
    try {
      const decrypted = decryptData(groupDoc.data().encrypted, GROUP_SECRET_KEY);

      if (!decrypted) return;
      
      const existingMemberIndex = decrypted.members.findIndex(
        (member: any) => member.id === auth.currentUser?.uid
      );

      const updatedMembers = [...decrypted.members];
      const now = Date.now();

      if (existingMemberIndex >= 0) {
        updatedMembers[existingMemberIndex] = {
          ...updatedMembers[existingMemberIndex],
          position,
          lastUpdated: now
        };
      } else {
        updatedMembers.push({
          id: auth.currentUser.uid,
          name: auth.currentUser.displayName || 'Anonymous',
          position,
          lastUpdated: now
        });
      }

      const encrypted = encryptData({
        ...decrypted,
        members: updatedMembers
      }, GROUP_SECRET_KEY);

      await updateDoc(userRef, { 
        encrypted,
        lastUpdated: serverTimestamp() 
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const joinGroup = async (userId: string, username: string) => {
    if (!groupId) return false;
    
    const userRef = doc(db, 'web-groups', groupId);
    const groupDoc = await getDoc(userRef);
    
    if (!groupDoc.exists()) return false;
    
    try {
      const decrypted = decryptData(groupDoc.data().encrypted, GROUP_SECRET_KEY);
      if (!decrypted) return false;
      
      if (decrypted.members.some((m: any) => m.id === userId)) return true;
      
      const updatedMembers = [
        ...decrypted.members,
        {
          id: userId,
          name: username,
          position: [0, 0], // Default position
          lastUpdated: Date.now()
        }
      ];

      const encrypted = encryptData({
        ...decrypted,
        members: updatedMembers
      }, GROUP_SECRET_KEY);

      await updateDoc(userRef, { 
        encrypted,
        lastUpdated: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error joining group:', error);
      return false;
    }
  };

  return { group, members, loading, updateLocation, joinGroup };
};