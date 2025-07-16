// place files you want to import through the `$lib` alias in this folder.
// コンポーネントのエクスポート
export { default as Header } from './components/Header.svelte';
export { default as StatusButton } from './components/StatusButton.svelte';
export { default as MemberList } from './components/MemberList.svelte';
export { default as StatusCounter } from './components/StatusCounter.svelte';
export { default as HistoryList } from './components/HistoryList.svelte';
export { default as MemberEditor } from './components/MemberEditor.svelte';
export { default as RecordEditor } from './components/RecordEditor.svelte';
export { default as StatsView } from './components/StatsView.svelte';
export { default as ExportButton } from './components/ExportButton.svelte';

// 型のエクスポート
export type {
  Member,
  MemberStatus,
  Record,
  RecordType,
  Stats,
  PeriodStats
} from './utils/types';

// ユーティリティのエクスポート
export * from './utils/date';
export * from './utils/stats';
export * from './utils/export';

// 定数のエクスポート
export * from './constants';

// Firebaseサービスのエクスポート
export * from './firebase/members';
export * from './firebase/records';

// ストアのエクスポート
export * from './stores/members';
export * from './stores/records';

/**
 * ライブラリのバージョン情報
 */
export const version = '1.0.0';

/**
 * アプリケーションの初期化処理
 * この関数はアプリケーションの起動時に一度だけ呼び出される
 */
export const initializeApp = async () => {
  console.log('滞在管理システムを初期化しています...');
  
  // ここで必要な初期化処理を行う
  // 例：Firebaseの接続確認、初期データの読み込みなど
  
  return {
    version,
    initialized: true,
    timestamp: new Date()
  };
};