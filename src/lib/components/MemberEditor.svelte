<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { addMember, updateMember, deleteMember } from '$lib/firebase/members';
    import type { Member, Grade } from '$lib/utils/types';
    import { GRADE_ORDER } from '$lib/constants';
    
    export let member: Member | null = null;
    
    const dispatch = createEventDispatcher();
    
    let name = member?.name || '';
    let grade = member?.grade || 'H3'; // デフォルト値としてH3を設定
    let sortValue = member?.sortValue || undefined;
    let processing = false;
    let error = '';
    
    const resetForm = () => {
      name = '';
      grade = 'H3';
      sortValue = undefined;
      error = '';
    };
    
    const handleSubmit = async () => {
      if (!name.trim()) {
        error = '名前を入力してください';
        return;
      }
      
      error = '';
      processing = true;
      
      try {
        if (member) {
          // 既存メンバーの更新
          await updateMember(member.id, name, grade, sortValue);
          dispatch('updated', { id: member.id, name, grade, sortValue });
        } else {
          // 新規メンバーの追加
          const id = await addMember(name, grade, sortValue);
          dispatch('created', { id, name, grade, sortValue });
          resetForm();
        }
      } catch (err) {
        console.error('Member save failed:', err);
        error = member ? '更新に失敗しました' : '追加に失敗しました';
      } finally {
        processing = false;
      }
    };
    
    const handleDelete = async () => {
      if (!member) return;
      
      if (!confirm(`${member.name}を削除してもよろしいですか？`)) {
        return;
      }
      
      processing = true;
      
      try {
        await deleteMember(member.id);
        dispatch('deleted', { id: member.id });
      } catch (err) {
        console.error('Member delete failed:', err);
        error = '削除に失敗しました';
      } finally {
        processing = false;
      }
    };
    
    const handleCancel = () => {
      dispatch('cancel');
      resetForm();
    };
  </script>
  
  <div class="member-editor">
    <h3>{member ? 'メンバー編集' : 'メンバー追加'}</h3>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="name">名前</label>
        <input
          type="text"
          id="name"
          bind:value={name}
          placeholder="メンバー名を入力"
          disabled={processing}
        />
      </div>
      
      <div class="form-group">
        <label for="grade">学年</label>
        <select
          id="grade"
          bind:value={grade}
          disabled={processing}
        >
          {#each GRADE_ORDER as gradeOption}
            <option value={gradeOption}>{gradeOption}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label for="sortValue">ソート順（オプション）</label>
        <input
          type="number"
          id="sortValue"
          bind:value={sortValue}
          placeholder="数値を入力"
          disabled={processing}
        />
        <div class="help-text">同じ学年内での表示順を指定します。未設定の場合は最後に表示されます。</div>
      </div>
      
      {#if error}
        <div class="error">{error}</div>
      {/if}
      
      <div class="actions">
        <button type="submit" class="save-button" disabled={processing}>
          {processing ? '処理中...' : member ? '更新' : '追加'}
        </button>
        
        {#if member}
          <button
            type="button"
            class="delete-button"
            on:click={handleDelete}
            disabled={processing}
          >
            削除
          </button>
        {/if}
        
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
    .member-editor {
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
    
    .form-group {
      margin-bottom: 16px;
    }
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: bold;
      color: #555;
    }
    
    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    input:focus {
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
    
    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
  </style>