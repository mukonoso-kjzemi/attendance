<script lang="ts">
  import { onMount } from 'svelte';
  import { getMembers as getAllMembers } from '$lib/firebase/members';
  import { getAllRecords } from '$lib/firebase/records';
  import type { Member, Record as AttendanceRecord } from '$lib/utils/types';
  import { getYear, getMonth, format } from 'date-fns';
  import { downloadCSV, simplifiedShiftJISConversion } from '$lib/utils/export';

  type RankedMember = {
    id: string;
    name: string;
    grade: string;
    totalTime: number;
    records: AttendanceRecord[];
  };

  let members: Member[] = [];
  let records: AttendanceRecord[] = [];
  let rankedMembers: RankedMember[] = [];
  let isLoading = true;

  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1;
  let selectedYear = currentYear;
  let selectedMonth = currentMonth;

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  onMount(async () => {
    try {
      const [membersData, recordsData] = await Promise.all([
        getAllMembers(),
        getAllRecords()
      ]);
      members = membersData;
      records = recordsData;
      calculateRanking();
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("データの読み込みに失敗しました。");
    } finally {
      isLoading = false;
    }
  });

  function calculateRanking() {
    const targetMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const memberStats = new Map<string, { totalTime: number; records: AttendanceRecord[] }>();

    for (const record of records) {
      if (record.type === 'out' && format(record.timestamp, 'yyyy-MM') === targetMonth) {
        const memberId = record.memberId;
        if (!memberStats.has(memberId)) {
          memberStats.set(memberId, { totalTime: 0, records: [] });
        }
        const stats = memberStats.get(memberId)!;
        stats.totalTime += record.duration || 0;
        stats.records.push(record);
      }
    }

    const ranked = members.map(member => {
      const stats = memberStats.get(member.id) || { totalTime: 0, records: [] };
      return {
        id: member.id,
        name: member.name,
        grade: member.grade,
        totalTime: stats.totalTime,
        records: stats.records,
      };
    });

    ranked.sort((a, b) => b.totalTime - a.totalTime);
    rankedMembers = ranked;
  }

  function handleExportCSV() {
    if (rankedMembers.length === 0) {
      alert('エクスポートするデータがありません。');
      return;
    }

    const headers = ['順位', '名前', '学年', '総滞在時間(分)', '滞在記録'];
    
    const rows = rankedMembers.map((member, index) => {
      const recordsText = member.records
        .map(r => `in: ${format(new Date(r.timestamp).getTime() - (r.duration || 0) * 60000, 'MM/dd HH:mm')} / out: ${format(r.timestamp, 'MM/dd HH:mm')} (${r.duration}分)`)
        .join('; ');

      return [
        index + 1,
        member.name,
        member.grade,
        member.totalTime,
        `"${recordsText}"` // To handle commas in recordsText
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const filename = `${selectedYear}年${selectedMonth}月_滞在ランキング.csv`;
    
    downloadCSV(csvContent, filename);
  }

  $: if (!isLoading) {
    calculateRanking();
  }
</script>

<svelte:head>
  <title>月次滞在ランキング | 管理画面</title>
</svelte:head>

<div class="ranking-page">
  <header class="header">
    <h1>月次滞在ランキング</h1>
    <div class="header-links">
      <a href="/admin" class="back-link">管理画面に戻る</a>
    </div>
  </header>

  <div class="controls">
    <div class="month-selector">
      <select bind:value={selectedYear}>
        {#each years as year}
          <option value={year}>{year}年</option>
        {/each}
      </select>
      <select bind:value={selectedMonth}>
        {#each months as month}
          <option value={month}>{month}月</option>
        {/each}
      </select>
    </div>
  </div>

  {#if isLoading}
    <p class="loading-message">読み込み中...</p>
  {:else if rankedMembers.every(m => m.totalTime === 0)}
    <p class="empty-message">この月の滞在記録はありません。</p>
  {:else}
    <div class="ranking-table-container">
      <table class="ranking-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>名前</th>
            <th>学年</th>
            <th>総滞在時間 (分)</th>
          </tr>
        </thead>
        <tbody>
          {#each rankedMembers.filter(m => m.totalTime > 0) as member, index}
            <tr>
              <td>{index + 1}</td>
              <td>{member.name}</td>
              <td>
                <span class="grade-badge">{member.grade}</span>
              </td>
              <td>{Math.round(member.totalTime)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="export-section">
      <button on:click={handleExportCSV} class="export-button">全員分のCSVをエクスポート</button>
    </div>
  {/if}
</div>

<style>
  .ranking-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e0e0e0;
  }
  h1 {
    font-size: 28px;
    color: #1976d2;
    margin: 0;
  }
  .header-links {
    display: flex;
    gap: 12px;
  }
  .back-link {
    padding: 8px 16px;
    background-color: #f5f5f5;
    color: #333;
    text-decoration: none;
    border-radius: 4px;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  .back-link:hover {
    background-color: #e0e0e0;
  }
  .controls {
    margin-bottom: 20px;
    background-color: #f5f5f5;
    padding: 16px;
    border-radius: 6px;
  }
  .month-selector {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  .loading-message, .empty-message {
    padding: 40px;
    text-align: center;
    background-color: #f5f5f5;
    border-radius: 6px;
    font-size: 16px;
    color: #666;
  }
  .ranking-table-container {
    overflow-x: auto;
  }
  .ranking-table {
    width: 100%;
    border-collapse: collapse;
  }
  .ranking-table th, .ranking-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  .ranking-table th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
  .ranking-table tr:hover {
    background-color: #f9f9f9;
  }
  .grade-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    background-color: #777; /* Default color */
  }
  .export-section {
    margin-top: 20px;
    text-align: right;
  }
  .export-button {
    padding: 12px 24px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }
  .export-button:hover {
    background-color: #45a049;
  }
</style>
