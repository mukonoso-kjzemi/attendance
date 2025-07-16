<script lang="ts">
    import { onMount } from 'svelte';
    import { getRecentRecords } from '$lib/firebase/records';
    import type { Record } from '$lib/utils/types';
    import { format } from 'date-fns';
    import { ja } from 'date-fns/locale';
    
    export let memberId: string;
    export let days = 7;
    
    let records: Record[] = [];
    let loading = true;
    let error = '';
    
    // 滞在時間を表示用にフォーマット
    const formatDuration = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        return `${hours}時間${mins > 0 ? ` ${mins}分` : ''}`;
      }
      
      return `${mins}分`;
    };
    
    // 履歴データを読み込み
    const loadRecords = async () => {
      try {
        loading = true;
        records = await getRecentRecords(memberId, days);
      } catch (err) {
        console.error('Failed to load records:', err);
        error = '履歴の読み込みに失敗しました';
      } finally {
        loading = false;
      }
    };
    
    onMount(() => {
      loadRecords();
    });
  </script>
  
  <div class="history-container">
    <h3>最近の履歴 (直近{days}日間)</h3>
    
    {#if loading}
      <div class="loading">読み込み中...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if records.length === 0}
      <div class="empty">履歴がありません</div>
    {:else}
      <div class="history-list">
        {#each records as record}
          <div class="history-item {record.type}">
            <div class="record-type">
              {record.type === 'in' ? '入室' : '退室'}
            </div>
            <div class="record-time">
              <div class="date">{format(record.timestamp, 'yyyy年MM月dd日', { locale: ja })}</div>
              <div class="time">{format(record.timestamp, 'HH:mm', { locale: ja })}</div>
            </div>
            {#if record.type === 'out' && record.duration}
              <div class="duration">
                滞在時間: {formatDuration(record.duration)}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    
    <button class="refresh-button" on:click={loadRecords} disabled={loading}>
      更新する
    </button>
  </div>
  
  <style>
    .history-container {
      margin-top: 20px;
    }
    
    h3 {
      margin-bottom: 16px;
      color: #333;
      font-size: 18px;
    }
    
    .loading, .error, .empty {
      padding: 20px;
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    
    .error {
      color: #f44336;
    }
    
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .history-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .history-item.in {
      background-color: #e8f5e9;
      border-left-color: #4caf50;
    }
    
    .history-item.out {
      background-color: #ffebee;
      border-left-color: #f44336;
    }
    
    .record-type {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .record-time {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .date {
      font-size: 14px;
    }
    
    .time {
      font-size: 14px;
      font-weight: bold;
    }
    
    .duration {
      font-size: 14px;
      color: #666;
    }
    
    .refresh-button {
      margin-top: 16px;
      padding: 8px 16px;
      background-color: #e0e0e0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s;
    }
    
    .refresh-button:hover:not(:disabled) {
      background-color: #d0d0d0;
    }
    
    .refresh-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>