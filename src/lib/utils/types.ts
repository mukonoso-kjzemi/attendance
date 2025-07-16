// メンバーステータスの型
export type MemberStatus = 'in' | 'out';

// 記録タイプの型
export type RecordType = 'in' | 'out';

// 学年の型
export type Grade = 'H3' | 'H2' | 'H1' | 'M3' | 'M2' | 'M1';

// メンバー情報の型
export interface Member {
  id: string;
  name: string;
  grade: Grade;
  status: MemberStatus;
  lastStatusChange: Date;
  deleted?: boolean;  // 論理削除フラグ
  sortValue?: number;  // ソート順の値（オプション）
}

// 記録情報の型
export interface Record {
  id: string;
  memberId: string;
  type: RecordType;
  timestamp: Date;
  duration?: number;  // 'out'の場合のみ存在する（滞在時間、分単位）
  deleted?: boolean;  // 論理削除フラグ
}

// 統計情報の型
export interface Stats {
  totalTime: number;  // 合計滞在時間（分）
  averageTime: number;  // 平均滞在時間（分/日）
  daysPresent: number;  // 出席日数
}

// 期間の統計情報の型
export interface PeriodStats {
  daily: Map<string, Stats>;  // 日別統計
  weekly: Map<string, Stats>;  // 週別統計
  monthly: Map<string, Stats>;  // 月別統計
  weekday: Stats;  // 平日の統計
  weekend: Stats;  // 休日の統計
  total: Stats;  // 全体の統計
}