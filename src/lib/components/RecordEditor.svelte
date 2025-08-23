<script lang="ts">
  import { onMount } from 'svelte';
  import { getRecordsForPeriod, updateRecord, deleteRecord } from '$lib/firebase/records';
  import type { Record } from '$lib/utils/types';
  import { format, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';

  export let memberId: string;
  export let memberName: string;
  export let close: () => void;

  let records: Record[] = [];
  let isLoading = true;
  let selectedYear = new Date().getFullYear();
  let selectedMonth = new Date().getMonth() + 1;
  let editingRecordId: string | null = null;
  let editValues: { in: string; out: string } = { in: '', out: '' };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  async function fetchRecords() {
    isLoading = true;
    const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = endOfMonth(startDate);
    
    try {
      const rawRecords = await getRecordsForPeriod(memberId, startDate, endDate);
      // `in`と`out`をペアにする
      records = pairRecords(rawRecords);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      records = [];
    } finally {
      isLoading = false;
    }
  }

  // inとoutのペアを組むヘルパー関数
  function pairRecords(rawRecords: Record[]): Record[] {
    const paired: Record[] = [];
    const inRecords = new Map(rawRecords.filter(r => r.type === 'in').map(r => [r.id, r]));
    const outRecords = rawRecords.filter(r => r.type === 'out');

    const usedInIds = new Set<string>();

    outRecords.forEach(outRec => {
      let correspondingIn: Record | undefined;
      let correspondingInId: string | undefined;

      // outRecord.inTimestamp を使って inRecord を見つける
      if (outRec.inTimestamp) {
        for (const [id, inRec] of inRecords.entries()) {
          if (inRec.timestamp.getTime() === outRec.inTimestamp.getTime()) {
            correspondingIn = inRec;
            correspondingInId = id;
            break;
          }
        }
      }

      if (correspondingIn && correspondingInId) {
        paired.push({
          ...correspondingIn,
          outTimestamp: outRec.timestamp,
          outId: outRec.id,
          duration: outRec.duration,
        });
        usedInIds.add(correspondingInId);
      } else {
        // 対応するinが見つからないout記録
        paired.push(outRec);
      }
    });

    // まだペアになっていないin記録（退室していないもの）を追加
    inRecords.forEach((inRec, id) => {
      if (!usedInIds.has(id)) {
        paired.push(inRec);
      }
    });

    return paired.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  function handleEdit(record: Record) {
    editingRecordId = record.id;
    // Svelteはdatetime-localのために `YYYY-MM-DDTHH:mm` 形式を要求する
    editValues.in = format(record.timestamp, "yyyy-MM-dd'T'HH:mm");
    editValues.out = record.outTimestamp ? format(record.outTimestamp, "yyyy-MM-dd'T'HH:mm") : '';
  }

  async function handleSave(record: Record) {
    if (!editingRecordId) return;

    const inDate = new Date(editValues.in);
    const outDate = editValues.out ? new Date(editValues.out) : null;

    try {
      // 1. 'in' recordのタイムスタンプを更新
      await updateRecord(memberId, record.id, { timestamp: inDate });

      // 2. 'out' recordがあれば更新、なければ何もしない
      if (record.outId && outDate) {
        const duration = differenceInMinutes(outDate, inDate);
        await updateRecord(memberId, record.outId, { 
          timestamp: outDate,
          inTimestamp: inDate, // ペアとなるinのタイムスタンプも更新
          duration: Math.max(0, duration)
        });
      }
      
      editingRecordId = null;
      await fetchRecords(); // データを再取得してUIを更新
    } catch (error) {
      console.error("Failed to save record:", error);
      alert("記録の保存に失敗しました。");
    }
  }

  async function handleDelete(record: Record) {
    if (!confirm("この入室記録と、対応する退室記録を削除しますか？")) return;

    try {
      // 'in' recordを削除
      await deleteRecord(memberId, record.id);
      // 対応する 'out' recordがあればそれも削除
      if (record.outId) {
        await deleteRecord(memberId, record.outId);
      }
      await fetchRecords(); // UIを更新
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("記録の削除に失敗しました。");
    }
  }

  onMount(() => {
    fetchRecords();
  });

  $: {
    // selectedYear or selectedMonth changes
    if (!isLoading) {
      fetchRecords();
    }
  }
</script>

<div class="record-editor">
  <header class="editor-header">
    <h2>{memberName} の記録を修正</h2>
    <button class="close-button" on:click={close}>×</button>
  </header>

  <div class="controls">
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

  <div class="record-list">
    {#if isLoading}
      <p>読み込み中...</p>
    {:else if records.length === 0}
      <p>この月の記録はありません。</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>入室日時</th>
            <th>退室日時</th>
            <th>滞在時間 (分)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each records as record (record.id)}
            {#if editingRecordId === record.id}
              <!-- 編集モード -->
              <tr>
                <td><input type="datetime-local" bind:value={editValues.in}></td>
                <td>
                  {#if record.outTimestamp}
                    <input type="datetime-local" bind:value={editValues.out}>
                  {/if}
                </td>
                <td>-</td>
                <td>
                  <button on:click={() => handleSave(record)}>保存</button>
                  <button on:click={() => editingRecordId = null}>キャンセル</button>
                </td>
              </tr>
            {:else}
              <!-- 表示モード -->
              <tr>
                <td>{format(record.timestamp, 'yyyy/MM/dd HH:mm')}</td>
                <td>
                  {#if record.outTimestamp}
                    {format(record.outTimestamp, 'yyyy/MM/dd HH:mm')}
                  {:else}
                    <span class="no-exit">退室記録なし</span>
                  {/if}
                </td>
                <td>
                  {#if record.duration !== undefined}
                    {record.duration}
                  {/if}
                </td>
                <td>
                  <button on:click={() => handleEdit(record)}>編集</button>
                  <button on:click={() => handleDelete(record)}>削除</button>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .record-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #eee;
    padding-bottom: 12px;
  }
  h2 {
    margin: 0;
    font-size: 22px;
    color: #333;
  }
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
  }
  .controls {
    display: flex;
    gap: 10px;
  }
  select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  .record-list {
    max-height: 50vh;
    overflow-y: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th, td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }
  th {
    background-color: #f8f8f8;
    position: sticky;
    top: 0;
  }
  button {
    padding: 4px 8px;
    margin-right: 4px;
    border-radius: 4px;
    border: 1px solid #ccc;
    cursor: pointer;
  }
  .no-exit {
    color: #999;
    font-style: italic;
  }
  input[type="datetime-local"] {
    font-family: inherit;
    font-size: 14px;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
</style>