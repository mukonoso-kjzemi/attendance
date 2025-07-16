import {
    format,
    formatDistance,
    differenceInMinutes,
    differenceInHours,
    differenceInDays,
    addDays,
    subDays,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isWeekend,
    parseISO
  } from 'date-fns';
  import { ja } from 'date-fns/locale';
  
  // 日付をYYYY-MM-DD形式にフォーマット
  export const formatDateToISO = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // 時刻をHH:MM形式にフォーマット
  export const formatTime = (date: Date): string => {
    return format(date, 'HH:mm');
  };
  
  // 日付と時刻を日本語形式にフォーマット
  export const formatDateTimeJP = (date: Date): string => {
    return format(date, 'yyyy年MM月dd日 HH時mm分', { locale: ja });
  };
  
  // 日付を日本語形式にフォーマット（曜日付き）
  export const formatDateJP = (date: Date): string => {
    return format(date, 'yyyy年MM月dd日(E)', { locale: ja });
  };
  
  // 相対的な時間を表示（例: 3時間前）
  export const formatRelativeTime = (date: Date, baseDate = new Date()): string => {
    return formatDistance(date, baseDate, { addSuffix: true, locale: ja });
  };
  
  // 分をわかりやすい時間形式に変換（例: 90分 → 1時間30分）
  export const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0分';
  
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
  
    if (hours > 0) {
      return `${hours}時間${mins > 0 ? ` ${mins}分` : ''}`;
    }
  
    return `${mins}分`;
  };
  
  // 特定の期間の開始日と終了日を取得
  export type DateRange = {
    startDate: Date;
    endDate: Date;
  };
  
  // 今日の日付範囲
  export const getToday = (): DateRange => {
    const now = new Date();
    return {
      startDate: startOfDay(now),
      endDate: endOfDay(now)
    };
  };
  
  // 今週の日付範囲
  export const getThisWeek = (): DateRange => {
    const now = new Date();
    return {
      startDate: startOfWeek(now, { locale: ja }),
      endDate: endOfWeek(now, { locale: ja })
    };
  };
  
  // 今月の日付範囲
  export const getThisMonth = (): DateRange => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    };
  };
  
  // 過去N日間の日付範囲
  export const getLastNDays = (days: number): DateRange => {
    const now = new Date();
    return {
      startDate: startOfDay(subDays(now, days - 1)),
      endDate: endOfDay(now)
    };
  };
  
  // 文字列の日付をDateオブジェクトに変換
  export const parseDate = (dateString: string): Date => {
    return parseISO(dateString);
  };
  
  // 日付が平日かどうかをチェック
  export const isWeekday = (date: Date): boolean => {
    return !isWeekend(date);
  };