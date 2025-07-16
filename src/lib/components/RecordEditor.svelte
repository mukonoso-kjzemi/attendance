<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { updateRecord, deleteRecord } from '$lib/firebase/records';
    import type { Record, RecordType } from '$lib/utils/types';
    import { format } from 'date-fns';
    
    export let record: Record;
    
    const dispatch = createEventDispatcher();
    
    // 編集用のフォームデータ
    let type: RecordType = record.type;
    let date = format(record.timestamp, 'yyyy-MM-dd');
    let time = format(record.timestamp, 'HH:mm');
    let duration = record.type === 'out' ? record.duration : undefined;
    
    // 記録タイプが変更されたときの処理
    $: if (type === 'out' && record.type === 'in') {
      // 'in'から'out'に変更した場合、デフォルトの滞在時間を設定
      if (duration === undefined) {
        duration = 0;
      }
    }
    
    let processing = false;
    let error = '';
    
    // 記録の更新処理
    const handleUpdate = async () => {
      if (!date || !time) {
        error = '日付と時間を入力してください';
        return;
      }
      
      if (type === 'out' && (!duration || duration < 0)) {
        error = '有効な滞在時間を入力してください';
        return;
      }
      
      error = '';
      processing = true;
      
      try {
        // タイムスタンプを作成
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        const timestamp = new Date(year, month - 1, day, hours, minutes);
        
        // 更新データを作成
        const updateData: {
          type?: RecordType;
          timestamp?: Date;
          duration?: number;
        } = {
          type,
          timestamp
        };
        
        if (type === 'out') {
          updateData.duration = duration;
        }
        
        // 記録を更新
        await updateRecord(record.memberId, record.id, record.timestamp, updateData);
        
        // 更新完了イベントを発行
        dispatch('updated', {
          ...record,
          type,
          timestamp,
          duration: type === 'out' ? duration : undefined
        });
      } catch (err) {
        console.error('Record update failed:', err);
        error = '更新に失敗しました';
      } finally {
        processing = false;
      }
    };
    
    // 記録の削除処理
    const handleDelete = async () => {
      if (!confirm('この記録を削除してもよろしいですか？')) {
        return;
      }
      
      processing = true;
      
      try {
        await deleteRecord(record.memberId, record.id, record.timestamp);
        dispatch('deleted', { id: record.id });
      } catch (err) {
        console.error('Record delete failed:', err);
        error = '削除に失敗しました';
      } finally {
        processing = false;
      }
    };
    
    // キャンセル処理
    const handleCancel = () => {
      dispatch('cancel');
    };
  </script>
  
  <div class="record-editor">
    <h3>記録編集</h3>
    
    <form on:submit|preventDefault={handleUpdate}>
      <div class="form-group">
        <label for="type">記録タイプ</label>
        <select id="type" bind:value={type} disabled={processing}>
          <option value="in">入室</option>
          <option value="out">退室</option>
        </select>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="date">日付</label>
          <input
            type="date"
            id="date"
            bind:value={date}
            disabled={processing}
          />
        </div>
        
        <div class="form-group">
          <label for="time">時間</label>
          <input
            type="time"
            id="time"
            bind:value={time}
            disabled={processing}
          />
        </div>
      </div>
      
      {#if type === 'out'}
        <div class="form-group">
          <label for="duration">滞在時間（分）</label>
          <input
            type="number"
            id="duration"
            bind:value={duration}
            min="0"
            disabled={processing}
          />
        </div>
      {/if}
      
      {#if error}
        <div class="error">{error}</div>
      {/if}
      
      <div class="actions">
        <button type="submit" class="save-button" disabled={processing}>
          {processing ? '処理中...' : '更新'}
        </button>
        
        <button
          type="button"
          class="delete-button"
          on:click={handleDelete}
          disabled={processing}
        >
          削除
        </button>
        
        <button
          type="button"
          class="cancel-button"
          on:click={handleCancel}
          disabled={processing}
        >
          キャンセル
        </button>
      </div>
    </form>
  </div>
  
  <style>
    .record-editor {
      background-color: #f5f5f5;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 20px;
    }
    
    h3 {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 18px;
      color: #333;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .form-group {
      margin-bottom: 16px;
      flex: 1;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: bold;
      color: #555;
    }
    
    input, select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    input:focus, select:focus {
      border-color: #1976d2;
      outline: none;
    }
    
    .error {
      color: #f44336;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .actions {
      display: flex;
      gap: 10px;
    }
    
    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .save-button {
      background-color: #1976d2;
      color: white;
    }
    
    .save-button:hover:not(:disabled) {
      background-color: #1565c0;
    }
    
    .delete-button {
      background-color: #f44336;
      color: white;
    }
    
    .delete-button:hover:not(:disabled) {
      background-color: #d32f2f;
    }
    
    .cancel-button {
      background-color: #e0e0e0;
      color: #333;
    }
    
    .cancel-button:hover:not(:disabled) {
      background-color: #d0d0d0;
    }
    
    @media (max-width: 500px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  </style>