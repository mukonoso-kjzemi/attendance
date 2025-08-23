<script lang="ts">
  import { onMount } from 'svelte';
  import { getRecordsForPeriod, updateRecord, deleteRecord, addOutRecordForIn } from '$lib/firebase/records';
  import type { Record as RawRecord } from '$lib/utils/types';
  import { format, startOfMonth, endOfMonth, differenceInMinutes, parseISO } from 'date-fns';

  type PairedRecord = {
    key: string; // ユニークなキー
    inId?: string;
    outId?: string;
    inTimestamp?: Date;
    outTimestamp?: Date;
    duration?: number;
    isUnmatchedOut: boolean;
  };

  export let memberId: string;
  export let memberName: string;
  export let close: () => void;

  let pairedRecords: PairedRecord[] = [];
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
      pairedRecords = pairRecords(rawRecords);
    } catch (error) {
      console.error("Failed to fetch records:", error);
      pairedRecords = [];
    } finally {
      isLoading = false;
    }
  }

  function pairRecords(rawRecords: RawRecord[]): PairedRecord[] {
    const inRecords = new Map(rawRecords.filter(r => r.type === 'in').map(r => [r.id, { ...r }]));
    const outRecords = rawRecords.filter(r => r.type === 'out');
    const result: PairedRecord[] = [];
    const usedInIds = new Set<string>();

    outRecords.forEach(outRec => {
      let correspondingIn: RawRecord | undefined;
      let correspondingInId: string | undefined;

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
        result.push({
          key: correspondingInId,
          inId: correspondingInId,
          outId: outRec.id,
          inTimestamp: correspondingIn.timestamp,
          outTimestamp: outRec.timestamp,
          duration: outRec.duration,
          isUnmatchedOut: false,
        });
        usedInIds.add(correspondingInId);
      } else {
        result.push({
          key: outRec.id,
          outId: outRec.id,
          outTimestamp: outRec.timestamp,
          isUnmatchedOut: true,
        });
      }
    });

    inRecords.forEach((inRec, id) => {
      if (!usedInIds.has(id)) {
        result.push({
          key: id,
          inId: id,
          inTimestamp: inRec.timestamp,
          isUnmatchedOut: false,
        });
      }
    });

    return result.sort((a, b) => {
      const timeA = a.inTimestamp || a.outTimestamp;
      const timeB = b.inTimestamp || b.outTimestamp;
      if (!timeA || !timeB) return 0;
      return timeB.getTime() - timeA.getTime();
    });
  }

  function handleEdit(record: PairedRecord) {
    editingRecordId = record.key;
    editValues.in = record.inTimestamp && !record.isUnmatchedOut ? format(record.inTimestamp, "yyyy-MM-dd'T'HH:mm") : '';
    editValues.out = record.outTimestamp ? format(record.outTimestamp, "yyyy-MM-dd'T'HH:mm") : '';
  }

  function handleCancel() {
    editingRecordId = null;
  }

  async function handleSave(record: PairedRecord) {
    if (!editingRecordId) return;

    const inDate = editValues.in ? parseISO(editValues.in) : null;
    const outDate = editValues.out ? parseISO(editValues.out) : null;

    try {
      if (record.isUnmatchedOut) {
        // ペアのいないout記録の修正
        if (outDate && record.outId) {
          await updateRecord(memberId, record.outId, { timestamp: outDate });
        }
      } else if (record.inId) {
        // ペア、またはinのみの記録の修正
        if (inDate) {
          await updateRecord(memberId, record.inId, { timestamp: inDate });
        }

        if (record.outId && outDate && inDate) { // 既存ペアの更新
          const duration = differenceInMinutes(outDate, inDate);
          await updateRecord(memberId, record.outId, { 
            timestamp: outDate, 
            inTimestamp: inDate, 
            duration: Math.max(0, duration) 
          });
        } else if (!record.outId && outDate && inDate) { // inのみの記録にoutを追加
          await addOutRecordForIn(memberId, outDate, inDate);
        }
      }
      
      editingRecordId = null;
      await fetchRecords();
    } catch (error) {
      console.error("Failed to save record:", error);
      alert("記録の保存に失敗しました。");
    }
  }

  async function handleDelete(record: PairedRecord) {
    const confirmMessage = record.isUnmatchedOut
      ? "この退室記録を削除しますか？"
      : record.outId
        ? "この入室記録と、対応する退室記録の両方を削除しますか？"
        : "この入室記録を削除しますか？";

    if (!confirm(confirmMessage)) return;

    try {
      if (record.isUnmatchedOut && record.outId) {
        await deleteRecord(memberId, record.outId);
      } else if (record.inId) {
        await deleteRecord(memberId, record.inId);
        if (record.outId) {
          await deleteRecord(memberId, record.outId);
        }
      }
      await fetchRecords();
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("記録の削除に失敗しました。");
    }
  }

  $: if (memberId && selectedYear && selectedMonth) {
    fetchRecords();
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
    {:else if pairedRecords.length === 0}
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
          {#each pairedRecords as record (record.key)}
            <tr>
              {#if editingRecordId === record.key}
                <!-- Edit Mode -->
                <td>
                  {#if !record.isUnmatchedOut}
                    <input type="datetime-local" bind:value={editValues.in}>
                  {/if}
                </td>
                <td><input type="datetime-local" bind:value={editValues.out}></td>
                <td>-</td>
                <td>
                  <button on:click={() => handleSave(record)}>保存</button>
                  <button on:click={handleCancel}>キャンセル</button>
                </td>
              {:else}
                <!-- Display Mode -->
                <td>
                  {#if !record.isUnmatchedOut && record.inTimestamp}
                    {format(record.inTimestamp, 'yyyy/MM/dd HH:mm')}
                  {/if}
                </td>
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
              {/if}
            </tr>
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
    vertical-align: middle;
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