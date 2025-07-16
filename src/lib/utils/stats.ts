import type { Record, Stats, PeriodStats } from './types';
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWeekend,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  isAfter,
  isBefore,
  parseISO
} from 'date-fns';
import { ja } from 'date-fns/locale';

// 日付をYYYY-MM-DD形式の文字列に変換
const formatDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// 週のキーを生成 (YYYY-WW形式)
const formatWeekKey = (date: Date): string => {
  return format(date, 'yyyy-\'W\'ww', { locale: ja });
};

// 月のキーを生成 (YYYY-MM形式)
const formatMonthKey = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

// 日をまたぐ滞在時間を日ごとに分割
const splitStayByDays = (inTimestamp: Date, outTimestamp: Date): Map<string, number> => {
  const result = new Map<string, number>();
  
  // 同じ日の場合は分割不要
  if (formatDateKey(inTimestamp) === formatDateKey(outTimestamp)) {
    const duration = differenceInMinutes(outTimestamp, inTimestamp);
    result.set(formatDateKey(inTimestamp), duration);
    return result;
  }
  
  // 滞在期間の各日に分割
  let currentDay = new Date(inTimestamp);
  
  // 初日: 入室時刻から日の終わりまで
  const firstDayEnd = endOfDay(currentDay);
  const firstDayDuration = differenceInMinutes(firstDayEnd, inTimestamp);
  result.set(formatDateKey(currentDay), firstDayDuration);
  
  // 中間の日: 各日24時間（1440分）
  currentDay = addDays(currentDay, 1);
  while (formatDateKey(currentDay) !== formatDateKey(outTimestamp)) {
    result.set(formatDateKey(currentDay), 1440); // 24時間 = 1440分
    currentDay = addDays(currentDay, 1);
  }
  
  // 最終日: 日の始まりから退室時刻まで
  if (formatDateKey(currentDay) === formatDateKey(outTimestamp)) {
    const lastDayStart = startOfDay(outTimestamp);
    const lastDayDuration = differenceInMinutes(outTimestamp, lastDayStart);
    result.set(formatDateKey(currentDay), lastDayDuration);
  }
  
  return result;
};

// 記録配列から統計情報を計算（日ごとの滞在時間を分割）
export const calculateStats = (records: Record[]): Stats => {
  if (records.length === 0) {
    return {
      totalTime: 0,
      averageTime: 0,
      daysPresent: 0,
    };
  }

  // 'in'と'out'のペアを見つけて日ごとの滞在時間を計算
  const dailyMinutes = new Map<string, number>();
  const inRecords: Record[] = [];
  const outRecords: Record[] = [];
  
  // 入室と退室の記録を分類
  records.forEach(record => {
    if (record.type === 'in') {
      inRecords.push(record);
    } else if (record.type === 'out') {
      outRecords.push(record);
    }
  });
  
  // 各'out'記録に対応する'in'記録を見つけて滞在時間を計算
  outRecords.forEach(outRecord => {
    if (!outRecord.duration) return; // 滞在時間がない場合はスキップ
    
    // この'out'記録に対応する最新の'in'記録を見つける
    const matchingInRecord = inRecords
      .filter(inRecord => isBefore(inRecord.timestamp, outRecord.timestamp))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    if (matchingInRecord) {
      // 日をまたぐ滞在を日ごとに分割
      const dailySplits = splitStayByDays(matchingInRecord.timestamp, outRecord.timestamp);
      
      // 各日の滞在時間を累積
      dailySplits.forEach((minutes, day) => {
        dailyMinutes.set(day, (dailyMinutes.get(day) || 0) + minutes);
      });
    } else {
      // 対応する'in'が見つからない場合は退室日に全て計上
      const day = formatDateKey(outRecord.timestamp);
      dailyMinutes.set(day, (dailyMinutes.get(day) || 0) + (outRecord.duration || 0));
    }
  });
  
  // 統計情報を計算
  let totalTime = 0;
  let longestStay = 0;
  
  dailyMinutes.forEach((minutes, day) => {
    totalTime += minutes;
    longestStay = Math.max(longestStay, minutes);
  });
  
  const daysPresent = dailyMinutes.size;
  
  return {
    totalTime,
    averageTime: daysPresent > 0 ? totalTime / daysPresent : 0,
    daysPresent,
  };
};

