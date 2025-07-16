import { writable, derived } from 'svelte/store';
import type { Record } from '../utils/types';
import { getRecentRecords } from '../firebase/records';

// 現在選択中のメンバーID
export const selectedMemberId = writable<string | null>(null);

// メンバーの記録
export const memberRecords = writable<Record[]>([]);

// 記録の読み込み中状態
export const recordsLoading = writable(false);

// 記録読み込みエラー
export const recordsError = writable<string | null>(null);

// 記録の並び替え（最新順）
export const sortedRecords = derived(memberRecords, $records => {
  return [...$records].sort((a, b) => {
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
});

// 特定期間の記録をフィルタリング
export const filterRecordsByDate = (
  records: Record[], 
  startDate: Date, 
  endDate: Date
): Record[] => {
  return records.filter(record => {
    const timestamp = record.timestamp;
    return timestamp >= startDate && timestamp <= endDate;
  });
};

// メンバーの最近の記録を読み込む
export const loadMemberRecords = async (memberId: string, days = 7): Promise<void> => {
  if (!memberId) return;
  
  recordsLoading.set(true);
  recordsError.set(null);
  
  try {
    const records = await getRecentRecords(memberId, days);
    memberRecords.set(records);
  } catch (error) {
    console.error('Failed to load records:', error);
    recordsError.set('記録の読み込みに失敗しました');
    memberRecords.set([]);
  } finally {
    recordsLoading.set(false);
  }
};

// 記録をクリア
export const clearRecords = () => {
  memberRecords.set([]);
  recordsError.set(null);
  recordsLoading.set(false);
};