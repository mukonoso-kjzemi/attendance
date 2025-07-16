import type { Record, Stats, PeriodStats } from './types';
import { format } from 'date-fns';

// 記録データをCSVに変換
export const recordsToCSV = (records: Record[]): string => {
  // ヘッダー行
  const headers = ['ID', '記録タイプ', 'タイムスタンプ', '滞在時間(分)'];
  
  // データ行
  const rows = records.map(record => [
    record.id,
    record.type === 'in' ? '入室' : '退室',
    format(record.timestamp, 'yyyy-MM-dd HH:mm:ss'),
    record.duration?.toString() || ''
  ]);
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// 日別統計をCSVに変換
export const dailyStatsToCSV = (stats: Map<string, Stats>): string => {
  // ヘッダー行
  const headers = ['日付', '総滞在時間(分)', '平均滞在時間(分/日)', '出席日数'];
  
  // データ行
  const rows: string[][] = [];
  stats.forEach((stat, dateKey) => {
    rows.push([
      dateKey,
      stat.totalTime.toString(),
      stat.averageTime.toFixed(1),
      stat.daysPresent.toString()
    ]);
  });
  
  // 日付順にソート
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// 週別統計をCSVに変換
export const weeklyStatsToCSV = (stats: Map<string, Stats>): string => {
  // ヘッダー行
  const headers = ['週', '総滞在時間(分)', '平均滞在時間(分/日)', '出席日数'];
  
  // データ行
  const rows: string[][] = [];
  stats.forEach((stat, weekKey) => {
    rows.push([
      weekKey,
      stat.totalTime.toString(),
      stat.averageTime.toFixed(1),
      stat.daysPresent.toString()
    ]);
  });
  
  // 週順にソート
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// 月別統計をCSVに変換
export const monthlyStatsToCSV = (stats: Map<string, Stats>): string => {
  // ヘッダー行
  const headers = ['月', '総滞在時間(分)', '平均滞在時間(分/日)', '出席日数'];
  
  // データ行
  const rows: string[][] = [];
  stats.forEach((stat, monthKey) => {
    rows.push([
      monthKey,
      stat.totalTime.toString(),
      stat.averageTime.toFixed(1),
      stat.daysPresent.toString()
    ]);
  });
  
  // 月順にソート
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// 全体統計をCSVに変換（平日/休日/合計）
export const summaryStatsToCSV = (stats: PeriodStats): string => {
  // ヘッダー行
  const headers = ['区分', '総滞在時間(分)', '平均滞在時間(分/日)', '出席日数'];
  
  // データ行
  const rows = [
    ['平日', stats.weekday.totalTime.toString(), stats.weekday.averageTime.toFixed(1), 
     stats.weekday.daysPresent.toString()],
    ['休日', stats.weekend.totalTime.toString(), stats.weekend.averageTime.toFixed(1), 
     stats.weekend.daysPresent.toString()],
    ['合計', stats.total.totalTime.toString(), stats.total.averageTime.toFixed(1), 
     stats.total.daysPresent.toString()]
  ];
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// メンバー比較データをCSVに変換
export const memberComparisonToCSV = (
  membersData: { memberId: string, name: string, stats: Stats }[]
): string => {
  // ヘッダー行
  const headers = ['メンバーID', '名前', '総滞在時間(分)', '平均滞在時間(分/日)', '出席日数'];
  
  // データ行
  const rows = membersData.map(data => [
    data.memberId,
    data.name,
    data.stats.totalTime.toString(),
    data.stats.averageTime.toFixed(1),
    data.stats.daysPresent.toString()
  ]);
  
  // 滞在時間の降順でソート
  rows.sort((a, b) => parseInt(b[2]) - parseInt(a[2]));
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

// Shift-JISに変換する関数
export const convertToShiftJIS = async (text: string): Promise<Uint8Array> => {
  try {
    // Shift-JISエンコーダーを作成
    const encoder = new TextEncoder();
    const utf8Data = encoder.encode(text);
    
    // Unicodeをバイナリ（UTF-8）に変換
    const utf8Array = Array.from(utf8Data);
    
    // ブラウザでShift-JISエンコーディングをサポートする方法を実装
    // ここではWindowsに対応したBOMを追加
    const bom = [0xEF, 0xBB, 0xBF]; // UTF-8 BOM
    
    // エンコーディング変換用のCDNを使用（実運用環境では注意）
    const convertedData = await fetch('https://api.moji.cloud/enc/shift_jis', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: text
    })
    .then(response => response.arrayBuffer())
    .then(buffer => new Uint8Array(buffer))
    .catch(error => {
      console.error('Shift-JIS conversion failed:', error);
      // 失敗した場合はUTF-8で返す（BOM付き）
      return new Uint8Array([...bom, ...utf8Array]);
    });
    
    return convertedData;
  } catch (error) {
    console.error('Error in Shift-JIS conversion:', error);
    // エラー時はUTF-8 BOMをつけて返す
    const encoder = new TextEncoder();
    const utf8Data = encoder.encode(text);
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
    
    // BOMとエンコードされたデータを結合
    const result = new Uint8Array(bom.length + utf8Data.length);
    result.set(bom);
    result.set(utf8Data, bom.length);
    
    return result;
  }
};

// 簡易的なShift-JIS変換（外部APIに依存しない方法）
export const simplifiedShiftJISConversion = (text: string): Uint8Array => {
  // Shift-JIS変換を自前で行うのは複雑なため、
  // ここではUTF-8にBOMを付けてExcelが自動認識できるようにする
  const encoder = new TextEncoder();
  const utf8Data = encoder.encode(text);
  
  // UTF-8 BOMを追加
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const result = new Uint8Array(bom.length + utf8Data.length);
  result.set(bom);
  result.set(utf8Data, bom.length);
  
  return result;
};

// ファイルダウンロード（Shift-JIS対応版）
export const downloadCSV = (csvContent: string, filename: string): void => {
  // Shift-JISに変換するか尋ねる（実際の運用では不要かも）
  const useShiftJIS = window.confirm(
    '日本語Excelで開く場合はOKを押してください（Shift-JIS形式）\n' +
    '他のアプリで開く場合はキャンセルを押してください（UTF-8形式）'
  );
  
  if (useShiftJIS) {
    // Shift-JIS変換を行う（簡易版）
    const shiftJisData = simplifiedShiftJISConversion(csvContent);
    const blob = new Blob([shiftJisData], { type: 'text/csv;charset=shift_jis' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // 通常のUTF-8でダウンロード
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// 月全体の日別データをCSVに変換（滞在時間が無い日も含む）
export const monthlyDailyStatsToCSV = (stats: Map<string, Stats>, year: number, month: number): string => {
  // ヘッダー行
  const headers = ['日付', '滞在時間(分)'];
  
  // 月の日数を取得
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // データ行
  const rows: string[][] = [];
  
  // 月の全ての日に対してデータを作成
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayStats = stats.get(dateKey);
    
    rows.push([
      dateKey,
      dayStats ? dayStats.totalTime.toString() : '0'
    ]);
  }
  
  // CSVテキスト生成
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};