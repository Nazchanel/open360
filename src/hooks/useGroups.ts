import { useState, useEffect } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { auth, db, encryptData, decryptData } from '../firebase/firebaseConfig';

export const useGroups = (groupId?: string) => {
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !auth.currentUser?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const decrypted = decryptData(data.encrypted, auth.currentUser?.uid || '');        
        if (decrypted) {
          setGroup(decrypted);
          setMembers(decrypted.members || []);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const updateLocation = async (position: [number, number]) => {
    if (!groupId || !auth.currentUser?.uid) return;
    
    const userRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(userRef);
    
    if (!groupDoc.exists()) return;
    
    const decrypted = decryptData(groupDoc.data().encrypted, auth.currentUser.uid);
    if (!decrypted) return;
    
    const updatedMembers = decrypted.members.map((member: any) => 
      member.id === auth.currentUser?.uid
        ? { ...member, position, lastUpdated: Date.now() }
        : member
    );

    const encrypted = encryptData({
      ...decrypted,
      members: updatedMembers
    }, auth.currentUser.uid);

    await updateDoc(userRef, { encrypted });
  };

  const joinGroup = async (userId: string, username: string) => {
    if (!groupId) return false;
    
    const userRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(userRef);
    
    if (!groupDoc.exists()) return false;
    
    const decrypted = decryptData(groupDoc.data().encrypted, userId);
    if (!decrypted) return false;
    
    if (decrypted.members.some((m: any) => m.id === userId)) return true;
    
    const updatedMembers = [
      ...decrypted.members,
      {
        id: userId,
        name: username,
        position: [0, 0],
        lastUpdated: Date.now()
      }
    ];

    const encrypted = encryptData({
      ...decrypted,
      members: updatedMembers
    }, userId);

    await updateDoc(userRef, { encrypted });
    return true;
  };

  return { group, members, loading, updateLocation, joinGroup };
};
