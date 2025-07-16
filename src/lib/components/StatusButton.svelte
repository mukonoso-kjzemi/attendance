<script lang="ts">
    import { toggleMemberStatus } from '$lib/stores/members';
    import { addRecord } from '$lib/firebase/records';
    import type { MemberStatus } from '$lib/utils/types';
    import { onDestroy } from 'svelte';
    
    export let memberId: string;
    export let status: MemberStatus;
    export let size: 'normal' | 'large' = 'normal';
    
    let isProcessing = false;
    let error = '';
    let countdown = 0;
    let countdownInterval: number;
    
    // コンポーネントが破棄される時にインターバルをクリア
    onDestroy(() => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    });
    
    const handleStatusChange = async () => {
      if (isProcessing) return; // 既に処理中なら何もしない
      
      isProcessing = true;
      error = '';
      
      try {
        console.log('処理開始: memberId=', memberId, 'current status=', status);
        
        // 新しい状態
        const newStatus = status === 'in' ? 'out' : 'in';
        
        // 記録を追加
        console.log('記録追加中...');
        await addRecord(memberId, newStatus);
        
        // 状態を更新
        console.log('状態更新中...');
        await toggleMemberStatus(memberId, status);
        
        console.log('処理完了');
        
        // カウントダウン開始
        countdown = 3;
        countdownInterval = window.setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(countdownInterval);
            window.location.hash = '/';
          }
        }, 1000);
      } catch (err) {
        console.error('状態変更失敗:', err);
        error = (err as Error).message || '状態の変更に失敗しました。しばらく待ってから再度お試しください。';
        alert(error);
      } finally {
        isProcessing = false;
      }
    };
    
    // 重複したクリーンアップ処理を削除
  </script>
  
  <button
    class="status-button {status} {size} {countdown > 0 ? 'countdown' : ''}"
    on:click={handleStatusChange}
    aria-label="{status === 'in' ? '退室' : '入室'}する"
    disabled={isProcessing}
  >
    {#if isProcessing}
      <span class="processing">処理中...</span>
    {:else if countdown > 0}
      <span class="countdown">
        {status === 'in' ? '入室' : '退室'}しました。{countdown}秒後にメインページに戻ります
      </span>
    {:else if status === 'in'}
      退室する
    {:else}
      入室する
    {/if}
  </button>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  <style>
    .status-button {
      font-weight: bold;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .status-button.normal {
      padding: 8px 16px;
      font-size: 14px;
    }
    
    .status-button.large {
      padding: 12px 24px;
      font-size: 18px;
    }
    
    .status-button.in {
      background-color: #f44336;
      color: white;
    }
    
    .status-button.in:hover:not(:disabled) {
      background-color: #d32f2f;
    }
    
    .status-button.out {
      background-color: #4caf50;
      color: white;
    }
    
    .status-button.out:hover:not(:disabled) {
      background-color: #388e3c;
    }
    
    .status-button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .processing {
      opacity: 0.7;
    }
    
    .countdown {
      color: white;
      font-weight: bold;
    }
    
    /* カウントダウン時のボタンの色を青に変更 */
    .status-button.countdown {
      background-color: #2196f3;
    }
    
    .status-button.countdown:hover {
      background-color: #1976d2;
    }
    
    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }
  </style>