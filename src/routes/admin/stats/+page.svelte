<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { initMembersListener, sortedMembers } from '$lib/stores/members';
    import StatsView from '$lib/components/StatsView.svelte';
    import RecordEditor from '$lib/components/RecordEditor.svelte';
    import type { Member } from '$lib/utils/types';
    
    let unsubscribe: () => void;
    let selectedMemberId = '';
    let showModal = false;
    
    // 選択されたメンバーを取得
    $: selectedMember = $sortedMembers.find(m => m.id === selectedMemberId);
    
    onMount(() => {
      unsubscribe = initMembersListener();
      
      // URLパラメータからメンバーIDを取得
      const urlParams = new URLSearchParams(window.location.search);
      const memberId = urlParams.get('member');
      
      if (memberId) {
        selectedMemberId = memberId;
      }
    });
    
    onDestroy(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });
    
    // メンバー選択時にURLを更新
    const updateURL = () => {
      const url = new URL(window.location.href);
      
      if (selectedMemberId) {
        url.searchParams.set('member', selectedMemberId);
      } else {
        url.searchParams.delete('member');
      }
      
      window.history.replaceState({}, '', url);
    };
    
    // メンバー選択が変わったらURLを更新
    $: if (selectedMemberId) {
      updateURL();
    }
  </script>
  
  <svelte:head>
    <title>統計 | 滞在管理システム</title>
  </svelte:head>
  
  <div class="stats-page">
    <header class="header">
      <h1>統計</h1>
      <div class="header-links">
        <a href="/" class="back-link">トップに戻る</a>
        <a href="/admin" class="back-link">管理画面に戻る</a>
      </div>
    </header>
    
    <div class="member-selector">
      <label for="member-select">メンバーを選択</label>
      <div class="selector-wrapper">
        <select id="member-select" bind:value={selectedMemberId}>
          <option value="">メンバーを選択...</option>
          {#each $sortedMembers as member}
            <option value={member.id}>
              [{member.grade}] {member.name}
            </option>
          {/each}
        </select>
        <button 
          class="edit-button" 
          disabled={!selectedMemberId} 
          on:click={() => showModal = true}
        >
          記録を修正
        </button>
      </div>
    </div>
    
    {#if selectedMemberId && selectedMember}
      <StatsView 
        memberId={selectedMemberId} 
        memberName={selectedMember.name}
        memberGrade={selectedMember.grade}
      />
    {:else}
      <div class="select-prompt">
        統計を表示するメンバーを選択してください
      </div>
    {/if}
  </div>

  {#if showModal && selectedMember}
    <div class="modal-backdrop" on:click={() => showModal = false}>
      <div class="modal-content" on:click|stopPropagation>
        <RecordEditor 
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          close={() => showModal = false}
        />
      </div>
    </div>
  {/if}
  
  <style>
    .stats-page {
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
    
    .member-selector {
      margin-bottom: 24px;
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
    }

    .selector-wrapper {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    label {
      font-weight: bold;
      color: #555;
      margin-bottom: 8px;
    }
    
    select {
      flex-grow: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }

    .edit-button {
      padding: 10px 20px;
      font-size: 16px;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .edit-button:hover {
      background-color: #135a9e;
    }

    .edit-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .select-prompt {
      padding: 40px;
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 6px;
      font-size: 16px;
      color: #666;
    }

    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      max-width: 90%;
      width: 700px;
      max-height: 80vh;
      overflow-y: auto;
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

      .selector-wrapper {
        flex-direction: column;
        align-items: stretch;
      }
    }
  </style>