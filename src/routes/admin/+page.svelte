<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { initMembersListener, sortedMembers } from '$lib/stores/members';
    import { updateMemberStatus } from '$lib/firebase/members';
    import { addRecord } from '$lib/firebase/records';
    import type { Member } from '$lib/utils/types';
    import { format } from 'date-fns';
    import { ja } from 'date-fns/locale';
    import { GRADE_COLORS } from '$lib/constants';
    
    let unsubscribe: () => void;
    let processing = false;
    let selectedMemberId = '';
    
    // 全員退室処理
    const setAllOut = async () => {
      if (!confirm('全員を退室状態に変更しますか？')) {
        return;
      }
      
      processing = true;
      
      try {
        const promises = $sortedMembers
          .filter(member => member.status === 'in')
          .map(async (member) => {
            await addRecord(member.id, 'out');
            await updateMemberStatus(member.id, 'out');
          });
        
        await Promise.all(promises);
      } catch (err) {
        console.error('Failed to set all members out:', err);
        alert('処理に失敗しました');
      } finally {
        processing = false;
      }
    };
    
    // 全員入室処理
    const setAllIn = async () => {
      if (!confirm('全員を入室状態に変更しますか？')) {
        return;
      }
      
      processing = true;
      
      try {
        const promises = $sortedMembers
          .filter(member => member.status === 'out')
          .map(async (member) => {
            await addRecord(member.id, 'in');
            await updateMemberStatus(member.id, 'in');
          });
        
        await Promise.all(promises);
      } catch (err) {
        console.error('Failed to set all members in:', err);
        alert('処理に失敗しました');
      } finally {
        processing = false;
      }
    };
    
    // 選択したメンバーの状態を変更
    const toggleSelected = async () => {
      if (!selectedMemberId) {
        alert('メンバーを選択してください');
        return;
      }
      
      const member = $sortedMembers.find(m => m.id === selectedMemberId);
      if (!member) return;
      
      processing = true;
      
      try {
        const newStatus = member.status === 'in' ? 'out' : 'in';
        await addRecord(member.id, newStatus);
        await updateMemberStatus(member.id, newStatus);
      } catch (err) {
        console.error('Failed to toggle member status:', err);
        alert('処理に失敗しました');
      } finally {
        processing = false;
      }
    };
    
    onMount(() => {
      unsubscribe = initMembersListener();
    });
    
    onDestroy(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
  </script>
  
  <svelte:head>
    <title>管理画面 | 滞在管理システム</title>
  </svelte:head>
  
  <div class="admin-page">
    <header class="header">
      <h1>管理画面</h1>
      <div class="header-links">
        <a href="/" class="back-link">トップに戻る</a>
        <a href="/admin/members" class="nav-link">メンバー管理</a>
        <a href="/admin/stats" class="nav-link">統計</a>
      </div>
    </header>
    
    <div class="admin-actions">
      <section class="action-section">
        <h2>一括操作</h2>
        <div class="action-buttons">
          <button
            on:click={setAllOut}
            disabled={processing || $sortedMembers.every(m => m.status === 'out')}
            class="out-button"
          >
            全員退室
          </button>
          
          <button
            on:click={setAllIn}
            disabled={processing || $sortedMembers.every(m => m.status === 'in')}
            class="in-button"
          >
            全員入室
          </button>
        </div>
      </section>
      
      <section class="action-section">
        <h2>個別操作</h2>
        
        <div class="member-selector">
          <select bind:value={selectedMemberId} disabled={processing}>
            <option value="">メンバーを選択...</option>
            {#each $sortedMembers as member}
              <option value={member.id}>
                {member.name} ({member.status === 'in' ? '入室中' : '退室中'})
              </option>
            {/each}
          </select>
          
          <button
            on:click={toggleSelected}
            disabled={processing || !selectedMemberId}
            class="toggle-button"
          >
            状態を切り替え
          </button>
        </div>
      </section>
    </div>
    
    <section class="members-section">
      <h2>メンバー状態</h2>
      
      {#if $sortedMembers.length === 0}
        <p class="empty-message">メンバーがいません</p>
      {:else}
        <div class="members-table-container">
          <table class="members-table">
            <thead>
              <tr>
                <th>学年</th>
                <th>名前</th>
                <th>状態</th>
                <th>最終更新</th>
                <th>アクション</th>
              </tr>
            </thead>
            <tbody>
              {#each $sortedMembers as member}
                <tr class={member.status}>
                  <td>
                    <span class="grade-badge" style="background-color: {GRADE_COLORS[member.grade]}">
                      {member.grade}
                    </span>
                  </td>
                  <td>{member.name}</td>
                  <td>
                    <span class="status-badge {member.status}">
                      {member.status === 'in' ? '入室中' : '退室中'}
                    </span>
                  </td>
                  <td>
                    {format(member.lastStatusChange, 'MM/dd HH:mm', { locale: ja })}
                  </td>
                  <td>
                    <a href="/member/{member.id}" class="view-link">詳細</a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </div>
  
  <style>
    .admin-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
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
    
    .back-link, .nav-link {
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.3s;
    }
    
    .back-link {
      background-color: #f5f5f5;
      color: #333;
    }
    
    .back-link:hover {
      background-color: #e0e0e0;
    }
    
    .nav-link {
      background-color: #1976d2;
      color: white;
    }
    
    .nav-link:hover {
      background-color: #1565c0;
    }
    
    .admin-actions {
      margin-bottom: 24px;
    }
    
    .action-section {
      background-color: #f5f5f5;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    h2 {
      font-size: 18px;
      color: #333;
      margin-top: 0;
      margin-bottom: 16px;
    }
    
    .action-buttons {
      display: flex;
      gap: 16px;
    }
    
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .out-button {
      background-color: #f44336;
      color: white;
    }
    
    .out-button:hover:not(:disabled) {
      background-color: #d32f2f;
    }
    
    .in-button {
      background-color: #4caf50;
      color: white;
    }
    
    .in-button:hover:not(:disabled) {
      background-color: #388e3c;
    }
    
    .toggle-button {
      background-color: #ff9800;
      color: white;
    }
    
    .toggle-button:hover:not(:disabled) {
      background-color: #f57c00;
    }
    
    .member-selector {
      display: flex;
      gap: 16px;
    }
    
    select {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    
    .members-section {
      margin-top: 32px;
    }
    
    .empty-message {
      padding: 20px;
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 6px;
    }
    
    .members-table-container {
      overflow-x: auto;
    }
    
    .members-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .members-table th,
    .members-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .members-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .members-table tr.in {
      background-color: rgba(76, 175, 80, 0.1);
    }
    
    .grade-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-align: center;
      min-width: 40px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-badge.in {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .status-badge.out {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .view-link {
      color: #1976d2;
      text-decoration: none;
    }
    
    .view-link:hover {
      text-decoration: underline;
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      
      .header-links {
        flex-wrap: wrap;
      }
      
      .action-buttons,
      .member-selector {
        flex-direction: column;
        gap: 8px;
      }
    }
  </style>