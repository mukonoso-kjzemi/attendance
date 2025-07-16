<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { initMembersListener, sortedMembers } from '$lib/stores/members';
    import MemberEditor from '$lib/components/MemberEditor.svelte';
    import type { Member } from '$lib/utils/types';
    import { format } from 'date-fns';
    import { ja } from 'date-fns/locale';
    import { GRADE_COLORS } from '$lib/constants';
    
    let unsubscribe: () => void;
    let editingMember: Member | null = null;
    let showAddForm = false;
    
    // メンバー編集モードを開始
    const startEdit = (member: Member) => {
      editingMember = member;
      showAddForm = false;
    };
    
    // 追加フォームを表示
    const showAddMemberForm = () => {
      editingMember = null;
      showAddForm = true;
    };
    
    // 編集/追加をキャンセル
    const cancelEdit = () => {
      editingMember = null;
      showAddForm = false;
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
    <title>メンバー管理 | 滞在管理システム</title>
  </svelte:head>
  
  <div class="members-admin-page">
    <header class="header">
      <h1>メンバー管理</h1>
      <div class="header-links">
        <a href="/" class="back-link">トップに戻る</a>
        <a href="/admin" class="back-link">管理画面に戻る</a>
      </div>
    </header>
    
    <div class="page-actions">
      {#if !showAddForm}
        <button class="add-button" on:click={showAddMemberForm}>
          新しいメンバーを追加
        </button>
      {/if}
    </div>
    
    {#if showAddForm}
      <MemberEditor 
        on:created={() => { showAddForm = false; }}
        on:cancel={cancelEdit}
      />
    {/if}
    
    {#if editingMember}
      <MemberEditor 
        member={editingMember}
        on:updated={() => { editingMember = null; }}
        on:deleted={() => { editingMember = null; }}
        on:cancel={cancelEdit}
      />
    {/if}
    
    <section class="members-section">
      <h2>メンバー一覧</h2>
      
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
                <tr>
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
                    {format(member.lastStatusChange, 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </td>
                  <td class="actions-cell">
                    <button 
                      class="edit-button" 
                      on:click={() => startEdit(member)}
                      disabled={editingMember?.id === member.id}
                    >
                      編集
                    </button>
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
    .members-admin-page {
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
    
    .page-actions {
      margin-bottom: 20px;
    }
    
    .add-button {
      padding: 10px 20px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .add-button:hover {
      background-color: #388e3c;
    }
    
    .members-section {
      margin-top: 32px;
    }
    
    h2 {
      font-size: 18px;
      color: #333;
      margin-top: 0;
      margin-bottom: 16px;
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
    
    .actions-cell {
      display: flex;
      gap: 8px;
    }
    
    .edit-button {
      padding: 6px 12px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .edit-button:hover:not(:disabled) {
      background-color: #1565c0;
    }
    
    .edit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .view-link {
      display: inline-block;
      padding: 6px 12px;
      background-color: #f5f5f5;
      color: #333;
      text-decoration: none;
      border-radius: 4px;
      font-size: 12px;
      transition: background-color 0.3s;
    }
    
    .view-link:hover {
      background-color: #e0e0e0;
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
      
      .actions-cell {
        flex-direction: column;
        gap: 4px;
      }
    }
  </style>