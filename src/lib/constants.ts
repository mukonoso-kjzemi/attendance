// Firebase コレクション名
export const COLLECTIONS = {
    MEMBERS: 'members',
    RECORDS: 'records'
  };
  
  // 学年
  export const GRADES = {
    P: 'P',
    D: 'D',
    M2: 'M2',
    M1: 'M1',
    B4: 'B4',
    B3: 'B3'
  };
  
  // 学年の表示順（降順）
  export const GRADE_ORDER = ['H3','H2', 'H1', 'M3', 'M2', 'M1'];
  
  // 学年ごとの色設定
  export const GRADE_COLORS = {
    'H3': '#6a1b9a',  // 濃い紫
    'H2': '#1565c0',   // 鮮やかな青
    'H1': '#00695c',  // 深い青緑
    'M3': '#f8b500',  // 濃い黄色
    'M2': '#f57c00',  // 鮮やかなオレンジ
    'M1': '#e65100'   // 深い赤オレンジ
  };
  
  // メンバーステータス
  export const MEMBER_STATUS = {
    IN: 'in',
    OUT: 'out'
  };
  
  // 記録タイプ
  export const RECORD_TYPE = {
    IN: 'in',
    OUT: 'out'
  };
  
  // 自動リフレッシュ間隔 (ミリ秒)
  export const REFRESH_INTERVAL = 5 * 60 * 1000; // 5分
  
  // 日付形式
  export const DATE_FORMATS = {
    // 表示用
    DISPLAY_DATE: 'yyyy年MM月dd日',
    DISPLAY_TIME: 'HH:mm',
    DISPLAY_DATE_TIME: 'yyyy年MM月dd日 HH:mm',
    DISPLAY_MONTH: 'yyyy年MM月',
    DISPLAY_WEEK: 'yyyy年 第ww週',
    
    // 内部処理用
    ISO_DATE: 'yyyy-MM-dd',
    ISO_DATE_TIME: 'yyyy-MM-dd\'T\'HH:mm:ss',
    MONTH_KEY: 'yyyy-MM',
    WEEK_KEY: 'yyyy-\'W\'ww'
  };
  
  // ローカルストレージのキー
  export const STORAGE_KEYS = {
    SELECTED_MEMBER: 'stay-manager-selected-member',
    ADMIN_SETTINGS: 'stay-manager-admin-settings'
  };
  
  // 統計の期間オプション
  export const STATS_PERIODS = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    TOTAL: 'total'
  };
  
  // エラーメッセージ
  export const ERROR_MESSAGES = {
    FETCH_FAILED: 'データの取得に失敗しました。再度お試しください。',
    UPDATE_FAILED: '更新に失敗しました。再度お試しください。',
    DELETE_FAILED: '削除に失敗しました。再度お試しください。',
    CREATE_FAILED: '作成に失敗しました。再度お試しください。',
    CONNECTION_ERROR: 'サーバーとの接続に問題があります。インターネット接続を確認してください。',
    INVALID_INPUT: '入力内容が正しくありません。確認してください。'
  };
  
  // ページパス
  export const ROUTES = {
    HOME: '/',
    MEMBER: '/member',
    ADMIN: '/admin',
    ADMIN_MEMBERS: '/admin/members',
    ADMIN_STATS: '/admin/stats'
  };