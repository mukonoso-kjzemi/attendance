import { db } from './config';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import type { Member, MemberStatus, Grade } from '../utils/types';
import { COLLECTIONS } from '../constants';

const MEMBERS_COLLECTION = COLLECTIONS.MEMBERS;

// メンバーのドキュメント参照を取得
export const getMemberRef = (memberId: string) => {
  return doc(db, MEMBERS_COLLECTION, memberId);
};

// メンバー情報を取得
export const getMember = async (memberId: string): Promise<Member | null> => {
  try {
    const memberRef = getMemberRef(memberId);
    const memberDoc = await getDoc(memberRef);

    if (!memberDoc.exists()) {
      return null;
    }

    const data = memberDoc.data();
    return {
      id: memberDoc.id,
      name: data.name,
      grade: data.grade || 'H3', // gradeがない場合のフォールバック
      status: data.status,
      lastStatusChange: data.lastStatusChange ? data.lastStatusChange.toDate() : new Date()
    };
  } catch (error) {
    console.error('Failed to get member:', error);
    throw new Error('メンバー情報の取得に失敗しました。');
  }
};

// メンバー一覧を取得
export const getMembers = async (): Promise<Member[]> => {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const q = query(membersRef);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return !data.deleted; // deletedがtrueでないものを含める
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastStatusChange: doc.data().lastStatusChange?.toDate()
      })) as Member[];
  } catch (error) {
    console.error('Failed to fetch members:', error);
    throw new Error('メンバー一覧の取得に失敗しました。再度お試しください。');
  }
};

// メンバー状態変更リスナーを設定
export const onMembersChange = (callback: (members: Member[]) => void) => {
  try {
    const membersCollection = collection(db, MEMBERS_COLLECTION);
    const q = query(membersCollection);
    
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          return !data.deleted; // deletedがtrueでないものを含める
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            grade: data.grade || 'H3', // gradeがない場合のフォールバック
            status: data.status,
            lastStatusChange: data.lastStatusChange ? data.lastStatusChange.toDate() : new Date(),
            sortValue: data.sortValue
          };
        });
      
      // コールバック関数が存在する場合のみ呼び出す
      if (typeof callback === 'function') {
        callback(members);
      }
    }, (error) => {
      console.error('Realtime listener error:', error);
    });
  } catch (error) {
    console.error('Failed to setup members listener:', error);
    // エラー時にも空の配列でコールバックを呼び出す
    if (typeof callback === 'function') {
      callback([]);
    }
    // ダミーのアンサブスクライブ関数を返す
    return () => {};
  }
};

// メンバー情報を追加
export const addMember = async (
  name: string, 
  grade: Grade,
  sortValue?: number
): Promise<string> => {
  try {
    const membersCollection = collection(db, MEMBERS_COLLECTION);
    const newMemberRef = doc(membersCollection);
    
    const memberData: any = {
      name,
      grade,
      status: 'out' as MemberStatus,
      lastStatusChange: serverTimestamp(),
      deleted: false
    };

    // sortValueが指定された場合のみ追加
    if (sortValue !== undefined) {
      memberData.sortValue = sortValue;
    }
    
    await setDoc(newMemberRef, memberData);

    return newMemberRef.id;
  } catch (error) {
    console.error('Failed to add member:', error);
    throw new Error('メンバーの追加に失敗しました。再度お試しください。');
  }
};

// メンバー情報を更新
export const updateMember = async (
  memberId: string, 
  name: string, 
  grade: Grade,
  sortValue?: number
): Promise<void> => {
  try {
    const memberRef = getMemberRef(memberId);
    const updateData: any = { name, grade };
    
    // sortValueが指定された場合のみ更新
    if (sortValue !== undefined) {
      updateData.sortValue = sortValue;
    }
    
    await updateDoc(memberRef, updateData);
  } catch (error) {
    console.error('Failed to update member:', error);
    throw new Error('メンバー情報の更新に失敗しました。再度お試しください。');
  }
};

// メンバー状態を更新
export const updateMemberStatus = async (memberId: string, status: MemberStatus): Promise<void> => {
  try {
    console.log(`Updating member status: ${memberId} to ${status}`);
    const memberRef = getMemberRef(memberId);
    await updateDoc(memberRef, { 
      status, 
      lastStatusChange: serverTimestamp() 
    });
    console.log(`Status updated successfully: ${status}`);
  } catch (error) {
    console.error('Failed to update member status:', error);
    throw new Error('メンバーの状態更新に失敗しました。再度お試しください。');
  }
};

// メンバー情報を削除
export const deleteMember = async (memberId: string): Promise<void> => {
  try {
    const memberRef = getMemberRef(memberId);
    await updateDoc(memberRef, {
      deleted: true
    });
  } catch (error) {
    console.error('Failed to delete member:', error);
    throw new Error('メンバーの削除に失敗しました。再度お試しください。');
  }
};

// 現在入室中のメンバー数を取得
export const getInRoomCount = async (): Promise<number> => {
  try {
    const membersCollection = collection(db, MEMBERS_COLLECTION);
    const q = query(membersCollection, where("status", "==", "in"));
    const snapshot = await getDocs(q);
    
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get in-room count:', error);
    return 0; // エラー時は0を返す
  }
};
