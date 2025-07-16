<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import { getMember, getMemberRef } from '$lib/firebase/members';
    import StatusButton from '$lib/components/StatusButton.svelte';
    import HistoryList from '$lib/components/HistoryList.svelte';
    import type { Member } from '$lib/utils/types';
    import { format } from 'date-fns';
    import { ja } from 'date-fns/locale';
    import { GRADE_COLORS } from '$lib/constants';
    import { onSnapshot } from 'firebase/firestore';
    
    const memberId = $page.params.id;
    
    let member: Member | null = null;
    let loading = true;
    let error = '';
    let unsubscribe: (() => void) | null = null;
    let connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
    
    // メンバー情報を読み込み（初回のみ）
    const loadMember = async () => {
      try {
        loading = true;
        error = '';
        
        // 通常の読み込み
        member = await getMember(memberId);
        
        if (!member) {
          error = 'メンバーが見つかりません';
          return;
        }
        
        // リアルタイムリスナーのセットアップ
        setupRealTimeListener();
        
      } catch (err) {
        console.error('Failed to load member:', err);
        error = 'メンバー情報の読み込みに失敗しました';
      } finally {
        loading = false;
      }
    };
    
    // リアルタイムリスナーをセットアップ
    const setupRealTimeListener = () => {
      try {
        // 既存のリスナーがあればクリーンアップ
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        
        connectionStatus = 'connecting';
        console.log('Setting up realtime listener for member:', memberId);
        
        const memberRef = getMemberRef(memberId);
        unsubscribe = onSnapshot(memberRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            
            // メンバー情報を更新
            member = {
              id: doc.id,
              name: data.name,
              grade: data.grade || 'B4', // gradeがない場合のフォールバック
              status: data.status,
              lastStatusChange: data.lastStatusChange ? data.lastStatusChange.toDate() : new Date()
            };
            
            console.log('Member updated via realtime:', member);
            connectionStatus = 'connected';
          } else {
            error = 'メンバーが見つかりません（削除された可能性があります）';
            connectionStatus = 'disconnected';
          }
        }, (err) => {
          console.error('Realtime listener error:', err);
          error = `リアルタイム監視中にエラーが発生しました: ${err.message}`;
          connectionStatus = 'disconnected';
        });
        
      } catch (err) {
        console.error('Failed to setup realtime listener:', err);
        error = 'リアルタイム監視のセットアップに失敗しました';
        connectionStatus = 'disconnected';
      }
    };
    
    // リスナーを再接続
    const reconnect = () => {
      setupRealTimeListener();
    };
    
    onMount(() => {
      loadMember();
      
      // タブがアクティブになったときに確認
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && connectionStatus === 'disconnected') {
          reconnect();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
    
    onDestroy(() => {
      // リスナーのクリーンアップ
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });
  </script>
  
  <svelte:head>
    <title>{member?.name ?? 'メンバー'} | 滞在管理システム</title>
  </svelte:head>
  
  <div class="member-page">
    <div class="header-actions">
      <a href="/#" class="back-link">← トップに戻る</a>
      <div class="connection-info">
        {#if connectionStatus === 'connected'}
          <span class="status connected">リアルタイム監視中</span>
        {:else if connectionStatus === 'connecting'}
          <span class="status connecting">接続中...</span>
        {:else}
          <span class="status disconnected">未接続</span>
          <button class="reconnect-button" on:click={reconnect}>再接続</button>
        {/if}
      </div>
    </div>
    
    {#if loading}
      <div class="loading">読み込み中...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if member}
      <div class="member-card">
        <div class="member-header">
          <h1 class="member-name">{member.name}</h1>
          <div class="grade-badge" style="background-color: {GRADE_COLORS[member.grade]}">
            {member.grade}
          </div>
          <div class="status-badge {member.status}">
            {member.status === 'in' ? '入室中' : '退室中'}
          </div>
        </div>
        
        <div class="member-info">
          <p class="status-time">
            最終ステータス変更: {format(member.lastStatusChange, 'yyyy年MM月dd日 HH:mm', { locale: ja })}
          </p>
        </div>
        
        <div class="action-container">
          <StatusButton
            memberId={member.id}
            status={member.status}
            size="large"
          />
        </div>
        
        <HistoryList memberId={member.id} />
      </div>
    {/if}
  </div>
  
  <style>
    .member-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .back-link {
      color: #1976d2;
      text-decoration: none;
      font-size: 16px;
    }
    
    .back-link:hover {
      text-decoration: underline;
    }
    
    .connection-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status {
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
    }
    
    .status::before {
      content: "";
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }
    
    .status.connected {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .status.connected::before {
      background-color: #2e7d32;
    }
    
    .status.connecting {
      background-color: #fff3e0;
      color: #e65100;
    }
    
    .status.connecting::before {
      background-color: #e65100;
    }
    
    .status.disconnected {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .status.disconnected::before {
      background-color: #c62828;
    }
    
    .reconnect-button {
      padding: 4px 8px;
      background-color: #e0e0e0;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }
    
    .reconnect-button:hover {
      background-color: #d0d0d0;
    }
    
    .loading, .error {
      padding: 40px;
      text-align: center;
      background-color: #f5f5f5;
      border-radius: 8px;
      font-size: 16px;
    }
    
    .error {
      color: #f44336;
    }
    
    .member-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 24px;
    }
    
    .member-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .member-name {
      font-size: 24px;
      margin: 0;
      margin-right: 16px;
    }
    
    .grade-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: bold;
      color: white;
      margin-right: 8px;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
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
    
    .member-info {
      margin-bottom: 24px;
      color: #666;
    }
    
    .status-time {
      font-size: 14px;
      margin: 0;
    }
    
    .action-container {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
    }
    
    @media (max-width: 600px) {
      .member-page {
        padding: 16px;
      }
      
      .member-card {
        padding: 16px;
      }
      
      .member-name {
        font-size: 20px;
      }
      
      .header-actions {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  </style>