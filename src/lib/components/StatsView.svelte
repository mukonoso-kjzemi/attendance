<script lang="ts">
    import { GRADE_COLORS } from '../constants';
    import { onMount } from 'svelte';
    import { getRecordsForPeriod } from '$lib/firebase/records';
    import { calculatePeriodStats } from '$lib/utils/stats';
    import { 
      dailyStatsToCSV, 
      weeklyStatsToCSV, 
      monthlyStatsToCSV, 
      summaryStatsToCSV,
      monthlyDailyStatsToCSV,
      downloadCSV 
    } from '$lib/utils/export';
    import type { Record, PeriodStats } from '$lib/utils/types';
    import { 
      startOfMonth, 
      endOfMonth, 
      subMonths, 
      format,
      isWeekend 
    } from 'date-fns';
    import { ja } from 'date-fns/locale';
    
    export let memberId: string;
    export let memberName: string;
    export let memberGrade: keyof typeof GRADE_COLORS;
    
    let selectedMonth = format(new Date(), 'yyyy-MM');
    let records: Record[] = [];
    let stats: PeriodStats | null = null;
    let loading = true;
    let error = '';
    
    // 滞在時間を表示用にフォーマット
    const formatDuration = (minutes: number): string => {
      if (minutes === 0) return '0分';
      
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        return `${hours}時間${mins > 0 ? ` ${mins}分` : ''}`;
      }
      
      return `${mins}分`;
    };
    
    // 日付をフォーマット
    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      return format(date, 'M月d日(E)', { locale: ja });
    };
    
    // 週をフォーマット
    const formatWeek = (weekStr: string): string => {
      const [year, weekNum] = weekStr.split('-W');
      return `${year}年 第${weekNum}週`;
    };
    
    // 月をフォーマット
    const formatMonth = (monthStr: string): string => {
      const [year, month] = monthStr.split('-');
      return `${year}年${month}月`;
    };
    
    // 統計データを読み込み
    const loadStats = async () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      console.log('選択された月:', selectedMonth, '年:', year, '月:', month);
      
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(startDate);
      console.log('検索期間:', {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      loading = true;
      error = '';
      
      try {
        records = await getRecordsForPeriod(memberId, startDate, endDate);
        console.log('取得した記録:', records);
        console.log('記録数:', records.length);
        
        stats = calculatePeriodStats(records, startDate, endDate);
        console.log('計算された統計:', stats);
      } catch (err) {
        console.error('Failed to load stats:', err);
        error = '統計データの読み込みに失敗しました';
        stats = null;
      } finally {
        loading = false;
      }
    };
    
    // 月別CSVをエクスポート
    const exportMonthly = () => {
      if (!stats) return;
      
      const csvContent = monthlyStatsToCSV(stats.monthly);
      const filename = `${memberName}_月別統計_${selectedMonth}.csv`;
      downloadCSV(csvContent, filename);
    };
    
    // 週別CSVをエクスポート
    const exportWeekly = () => {
      if (!stats) return;
      
      const csvContent = weeklyStatsToCSV(stats.weekly);
      const filename = `${memberName}_週別統計_${selectedMonth}.csv`;
      downloadCSV(csvContent, filename);
    };
    
    // 日別CSVをエクスポート
    const exportDaily = () => {
      if (!stats) return;
      
      const csvContent = dailyStatsToCSV(stats.daily);
      const filename = `${memberName}_日別統計_${selectedMonth}.csv`;
      downloadCSV(csvContent, filename);
    };
    
    // 月全体の日別CSVをエクスポート
    const exportMonthlyDaily = () => {
      if (!stats) return;
      
      const [year, month] = selectedMonth.split('-').map(Number);
      const csvContent = monthlyDailyStatsToCSV(stats.daily, year, month);
      const filename = `${memberName}_月全体日別統計_${selectedMonth}.csv`;
      downloadCSV(csvContent, filename);
    };
    
    // 全体CSVをエクスポート
    const exportSummary = () => {
      if (!stats) return;
      
      const csvContent = summaryStatsToCSV(stats);
      const filename = `${memberName}_統計サマリー_${selectedMonth}.csv`;
      downloadCSV(csvContent, filename);
    };
    
    // 月の選択が変わったら統計を再読み込み
    $: if (selectedMonth) {
      loadStats();
    }
    
    // 過去6ヶ月の選択肢を作成
    const monthOptions = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'yyyy年M月', { locale: ja });
      return { value, label };
    });
    
    onMount(() => {
      loadStats();
    });
  </script>
  
  <div class="stats-view">
    <h3>
      <span class="grade-badge" style="background-color: {GRADE_COLORS[memberGrade]}">
        {memberGrade}
      </span>
      {memberName}の統計
    </h3>
    
    <div class="month-selector">
      <label for="month-select">表示する月</label>
      <select id="month-select" bind:value={selectedMonth}>
        {#each monthOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
    
    {#if loading}
      <div class="loading">読み込み中...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if stats}
      <div class="stats-container">
        <!-- サマリー -->
        <div class="stats-section">
          <h4>集計サマリー</h4>
          <div class="summary-stats">
            <div class="summary-item">
              <span class="label">合計滞在時間</span>
              <span class="value">{formatDuration(stats.total.totalTime)}</span>
            </div>
            <div class="summary-item">
              <span class="label">平均滞在時間（日）</span>
              <span class="value">{formatDuration(stats.total.averageTime)}</span>
            </div>
            <div class="summary-item">
              <span class="label">出席日数</span>
              <span class="value">{stats.total.daysPresent}日</span>
            </div>
          </div>
          
          <div class="weekday-stats">
            <div class="weekday-item">
              <h5>平日</h5>
              <div class="weekday-data">
                <div class="data-item">
                  <span>合計: {formatDuration(stats.weekday.totalTime)}</span>
                </div>
                <div class="data-item">
                  <span>平均: {formatDuration(stats.weekday.averageTime)}</span>
                </div>
                <div class="data-item">
                  <span>日数: {stats.weekday.daysPresent}日</span>
                </div>
              </div>
            </div>
            
            <div class="weekday-item">
              <h5>休日</h5>
              <div class="weekday-data">
                <div class="data-item">
                  <span>合計: {formatDuration(stats.weekend.totalTime)}</span>
                </div>
                <div class="data-item">
                  <span>平均: {formatDuration(stats.weekend.averageTime)}</span>
                </div>
                <div class="data-item">
                  <span>日数: {stats.weekend.daysPresent}日</span>
                </div>
              </div>
            </div>
          </div>
          
          <button class="export-button" on:click={exportSummary}>
            サマリーをCSVでエクスポート
          </button>
        </div>
        
        <!-- 日別統計 -->
        {#if stats.daily.size > 0}
          <div class="stats-section">
            <h4>日別統計</h4>
            <div class="table-container">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>日付</th>
                    <th>滞在時間</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Array.from(stats.daily.entries()).sort((a, b) => a[0].localeCompare(b[0])) as [day, dayStat]}
                    <tr class={isWeekend(new Date(day)) ? 'weekend' : ''}>
                      <td>{formatDate(day)}</td>
                      <td>{formatDuration(dayStat.totalTime)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <button class="export-button" on:click={exportDaily}>
              日別データをCSVでエクスポート
            </button>
            <button class="export-button monthly-daily-export" on:click={exportMonthlyDaily}>
              <svg class="icon" viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              月全体の日別データをCSVでエクスポート
            </button>
          </div>
        {/if}
        
        <!-- 週別統計 -->
        {#if stats.weekly.size > 0}
          <div class="stats-section">
            <h4>週別統計</h4>
            <div class="table-container">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>週</th>
                    <th>合計滞在時間</th>
                    <th>出席日数</th>
                    <th>平均滞在時間</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Array.from(stats.weekly.entries()).sort((a, b) => a[0].localeCompare(b[0])) as [week, weekStat]}
                    <tr>
                      <td>{formatWeek(week)}</td>
                      <td>{formatDuration(weekStat.totalTime)}</td>
                      <td>{weekStat.daysPresent}日</td>
                      <td>{formatDuration(weekStat.averageTime)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <button class="export-button" on:click={exportWeekly}>
              週別データをCSVでエクスポート
            </button>
          </div>
        {/if}
        
        <!-- 月別統計 -->
        {#if stats.monthly.size > 0}
          <div class="stats-section">
            <h4>月別統計</h4>
            <div class="table-container">
              <table class="stats-table">
                <thead>
                  <tr>
                    <th>月</th>
                    <th>合計滞在時間</th>
                    <th>出席日数</th>
                    <th>平均滞在時間</th>
                  </tr>
                </thead>
                <tbody>
                  {#each Array.from(stats.monthly.entries()).sort((a, b) => a[0].localeCompare(b[0])) as [month, monthStat]}
                    <tr>
                      <td>{formatMonth(month)}</td>
                      <td>{formatDuration(monthStat.totalTime)}</td>
                      <td>{monthStat.daysPresent}日</td>
                      <td>{formatDuration(monthStat.averageTime)}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            <button class="export-button" on:click={exportMonthly}>
              月別データをCSVでエクスポート
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-stats">統計データがありません</div>
    {/if}
  </div>
  
  <style>
    .stats-view {
      margin-top: 20px;
    }
    
    h3 {
      margin-bottom: 16px;
      color: #333;
      font-size: 18px;
    }
    
    .month-selector {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    label {
      font-weight: bold;
      color: #555;
    }
    
    select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .loading, .error, .empty-stats {
      padding: 20px;
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    
    .error {
      color: #f44336;
    }
    
    .stats-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .stats-section {
      background-color: #f5f5f5;
      border-radius: 6px;
      padding: 16px;
    }
    
    h4 {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 16px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 8px;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .summary-item {
      background-color: white;
      padding: 12px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 16px;
      font-weight: bold;
      color: #1976d2;
    }
    
    .weekday-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .weekday-item {
      background-color: white;
      padding: 12px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    h5 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 14px;
      color: #333;
    }
    
    .weekday-data {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .data-item {
      font-size: 14px;
      color: #555;
    }
    
    .table-container {
      overflow-x: auto;
      margin-bottom: 16px;
    }
    
    .stats-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    
    .stats-table th,
    .stats-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .stats-table th {
      background-color: #e0e0e0;
      font-weight: bold;
    }
    
    .stats-table tr.weekend {
      background-color: #f8f8f8;
    }
    
    .export-button {
      padding: 8px 16px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .export-button:hover {
      background-color: #1565c0;
    }

    .monthly-daily-export {
      background-color: #2e7d32;
      font-weight: bold;
      padding: 10px 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .monthly-daily-export:hover {
      background-color: #1b5e20;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .monthly-daily-export .icon {
      margin-right: 8px;
    }
    
    @media (max-width: 768px) {
      .summary-stats,
      .weekday-stats {
        grid-template-columns: 1fr;
      }
    }
  </style>