// 期間の記録から日別、週別、月別の統計情報を計算
export const calculatePeriodStats = (records: Record[], startDate: Date, endDate: Date): PeriodStats => {
  // 'in'と'out'のペアから日ごとの滞在時間を計算
  const dailyMinutes = new Map<string, number>();
  const inRecords: Record[] = [];
  const outRecords: Record[] = [];
  
  // 入室と退室の記録を分類
  records.forEach(record => {
    if (record.type === 'in') {
      inRecords.push(record);
    } else if (record.type === 'out') {
      outRecords.push(record);
    }
  });
  
  // 各'out'記録に対応する'in'記録を見つけて滞在時間を計算
  outRecords.forEach(outRecord => {
    if (!outRecord.duration) return; // 滞在時間がない場合はスキップ
    
    // この'out'記録に対応する最新の'in'記録を見つける
    const matchingInRecord = inRecords
      .filter(inRecord => isBefore(inRecord.timestamp, outRecord.timestamp))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    
    if (matchingInRecord) {
      // 日をまたぐ滞在を日ごとに分割
      const dailySplits = splitStayByDays(matchingInRecord.timestamp, outRecord.timestamp);
      
      // 各日の滞在時間を累積
      dailySplits.forEach((minutes, day) => {
        dailyMinutes.set(day, (dailyMinutes.get(day) || 0) + minutes);
      });
    } else {
      // 対応する'in'が見つからない場合は退室日に全て計上
      const day = formatDateKey(outRecord.timestamp);
      dailyMinutes.set(day, (dailyMinutes.get(day) || 0) + (outRecord.duration || 0));
    }
  });
  
  // 日別、週別、月別の記録マップを初期化
  const dailyRecords = new Map<string, Record[]>();
  const weeklyRecords = new Map<string, Record[]>();
  const monthlyRecords = new Map<string, Record[]>();
  
  // 平日と休日の記録を分離
  const weekdayMinutes = new Map<string, number>();
  const weekendMinutes = new Map<string, number>();
  
  // 日付ごとの滞在時間を分類
  dailyMinutes.forEach((minutes, dateKey) => {
    try {
      // dateKeyから日付オブジェクトを作成
      const date = parseISO(dateKey);
      
      // 統計カテゴリに分類
      const weekKey = formatWeekKey(date);
      const monthKey = formatMonthKey(date);
      
      // 日別、週別、月別に滞在時間を集計
      if (!dailyRecords.has(dateKey)) dailyRecords.set(dateKey, []);
      if (!weeklyRecords.has(weekKey)) weeklyRecords.set(weekKey, []);
      if (!monthlyRecords.has(monthKey)) monthlyRecords.set(monthKey, []);
      
      // 平日・休日に分類
      if (isWeekend(date)) {
        weekendMinutes.set(dateKey, minutes);
      } else {
        weekdayMinutes.set(dateKey, minutes);
      }
    } catch (error) {
      console.error(`Invalid date key: ${dateKey}`, error);
    }
  });
  
  // 各カテゴリの統計を計算
  const daily = new Map<string, Stats>();
  dailyMinutes.forEach((minutes, dateKey) => {
    daily.set(dateKey, {
      totalTime: minutes,
      averageTime: minutes, // 1日あたりは平均も合計も同じ
      daysPresent: 1,
    });
  });
  
  // 週別統計
  const weekly = new Map<string, Stats>();
  const weekTotals = new Map<string, number>();
  const weekDays = new Map<string, Set<string>>();
  
  dailyMinutes.forEach((minutes, dateKey) => {
    try {
      const date = parseISO(dateKey);
      const weekKey = formatWeekKey(date);
      
      // 週の合計時間
      weekTotals.set(weekKey, (weekTotals.get(weekKey) || 0) + minutes);
      
      // 週の出席日数
      if (!weekDays.has(weekKey)) weekDays.set(weekKey, new Set());
      weekDays.get(weekKey)?.add(dateKey);
      
    } catch (error) {
      console.error(`Error processing date: ${dateKey}`, error);
    }
  });
  
  weekTotals.forEach((total, weekKey) => {
    const days = weekDays.get(weekKey)?.size || 0;
    weekly.set(weekKey, {
      totalTime: total,
      averageTime: days > 0 ? total / days : 0,
      daysPresent: days,
    });
  });
  
  // 月別統計
  const monthly = new Map<string, Stats>();
  const monthTotals = new Map<string, number>();
  const monthDays = new Map<string, Set<string>>();
  
  dailyMinutes.forEach((minutes, dateKey) => {
    try {
      const date = parseISO(dateKey);
      const monthKey = formatMonthKey(date);
      
      // 月の合計時間
      monthTotals.set(monthKey, (monthTotals.get(monthKey) || 0) + minutes);
      
      // 月の出席日数
      if (!monthDays.has(monthKey)) monthDays.set(monthKey, new Set());
      monthDays.get(monthKey)?.add(dateKey);
      
    } catch (error) {
      console.error(`Error processing date: ${dateKey}`, error);
    }
  });
  
  monthTotals.forEach((total, monthKey) => {
    const days = monthDays.get(monthKey)?.size || 0;
    monthly.set(monthKey, {
      totalTime: total,
      averageTime: days > 0 ? total / days : 0,
      daysPresent: days,
    });
  });
  
  // 平日・休日の統計
  let weekdayTotal = 0;
  let weekdayLongest = 0;
  weekdayMinutes.forEach((minutes) => {
    weekdayTotal += minutes;
    weekdayLongest = Math.max(weekdayLongest, minutes);
  });
  
  let weekendTotal = 0;
  let weekendLongest = 0;
  weekendMinutes.forEach((minutes) => {
    weekendTotal += minutes;
    weekendLongest = Math.max(weekendLongest, minutes);
  });
  
  // 全体の合計
  let totalTime = 0;
  let longestStay = 0;
  dailyMinutes.forEach((minutes) => {
    totalTime += minutes;
    longestStay = Math.max(longestStay, minutes);
  });
  
  return {
    daily,
    weekly,
    monthly,
    weekday: {
      totalTime: weekdayTotal,
      averageTime: weekdayMinutes.size > 0 ? weekdayTotal / weekdayMinutes.size : 0,
      daysPresent: weekdayMinutes.size,
    },
    weekend: {
      totalTime: weekendTotal,
      averageTime: weekendMinutes.size > 0 ? weekendTotal / weekendMinutes.size : 0,
      daysPresent: weekendMinutes.size,
    },
    total: {
      totalTime,
      averageTime: dailyMinutes.size > 0 ? totalTime / dailyMinutes.size : 0,
      daysPresent: dailyMinutes.size,
    }
  };
};

// メンバー間の滞在時間比較データを作成
export const compareMembersStats = (membersStats: Map<string, Stats>): { name: string; totalTime: number }[] => {
  const result: { name: string; totalTime: number }[] = [];
  
  membersStats.forEach((stats, memberId) => {
    result.push({
      name: memberId,
      totalTime: stats.totalTime
    });
  });
  
  // 滞在時間の降順でソート
  return result.sort((a, b) => b.totalTime - a.totalTime);
};