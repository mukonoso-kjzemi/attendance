import { db } from './config';
import { 
  collection, doc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, Timestamp,
  collectionGroup // ← これが重要
} from 'firebase/firestore';
import type { Record, RecordType } from '../utils/types';
import { format } from 'date-fns';

// 月別コレクション名を生成
const getMonthlyCollectionName = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

// 記録コレクションへの参照を取得
export const getRecordsCollection = (memberId: string, date: Date) => {
  const monthCollection = getMonthlyCollectionName(date);
  return collection(db, 'records', memberId, monthCollection);
};

// ★★★ ここが新しい、賢い探し方をする関数です ★★★
// 最後の'in'記録を取得（新方式）
export const getLastInRecord = async (memberId: string): Promise<Record | null> => {
  console.log('最後の入室記録を検索開始（新方式）:', { memberId });

  // 'records'という名前の全てのコレクション（フォルダ）を横断して検索するための準備
  const recordsGroup = collectionGroup(db, 'records');

  // 全ての期間から、特定のメンバーの、最新の'in'記録を1つだけ探す命令
  const q = query(
    recordsGroup,
    where('memberId', '==', memberId),
    where('type', '==', 'in'),
    where('deleted', '==', false), // 削除されていないものに絞る
    orderBy('timestamp', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log('入室記録が見つかりませんでした');
    return null;
  }

  // 見つかった最新の記録を返す
  const doc = snapshot.docs[0];
  const data = doc.data();
  const latestRecord: Record = {
    id: doc.id,
    memberId: data.memberId,
    type: data.type,
    timestamp: data.timestamp.toDate()
  };

  console.log('最新の入室記録:', latestRecord);
  return latestRecord;
};

// 記録を追加
export const addRecord = async (memberId: string, type: RecordType, timestamp: Date = new Date()): Promise<string> => {
  try {
    console.log('記録追加開始:', { memberId, type, timestamp });
    const recordsCollection = getRecordsCollection(memberId, timestamp);
    console.log('コレクション参照:', recordsCollection.path);
    
    const record: any = {
      type,
      timestamp: Timestamp.fromDate(timestamp),
      memberId,
      deleted: false
    };

    // 'out'の場合、最後の'in'記録を検索して滞在時間を計算
    if (type === 'out') {
      console.log('退出処理: 最後の入室記録を検索');
      const lastInRecord = await getLastInRecord(memberId); // ← 新しい関数を呼び出す
      console.log('最後の入室記録:', lastInRecord);
      
      if (lastInRecord) {
        const durationMinutes = Math.round(
          (timestamp.getTime() - lastInRecord.timestamp.getTime()) / (1000 * 60)
        );
        record.duration = Math.max(0, durationMinutes);
        
        const inDate = format(lastInRecord.timestamp, 'yyyy-MM-dd');
        const outDate = format(timestamp, 'yyyy-MM-dd');
        record.inTimestamp = Timestamp.fromDate(lastInRecord.timestamp);

        if (inDate !== outDate) {
          record.crossesDays = true;
        }
      } else {
        record.duration = 0;
      }
    }
    
    console.log('保存するレコード:', record);
    const docRef = await addDoc(recordsCollection, record);
    console.log('記録の追加完了:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Failed to add record:', error);
    throw new Error('記録の追加に失敗しました。再度お試しください。');
  }
};

// (getRecentRecords, updateRecord, deleteRecordなどの他の関数は、この下に続けてください)
// (もし他の関数も必要であれば、それらもここに含めます)

// メンバーの最近の記録を取得（直近1週間）
export const getRecentRecords = async (memberId: string, days: number = 7): Promise<Record[]> => {
  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - days);

  // 月をまたぐ可能性があるので、現在月と前月を検索
  const thisMonth = getRecordsCollection(memberId, currentDate);
  const lastMonth = new Date(currentDate);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const prevMonth = getRecordsCollection(memberId, lastMonth);

  // 両方の月から記録を取得
  const qThisMonth = query(
    thisMonth,
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    orderBy('timestamp', 'desc')
  );

  const qPrevMonth = query(
    prevMonth,
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    orderBy('timestamp', 'desc')
  );

  const [thisMonthSnapshot, prevMonthSnapshot] = await Promise.all([
    getDocs(qThisMonth),
    getDocs(qPrevMonth)
  ]);

  // 結果を結合して日付順にソート
  const records = [
    ...thisMonthSnapshot.docs,
    ...prevMonthSnapshot.docs
  ]
    .filter(doc => {
      const data = doc.data();
      return !data.deleted;
    })
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

  return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};


// 記録を削除
export const deleteRecord = async (
  memberId: string, 
  recordId: string, 
  date: Date
): Promise<void> => {
  const recordsCollection = getRecordsCollection(memberId, date);
  const recordRef = doc(recordsCollection, recordId);
  await updateDoc(recordRef, {
    deleted: true
  });
};


// 記録を更新
export const updateRecord = async (
  memberId: string, 
  recordId: string, 
  date: Date,
  data: { type?: RecordType; timestamp?: Date; duration?: number }
): Promise<void> => {
  const recordsCollection = getRecordsCollection(memberId, date);
  const recordRef = doc(recordsCollection, recordId);

  const updateData: any = {};
  if (data.type) {
    updateData.type = data.type;
  }
  if (data.timestamp) {
    updateData.timestamp = Timestamp.fromDate(data.timestamp);
  }
  if (data.duration !== undefined) {
    updateData.duration = data.duration;
  }
  await updateDoc(recordRef, updateData);
};
// 期間の記録を取得（統計用）
export const getRecordsForPeriod = async (
  memberId: string, 
  startDate: Date, 
  endDate: Date
): Promise<Record[]> => {
  const adjustedStartDate = new Date(startDate);
  adjustedStartDate.setDate(adjustedStartDate.getDate() - 1);
  
  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  
  const months: Date[] = [];
  const startMonth = new Date(adjustedStartDate.getFullYear(), adjustedStartDate.getMonth(), 1);
  const endMonth = new Date(adjustedEndDate.getFullYear(), adjustedEndDate.getMonth(), 1);
  
  let currentMonth = new Date(startMonth);
  while (currentMonth <= endMonth) {
    months.push(new Date(currentMonth));
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  const queries = months.map(date => {
    const recordsCollection = getRecordsCollection(memberId, date);
    return query(
      recordsCollection,
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate)),
      orderBy('timestamp')
    );
  });
  
  const snapshots = await Promise.all(queries.map(q => getDocs(q)));
  
  const records: Record[] = [];
  
  snapshots.forEach((snapshot) => {
    snapshot.docs
      .filter(doc => !doc.data().deleted)
      .forEach(doc => {
        const data = doc.data();
        records.push({
          id: doc.id,
          memberId: data.memberId,
          type: data.type,
          timestamp: data.timestamp.toDate(),
          duration: data.duration
        });
      });
  });
  
  return records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};