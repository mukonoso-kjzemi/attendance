import { writable, derived, get } from 'svelte/store';
import type { Member, MemberStatus } from '../utils/types';
import { 
  onMembersChange, 
  getMemberRef,
  updateMemberStatus 
} from '../firebase/members';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GRADE_ORDER, COLLECTIONS } from '../constants';
import { collection, query, getDocs } from 'firebase/firestore';

// メンバー情報のストア
export const members = writable<Member[]>([]);
export const membersError = writable<string | null>(null);
export const membersLoading = writable(false);

// 入室中のメンバーのストア
export const inRoomMembers = derived(members, $members => 
  $members.filter(member => member.status === 'in')
);

// 退室中のメンバーのストア
export const outRoomMembers = derived(members, $members => 
  $members.filter(member => member.status === 'out')
);

// 入室人数のストア
export const inRoomCount = derived(inRoomMembers, $inRoomMembers => 
  $inRoomMembers.length
);

// 最終更新時刻
export const lastUpdateTime = writable<Date>(new Date());

// 接続状態のストア
export const connectionStatus = writable<'connected' | 'disconnected' | 'connecting'>('disconnected');

// 個別メンバーのリスナーマップ
const memberListeners = new Map<string, () => void>();

// 全体リスナー
let globalListener: (() => void) | null = null;

// メンバーリスナーを初期化
export const initMembersListener = (callback?: (members: Member[]) => void) => {
  // 既存のリスナーがあれば削除
  if (globalListener) {
    globalListener();
    globalListener = null;
  }
  
  connectionStatus.set('connecting');
  
  try {
    // 新しいリスナーを設定
    globalListener = onMembersChange(updatedMembers => {
      members.set(updatedMembers);
      lastUpdateTime.set(new Date());
      connectionStatus.set('connected');
      
      // 既存の個別リスナーを更新
      updateIndividualListeners(updatedMembers);
      
      // コールバック関数が存在する場合のみ呼び出す
      if (typeof callback === 'function') {
        callback(updatedMembers);
      }
    });
    
    return globalListener;
  } catch (error) {
    console.error('Failed to initialize members listener:', error);
    connectionStatus.set('disconnected');
    return () => {}; // ダミーのクリーンアップ関数
  }
};

// 個別のメンバー状態の変更を監視
const updateIndividualListeners = (membersList: Member[]) => {
  const currentMemberIds = new Set(membersList.map(m => m.id));
  
  // 不要になったリスナーを削除
  memberListeners.forEach((unsubscribe, memberId) => {
    if (!currentMemberIds.has(memberId)) {
      unsubscribe();
      memberListeners.delete(memberId);
    }
  });
  
  // 新しいメンバーのリスナーを追加
  membersList.forEach(member => {
    if (!memberListeners.has(member.id)) {
      const memberRef = getMemberRef(member.id);
      try {
        const unsubscribe = onSnapshot(memberRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const updatedMember: Member = {
              id: doc.id,
              name: data.name,
              grade: data.grade || 'B4', // gradeがない場合のフォールバック
              status: data.status,
              lastStatusChange: data.lastStatusChange ? data.lastStatusChange.toDate() : new Date(),
              sortValue: data.sortValue
            };
            
            // メンバーリストを更新
            members.update($members => {
              const index = $members.findIndex(m => m.id === member.id);
              if (index >= 0) {
                $members[index] = updatedMember;
              }
              return [...$members];
            });
            
            lastUpdateTime.set(new Date());
          }
        }, error => {
          console.error(`Error in individual listener for ${member.id}:`, error);
        });
        
        memberListeners.set(member.id, unsubscribe);
      } catch (error) {
        console.error(`Failed to setup listener for member ${member.id}:`, error);
      }
    }
  });
};

// メンバーの状態を切り替え
export const toggleMemberStatus = async (memberId: string, currentStatus: 'in' | 'out') => {
  try {
    console.log(`Toggling status for ${memberId} from ${currentStatus}`);
    const newStatus = currentStatus === 'in' ? 'out' : 'in';
    await updateMemberStatus(memberId, newStatus);
    console.log(`Status toggled successfully to ${newStatus}`);
  } catch (error) {
    console.error('Failed to toggle status:', error);
    throw error; // エラーを呼び出し元に伝播
  }
};

// メンバーを学年順、同じ学年内ではsortValue順にソート
export const sortedMembers = derived(members, $members => {
  return [...$members].sort((a, b) => {
    // まず学年でソート（GRADE_ORDERの順）
    const gradeIndexA = GRADE_ORDER.indexOf(a.grade);
    const gradeIndexB = GRADE_ORDER.indexOf(b.grade);
    
    if (gradeIndexA !== gradeIndexB) {
      return gradeIndexA - gradeIndexB;
    }
    
    // 同じ学年内ではsortValueでソート
    if (a.sortValue !== undefined && b.sortValue !== undefined) {
      return a.sortValue - b.sortValue;
    }
    
    // sortValueが設定されていない場合は、設定されている方を後ろに
    if (a.sortValue === undefined && b.sortValue === undefined) {
      return 0;
    }
    if (a.sortValue === undefined) {
      return 1;
    }
    return -1;
  });
});

// メンバーを状態順（入室中→退室中）、その中で学年順、さらにsortValue順にソート
export const sortedMembersByStatus = derived(members, $members => {
  return [...$members].sort((a, b) => {
    // まず状態でソート（入室中が先）
    if (a.status !== b.status) {
      return a.status === 'in' ? -1 : 1;
    }
    
    // 次に学年でソート
    const gradeIndexA = GRADE_ORDER.indexOf(a.grade);
    const gradeIndexB = GRADE_ORDER.indexOf(b.grade);
    
    if (gradeIndexA !== gradeIndexB) {
      return gradeIndexA - gradeIndexB;
    }
    
    // 最後にsortValueでソート
    if (a.sortValue !== undefined && b.sortValue !== undefined) {
      return a.sortValue - b.sortValue;
    }
    
    // sortValueが設定されていない場合は、設定されている方を後ろに
    if (a.sortValue === undefined && b.sortValue === undefined) {
      return 0;
    }
    if (a.sortValue === undefined) {
      return 1;
    }
    return -1;
  });
});

// メンバーをIDで検索
export const findMemberById = (id: string) => {
  let foundMember: Member | undefined;
  
  members.subscribe(memberList => {
    foundMember = memberList.find(member => member.id === id);
  })();
  
  return foundMember;
};

// メンバー一覧の初期化
export const initMembers = async () => {
  try {
    membersLoading.set(true);
    membersError.set(null);
    
    const unsubscribe = initMembersListener((fetchedMembers) => {
      members.set(fetchedMembers);
      connectionStatus.set('connected');
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Failed to initialize members:', error);
    membersError.set('メンバー情報の取得に失敗しました。');
    connectionStatus.set('disconnected');
    return () => {};
  } finally {
    membersLoading.set(false);
  }
};

// すべてのリスナーをクリーンアップ
export const cleanupAllListeners = () => {
  // 個別メンバーリスナーをクリーンアップ
  memberListeners.forEach(unsubscribe => unsubscribe());
  memberListeners.clear();
  
  // 全体リスナーをクリーンアップ
  if (globalListener) {
    globalListener();
    globalListener = null;
  }
  
  connectionStatus.set('disconnected');
};