import { db } from './config';
import { 
  collection, doc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, Timestamp,
  collectionGroup
} from 'firebase/firestore';
import type { Record, RecordType } from '../utils/types';

// 常に 'history' という名前のコレクションを使用するように修正
const getRecordsCollection = (memberId: string) => {
  return collection(db, 'records', memberId, 'history');
};

// 最後の'in'記録を取得（collectionGroupの対象を'history'に修正）
const getLastInRecord = async (memberId: string): Promise<Record | null> => {
  // 'history' という名前の全てのコレクションを横断して検索
  const recordsGroup = collectionGroup(db, 'history');

  const q = query(
    recordsGroup,
    where('memberId', '==', memberId),
    where('type', '==', 'in'),
    where('deleted', '==', false),
    orderBy('timestamp', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    memberId: data.memberId,
    type: data.type,
    timestamp: data.timestamp.toDate()
  };
};

// 記録を追加（ロジックはほぼ同じだが、新しい構造で動作）
export const addRecord = async (memberId: string, type: RecordType, timestamp: Date = new Date()): Promise<string> => {
  try {
    const recordsCollection = getRecordsCollection(memberId);
    
    const record: any = {
      type,
      timestamp: Timestamp.fromDate(timestamp),
      memberId,
      deleted: false
    };

    if (type === 'out') {
      const lastInRecord = await getLastInRecord(memberId);
      
      if (lastInRecord) {
        const durationMinutes = Math.round(
          (timestamp.getTime() - lastInRecord.timestamp.getTime()) / (1000 * 60)
        );
        record.duration = Math.max(0, durationMinutes);
        record.inTimestamp = Timestamp.fromDate(lastInRecord.timestamp);
      } else {
        record.duration = 0; // 対応するin記録がない場合は0
      }
    }
    
    const docRef = await addDoc(recordsCollection, record);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add record:', error);
    throw new Error('記録の追加に失敗しました。');
  }
};

// 期間の記録を取得（統計用、大幅に簡素化）
export const getRecordsForPeriod = async (
  memberId: string, 
  startDate: Date, 
  endDate: Date
): Promise<Record[]> => {
  const recordsCollection = getRecordsCollection(memberId);
  const q = query(
    recordsCollection,
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp')
  );

  const snapshot = await getDocs(q);
  
  return snapshot.docs
    .filter(doc => !doc.data().deleted)
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        memberId: data.memberId,
        type: data.type,
        timestamp: data.timestamp.toDate(),
        duration: data.duration
      };
    });
};

// 最近の記録を取得（getRecordsForPeriodを使うように簡素化）
export const getRecentRecords = async (memberId: string, days: number = 7): Promise<Record[]> => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  return getRecordsForPeriod(memberId, startDate, endDate);
};


// 記録の更新（date引数が不要に）
export const updateRecord = async (
  memberId: string, 
  recordId: string, 
  data: { type?: RecordType; timestamp?: Date; duration?: number }
): Promise<void> => {
  const recordRef = doc(getRecordsCollection(memberId), recordId);
  const updateData: any = {};
  if (data.type) updateData.type = data.type;
  if (data.timestamp) updateData.timestamp = Timestamp.fromDate(data.timestamp);
  if (data.duration !== undefined) updateData.duration = data.duration;
  await updateDoc(recordRef, updateData);
};


// 記録の削除（date引数が不要に）
export const deleteRecord = async (
  memberId: string, 
  recordId: string
): Promise<void> => {
  const recordRef = doc(getRecordsCollection(memberId), recordId);
  await updateDoc(recordRef, { deleted: true });
};